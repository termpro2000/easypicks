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
      console.log('⚠️ [Test API] drivers 테이블이 존재하지 않음 - users 테이블에서 driver 역할 조회');
      
      // users 테이블에서 driver 역할의 사용자들을 조회
      const [drivers] = await pool.execute(`
        SELECT 
          id,
          username,
          name,
          email,
          phone,
          company as vehicle_type,
          phone as vehicle_number,
          '' as license_number,
          is_active,
          created_at,
          updated_at
        FROM users 
        WHERE role = 'driver'
        ORDER BY created_at DESC
      `);
      
      console.log(`✅ [Test API] 기사 목록 조회 완료 (users 테이블에서): ${drivers.length}개`);
      
      return res.json({
        success: true,
        drivers: drivers
      });
    }
    
    // drivers 테이블이 있는 경우 - 동적 컬럼 확인
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'drivers'
    `);
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    console.log('📋 [Test API] drivers 테이블 컬럼:', columnNames);
    
    // 존재하는 컬럼만 선택
    const selectColumns = ['id'];
    if (columnNames.includes('name')) selectColumns.push('name');
    if (columnNames.includes('email')) selectColumns.push('email');
    if (columnNames.includes('phone')) selectColumns.push('phone');
    if (columnNames.includes('vehicle_type')) selectColumns.push('vehicle_type');
    if (columnNames.includes('vehicle_number')) selectColumns.push('vehicle_number');
    if (columnNames.includes('license_number')) selectColumns.push('license_number');
    if (columnNames.includes('is_active')) selectColumns.push('is_active');
    if (columnNames.includes('created_at')) selectColumns.push('created_at');
    if (columnNames.includes('updated_at')) selectColumns.push('updated_at');
    
    const [drivers] = await pool.execute(`
      SELECT ${selectColumns.join(', ')}
      FROM drivers 
      ORDER BY ${columnNames.includes('created_at') ? 'created_at' : 'id'} DESC
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
    
    // drivers 테이블이 있는지 확인
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'drivers'
    `);
    
    if (tables.length === 0) {
      console.log('⚠️ drivers 테이블이 존재하지 않음 - 빈 배열 반환');
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    }
    
    // drivers 테이블 컬럼 확인
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'drivers'
    `);
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    console.log('📋 drivers 테이블 컬럼:', columnNames);
    
    // 기본적으로 존재할 것으로 예상되는 컬럼들만 조회
    const selectColumns = ['id'];
    if (columnNames.includes('username')) selectColumns.push('username');
    if (columnNames.includes('name')) selectColumns.push('name');
    if (columnNames.includes('email')) selectColumns.push('email');
    if (columnNames.includes('phone')) selectColumns.push('phone');
    if (columnNames.includes('vehicle_type')) selectColumns.push('vehicle_type');
    if (columnNames.includes('vehicle_number')) selectColumns.push('vehicle_number');
    if (columnNames.includes('license_number')) selectColumns.push('license_number');
    if (columnNames.includes('is_active')) selectColumns.push('is_active');
    if (columnNames.includes('created_at')) selectColumns.push('created_at');
    if (columnNames.includes('updated_at')) selectColumns.push('updated_at');
    
    const offset = (page - 1) * limit;
    
    const [drivers] = await pool.execute(`
      SELECT ${selectColumns.join(', ')}
      FROM drivers 
      ORDER BY ${columnNames.includes('created_at') ? 'created_at' : 'id'} DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);
    
    // 총 개수 조회
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total FROM drivers
    `);
    
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
    
    // drivers 테이블 컬럼 확인 (동적)
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'drivers'
    `);
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    console.log('📋 [Create Driver] drivers 테이블 컬럼:', columnNames);
    
    // username 컬럼이 있는 경우만 중복 확인
    if (columnNames.includes('username')) {
      const [existingDrivers] = await pool.execute(
        'SELECT id FROM drivers WHERE username = ?',
        [username]
      );
      
      if (existingDrivers.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: '이미 사용 중인 사용자명입니다.'
        });
      }
    }
    
    // 존재하는 컬럼만으로 INSERT 쿼리 구성
    const insertColumns = [];
    const insertValues = [];
    
    if (columnNames.includes('username')) {
      insertColumns.push('username');
      insertValues.push(username);
    }
    if (columnNames.includes('password')) {
      insertColumns.push('password');
      insertValues.push(password);
    }
    if (columnNames.includes('name')) {
      insertColumns.push('name');
      insertValues.push(name);
    }
    if (columnNames.includes('email')) {
      insertColumns.push('email');
      insertValues.push(email);
    }
    if (columnNames.includes('phone')) {
      insertColumns.push('phone');
      insertValues.push(phone);
    }
    if (columnNames.includes('vehicle_type')) {
      insertColumns.push('vehicle_type');
      insertValues.push(vehicle_type);
    }
    if (columnNames.includes('vehicle_number')) {
      insertColumns.push('vehicle_number');
      insertValues.push(vehicle_number);
    }
    if (columnNames.includes('license_number')) {
      insertColumns.push('license_number');
      insertValues.push(license_number);
    }
    if (columnNames.includes('is_active')) {
      insertColumns.push('is_active');
      insertValues.push(1);
    }
    if (columnNames.includes('created_at')) {
      insertColumns.push('created_at');
      insertValues.push(new Date());
    }
    if (columnNames.includes('updated_at')) {
      insertColumns.push('updated_at');
      insertValues.push(new Date());
    }
    
    const placeholders = insertColumns.map(() => '?').join(', ');
    
    // 기사 생성
    const [result] = await pool.execute(`
      INSERT INTO drivers (${insertColumns.join(', ')}) 
      VALUES (${placeholders})
    `, insertValues);
    
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

// 기사 정보 수정
app.put('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('✏️ 기사 정보 수정 요청:', id);
    
    const {
      username, password, name, email, phone,
      vehicle_type, vehicle_number, license_number, is_active
    } = req.body;
    
    // 기사 존재 확인
    const [existingDrivers] = await pool.execute('SELECT id FROM drivers WHERE id = ?', [id]);
    if (existingDrivers.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '기사를 찾을 수 없습니다.'
      });
    }
    
    // drivers 테이블 컬럼 확인
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'drivers'
    `);
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    console.log('📋 drivers 테이블 컬럼:', columnNames);
    
    // 동적으로 업데이트할 필드들
    const updates = [];
    const values = [];
    
    if (username !== undefined && columnNames.includes('username')) { 
      updates.push('username = ?'); 
      values.push(username); 
    }
    if (password !== undefined && columnNames.includes('password')) { 
      updates.push('password = ?'); 
      values.push(password); 
    }
    if (name !== undefined && columnNames.includes('name')) { 
      updates.push('name = ?'); 
      values.push(name); 
    }
    if (email !== undefined && columnNames.includes('email')) { 
      updates.push('email = ?'); 
      values.push(email); 
    }
    if (phone !== undefined && columnNames.includes('phone')) { 
      updates.push('phone = ?'); 
      values.push(phone); 
    }
    if (vehicle_type !== undefined && columnNames.includes('vehicle_type')) { 
      updates.push('vehicle_type = ?'); 
      values.push(vehicle_type); 
    }
    if (vehicle_number !== undefined && columnNames.includes('vehicle_number')) { 
      updates.push('vehicle_number = ?'); 
      values.push(vehicle_number); 
    }
    if (license_number !== undefined && columnNames.includes('license_number')) { 
      updates.push('license_number = ?'); 
      values.push(license_number); 
    }
    if (is_active !== undefined && columnNames.includes('is_active')) { 
      updates.push('is_active = ?'); 
      values.push(is_active ? 1 : 0); 
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '업데이트할 필드가 없습니다.'
      });
    }
    
    if (columnNames.includes('updated_at')) {
      updates.push('updated_at = NOW()');
    }
    values.push(id);
    
    const [result] = await pool.execute(`
      UPDATE drivers SET ${updates.join(', ')} WHERE id = ?
    `, values);
    
    console.log('✅ 기사 정보 수정 성공:', { id, affectedRows: result.affectedRows });
    
    res.json({
      success: true,
      message: '기사 정보가 성공적으로 수정되었습니다.',
      affectedRows: result.affectedRows
    });
    
  } catch (error) {
    console.error('❌ 기사 정보 수정 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '기사 정보 수정 중 오류가 발생했습니다.',
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
      stringFields: Object.entries(req.body).filter(([k,v]) => typeof v === 'string').length,
      numberFields: Object.entries(req.body).filter(([k,v]) => typeof v === 'number').length,
      booleanFields: Object.entries(req.body).filter(([k,v]) => typeof v === 'boolean').length,
      objectFields: Object.entries(req.body).filter(([k,v]) => typeof v === 'object' && v !== null).length
    });
    
    console.log('🔍 필드별 상세 분석:');
    Object.entries(req.body).forEach(([key, value]) => {
      console.log(`  ${key}: ${JSON.stringify(value)} (${typeof value})`);
    });
    
    // 날짜/시간 변환 함수 (MySQL datetime 형식으로 변환)
    const convertToMySQLDatetime = (dateString) => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        // ISO 8601을 MySQL datetime 형식으로 변환 (YYYY-MM-DD HH:MM:SS)
        return date.toISOString().slice(0, 19).replace('T', ' ');
      } catch (e) {
        console.warn('❌ 날짜 변환 오류:', dateString, e.message);
        return null;
      }
    };
    
    // 프론트엔드에서 보내는 52개 필드 구조에 맞게 수정
    const {
      // 발송자 정보
      sender_name, sender_company, sender_phone, sender_email,
      sender_address, sender_detail_address, sender_zipcode,
      
      // 수신자 정보 (customer_ 필드 우선)
      receiver_name, receiver_phone, receiver_email,
      receiver_address, receiver_detail_address, receiver_zipcode,
      customer_name, customer_phone, customer_address,
      
      // 상품 정보
      product_name, product_sku, product_quantity, seller_info,
      product_weight, product_size, box_size,
      
      // 배송 옵션
      has_elevator, can_use_ladder_truck, preferred_delivery_date,
      is_fragile, is_frozen, requires_signature, insurance_amount,
      delivery_memo, special_instructions,
      
      // 추가 필드들 (프론트엔드에서 보내는 모든 필드 포함)
      weight, delivery_fee, insurance_value, cod_amount, distance,
      driver_id, delivery_attempts, request_type, construction_type,
      visit_time, furniture_company, emergency_contact, building_type,
      floor_count, elevator_available, ladder_truck, disposal,
      room_movement, wall_construction, furniture_product_code,
      last_location, main_memo, furniture_requests, driver_notes,
      detail_notes, cancel_reason, completion_audio_file,
      fragile, cancel_status, customer_requested_completion,
      furniture_company_requested_completion, visit_date,
      estimated_delivery, actual_delivery, canceled_at,
      installation_photos, customer_signature
    } = req.body;

    // 필드명 통일 (customer_ 필드 우선 사용)
    const finalReceiverName = customer_name || receiver_name;
    const finalReceiverPhone = customer_phone || receiver_phone; 
    const finalReceiverAddress = customer_address || receiver_address;

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
      { column: 'estimated_delivery', value: convertToMySQLDatetime(req.body.estimated_delivery) },
      { column: 'actual_delivery', value: convertToMySQLDatetime(req.body.actual_delivery) },
      { column: 'completed_at', value: convertToMySQLDatetime(req.body.completed_at) },
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
      { column: 'cancelled_at', value: convertToMySQLDatetime(req.body.canceled_at || req.body.cancelled_at) },
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

    // 성공적인 로그인 - JWT 토큰 생성
    console.log('✅ 로그인 성공:', { username: user.username, role: user.role });
    
    // JWT 토큰 생성 (간단한 페이로드)
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role || 'user',
      name: user.name
    };
    
    // 개발용 간단한 토큰 (실제로는 JWT 라이브러리 사용)
    const token = `token-${user.id}-${Date.now()}`;
    
    res.json({
      success: true,
      message: '로그인 성공',
      token: token,
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

// 사용자명 중복 확인
app.get('/api/auth/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log('🔍 사용자명 중복 확인:', username);

    const [users] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    const available = users.length === 0;
    const message = available ? '사용 가능한 사용자명입니다.' : '이미 사용 중인 사용자명입니다.';

    console.log('✅ 사용자명 확인 결과:', { username, available });

    res.json({
      available,
      message
    });

  } catch (error) {
    console.error('❌ 사용자명 확인 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사용자명 확인 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 회원가입
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, name, phone, company } = req.body;
    console.log('👤 회원가입 요청:', { username, name, company });

    // 필수 필드 검증
    if (!username || !password || !name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '필수 필드가 누락되었습니다.'
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
        message: '이미 사용 중인 아이디입니다.'
      });
    }

    // 사용자 생성 (비밀번호는 평문 저장 - 개발용)
    const [result] = await pool.execute(`
      INSERT INTO users (username, password, name, phone, company, role, is_active, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, 'user', 1, NOW(), NOW())
    `, [username, password, name, phone || null, company || null]);

    console.log('✅ 회원가입 성공:', { id: result.insertId, username });

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      userId: result.insertId
    });

  } catch (error) {
    console.error('❌ 회원가입 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '회원가입 처리 중 오류가 발생했습니다.',
      details: error.message
    });
  }
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

