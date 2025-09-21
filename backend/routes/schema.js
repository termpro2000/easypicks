const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getSchemaInfo,
  getTableDetails
} = require('../controllers/schemaController');

// 데이터베이스 스키마 정보 조회
router.get('/', authenticateToken, getSchemaInfo);

// 특정 테이블 상세 정보 조회
router.get('/table/:tableName', authenticateToken, getTableDetails);

module.exports = router;