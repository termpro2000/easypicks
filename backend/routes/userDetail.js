const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const {
  getUserDetail,
  createUserDetail,
  updateUserDetail,
  deleteUserDetail
} = require('../controllers/userDetailController');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 사용자별 상세정보 조회
// GET /api/user-detail/:userId
router.get('/:userId', getUserDetail);

// 사용자 상세정보 생성
// POST /api/user-detail/:userId
router.post('/:userId', createUserDetail);

// 사용자 상세정보 업데이트
// PUT /api/user-detail/:userId
router.put('/:userId', updateUserDetail);

// 사용자 상세정보 삭제
// DELETE /api/user-detail/:userId
router.delete('/:userId', deleteUserDetail);

module.exports = router;