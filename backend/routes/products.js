const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts
} = require('../controllers/productsController');

// 로그 미들웨어
router.use((req, res, next) => {
  console.log(`[라우트] ${req.method} /products${req.path} 요청 수신`);
  next();
});

// 라우트 정의 (모든 라우트에 인증 필요)
router.get('/search', authenticateToken, searchProducts);     // GET /api/products/search?q=검색어
router.get('/', authenticateToken, getAllProducts);           // GET /api/products
router.get('/:id', authenticateToken, getProduct);            // GET /api/products/:id
router.post('/', authenticateToken, createProduct);           // POST /api/products
router.put('/:id', authenticateToken, updateProduct);         // PUT /api/products/:id
router.delete('/:id', authenticateToken, deleteProduct);      // DELETE /api/products/:id

module.exports = router;