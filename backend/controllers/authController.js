const { pool, executeWithRetry } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * 새 사용자를 등록하는 함수
 */
async function register(req, res) {
  try {
    const { username, password, name, phone, company } = req.body;

    // 유효성 검증
    if (!username || !password || !name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '필수 필드가 누락되었습니다.'
      });
    }

    // 아이디 중복 확인
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: '이미 사용 중인 아이디입니다.'
      });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, name, phone, company) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, name, phone || null, company || null]
    );

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      userId: result.insertId
    });

  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '회원가입 처리 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 사용자 아이디 중복 여부를 확인하는 함수
 */
async function checkUsername(req, res) {
  try {
    const { username } = req.params;

    const [users] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    res.json({
      available: users.length === 0,
      message: users.length === 0 ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.'
    });

  } catch (error) {
    console.error('아이디 확인 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '아이디 확인 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 사용자 로그인을 처리하는 함수
 */
async function login(req, res) {
  try {
    const { username, user_id, password } = req.body;
    const loginUsername = username || user_id;
    console.log(`로그인 시도: 사용자명=${loginUsername}, IP=${req.ip || req.connection.remoteAddress}`);

    if (!loginUsername || !password) {
      console.log('로그인 실패: 필수 필드 누락');
      return res.status(400).json({
        error: 'Bad Request',
        message: '아이디와 비밀번호를 입력해주세요.'
      });
    }

    // 사용자 조회
    let users;
    let user = null;
    let isDriver = false;
    
    try {
      [users] = await executeWithRetry(() =>
        pool.execute(
          'SELECT id, username, password, name, email, phone, company, department, position, role, is_active, last_login, created_at, updated_at, default_sender_address, default_sender_detail_address, default_sender_zipcode FROM users WHERE username = ?',
          [loginUsername]
        )
      );
      
      if (users.length > 0) {
        user = users[0];
      }
    } catch (dbError) {
      console.error(`사용자 테이블 조회 오류: ${dbError.message}, 사용자명: ${loginUsername}`);
      throw dbError;
    }

    if (!user) {
      console.log(`로그인 실패: 사용자명 '${loginUsername}' 존재하지 않음`);
      return res.status(401).json({
        error: 'Unauthorized',
        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log(`로그인 실패: 사용자명 '${loginUsername}' 비밀번호 불일치`);
      return res.status(401).json({
        error: 'Unauthorized',
        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 계정 비활성화 확인
    if (!user.is_active) {
      console.log(`로그인 실패: 사용자명 '${loginUsername}' 계정 비활성화`);
      return res.status(401).json({
        error: 'Unauthorized',
        message: '비활성화된 계정입니다. 관리자에게 문의하세요.'
      });
    }

    // JWT 토큰 생성
    const userPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      company: user.company,
      department: user.department,
      position: user.position,
      role: user.role,
      is_active: Boolean(user.is_active),
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
      default_sender_address: user.default_sender_address,
      default_sender_detail_address: user.default_sender_detail_address,
      default_sender_zipcode: user.default_sender_zipcode
    };

    const jwtSecret = process.env.JWT_SECRET || 'easypicks-jwt-secret-2024';
    console.log(`로그인 성공: 사용자명='${loginUsername}' (ID: ${user.id})`);
    
    const token = jwt.sign(
      userPayload,
      jwtSecret,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: '로그인 성공',
      user: userPayload,
      token: token
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '로그인 처리 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 사용자 로그아웃을 처리하는 함수
 */
async function logout(req, res) {
  try {
    res.json({ message: '로그아웃되었습니다.' });
  } catch (error) {
    console.error('로그아웃 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '로그아웃 처리 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 현재 로그인된 사용자의 정보를 조회하는 함수
 */
async function me(req, res) {
  try {
    let userId = null;
    
    // JWT 토큰에서 사용자 ID 가져오기
    console.log('[Auth ME] req.user 전체 객체:', JSON.stringify(req.user, null, 2));
    if (req.user && req.user.id) {
      userId = req.user.id;
      console.log(`[Auth ME] JWT 토큰에서 추출한 사용자 ID: ${userId} (타입: ${typeof userId})`);
      console.log(`[Auth ME] req.user.username: ${req.user.username}, req.user.role: ${req.user.role}`);
    }

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    // 데이터베이스에서 최신 사용자 정보 조회 (모든 필드 포함)
    console.log(`[Auth ME] 데이터베이스에서 사용자 조회 시작: ID=${userId}`);
    const [users] = await executeWithRetry(() =>
      pool.execute(`
        SELECT 
          id, username, name, email, phone, company, department, position, role, 
          is_active, last_login, created_at, updated_at,
          default_sender_address, default_sender_detail_address, default_sender_zipcode
        FROM users 
        WHERE id = ? AND is_active = true
      `, [userId])
    );
    
    console.log(`[Auth ME] 데이터베이스 조회 결과: ${users.length}개 사용자 발견`);
    if (users.length > 0) {
      console.log(`[Auth ME] 조회된 사용자: ID=${users[0].id}, username=${users[0].username}, name=${users[0].name}`);
    }

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '유효하지 않은 사용자입니다.'
      });
    }

    const user = users[0];
    
    console.log(`[Auth ME] 사용자 정보 조회 성공: ${user.username} (ID: ${user.id})`);

    res.json({
      success: true,
      user: {
        ...user,
        is_active: Boolean(user.is_active)
      },
      authenticated: true
    });

  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사용자 정보 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 사용자 프로필 조회 (hy2 호환성)
 */
async function profile(req, res) {
  try {
    let userId = null;
    
    if (req.user && req.user.id) {
      userId = req.user.id;
    }

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    const [users] = await executeWithRetry(() =>
      pool.execute(`
        SELECT 
          id, username, name, phone, company, role, 
          created_at, updated_at
        FROM users 
        WHERE id = ? AND is_active = true
      `, [userId])
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const user = users[0];

    res.json({
      message: '프로필 조회 성공',
      user: {
        id: user.id,
        user_id: user.username,
        name: user.name,
        phone: user.phone,
        company: user.company,
        role: user.role,
        delivery_area: '',
        vehicle_type: '',
        vehicle_number: '',
        cargo_capacity: '',
        map_preference: 0,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '프로필 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 지도 설정 조회
 */
async function getMapPreference(req, res) {
  try {
    let userId = null;
    
    if (req.user && req.user.id) {
      userId = req.user.id;
    }

    console.log('🔍 [getMapPreference] JWT에서 추출한 사용자:', {
      userId,
      userObj: req.user,
      hasUserId: !!userId
    });

    if (!userId) {
      console.log('❌ [getMapPreference] 사용자 ID 없음');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    // map_preference 컬럼이 없을 수도 있으므로 try-catch로 처리
    let users;
    try {
      console.log('🔍 [getMapPreference] SQL 쿼리 실행:', { userId });
      [users] = await executeWithRetry(() =>
        pool.execute(`
          SELECT map_preference
          FROM users 
          WHERE id = ? AND is_active = true
        `, [userId])
      );
      console.log('🔍 [getMapPreference] SQL 결과:', { 
        userCount: users.length,
        users: users.map(u => ({ id: u.id, map_preference: u.map_preference }))
      });
    } catch (error) {
      // map_preference 컬럼이 없는 경우 기본값 반환
      console.log('⚠️ [getMapPreference] map_preference 컬럼이 없음, 기본값 사용:', error.message);
      return res.json({
        success: true,
        mapPreference: 0 // 기본값 0 (네이버지도)
      });
    }

    if (users.length === 0) {
      console.log('⚠️ [getMapPreference] 사용자를 찾을 수 없음, 기본값 반환:', { userId });
      // 사용자를 찾을 수 없어도 기본값 반환 (Map settings 기능이 중단되지 않도록)
      return res.json({
        success: true,
        mapPreference: 0 // 기본값 0 (네이버지도)
      });
    }

    const user = users[0];
    const mapPreference = user.map_preference || 0; // 기본값 0 (네이버지도)

    res.json({
      success: true,
      mapPreference: mapPreference
    });

  } catch (error) {
    console.error('지도 설정 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: '지도 설정 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 지도 설정 업데이트
 */
async function updateMapPreference(req, res) {
  try {
    let userId = null;
    
    if (req.user && req.user.id) {
      userId = req.user.id;
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    const { mapPreference } = req.body;

    // 유효성 검증
    if (typeof mapPreference !== 'number' || mapPreference < 0 || mapPreference > 3) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: '올바른 지도 설정 값을 입력해주세요 (0-3).'
      });
    }

    // 지도 설정 업데이트 (컬럼이 없을 수도 있으므로 try-catch로 처리)
    let result;
    try {
      [result] = await executeWithRetry(() =>
        pool.execute(`
          UPDATE users 
          SET map_preference = ?, updated_at = NOW()
          WHERE id = ? AND is_active = true
        `, [mapPreference, userId])
      );
    } catch (error) {
      // map_preference 컬럼이 없는 경우 성공으로 처리 (임시)
      console.log('map_preference 컬럼이 없음, 업데이트 생략:', error.message);
      return res.json({
        success: true,
        message: '지도 설정이 성공적으로 업데이트되었습니다 (임시 - 컬럼 없음).',
        mapPreference: mapPreference
      });
    }

    if (result.affectedRows === 0) {
      console.log('⚠️ [updateMapPreference] 사용자를 찾을 수 없음, 성공으로 처리:', { userId, mapPreference });
      // 사용자를 찾을 수 없어도 성공으로 처리 (Map settings 기능이 중단되지 않도록)
      return res.json({
        success: true,
        message: '지도 설정이 성공적으로 업데이트되었습니다 (임시 - 사용자 없음).',
        mapPreference: mapPreference
      });
    }

    res.json({
      success: true,
      message: '지도 설정이 성공적으로 업데이트되었습니다.',
      mapPreference: mapPreference
    });

  } catch (error) {
    console.error('지도 설정 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: '지도 설정 업데이트 중 오류가 발생했습니다.'
    });
  }
}

module.exports = {
  register,
  checkUsername,
  login,
  logout,
  me,
  profile,
  getMapPreference,
  updateMapPreference
};