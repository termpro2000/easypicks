const express = require('express');
const router = express.Router();
const { getProductByQRCode, createQRCodeProduct, getAllQRCodeProducts } = require('../controllers/qrcodeController');
const { authenticateToken } = require('../middleware/auth');

// QR 코드로 상품 조회
router.get('/product/:qrCode', authenticateToken, getProductByQRCode);

// QR 코드 상품 등록 (관리자만)
router.post('/product', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '관리자만 접근할 수 있습니다' });
  }
  next();
}, createQRCodeProduct);

// 모든 QR 코드 상품 목록 조회
router.get('/products', authenticateToken, getAllQRCodeProducts);

module.exports = router;