// drivers 테이블에 username, password 컬럼 추가 (디버그용)
app.post('/api/debug/add-driver-columns', async (req, res) => {
  try {
    console.log('📋 drivers 테이블에 username, password 컬럼 추가 시작');
    
    // 현재 컬럼 확인
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'drivers'
    `);
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    console.log('📋 기존 drivers 테이블 컬럼:', columnNames);
    
    const results = [];
    
    // username 컬럼 추가
    if (!columnNames.includes('username')) {
      await pool.execute(`
        ALTER TABLE drivers ADD COLUMN username VARCHAR(50) NULL AFTER id
      `);
      console.log('✅ username 컬럼 추가 완료');
      results.push('username 컬럼 추가 완료');
    } else {
      results.push('username 컬럼 이미 존재');
    }
    
    // password 컬럼 추가
    if (!columnNames.includes('password')) {
      await pool.execute(`
        ALTER TABLE drivers ADD COLUMN password VARCHAR(255) NULL AFTER username
      `);
      console.log('✅ password 컬럼 추가 완료');
      results.push('password 컬럼 추가 완료');
    } else {
      results.push('password 컬럼 이미 존재');
    }
    
    res.json({
      success: true,
      message: 'drivers 테이블 컬럼 추가 작업 완료',
      results: results
    });
    
  } catch (error) {
    console.error('❌ drivers 테이블 컬럼 추가 오류:', error);
    res.status(500).json({
      error: error.message,
      message: 'drivers 테이블 컬럼 추가 중 오류 발생'
    });
  }
});

// ============================
// SHIPPING API 엔드포인트들
// ============================

// 주문 목록 조회
app.get('/api/shipping/orders', async (req, res) => {
  try {
    console.log('📦 주문 목록 조회 요청');
    
    // deliveries 테이블에서 주문 정보 조회
    const [orders] = await pool.execute(`
      SELECT 
        id,
        tracking_number,
        sender_name,
        customer_name,
        customer_phone,
        customer_address,
        product_name,
        status,
        created_at,
        updated_at
      FROM deliveries 
      ORDER BY created_at DESC
      LIMIT 100
    `);
    
    console.log(`✅ 주문 목록 조회 완료: ${orders.length}개`);
    
    res.json({
      success: true,
      orders: orders,
      total: orders.length
    });
    
  } catch (error) {
    console.error('❌ 주문 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '주문 목록을 조회할 수 없습니다.',
      details: error.message
    });
  }
});

// 새 배송 주문 생성
app.post('/api/shipping/orders', async (req, res) => {
  try {
    console.log('📦 새 배송 주문 생성 요청');
    
    const {
      sender_name, sender_address, customer_name, customer_phone, 
      customer_address, product_name, delivery_memo
    } = req.body;
    
    // 필수 필드 검증
    if (!sender_name || !customer_name || !customer_phone || !product_name) {
      return res.status(400).json({
        success: false,
        error: '필수 필드가 누락되었습니다.'
      });
    }
    
    // 운송장 번호 생성
    const tracking_number = generateTrackingNumber();
    
    // 배송 주문 생성
    const [result] = await pool.execute(`
      INSERT INTO deliveries (
        tracking_number, sender_name, sender_address, customer_name, 
        customer_phone, customer_address, product_name, status, 
        main_memo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, '접수완료', ?, NOW(), NOW())
    `, [
      tracking_number, sender_name, sender_address || '', customer_name,
      customer_phone, customer_address || '', product_name, delivery_memo || ''
    ]);
    
    console.log('✅ 배송 주문 생성 완료:', { id: result.insertId, tracking_number });
    
    res.status(201).json({
      success: true,
      message: '배송 주문이 성공적으로 생성되었습니다.',
      order: {
        id: result.insertId,
        tracking_number,
        sender_name,
        customer_name,
        product_name,
        status: '접수완료'
      }
    });
    
  } catch (error) {
    console.error('❌ 배송 주문 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '배송 주문 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 특정 주문 조회
app.get('/api/shipping/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📦 개별 주문 조회:', id);
    
    const [orders] = await pool.execute(`
      SELECT * FROM deliveries WHERE id = ?
    `, [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      order: orders[0]
    });
    
  } catch (error) {
    console.error('❌ 개별 주문 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '주문 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 주문 상태 업데이트
app.put('/api/shipping/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log('📦 주문 상태 업데이트:', { id, status });
    
    const [result] = await pool.execute(`
      UPDATE deliveries SET status = ?, updated_at = NOW() WHERE id = ?
    `, [status, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '주문 상태가 업데이트되었습니다.'
    });
    
  } catch (error) {
    console.error('❌ 주문 상태 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      error: '주문 상태 업데이트 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// ============================
// Products API 엔드포인트들
// ============================

// 모든 상품 조회
app.get('/api/products', async (req, res) => {
  try {
    console.log('📦 상품 목록 조회 요청');
    
    // products 테이블이 있는지 확인
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products'
    `);

    if (tables.length === 0) {
      console.log('⚠️ products 테이블이 존재하지 않음 - 빈 배열 반환');
      return res.json({
        success: true,
        products: [],
        total: 0
      });
    }

    const [products] = await pool.execute(`
      SELECT * FROM products 
      ORDER BY created_at DESC
    `);

    console.log(`✅ 상품 목록 조회 완료: ${products.length}개`);

    res.json({
      success: true,
      products: products,
      total: products.length
    });

  } catch (error) {
    console.error('❌ 상품 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '상품 목록을 조회할 수 없습니다.',
      details: error.message
    });
  }
});

