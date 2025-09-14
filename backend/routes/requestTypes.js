const express = require('express');
const router = express.Router();

// 의뢰타입 컨트롤러 함수들 가져오기
const {
  getRequestTypes,
  createRequestType,
  updateRequestType,
  deleteRequestType
} = require('../controllers/requestTypeController');

/**
 * @route GET /api/request-types
 * @desc 의뢰타입 목록 조회 (모든 사용자)
 * @access Public
 */
router.get('/', (req, res, next) => {
  console.log('[라우트] GET /request-types 요청 수신');
  next();
}, getRequestTypes);

/**
 * @route POST /api/request-types
 * @desc 의뢰타입 생성 (관리자만)
 * @access Admin
 */
router.post('/', (req, res, next) => {
  console.log('[라우트] POST /request-types 요청 수신');
  console.log('[라우트] 요청 데이터:', req.body);
  next();
}, createRequestType);

/**
 * @route PUT /api/request-types/:id
 * @desc 의뢰타입 수정 (관리자만)
 * @access Admin
 */
router.put('/:id', (req, res, next) => {
  console.log('[라우트] PUT /request-types/:id 요청 수신');
  console.log('[라우트] ID:', req.params.id);
  console.log('[라우트] 요청 데이터:', req.body);
  next();
}, updateRequestType);

/**
 * @route DELETE /api/request-types/:id
 * @desc 의뢰타입 삭제 (관리자만)
 * @access Admin
 */
router.delete('/:id', (req, res, next) => {
  console.log('[라우트] DELETE /request-types/:id 요청 수신');
  console.log('[라우트] ID:', req.params.id);
  next();
}, deleteRequestType);

module.exports = router;