const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정
const allowedOrigins = [
  'http://localhost:5173',
  'https://localhost:5173',
  'https://ep.easypickup.kr',
  'https://efficient-abundance-production-d603.up.railway.app'
];

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (origin.includes('termpro2000s-projects.vercel.app')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    console.log('CORS 차단된 origin:', origin);
    return callback(new Error('CORS 정책에 의해 차단됨'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 기본 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 데이터베이스 설정 (단순화)
const { pool, generateTrackingNumber } = require('./config/database');

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// DB 컬럼 정보 확인용 임시 엔드포인트
app.get('/api/debug/columns', async (req, res) => {
  try {
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deliveries'
      ORDER BY ORDINAL_POSITION
    `);
    
    res.json({
      success: true,
      columns: columns,
      totalColumns: columns.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get columns',
      message: error.message
    });
  }
});

// 루트 엔드포인트
app.get('/', (req, res) => {
  res.json({
    message: '배송접수 웹앱 API - 최소버전',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 데이터베이스 상태 확인
app.get('/db-test', async (req, res) => {
  try {
    const [result] = await pool.execute('SELECT 1 as test');
    res.json({ 
      status: 'OK', 
      database: 'connected',
      result: result[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 사용자 목록 조회 API
app.get('/api/users', async (req, res) => {
  try {
    console.log('👥 사용자 목록 조회 요청');
    
    const { page = 1, limit = 50, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;
    
    // 검색 조건 구성
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (search) {
      whereClause += ' AND (username LIKE ? OR name LIKE ? OR email LIKE ? OR company LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }
    
    // 파라미터에 LIMIT과 OFFSET 추가
    params.push(parseInt(limit), parseInt(offset));
    
    // 사용자 목록 조회
    const [users] = await pool.execute(`
      SELECT 
        id,
        username,
        name,
        email,
        phone,
        company,
        role,
        is_active,
        last_login,
        created_at,
        updated_at,
        default_sender_address,
        default_sender_detail_address,
        default_sender_zipcode
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, params);
    
    // 총 개수 조회
    const countParams = params.slice(0, -2); // LIMIT, OFFSET 제외
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, countParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    console.log('✅ 사용자 목록 조회 성공:', { 
      users: users.length, 
      total, 
      page, 
      totalPages 
    });
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('❌ 사용자 목록 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사용자 목록 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 개별 사용자 조회
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('👤 개별 사용자 조회:', id);
    
    const [users] = await pool.execute(`
      SELECT 
        id, username, name, email, phone, company, role, is_active,
        last_login, created_at, updated_at,
        default_sender_address, default_sender_detail_address, default_sender_zipcode
      FROM users WHERE id = ?
    `, [id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    // 불린 타입 변환
    const user = {
      ...users[0],
      is_active: Boolean(users[0].is_active)
    };
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('❌ 개별 사용자 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사용자 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 새 사용자 생성
app.post('/api/users', async (req, res) => {
  try {
    console.log('👤 새 사용자 생성 요청');
    
    const {
      username, password, name, email, phone, company, role = 'user',
      default_sender_address, default_sender_detail_address, default_sender_zipcode
    } = req.body;
    
    // 필수 필드 검증
    if (!username || !password || !name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'username, password, name은 필수 필드입니다.'
      });
    }
    
    // 사용자명 중복 확인
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: '이미 사용 중인 사용자명입니다.'
      });
    }
    
    // 사용자 생성
    const [result] = await pool.execute(`
      INSERT INTO users (
        username, password, name, email, phone, company, role,
        default_sender_address, default_sender_detail_address, default_sender_zipcode,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `, [
      username, password, name, email, phone, company, role,
      default_sender_address, default_sender_detail_address, default_sender_zipcode
    ]);
    
    console.log('✅ 사용자 생성 성공:', { id: result.insertId, username });
    
    res.status(201).json({
      success: true,
      message: '사용자가 성공적으로 생성되었습니다.',
      data: {
        id: result.insertId,
        username,
        name,
        role
      }
    });
    
  } catch (error) {
    console.error('❌ 사용자 생성 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사용자 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 사용자 정보 수정
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('✏️ 사용자 정보 수정:', id);
    
    // 사용자 존재 확인
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    const {
      username, name, email, phone, company, role,
      default_sender_address, default_sender_detail_address, default_sender_zipcode,
      is_active
    } = req.body;
    
    // 사용자명 중복 확인 (자신 제외)
    if (username) {
      const [duplicateUsers] = await pool.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, id]
      );
      
      if (duplicateUsers.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: '이미 사용 중인 사용자명입니다.'
        });
      }
    }
    
    // 동적으로 업데이트할 필드들
    const updates = [];
    const values = [];
    
    if (username !== undefined) { updates.push('username = ?'); values.push(username); }
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (company !== undefined) { updates.push('company = ?'); values.push(company); }
    if (role !== undefined) { updates.push('role = ?'); values.push(role); }
    if (default_sender_address !== undefined) { updates.push('default_sender_address = ?'); values.push(default_sender_address); }
    if (default_sender_detail_address !== undefined) { updates.push('default_sender_detail_address = ?'); values.push(default_sender_detail_address); }
    if (default_sender_zipcode !== undefined) { updates.push('default_sender_zipcode = ?'); values.push(default_sender_zipcode); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    
    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '업데이트할 필드가 없습니다.'
      });
    }
    
    updates.push('updated_at = NOW()');
    values.push(id);
    
    const [result] = await pool.execute(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `, values);
    
    console.log('✅ 사용자 정보 수정 성공:', { id, affectedRows: result.affectedRows });
    
    res.json({
      success: true,
      message: '사용자 정보가 성공적으로 수정되었습니다.',
      affectedRows: result.affectedRows
    });
    
  } catch (error) {
    console.error('❌ 사용자 정보 수정 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사용자 정보 수정 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 사용자 삭제
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ 사용자 삭제:', id);
    
    // 사용자 존재 확인
    const [existingUsers] = await pool.execute('SELECT username FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    
    console.log('✅ 사용자 삭제 성공:', { 
      id, 
      username: existingUsers[0].username,
      affectedRows: result.affectedRows 
    });
    
    res.json({
      success: true,
      message: '사용자가 성공적으로 삭제되었습니다.',
      affectedRows: result.affectedRows
    });
    
  } catch (error) {
    console.error('❌ 사용자 삭제 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사용자 삭제 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// ============================
// TEST API ENDPOINTS
// ============================

// 파트너사 목록 조회 (테스트용)
app.get('/api/test/partners', async (req, res) => {
  try {
    console.log('👥 [Test API] 파트너사 목록 조회 요청');
    
    const [partners] = await pool.execute(`
      SELECT 
        id,
        username,
        name,
        email,
        phone,
        company,
        role,
        is_active,
        default_sender_address,
        default_sender_detail_address,
        default_sender_zipcode,
        created_at,
        updated_at
      FROM users 
      WHERE role IN ('user', 'manager', 'admin')
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ [Test API] 파트너사 목록 조회 완료: ${partners.length}개`);
    
    res.json({
      success: true,
      partners: partners.map(partner => ({
        ...partner,
        default_sender_name: partner.name,
        default_sender_company: partner.company,
        default_sender_phone: partner.phone
      }))
    });
    
  } catch (error) {
    console.error('❌ [Test API] 파트너사 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '파트너사 목록을 조회할 수 없습니다.',
      details: error.message
    });
  }
});

// 모든 파트너사 삭제 (테스트용)
app.delete('/api/test/partners', async (req, res) => {
  try {
    console.log('🗑️ [Test API] 모든 파트너사 삭제 요청');
    
    // admin 계정은 삭제하지 않음
    const [result] = await pool.execute(`
      DELETE FROM users 
      WHERE role IN ('user', 'manager') 
      AND username != 'admin'
    `);
    
    console.log(`✅ [Test API] 파트너사 삭제 완료: ${result.affectedRows}개 삭제`);
    
    res.json({
      success: true,
      message: `${result.affectedRows}개의 파트너사가 삭제되었습니다.`,
      deletedCount: result.affectedRows
    });
    
  } catch (error) {
    console.error('❌ [Test API] 파트너사 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '파트너사 삭제에 실패했습니다.',
      details: error.message
    });
  }
});

// 기사 목록 조회 (테스트용)
app.get('/api/test/drivers', async (req, res) => {
  try {
    console.log('🚛 [Test API] 기사 목록 조회 요청');
    
    // drivers 테이블이 있는지 확인
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'drivers'
    `);
    
    if (tables.length === 0) {
      console.log('⚠️ [Test API] drivers 테이블이 존재하지 않음');
      return res.json({
        success: true,
        drivers: []
      });
    }
    
    const [drivers] = await pool.execute(`
      SELECT 
        driver_id as id,
        username,
        name,
        email,
        phone,
        vehicle_type,
        vehicle_number,
        license_number,
        is_active,
        created_at,
        updated_at
      FROM drivers 
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ [Test API] 기사 목록 조회 완료: ${drivers.length}개`);
    
    res.json({
      success: true,
      drivers: drivers
    });
    
  } catch (error) {
    console.error('❌ [Test API] 기사 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '기사 목록을 조회할 수 없습니다.',
      details: error.message
    });
  }
});

