const express = require('express');
const router = express.Router();
const { getRequestTypes, updateRequestTypes } = require('../controllers/configController');

// GET /api/config/request-types - 의뢰타입 목록 조회
router.get('/request-types', getRequestTypes);

// PUT /api/config/request-types - 의뢰타입 목록 업데이트 (관리자만)
router.put('/request-types', updateRequestTypes);

module.exports = router;