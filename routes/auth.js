const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

const router = express.Router();

// 토큰 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // 개발 환경에서 테스트 토큰 허용
  if (token === 'test-token' || !process.env.JWT_SECRET) {
    req.user = { user_id: 'test_user' };
    console.log('테스트 토큰으로 인증됨:', req.user);
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: '액세스 토큰이 필요합니다.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '토큰이 유효하지 않습니다.' });
    }
    req.user = user;
    next();
  });
};

// 임시 메모리 저장소 (데이터베이스 연결 실패 시 사용)
const tempUsers = [];

router.post('/register', async (req, res) => {
  try {
    const { user_id, password, name, phone } = req.body;

    if (!user_id || !password) {
      return res.status(400).json({ 
        error: '사용자 ID와 비밀번호는 필수입니다.' 
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 먼저 데이터베이스에 저장 시도
    try {
      // 데이터베이스에서 기존 사용자 확인
      const [existingUser] = await pool.execute(
        'SELECT id FROM drivers WHERE user_id = ?',
        [user_id]
      );

      if (existingUser.length > 0) {
        return res.status(409).json({ 
          error: '이미 존재하는 사용자 ID입니다.' 
        });
      }

      // 새 사용자를 데이터베이스에 추가
      const [result] = await pool.execute(
        'INSERT INTO drivers (user_id, password, name, phone) VALUES (?, ?, ?, ?)',
        [user_id, hashedPassword, name || '', phone || '']
      );

      console.log('새 드라이버 등록 (DB):', user_id);

      return res.status(201).json({
        message: '회원가입이 성공적으로 완료되었습니다.',
        user: {
          id: result.insertId,
          user_id: user_id,
          name: name
        }
      });
    } catch (dbError) {
      console.log('데이터베이스 등록 실패, 메모리 저장소 사용:', dbError.message);
      
      // 메모리에서 기존 사용자 확인
      const existingUser = tempUsers.find(u => u.user_id === user_id);
      if (existingUser) {
        return res.status(409).json({ 
          error: '이미 존재하는 사용자 ID입니다.' 
        });
      }

      // 메모리에 새 사용자 추가
      const newUser = {
        id: tempUsers.length + 1,
        user_id,
        password: hashedPassword,
        name: name || '',
        phone: phone || '',
        created_at: new Date()
      };
      tempUsers.push(newUser);

      console.log('새 드라이버 등록 (메모리):', user_id);

      return res.status(201).json({
        message: '회원가입이 성공적으로 완료되었습니다. (임시 저장)',
        user: {
          id: newUser.id,
          user_id: newUser.user_id,
          name: newUser.name
        }
      });
    }
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    console.log('🔐 로그인 요청 받음:', req.body);
    const { user_id, password } = req.body;

    if (!user_id || !password) {
      console.log('❌ 로그인 요청 - 필수 필드 누락');
      return res.status(400).json({ 
        error: '사용자 ID와 비밀번호를 입력해주세요.' 
      });
    }

    let user = null;

    // 먼저 데이터베이스에서 사용자 찾기 시도
    try {
      const [users] = await pool.execute(
        'SELECT * FROM drivers WHERE user_id = ?',
        [user_id]
      );

      if (users.length > 0) {
        user = users[0];
        console.log('데이터베이스에서 드라이버 찾음:', user_id);
      }
    } catch (dbError) {
      console.log('데이터베이스 조회 실패, 메모리에서 검색:', dbError.message);
    }

    // 데이터베이스에서 찾지 못했으면 메모리에서 찾기
    if (!user) {
      user = tempUsers.find(u => u.user_id === user_id);
      if (user) {
        console.log('메모리에서 드라이버 찾음:', user_id);
      }
    }

    if (!user) {
      console.log('❌ 사용자를 찾을 수 없음:', user_id);
      return res.status(401).json({ 
        error: '드라이버를 찾을 수 없습니다. 회원가입을 먼저 진행해주세요.' 
      });
    }

    console.log('✅ 사용자 찾음:', user_id, '비밀번호 확인 중...');
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log('❌ 비밀번호 불일치:', user_id);
      return res.status(401).json({ 
        error: '비밀번호가 일치하지 않습니다.' 
      });
    }

    console.log('✅ 비밀번호 확인 완료:', user_id, 'JWT 토큰 생성 중...');

    if (!process.env.JWT_SECRET) {
      console.log('❌ JWT_SECRET 환경변수가 설정되지 않음');
      return res.status(500).json({ error: '서버 설정 오류' });
    }

    const token = jwt.sign(
      { id: user.id, user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ 드라이버 로그인 성공:', user_id, '토큰 생성 완료');

    res.json({
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        user_id: user.user_id,
        name: user.name
      }
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 프로필 정보 가져오기
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user_id;

    // 데이터베이스에서 사용자 정보 조회
    const [users] = await pool.execute(
      'SELECT * FROM drivers WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const user = users[0];
    const { password, ...userProfile } = user;

    res.json({
      message: '프로필 조회 성공',
      user: userProfile
    });
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 프로필 정보 업데이트
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user_id;

    const { name, phone, email, delivery_area, vehicle_type, vehicle_number, cargo_capacity, mapPreference } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: '이름은 필수 입력 항목입니다.' });
    }

    // 프로필 정보 업데이트 (지도 설정 포함)
    await pool.execute(`
      UPDATE drivers 
      SET name = ?, phone = ?, email = ?, delivery_area = ?, vehicle_type = ?, vehicle_number = ?, cargo_capacity = ?, map_preference = ?
      WHERE user_id = ?
    `, [
      name.trim(),
      phone || '',
      email || '',
      delivery_area || '',
      vehicle_type || '',
      vehicle_number || '',
      cargo_capacity || '',
      mapPreference !== undefined ? mapPreference : 0,
      userId
    ]);

    // 업데이트된 정보 조회
    const [users] = await pool.execute(
      'SELECT * FROM drivers WHERE user_id = ?',
      [userId]
    );

    const user = users[0];
    const { password, ...userProfile } = user;

    console.log('프로필 업데이트 성공:', userId);

    res.json({
      message: '프로필이 성공적으로 업데이트되었습니다.',
      user: userProfile
    });
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 비밀번호 변경
router.put('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user_id;

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '새 비밀번호는 6자 이상이어야 합니다.' });
    }

    // 현재 사용자 정보 조회
    const [users] = await pool.execute(
      'SELECT * FROM drivers WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const user = users[0];

    // 현재 비밀번호 확인
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: '현재 비밀번호가 일치하지 않습니다.' });
    }

    // 새 비밀번호 해시화
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 비밀번호 업데이트
    await pool.execute(
      'UPDATE drivers SET password = ? WHERE user_id = ?',
      [hashedNewPassword, userId]
    );

    console.log('비밀번호 변경 성공:', userId);

    res.json({
      message: '비밀번호가 성공적으로 변경되었습니다.'
    });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 지도 설정 조회
router.get('/map-preference', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    console.log('지도 설정 조회 요청:', userId);
    
    // drivers 테이블에서 지도 설정 조회
    const [drivers] = await pool.execute(
      'SELECT map_preference FROM drivers WHERE user_id = ?',
      [userId]
    );
    
    console.log('지도 설정 쿼리 결과:', drivers);
    
    if (drivers.length === 0) {
      console.error('사용자를 찾을 수 없음:', userId);
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    const mapPreference = drivers[0].map_preference || 0;
    console.log('지도 설정 응답:', mapPreference);
    
    res.json({
      success: true,
      mapPreference: mapPreference
    });
  } catch (error) {
    console.error('지도 설정 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 지도 설정 업데이트
router.put('/map-preference', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { mapPreference } = req.body;
    
    console.log('지도 설정 업데이트 요청:', userId, '→', mapPreference);
    
    // 유효한 지도 설정 값인지 확인 (0: 네이버, 1: 카카오, 2: 티맵, 3: 구글)
    if (mapPreference < 0 || mapPreference > 3) {
      console.error('유효하지 않은 지도 설정:', mapPreference);
      return res.status(400).json({ error: '유효하지 않은 지도 설정입니다.' });
    }
    
    // drivers 테이블에서 지도 설정 업데이트
    const [result] = await pool.execute(
      'UPDATE drivers SET map_preference = ? WHERE user_id = ?',
      [mapPreference, userId]
    );
    
    console.log('지도 설정 업데이트 결과:', result.affectedRows, '행 영향받음');
    
    if (result.affectedRows === 0) {
      console.error('지도 설정 업데이트 실패: 사용자를 찾을 수 없음');
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    const mapNames = ['네이버지도', '카카오지도', '티맵', '구글지도'];
    console.log('지도 설정 업데이트 성공:', mapNames[mapPreference]);
    
    res.json({
      success: true,
      message: `지도 설정이 ${mapNames[mapPreference]}로 변경되었습니다.`,
      mapPreference: mapPreference
    });
  } catch (error) {
    console.error('지도 설정 업데이트 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;