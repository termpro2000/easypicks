const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

// 사용자 목록 조회 (관리자 전용)
router.get('/', authenticateToken, requireRole(['admin']), (req, res) => {
  res.json({ message: '사용자 목록 API' });
});

module.exports = router;