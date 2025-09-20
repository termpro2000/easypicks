const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const deliveryRoutes = require('./routes/delivery');
const photosRoutes = require('./routes/photos');
const audioRoutes = require('./routes/audio');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// 정적 파일 제공
app.use(express.static('web'));
app.use('/delivery_photos', express.static('uploads/delivery_photos')); // 업로드된 사진들 서빙
app.use('/delivery_audio', express.static('uploads/delivery_audio')); // 업로드된 오디오 파일들 서빙

// Socket.IO를 라우트에서 사용할 수 있도록 설정
app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/audio', audioRoutes);

app.get('/', (req, res) => {
  res.json({ message: '미래코리아 배송 관리 시스템 백엔드' });
});

// WebSocket 연결 처리
io.on('connection', (socket) => {
  console.log('클라이언트 연결됨:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('클라이언트 연결 해제됨:', socket.id);
  });
  
  socket.on('join_delivery_updates', () => {
    socket.join('delivery_updates');
    console.log('배송 업데이트 채널에 참여:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});