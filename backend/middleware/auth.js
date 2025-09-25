const jwt = require('jsonwebtoken');

/**
 * JWT 토큰 인증 미들웨어
 */
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '인증 토큰이 필요합니다.'
      });
    }

    // test-token 기능 완전 제거 - 프로덕션에서 문제 발생
    console.log(`[Auth Middleware] 토큰 길이: ${token.length}, 시작: ${token.substring(0, 20)}...`);

    const jwtSecret = process.env.JWT_SECRET || 'easypicks-jwt-secret-2024';
    
    console.log(`[Auth Middleware] JWT 토큰 검증 시작: ${token.substring(0, 30)}...`);
    
    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        console.error('[Auth Middleware] JWT 검증 실패:', err.message);
        return res.status(403).json({
          error: 'Forbidden',
          message: '유효하지 않은 토큰입니다.'
        });
      }
      
      console.log('[Auth Middleware] JWT 검증 성공:', { id: user.id, username: user.username, role: user.role });
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('토큰 인증 오류:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: '인증 처리 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 권한 확인 미들웨어
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '접근 권한이 없습니다.'
      });
    }

    next();
  };
}

/**
 * 인증이 필요한 요청을 위한 미들웨어 (세션 백워드 호환성 포함)
 */
function requireAuth(req, res, next) {
  const user = req.user || req.session?.user;
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized', 
      message: '로그인이 필요합니다.'
    });
  }
  
  if (!req.user) {
    req.user = user;
  }
  
  next();
}

module.exports = {
  authenticateToken,
  requireRole,
  requireAuth
};