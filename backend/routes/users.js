const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireAdmin, requireManager, authenticateToken } = require('../middleware/auth');

// 모든 사용자 목록 조회 (관리자/매니저만)
router.get('/', requireManager, userController.getAllUsers);

// 사용자 활동 로그 조회 (관리자/매니저만) - 구체적 경로 먼저
router.get('/activities/logs', requireManager, userController.getUserActivities);

// 사용자 프로필 업데이트 (본인 정보만) - 구체적 경로 먼저
router.put('/profile', authenticateToken, userController.updateProfile);

// 특정 사용자 조회 (관리자/매니저만)
router.get('/:id', requireManager, userController.getUser);

// 사용자 생성 (관리자만)
router.post('/', requireAdmin, userController.createUser);

// 사용자 정보 업데이트 (관리자만, 본인 정보 수정은 별도 엔드포인트)
router.put('/:id', requireAdmin, userController.updateUser);

// 사용자 삭제 (관리자만)
router.delete('/:id', requireAdmin, userController.deleteUser);

module.exports = router;