const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 기본 미들웨어만
app.use(express.json());

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 루트 엔드포인트
app.get('/', (req, res) => {
  res.json({
    message: '배송접수 웹앱 API - 최소버전',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});