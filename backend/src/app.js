const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const adminRoutes = require('./modules/admin/admin.routes');
const router   = express.Router();

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const vendorRoutes = require('./modules/vendors/vendors.routes');
const productRoutes = require('./modules/products/products.routes');
const categoryRoutes = require('./modules/categories/categories.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const orderRoutes = require('./modules/orders/orders.routes');
const reviewRoutes = require('./modules/reviews/reviews.routes');
const notificationRoutes = require('./modules/notifications/notifications.routes');
const paymentRoutes = require('./modules/payments/payments.routes');
const carouselRoutes = require('./modules/carousel/carousel.routes');

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/payments/webhook') {
    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk.toString(); });
    req.on('end', () => {
      req.rawBody = rawBody;
      req.body = JSON.parse(rawBody || '{}');
      next();
    });
  } else {
    next();
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); 
}

app.use('/api/v1/wishlist', require('../src/modules/wishlist/wishlist.routes'));

app.get('/api/health/db', async (req, res) => {
  try {
    const { query } = require('./config/database');
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    res.json({
      success: true,
      message: 'Database connected successfully',
      tables_found: result.rows.length,
      tables: result.rows.map(r => r.table_name)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/vendors`, vendorRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/carousel`, carouselRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running 🚀'
  });
});

app.get('/api/v1', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API v1 is working 🚀'
  });
});

app.all('/{*path}', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

module.exports = app;