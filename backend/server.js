const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');

dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const reviewRoutes = require('./routes/review.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const vendorRoutes = require('./routes/vendor.routes');

const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());

// ✅ FIXED CORS CONFIGURATION
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'https://tradesphere-wr1e.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    const msg = 'CORS policy does not allow access from this origin.';
    return callback(new Error(msg), false);
  },
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// 🔍 DEBUG MIDDLEWARE - Log all requests
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path}`);
  next();
});

// ✅ FIXED MONGOOSE CONNECTION
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
console.log('📋 Registering routes...');
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes registered');
app.use('/api/users', userRoutes);
console.log('✅ User routes registered');
app.use('/api/products', productRoutes);
console.log('✅ Product routes registered');
app.use('/api/categories', categoryRoutes);
console.log('✅ Category routes registered');
app.use('/api/cart', cartRoutes);
console.log('✅ Cart routes registered');
app.use('/api/orders', orderRoutes);
console.log('✅ Order routes registered');
app.use('/api/reviews', reviewRoutes);
console.log('✅ Review routes registered');
app.use('/api/wishlist', wishlistRoutes);
console.log('✅ Wishlist routes registered');
app.use('/api/vendor', vendorRoutes);
console.log('✅ Vendor routes registered');

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});

module.exports = app;