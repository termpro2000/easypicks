const express = require('express');
const cors = require('cors');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const deliveriesRoutes = require('./routes/deliveries');
const deliveryDetailsRoutes = require('./routes/deliveryDetails');
const userRoutes = require('./routes/users');
const schemaRoutes = require('./routes/schema');
const testRoutes = require('./routes/test');
const driversRoutes = require('./routes/drivers');
const productsRoutes = require('./routes/products');

const app = express();

// Railway와 같은 프록시 환경에서 필수 설정
app.set('trust proxy', true);

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3000;

// Rate limiting (Railway 환경에 최적화)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10000, // 개발용으로 거의 무제한
  message: {
    error: 'Too Many Requests',
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    retryAfter: '15분 후 재시도 가능'
  },
  // Railway 프록시 환경에서 안전한 키 생성
  keyGenerator: (req) => {
    // X-Forwarded-For의 첫 번째 IP 사용 (실제 클라이언트 IP)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const firstIP = forwardedFor.split(',')[0].trim();
      return firstIP;
    }
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  skip: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    return ip === '127.0.0.1' || ip === '::1' || ip?.includes('192.168') || ip?.includes('172.');
  }
});

// CORS 설정
const allowedOrigins = [
  'http://localhost:5173',
  'https://localhost:5173',
  'https://ep.easypickup.kr'
];

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (origin.includes('termpro2000s-projects.vercel.app')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    console.log('CORS 차단된 origin:', origin);
    return callback(new Error('CORS 정책에 의해 차단됨'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO를 라우트에서 사용할 수 있도록 설정
app.set('io', io);

// Session 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// 디버그 미들웨어
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '배송접수 웹앱 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      deliveries: '/api/deliveries',
      users: '/api/users',
      drivers: '/api/drivers',
      schema: '/api/schema',
      test: '/api/test',
      products: '/api/products'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'easypickup-api',
    version: '1.0.0'
  });
});

// 디버그용 엔드포인트 (배포 확인용)
app.get('/debug', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    port: PORT,
    hasTestRoutes: !!require('./routes/test'),
    availableRoutes: ['/api/auth', '/api/deliveries', '/api/users', '/api/drivers', '/api/schema', '/api/test', '/api/products']
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/delivery-details', deliveryDetailsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/schema', schemaRoutes);
app.use('/api/test', testRoutes);
app.use('/api/products', productsRoutes);

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

// WebSocket 연결 처리 - 기사별 알림 채널 지원
io.on('connection', (socket) => {
  console.log('클라이언트 연결됨:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('클라이언트 연결 해제됨:', socket.id);
  });
  
  // 배송 업데이트 채널 참여 (관리자, 매니저용)
  socket.on('join_delivery_updates', () => {
    socket.join('delivery_updates');
    console.log('배송 업데이트 채널에 참여:', socket.id);
  });

  // 기사별 알림 채널 참여
  socket.on('join_driver_channel', (data) => {
    try {
      const { driverId, userId } = data;
      console.log('📱 [기사 채널 참여 요청]:', { driverId, userId, socketId: socket.id });
      
      if (driverId && userId) {
        const driverChannel = `driver_${driverId}`;
        socket.join(driverChannel);
        console.log(`✅ [기사 채널 참여] 기사 ${driverId} (사용자 ${userId})가 채널 ${driverChannel}에 참여`);
        
        // 참여 확인 메시지 전송
        socket.emit('channel_joined', {
          channel: driverChannel,
          message: '기사 알림 채널에 성공적으로 연결되었습니다.',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('❌ [기사 채널 참여] 잘못된 데이터:', data);
        socket.emit('error', { message: '기사 ID 또는 사용자 ID가 없습니다.' });
      }
    } catch (error) {
      console.error('❌ [기사 채널 참여] 오류:', error);
      socket.emit('error', { message: '채널 참여 중 오류가 발생했습니다.' });
    }
  });

  // 기사별 알림 채널 떠나기
  socket.on('leave_driver_channel', (data) => {
    try {
      const { driverId } = data;
      if (driverId) {
        const driverChannel = `driver_${driverId}`;
        socket.leave(driverChannel);
        console.log(`🚪 [기사 채널 떠나기] 기사 ${driverId}가 채널 ${driverChannel}에서 떠남`);
      }
    } catch (error) {
      console.error('❌ [기사 채널 떠나기] 오류:', error);
    }
  });

  // 배송 상태 업데이트 (기사용)
  socket.on('update_delivery_status', (data) => {
    try {
      const { deliveryId, status, location, message } = data;
      console.log('📊 [배송 상태 업데이트]:', data);
      
      // 관리자들에게 실시간 업데이트 전송
      io.to('delivery_updates').emit('delivery_status_updated', {
        deliveryId,
        status,
        location,
        message,
        timestamp: new Date().toISOString(),
        updatedBy: socket.id
      });
    } catch (error) {
      console.error('❌ [배송 상태 업데이트] 오류:', error);
    }
  });
});

// 전역 에러 핸들러 (Railway 배포용 - 경고만 출력)
process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught Exception:', error.message);
  // Railway 환경에서는 즉시 종료하지 않음
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection:', reason);
  // Railway 환경에서는 즉시 종료하지 않음
});

console.log('🔄 서버 시작 준비 중... (v2.1)');
console.log('📦 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 포트:', PORT);
console.log('👤 Users API: department/position 필드 지원 활성화됨');

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏥 Health: /health`);
  console.log(`🔍 Debug: /debug`);
  console.log('✅ Railway deployment successful');
});

// Graceful shutdown 처리 (Railway SIGTERM 대응)
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM 신호 수신, 서버 종료 중...');
  server.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT 신호 수신, 서버 종료 중...');
  server.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});