// 모든 기사 삭제 (테스트용)
app.delete('/api/test/drivers', async (req, res) => {
  try {
    console.log('🗑️ [Test API] 모든 기사 삭제 요청');
    
    // drivers 테이블이 있는지 확인
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'drivers'
    `);
    
    if (tables.length === 0) {
      console.log('⚠️ [Test API] drivers 테이블이 존재하지 않음');
      return res.json({
        success: true,
        message: '삭제할 기사가 없습니다.',
        deletedCount: 0
      });
    }
    
    const [result] = await pool.execute('DELETE FROM drivers');
    
    console.log(`✅ [Test API] 기사 삭제 완료: ${result.affectedRows}개 삭제`);
    
    res.json({
      success: true,
      message: `${result.affectedRows}개의 기사가 삭제되었습니다.`,
      deletedCount: result.affectedRows
    });
    
  } catch (error) {
    console.error('❌ [Test API] 기사 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '기사 삭제에 실패했습니다.',
      details: error.message
    });
  }
});

// ============================
// DRIVERS API ENDPOINTS  
// ============================

// 기사 목록 조회
app.get('/api/drivers', async (req, res) => {
  try {
    console.log('🚛 기사 목록 조회 요청');
    
    const { page = 1, limit = 50, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    // drivers 테이블이 있는지 확인
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'drivers'
    `);
    
    if (tables.length === 0) {
      // drivers 테이블이 없으면 생성
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS drivers (
          driver_id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20),
          vehicle_type VARCHAR(50),
          vehicle_number VARCHAR(20),
          license_number VARCHAR(50),
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ drivers 테이블 생성 완료');
    }
    
    // 검색 조건 구성
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (search) {
      whereClause += ' AND (name LIKE ? OR username LIKE ? OR phone LIKE ? OR vehicle_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    params.push(parseInt(limit), parseInt(offset));
    
    const [drivers] = await pool.execute(`
      SELECT 
        driver_id as id,
        username,
        name,
        email,
        phone,
        vehicle_type,
        vehicle_number,
        license_number,
        is_active,
        created_at,
        updated_at
      FROM drivers 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, params);
    
    // 총 개수 조회
    const countParams = params.slice(0, -2);
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total FROM drivers ${whereClause}
    `, countParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    console.log(`✅ 기사 목록 조회 성공: ${drivers.length}개`);
    
    res.json({
      success: true,
      data: drivers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('❌ 기사 목록 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '기사 목록 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 새 기사 생성
app.post('/api/drivers', async (req, res) => {
  try {
    console.log('👤 새 기사 생성 요청');
    
    const {
      username, password, name, email, phone,
      vehicle_type, vehicle_number, license_number
    } = req.body;
    
    // 필수 필드 검증
    if (!username || !password || !name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'username, password, name은 필수 필드입니다.'
      });
    }
    
    // 사용자명 중복 확인
    const [existingDrivers] = await pool.execute(
      'SELECT driver_id FROM drivers WHERE username = ?',
      [username]
    );
    
    if (existingDrivers.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: '이미 사용 중인 사용자명입니다.'
      });
    }
    
    // 기사 생성
    const [result] = await pool.execute(`
      INSERT INTO drivers (
        username, password, name, email, phone,
        vehicle_type, vehicle_number, license_number,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `, [
      username, password, name, email, phone,
      vehicle_type, vehicle_number, license_number
    ]);
    
    console.log('✅ 기사 생성 성공:', { id: result.insertId, username });
    
    res.status(201).json({
      success: true,
      message: '기사가 성공적으로 생성되었습니다.',
      data: {
        id: result.insertId,
        username,
        name
      }
    });
    
  } catch (error) {
    console.error('❌ 기사 생성 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '기사 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 배송 생성 (52개 필드 지원)
app.post('/api/deliveries', async (req, res) => {
  try {
    console.log('📦 새로운 배송 접수 생성 시작');
    console.log('📝 요청 데이터 (전체):', JSON.stringify(req.body, null, 2));
    console.log('📊 데이터 분석:', {
      totalFields: Object.keys(req.body).length,
      undefinedFields: Object.entries(req.body).filter(([k,v]) => v === undefined).length,
      nullFields: Object.entries(req.body).filter(([k,v]) => v === null).length,
      stringFields: Object.entries(req.body).filter(([k,v]) => typeof v === 'string').length
    });
    
    const {
      sender_name, sender_company, sender_phone, sender_email,
      sender_address, sender_detail_address, sender_zipcode,
      receiver_name, receiver_phone, receiver_email,
      receiver_address, receiver_detail_address, receiver_zipcode,
      customer_name, customer_phone, customer_address,
      product_name, product_sku, product_quantity, seller_info,
      has_elevator, can_use_ladder_truck, preferred_delivery_date,
      is_fragile, is_frozen, requires_signature, insurance_amount,
      delivery_memo, special_instructions
    } = req.body;

    // 필드명 통일
    const finalReceiverName = receiver_name || customer_name;
    const finalReceiverPhone = receiver_phone || customer_phone; 
    const finalReceiverAddress = receiver_address || customer_address;

    // 필수 필드 검증
    if (!sender_name || !sender_address || !finalReceiverName || !finalReceiverPhone || !finalReceiverAddress) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '필수 필드가 누락되었습니다.'
      });
    }

    // 운송장 번호 생성
    const tracking_number = generateTrackingNumber();

    // 컬럼 확인
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deliveries'
      ORDER BY ORDINAL_POSITION
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);

    // 기본 필수 컬럼들
    const baseColumns = ['tracking_number', 'sender_name', 'sender_address', 'customer_name', 'customer_phone', 'customer_address', 'product_name', 'status', 'request_type'];
    const baseValues = [
      tracking_number,
      sender_name || null,
      (sender_address || '') + (sender_detail_address ? ' ' + sender_detail_address : ''),
      finalReceiverName || null,
      finalReceiverPhone || null,
      (finalReceiverAddress || '') + (receiver_detail_address ? ' ' + receiver_detail_address : ''),
      product_name || null,
      '접수완료',
      req.body.request_type || '배송접수'
    ];

    // 숫자 파싱 함수
    const parseNumber = (value) => {
      if (!value) return null;
      if (typeof value === 'number') return value;
      const numericValue = parseFloat(value.toString().replace(/[^0-9.]/g, ''));
      return isNaN(numericValue) ? null : numericValue;
    };

    // 추가 필드들
    const additionalFields = [
      { column: 'weight', value: parseNumber(req.body.weight || req.body.product_weight) },
      { column: 'driver_id', value: req.body.driver_id || null },
      { column: 'construction_type', value: req.body.construction_type },
      { column: 'visit_date', value: preferred_delivery_date || req.body.visit_date },
      { column: 'visit_time', value: req.body.visit_time },
      { column: 'furniture_company', value: sender_company || req.body.furniture_company },
      { column: 'emergency_contact', value: req.body.emergency_contact },
      { column: 'main_memo', value: req.body.main_memo || delivery_memo },
      { column: 'special_instructions', value: special_instructions },
      { column: 'detail_notes', value: req.body.detail_notes },
      { column: 'driver_notes', value: req.body.driver_notes },
      { column: 'building_type', value: req.body.building_type },
      { column: 'floor_count', value: req.body.floor_count },
      { column: 'elevator_available', value: has_elevator ? '있음' : (req.body.elevator_available || '없음') },
      { column: 'ladder_truck', value: can_use_ladder_truck ? '필요' : (req.body.ladder_truck || '불필요') },
      { column: 'disposal', value: req.body.disposal },
      { column: 'room_movement', value: req.body.room_movement },
      { column: 'wall_construction', value: req.body.wall_construction },
      { column: 'furniture_product_code', value: product_sku || req.body.furniture_product_code },
      { column: 'product_weight', value: req.body.product_weight },
      { column: 'product_size', value: req.body.product_size },
      { column: 'box_size', value: req.body.box_size },
      { column: 'furniture_requests', value: req.body.furniture_requests },
      { column: 'fragile', value: is_fragile ? 1 : (req.body.fragile ? 1 : 0) },
      { column: 'installation_photos', value: req.body.installation_photos ? JSON.stringify(req.body.installation_photos) : null },
      { column: 'customer_signature', value: req.body.customer_signature },
      { column: 'delivery_fee', value: parseNumber(req.body.delivery_fee) || 0 },
      { column: 'insurance_value', value: parseNumber(insurance_amount || req.body.insurance_value) || 0 },
      { column: 'cod_amount', value: parseNumber(req.body.cod_amount) || 0 },
      { column: 'estimated_delivery', value: preferred_delivery_date || req.body.estimated_delivery },
      { column: 'actual_delivery', value: req.body.actual_delivery },
      { column: 'completed_at', value: req.body.completed_at },
      { column: 'priority', value: req.body.priority || '보통' },
      { column: 'delivery_type', value: req.body.delivery_type || '일반배송' },
      { column: 'payment_method', value: req.body.payment_method },
      { column: 'shipping_method', value: req.body.shipping_method },
      { column: 'sender_phone', value: sender_phone },
      { column: 'sender_email', value: sender_email },
      { column: 'receiver_phone', value: finalReceiverPhone },
      { column: 'receiver_email', value: receiver_email },
      { column: 'sender_zipcode', value: sender_zipcode },
      { column: 'receiver_zipcode', value: receiver_zipcode },
      { column: 'sender_detail_address', value: sender_detail_address },
      { column: 'receiver_detail_address', value: receiver_detail_address },
      { column: 'product_quantity', value: product_quantity || 1 },
      { column: 'seller_info', value: seller_info },
      { column: 'frozen', value: is_frozen ? 1 : (req.body.frozen ? 1 : 0) },
      { column: 'signature_required', value: requires_signature ? 1 : (req.body.signature_required ? 1 : 0) },
      { column: 'notes', value: req.body.notes },
      { column: 'cancellation_reason', value: req.body.cancellation_reason },
      { column: 'cancelled_at', value: req.body.cancelled_at },
      { column: 'updated_at', value: req.body.updated_at }
    ];

    // 실제 존재하는 컬럼만 필터링
    const validAdditionalFields = additionalFields.filter(field => 
      existingColumns.includes(field.column)
    );

    // 최종 컬럼과 값 배열 (undefined를 null로 변환)
    const finalColumns = [...baseColumns, ...validAdditionalFields.map(f => f.column)];
    const finalValues = [...baseValues, ...validAdditionalFields.map(f => f.value === undefined ? null : f.value)];

    // INSERT 쿼리 생성
    const placeholders = finalColumns.map(() => '?').join(', ');
    const insertQuery = `INSERT INTO deliveries (${finalColumns.join(', ')}) VALUES (${placeholders})`;

    // 배송 데이터 삽입
    const [result] = await pool.execute(insertQuery, finalValues);
    
    console.log('✅ 배송 접수 생성 완료:', {
      insertId: result.insertId,
      trackingNumber: tracking_number,
      totalFields: finalColumns.length
    });

    res.status(201).json({
      success: true,
      message: '배송 접수가 성공적으로 생성되었습니다.',
      delivery: {
        id: result.insertId,
        tracking_number: tracking_number,
        status: '접수완료',
        sender_name: sender_name,
        customer_name: finalReceiverName,
        product_name: product_name,
        created_at: new Date().toISOString(),
        fieldsStored: finalColumns.length
      }
    });

  } catch (error) {
    console.error('❌ 배송 접수 생성 오류 상세:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      errno: error.errno,
      requestBody: JSON.stringify(req.body, null, 2)
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 접수 생성 중 오류가 발생했습니다.',
      details: error.message,
      code: error.code,
      time: new Date().toISOString()
    });
  }
});

// 배송 목록 조회
app.get('/api/deliveries', async (req, res) => {
  try {
    const [deliveries] = await pool.execute('SELECT * FROM deliveries ORDER BY created_at DESC');
    res.json({
      success: true,
      count: deliveries.length,
      deliveries: deliveries
    });
  } catch (error) {
    console.error('❌ 배송 목록 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 모든 배송 데이터 삭제 (테스트용)
app.delete('/api/deliveries/all', async (req, res) => {
  try {
    console.log('🗑️ 모든 배송 데이터 삭제 요청');
    
    // 삭제 전 데이터 개수 확인
    const [countResult] = await pool.execute('SELECT COUNT(*) as count FROM deliveries');
    const totalCount = countResult[0].count;
    
    console.log('📊 삭제 대상 배송 데이터:', totalCount + '개');
    
    // 모든 배송 데이터 삭제
    const [result] = await pool.execute('DELETE FROM deliveries');
    
    console.log('✅ 모든 배송 데이터가 성공적으로 삭제되었습니다.');
    console.log('📋 삭제된 레코드 수:', result.affectedRows);
    
    res.json({
      success: true,
      message: `총 ${result.affectedRows}개의 배송 데이터가 성공적으로 삭제되었습니다.`,
      deletedCount: result.affectedRows,
      totalCount: totalCount
    });
    
  } catch (error) {
    console.error('❌ 배송 데이터 삭제 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 데이터 삭제 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// Auth 라우트들
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 로그인 시도:', { username, passwordLength: password?.length });
    
    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '사용자명과 비밀번호가 필요합니다.'
      });
    }

    // 간단한 사용자 검증 (실제 구현에서는 bcrypt 사용)
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    console.log('👤 사용자 검색 결과:', { username, found: users.length > 0 });

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '잘못된 사용자명 또는 비밀번호입니다.',
        debug: `사용자 '${username}'를 찾을 수 없습니다.`
      });
    }

    const user = users[0];
    
    console.log('🔍 비밀번호 검증:', { 
      provided: password, 
      stored: user.password, 
      match: user.password === password 
    });
    
    // 간단한 비밀번호 검증 (테스트용)
    if (user.password !== password) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '잘못된 사용자명 또는 비밀번호입니다.',
        debug: '비밀번호가 일치하지 않습니다.'
      });
    }

    // 성공적인 로그인
    console.log('✅ 로그인 성공:', { username: user.username, role: user.role });
    
    res.json({
      success: true,
      message: '로그인 성공',
      user: {
        id: user.id,
        username: user.username,
        role: user.role || 'user',
        name: user.name
      }
    });

  } catch (error) {
    console.error('❌ 로그인 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '로그인 처리 중 오류가 발생했습니다.',
      debug: error.message
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: '로그아웃 성공'
  });
});

