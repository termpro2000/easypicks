const express = require('express');
const cors = require('cors');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const shippingRoutes = require('./routes/shipping');
const deliveriesRoutes = require('./routes/deliveries');
const userRoutes = require('./routes/users');
const exportRoutes = require('./routes/exports');
const qrcodeRoutes = require('./routes/qrcode');
const configRoutes = require('./routes/config');
const testRoutes = require('./routes/test');
const requestTypesRoutes = require('./routes/requestTypes');
const productsRoutes = require('./routes/products');
const productPhotosRoutes = require('./routes/productPhotos');
const driversRoutes = require('./routes/drivers');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting (개발 중이므로 제한을 늘림)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 1000 // limit each IP to 1000 requests per windowMs (개발용으로 증가)
});

// CORS 설정
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://localhost:5173',
    'https://192.168.219.102:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (업로드된 사진)
app.use('/uploads', express.static('uploads'));

// Session 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // 명시적 세션 이름
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// 디버그 미들웨어 추가
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Session ID:', req.sessionID);
  console.log('Session exists:', !!req.session);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '배송접수 웹앱 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      shipping: '/api/shipping',
      deliveries: '/api/deliveries',
      users: '/api/users',
      exports: '/api/exports',
      qrcode: '/api/qrcode',
      config: '/api/config',
      products: '/api/products',
      productPhotos: '/api/product-photos',
      drivers: '/api/drivers'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/qrcode', qrcodeRoutes);
app.use('/api/config', configRoutes);
app.use('/api/test', testRoutes);
app.use('/api/request-types', requestTypesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/product-photos', productPhotosRoutes);
app.use('/api/drivers', driversRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});