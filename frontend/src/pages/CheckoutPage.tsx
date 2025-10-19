import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    vendor: string;
  };
  quantity: number;
}

interface Cart {
  items: CartItem[];
  totalAmount: number;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/auth');
        return;
      }

      const response = await api.getCart();
      if (response.success && response.data) {
        if (response.data.items && response.data.items.length > 0) {
          setCart(response.data);
        } else {
          toast({
            title: "Cart is empty",
            description: "Add items to your cart before checkout.",
          });
          navigate('/cart');
        }
      }
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      if (error.message?.includes('authorized') || error.message?.includes('login')) {
        navigate('/auth');
      } else {
        navigate('/cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!shippingAddress.trim()) {
      toast({
        title: "Address required",
        description: "Please provide a shipping address.",
        variant: "destructive",
      });
      return;
    }

    if (!phone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please provide a contact phone number.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        shippingAddress,
        phone,
        paymentMethod,
        paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid',
      };

      const response = await api.createOrder(orderData);

      if (response.success) {
        toast({
          title: "Order placed successfully!",
          description: "You will receive a confirmation shortly.",
        });

        navigate('/orders');
      }
    } catch (error: any) {
      console.error('Order error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const total = cart?.totalAmount || 0;
  const cartItems = cart?.items || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Shipping Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full shipping address (street, city, state, postal code)..."
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-accent transition-colors">
                    <Input
                      type="radio"
                      name="payment"
                      value="cash_on_delivery"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">Cash on Delivery</div>
                      <div className="text-sm text-muted-foreground">Pay when you receive your order</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-accent transition-colors">
                    <Input
                      type="radio"
                      name="payment"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">Bank Transfer</div>
                      <div className="text-sm text-muted-foreground">Transfer directly to our bank account</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-accent transition-colors">
                    <Input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">Card Payment</div>
                      <div className="text-sm text-muted-foreground">Pay securely with your debit/credit card</div>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.product.name} x {item.quantity}
                      </span>
                      <span className="font-semibold">
                        ${(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">${total.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-semibold">Free</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary">${total.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={placeOrder}
                  disabled={submitting || !shippingAddress || !phone}
                >
                  {submitting ? 'Processing...' : 'Place Order'}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={() => navigate('/cart')}
                  disabled={submitting}
                >
                  Back to Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}