app.get('/api/auth/me', (req, res) => {
  // 간단한 인증 체크 (실제로는 JWT 토큰 검증)
  res.json({
    success: true,
    user: {
      id: 1,
      username: 'testuser',
      role: 'admin',
      name: '테스트 사용자'
    }
  });
});

// 데이터베이스 테이블 확인
app.get('/api/debug/tables', async (req, res) => {
  try {
    // users 테이블 확인
    const [usersTable] = await pool.execute(`
      SELECT COUNT(*) as count FROM users
    `);
    
    const [users] = await pool.execute(`
      SELECT id, username, role, name FROM users LIMIT 5
    `);

    // deliveries 테이블 확인
    const [deliveriesTable] = await pool.execute(`
      SELECT COUNT(*) as count FROM deliveries
    `);

    res.json({
      success: true,
      tables: {
        users: {
          count: usersTable[0].count,
          sample: users
        },
        deliveries: {
          count: deliveriesTable[0].count
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: '테이블 확인 중 오류 발생'
    });
  }
});

// 테스트 사용자 생성
app.post('/api/debug/create-test-user', async (req, res) => {
  try {
    // 테스트 사용자 생성
    const testUsers = [
      { username: 'admin', password: 'admin123', role: 'admin', name: '관리자' },
      { username: 'manager', password: 'manager123', role: 'manager', name: '매니저' },
      { username: 'driver', password: 'driver123', role: 'driver', name: '기사' }
    ];

    const results = [];
    
    for (const user of testUsers) {
      try {
        const [result] = await pool.execute(
          'INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)',
          [user.username, user.password, user.role, user.name]
        );
        results.push({ username: user.username, created: true, id: result.insertId });
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          results.push({ username: user.username, created: false, message: '이미 존재' });
        } else {
          results.push({ username: user.username, created: false, error: error.message });
        }
      }
    }

    res.json({
      success: true,
      message: '테스트 사용자 생성 완료',
      results: results
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: '테스트 사용자 생성 중 오류 발생'
    });
  }
});

// 사용자 비밀번호 업데이트 (디버그용)
app.post('/api/debug/update-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    
    if (!username || !newPassword) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'username과 newPassword가 필요합니다.'
      });
    }

    const [result] = await pool.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [newPassword, username]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: `사용자 '${username}'의 비밀번호가 업데이트되었습니다.`,
      username: username
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: '비밀번호 업데이트 중 오류 발생'
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});