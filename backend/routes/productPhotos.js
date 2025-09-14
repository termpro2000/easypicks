const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  upload,
  uploadProductPhoto,
  getProductPhotos,
  deleteProductPhoto
} = require('../controllers/productPhotosController');

// 로그 미들웨어
router.use((req, res, next) => {
  console.log(`[라우트] ${req.method} /product-photos${req.path} 요청 수신`);
  next();
});

// 라우트 정의 (모든 라우트에 인증 필요)
router.post('/upload', authenticateToken, upload.single('photo'), uploadProductPhoto);     // POST /api/product-photos/upload
router.get('/product/:product_id', authenticateToken, getProductPhotos);                  // GET /api/product-photos/product/:product_id
router.delete('/:photo_id', authenticateToken, deleteProductPhoto);                       // DELETE /api/product-photos/:photo_id

module.exports = router;