// 특정 상품 조회
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📦 개별 상품 조회:', id);
    
    const [products] = await pool.execute(`
      SELECT * FROM products WHERE id = ?
    `, [id]);
    
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: '상품을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      product: products[0]
    });
    
  } catch (error) {
    console.error('❌ 개별 상품 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '상품 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 새 상품 생성
app.post('/api/products', async (req, res) => {
  try {
    console.log('📦 새 상품 생성 요청');
    
    const {
      name, code, maincode, subcode, weight, size,
      cost1, cost2, memo, partner_id
    } = req.body;
    
    // 필수 필드 검증
    if (!name) {
      return res.status(400).json({
        success: false,
        error: '상품명은 필수 항목입니다.'
      });
    }
    
    const [result] = await pool.execute(`
      INSERT INTO products (
        name, code, maincode, subcode, weight, size,
        cost1, cost2, memo, partner_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      name, code, maincode, subcode, weight, size,
      cost1 || 0, cost2 || 0, memo, partner_id
    ]);
    
    console.log('✅ 상품 생성 성공:', { id: result.insertId, name });
    
    res.status(201).json({
      success: true,
      message: '상품이 성공적으로 생성되었습니다.',
      product: {
        id: result.insertId,
        name,
        code,
        maincode,
        subcode
      }
    });
    
  } catch (error) {
    console.error('❌ 상품 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '상품 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 상품 수정
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📦 상품 수정 요청:', id);
    
    const {
      name, maincode, subcode, weight, size,
      cost1, cost2, memo
    } = req.body;
    
    // 필수 필드 검증
    if (!name) {
      return res.status(400).json({
        success: false,
        error: '상품명은 필수 항목입니다.'
      });
    }
    
    const [result] = await pool.execute(`
      UPDATE products SET
        name = ?, maincode = ?, subcode = ?, weight = ?, size = ?,
        cost1 = ?, cost2 = ?, memo = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      name, maincode, subcode, weight, size,
      cost1 || 0, cost2 || 0, memo, id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '상품을 찾을 수 없습니다.'
      });
    }
    
    console.log('✅ 상품 수정 성공:', { id, name });
    
    res.json({
      success: true,
      message: '상품이 성공적으로 수정되었습니다.'
    });
    
  } catch (error) {
    console.error('❌ 상품 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '상품 수정 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 상품 삭제
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📦 상품 삭제 요청:', id);
    
    const [result] = await pool.execute(`
      DELETE FROM products WHERE id = ?
    `, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '상품을 찾을 수 없습니다.'
      });
    }
    
    console.log('✅ 상품 삭제 성공:', { id });
    
    res.json({
      success: true,
      message: '상품이 성공적으로 삭제되었습니다.'
    });
    
  } catch (error) {
    console.error('❌ 상품 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '상품 삭제 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 상품 검색
app.get('/api/products/search', async (req, res) => {
  try {
    const { q } = req.query;
    console.log('📦 상품 검색 요청:', q);
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: '검색어가 필요합니다.'
      });
    }
    
    const [products] = await pool.execute(`
      SELECT * FROM products 
      WHERE name LIKE ? OR code LIKE ? OR maincode LIKE ? OR subcode LIKE ?
      ORDER BY name
      LIMIT 50
    `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);
    
    console.log(`✅ 상품 검색 완료: ${products.length}개`);
    
    res.json({
      success: true,
      products: products,
      total: products.length
    });
    
  } catch (error) {
    console.error('❌ 상품 검색 오류:', error);
    res.status(500).json({
      success: false,
      error: '상품 검색 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 상품 코드로 검색
app.get('/api/products/search/code', async (req, res) => {
  try {
    const { code } = req.query;
    console.log('📦 상품 코드 검색 요청:', code);
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: '상품 코드가 필요합니다.'
      });
    }
    
    const [products] = await pool.execute(`
      SELECT * FROM products 
      WHERE code = ? OR maincode = ? OR subcode = ?
      ORDER BY name
    `, [code, code, code]);
    
    console.log(`✅ 상품 코드 검색 완료: ${products.length}개`);
    
    res.json({
      success: true,
      products: products,
      total: products.length
    });
    
  } catch (error) {
    console.error('❌ 상품 코드 검색 오류:', error);
    res.status(500).json({
      success: false,
      error: '상품 코드 검색 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});