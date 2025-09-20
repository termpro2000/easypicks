const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  register,
  checkUsername,
  login,
  logout,
  me,
  profile
} = require('../controllers/authController');

// 회원가입
router.post('/register', register);

// 아이디 중복 확인
router.get('/check-username/:username', checkUsername);

// 로그인
router.post('/login', login);

// 로그아웃
router.post('/logout', logout);

// 현재 사용자 정보
router.get('/me', authenticateToken, me);

// 사용자 프로필 조회 (hy2 호환성)
router.get('/profile', authenticateToken, profile);

module.exports = router;