const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/database');
const {
  register,
  checkUsername,
  login,
  logout,
  me,
  profile,
  getMapPreference,
  updateMapPreference,
  updateProfile
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

// 지도 설정 조회
router.get('/map-preference', authenticateToken, getMapPreference);

// 지도 설정 업데이트
router.put('/map-preference', authenticateToken, updateMapPreference);

// 사용자 자신의 프로필 업데이트 (일반 사용자용)
router.put('/profile', authenticateToken, updateProfile);

// 임시 컬럼 추가 엔드포인트
router.post('/add-user-columns', async (req, res) => {
  try {
    console.log('[Auth API] users 테이블 컬럼 추가 시작');
    
    // 컬럼 존재 확인
    const [existingColumns] = await pool.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      AND COLUMN_NAME IN ('department', 'position')
    `);
    
    const existingColumnNames = existingColumns.map(col => col.COLUMN_NAME);
    const results = [];
    
    // department 컬럼 추가
    if (!existingColumnNames.includes('department')) {
      try {
        await pool.execute(`ALTER TABLE users ADD COLUMN department VARCHAR(100) NULL`);
        results.push('department 컬럼 추가 성공');
      } catch (error) {
        results.push(`department 컬럼 추가 실패: ${error.message}`);
      }
    } else {
      results.push('department 컬럼이 이미 존재함');
    }
    
    // position 컬럼 추가
    if (!existingColumnNames.includes('position')) {
      try {
        await pool.execute(`ALTER TABLE users ADD COLUMN position VARCHAR(100) NULL`);
        results.push('position 컬럼 추가 성공');
      } catch (error) {
        results.push(`position 컬럼 추가 실패: ${error.message}`);
      }
    } else {
      results.push('position 컬럼이 이미 존재함');
    }
    
    res.json({
      success: true,
      message: 'users 테이블 컬럼 추가 완료',
      results: results
    });
    
  } catch (error) {
    console.error('[Auth API] 컬럼 추가 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;