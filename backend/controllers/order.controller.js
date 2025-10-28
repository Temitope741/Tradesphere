// controllers/order.controller.js
const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const Cart = require('../models/Cart.model');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, phone, paymentMethod, paymentReference } = req.body;

    if (!shippingAddress) {
      return ApiResponse.error(res, 'Shipping address is required', 400);
    }

    if (!phone) {
      return ApiResponse.error(res, 'Phone number is required', 400);
    }

    // Get cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return ApiResponse.error(res, 'Cart is empty', 400);
    }

    // Group items by vendor
    const vendorGroups = {};
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = item.product;
      
      if (!product || !product.isActive) {
        return ApiResponse.error(res, `Product ${item.product?._id} not available`, 404);
      }

      if (!product.isInStock(item.quantity)) {
        return ApiResponse.error(res, `Insufficient stock for ${product.name}`, 400);
      }

      const vendorId = product.vendor.toString();
      if (!vendorGroups[vendorId]) {
        vendorGroups[vendorId] = [];
      }

      const itemTotal = product.price * item.quantity;
      vendorGroups[vendorId].push({
        product: product._id,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal
      });

      totalAmount += itemTotal;
    }

    // Determine payment status based on payment method
    let paymentStatus = 'pending';
    if (paymentMethod === 'card' && paymentReference) {
      // For card payments, verify with Paystack
      paymentStatus = 'paid'; // Will be verified in separate endpoint
    } else if (paymentMethod === 'bank_transfer') {
      paymentStatus = 'pending'; // Awaiting bank transfer confirmation
    }

    // Create orders for each vendor
    const orders = [];
    for (const [vendorId, vendorItems] of Object.entries(vendorGroups)) {
      const vendorTotal = vendorItems.reduce((sum, item) => sum + item.totalPrice, 0);

      const order = await Order.create({
        customer: req.user._id,
        vendor: vendorId,
        items: vendorItems,
        totalAmount: vendorTotal,
        shippingAddress,
        phone,
        paymentMethod: paymentMethod || 'cash_on_delivery',
        paymentStatus,
        paymentReference: paymentReference || null
      });

      // Reduce stock for each product
      for (const item of vendorItems) {
        const product = await Product.findById(item.product);
        await product.reduceStock(item.quantity);
      }

      orders.push(order);
    }

    // Clear cart after successful order
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [] }
    );

    ApiResponse.success(res, orders, 'Order placed successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Paystack payment
// @route   POST /api/orders/verify-payment
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return ApiResponse.error(res, 'Payment reference is required', 400);
    }

    // Verify payment with Paystack
    const https = require('https');
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    };

    const paystackReq = https.request(options, (paystackRes) => {
      let data = '';

      paystackRes.on('data', (chunk) => {
        data += chunk;
      });

      paystackRes.on('end', async () => {
        const response = JSON.parse(data);

        if (response.data.status === 'success') {
          // Update order payment status
          await Order.updateMany(
            { paymentReference: reference },
            { paymentStatus: 'paid' }
          );

          ApiResponse.success(res, response.data, 'Payment verified successfully');
        } else {
          ApiResponse.error(res, 'Payment verification failed', 400);
        }
      });
    });

    paystackReq.on('error', (error) => {
      console.error('Paystack verification error:', error);
      ApiResponse.error(res, 'Payment verification failed', 500);
    });

    paystackReq.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm bank transfer
// @route   PUT /api/orders/:id/confirm-transfer
// @access  Private
exports.confirmBankTransfer = async (req, res, next) => {
  try {
    const { transferReference } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return ApiResponse.error(res, 'Order not found', 404);
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Not authorized', 403);
    }

    order.paymentReference = transferReference;
    order.paymentStatus = 'pending'; // Admin will verify
    await order.save();

    ApiResponse.success(res, order, 'Bank transfer details submitted. Awaiting verification.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('vendor', 'fullName email phone')
      .populate('items.product', 'name imageUrl')
      .sort({ createdAt: -1 });

    ApiResponse.success(res, orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'fullName email phone')
      .populate('vendor', 'fullName email phone')
      .populate('items.product', 'name imageUrl price');

    if (!order) {
      return ApiResponse.error(res, 'Order not found', 404);
    }

    if (
      order.customer._id.toString() !== req.user._id.toString() &&
      order.vendor._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return ApiResponse.error(res, 'Not authorized', 403);
    }

    ApiResponse.success(res, order);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Vendor only)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return ApiResponse.error(res, 'Invalid status', 400);
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return ApiResponse.error(res, 'Order not found', 404);
    }

    if (order.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.error(res, 'Not authorized', 403);
    }

    order.status = status;
    await order.save();

    ApiResponse.success(res, order, 'Order status updated');
  } catch (error) {
    next(error);
  }
};