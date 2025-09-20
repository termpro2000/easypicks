const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

// JWT 비밀키 (실제 운영에서는 환경변수로 관리)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

/**
 * JWT 토큰 인증 미들웨어
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다.'
      });
    }

    // 개발/테스트용 토큰 허용
    if (token === 'test-token') {
      req.user = {
        id: 'test-user',
        username: 'test',
        role: 'driver'
      };
      return next();
    }

    // JWT 토큰 검증
    jwt.verify(token, JWT_SECRET, async (err, user) => {
      if (err) {
        console.error('JWT 검증 오류:', err.message);
        return res.status(403).json({
          success: false,
          error: '유효하지 않은 토큰입니다.'
        });
      }

      // 사용자 정보를 요청 객체에 추가
      req.user = user;
      next();
    });

  } catch (error) {
    console.error('인증 미들웨어 오류:', error);
    res.status(500).json({
      success: false,
      error: '인증 처리 중 오류가 발생했습니다.'
    });
  }
};

module.exports = authenticateToken;