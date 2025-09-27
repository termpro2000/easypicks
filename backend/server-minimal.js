const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
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

// delivery_products 테이블 생성 (존재하지 않을 경우)
async function createDeliveryProductsTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS delivery_products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        delivery_id INT NOT NULL,
        product_code VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_delivery_id (delivery_id),
        INDEX idx_product_code (product_code)
      );
    `);
    console.log('✅ delivery_products 테이블 확인/생성 완료');
  } catch (error) {
    console.error('❌ delivery_products 테이블 생성 오류:', error);
  }
}

// 앱 시작 시 테이블 생성
createDeliveryProductsTable();

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
    
    // 사용자 목록 조회 (기본 컬럼만 사용)
    const [users] = await pool.execute(`
      SELECT 
        id,
        username,
        name,
        email,
        phone,
        role,
        is_active,
        created_at,
        updated_at
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
    console.log('📋 요청 본문:', req.body);
    
    const {
      username, password, name, email, phone, company, role = 'user',
      default_sender_address, default_sender_detail_address, default_sender_zipcode
    } = req.body;
    
    console.log('📝 추출된 필드:', { username, name, email, phone, company, role });
    
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
    
    // 비밀번호 해싱
    console.log('🔐 비밀번호 해싱 중...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔐 비밀번호 해싱 완료');
    
    // undefined를 null로 변환
    const safeEmail = email || null;
    const safePhone = phone || null;
    const safeCompany = company || null;
    const safeDefaultSenderAddress = default_sender_address || null;
    const safeDefaultSenderDetailAddress = default_sender_detail_address || null;
    const safeDefaultSenderZipcode = default_sender_zipcode || null;
    
    console.log('📝 SQL 파라미터:', {
      username, hashedPassword: '***', name, 
      safeEmail, safePhone, safeCompany, role,
      safeDefaultSenderAddress, safeDefaultSenderDetailAddress, safeDefaultSenderZipcode
    });
    
    // 사용자 생성
    const [result] = await pool.execute(`
      INSERT INTO users (
        username, password, name, email, phone, company, role,
        default_sender_address, default_sender_detail_address, default_sender_zipcode,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `, [
      username, hashedPassword, name, safeEmail, safePhone, safeCompany, role,
      safeDefaultSenderAddress, safeDefaultSenderDetailAddress, safeDefaultSenderZipcode
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
      username, password, name, email, phone, company, role,
      default_sender_address, default_sender_detail_address, default_sender_zipcode,
      is_active
    } = req.body;
    
    console.log('📝 요청 본문:', req.body);
    console.log('🔐 비밀번호 필드:', password);
    
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
    if (password !== undefined) { 
      console.log('🔐 비밀번호 업데이트 시작:', password);
      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('🔐 비밀번호 해싱 완료:', password, '->', hashedPassword.substring(0, 20) + '...');
      updates.push('password = ?'); 
      values.push(hashedPassword); 
    }
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
    
    // 업데이트 전 상태 조회
    const [beforeUpdate] = await pool.execute(
      'SELECT id, username, password, LENGTH(password) as pw_length, updated_at FROM users WHERE id = ?',
      [id]
    );
    console.log('⏰ 업데이트 전 상태:', beforeUpdate[0]);
    
    console.log('📝 실행할 쿼리:', `UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
    console.log('📝 쿼리 값:', values);
    
    const [result] = await pool.execute(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `, values);
    
    console.log('✅ SQL UPDATE 실행 결과:', {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows,
      insertId: result.insertId,
      info: result.info,
      warningCount: result.warningCount
    });
    
    // 업데이트 후 상태 조회
    const [afterUpdate] = await pool.execute(
      'SELECT id, username, password, LENGTH(password) as pw_length, updated_at FROM users WHERE id = ?',
      [id]
    );
    console.log('⏰ 업데이트 후 상태:', afterUpdate[0]);
    console.log('🔄 변경 여부:', {
      passwordChanged: beforeUpdate[0].password !== afterUpdate[0].password,
      pwLengthBefore: beforeUpdate[0].pw_length,
      pwLengthAfter: afterUpdate[0].pw_length,
      updatedAtChanged: beforeUpdate[0].updated_at !== afterUpdate[0].updated_at
    });
    
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
        u.id,
        u.username,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        ud.detail as user_detail
      FROM users u
      LEFT JOIN user_detail ud ON u.id = ud.user_id
      WHERE u.role IN ('user', 'admin')
      ORDER BY u.created_at DESC
    `);
    
    console.log(`✅ [Test API] 파트너사 목록 조회 완료: ${partners.length}개`);
    
    const partnersWithDetails = partners.map(partner => {
      let detail = {};
      try {
        if (partner.user_detail) {
          detail = typeof partner.user_detail === 'string' 
            ? JSON.parse(partner.user_detail) 
            : partner.user_detail;
        }
      } catch (parseError) {
        console.warn(`[Test API] JSON 파싱 오류 (user_id: ${partner.id}):`, parseError);
      }

      return {
        id: partner.id,
        username: partner.username,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        role: partner.role,
        is_active: partner.is_active,
        last_login: partner.last_login,
        created_at: partner.created_at,
        updated_at: partner.updated_at,
        // 추가 상세 정보 (user_detail에서 추출)
        default_sender_name: detail.sender_name || partner.name,
        default_sender_company: detail.sender_company || '',
        default_sender_address: detail.sender_address || '',
        default_sender_detail_address: detail.sender_detail_address || '',
        default_sender_phone: detail.emergency_contact_phone || partner.phone,
        emergency_contact_name: detail.emergency_contact_name || '',
        emergency_contact_phone: detail.emergency_contact_phone || '',
        // 관리자의 경우
        address: detail.address || '',
        detail_address: detail.detail_address || '',
        zipcode: detail.zipcode || '',
        memo: detail.memo || ''
      };
    });
    
    res.json({
      success: true,
      partners: partnersWithDetails
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

// 디버그: 특정 user_id로 기사 검색
app.get('/api/debug/driver/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const [drivers] = await pool.execute(
      'SELECT * FROM drivers WHERE user_id = ?',
      [user_id]
    );
    
    res.json({
      success: true,
      user_id,
      found: drivers.length > 0,
      data: drivers[0] || null
    });
    
  } catch (error) {
    console.error('❌ 기사 검색 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '기사 검색 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 기사 목록 조회 (users 테이블에서 role='driver')
app.get('/api/drivers', async (req, res) => {
  try {
    console.log('🚛 기사 목록 조회 요청 (users 테이블에서 role=driver)');
    
    const { page = 1, limit = 50, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    // 검색 조건 구성
    let whereClause = "WHERE role = 'driver'";
    const params = [];
    
    if (search) {
      whereClause += ' AND (username LIKE ? OR name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // users 테이블에서 driver 역할 사용자 조회
    const [drivers] = await pool.execute(`
      SELECT 
        id,
        username,
        name,
        email,
        phone,
        role,
        is_active,
        last_login,
        created_at,
        updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);
    
    // 총 개수 조회
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM users 
      ${whereClause}
    `, params);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    console.log(`✅ 기사 목록 조회 성공 (users 테이블): ${drivers.length}개`);
    
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
      username, user_id, password, name, email, phone,
      vehicle_type, vehicle_number, license_number
    } = req.body;
    
    // username 또는 user_id 사용 (호환성)
    const finalUserId = user_id || username;
    
    // 필수 필드 검증
    if (!finalUserId || !password || !name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'user_id, password, name은 필수 필드입니다.'
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
    
    // user_id 컬럼이 있는 경우만 중복 확인
    if (columnNames.includes('user_id')) {
      const [existingDrivers] = await pool.execute(
        'SELECT id FROM drivers WHERE user_id = ?',
        [finalUserId]
      );
      
      if (existingDrivers.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: '이미 사용 중인 사용자 ID입니다.'
        });
      }
    }
    
    // 존재하는 컬럼만으로 INSERT 쿼리 구성
    const insertColumns = [];
    const insertValues = [];
    
    if (columnNames.includes('user_id')) {
      insertColumns.push('user_id');
      insertValues.push(finalUserId);
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
      insertValues.push(email || null);
    }
    if (columnNames.includes('phone')) {
      insertColumns.push('phone');
      insertValues.push(phone || null);
    }
    if (columnNames.includes('vehicle_type')) {
      insertColumns.push('vehicle_type');
      insertValues.push(vehicle_type || null);
    }
    if (columnNames.includes('vehicle_number')) {
      insertColumns.push('vehicle_number');
      insertValues.push(vehicle_number || null);
    }
    if (columnNames.includes('license_number')) {
      insertColumns.push('license_number');
      insertValues.push(license_number || null);
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
    
    console.log('✅ 기사 생성 성공:', { id: result.insertId, user_id: finalUserId });
    
    res.status(201).json({
      success: true,
      message: '기사가 성공적으로 생성되었습니다.',
      data: {
        id: result.insertId,
        user_id: finalUserId,
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
    
    const deliveryId = result.insertId;
    
    // 멀티-프로덕트 처리: products 필드가 있으면 delivery_products 테이블에 저장
    let savedProductsCount = 0;
    if (req.body.products && Array.isArray(req.body.products)) {
      console.log('📦 제품 목록 저장 시작:', req.body.products.length, '개');
      
      for (const product of req.body.products) {
        if (product.product_code || product.code) {
          try {
            await pool.execute(`
              INSERT INTO delivery_products (
                delivery_id, 
                product_code, 
                product_weight, 
                total_weight, 
                product_size, 
                box_size
              ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
              deliveryId,
              product.product_code || product.code,
              product.product_weight || product.weight || null,
              product.total_weight || null,
              product.product_size || product.size || null,
              product.box_size || null
            ]);
            savedProductsCount++;
            console.log('✅ 제품 저장 완료:', product.product_code || product.code);
          } catch (productError) {
            console.error('❌ 제품 저장 오류:', product, productError.message);
          }
        }
      }
    }
    
    console.log('✅ 배송 접수 생성 완료:', {
      insertId: result.insertId,
      trackingNumber: tracking_number,
      totalFields: finalColumns.length,
      productsCount: savedProductsCount
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
        fieldsStored: finalColumns.length,
        productsCount: savedProductsCount
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
    const { driver_id } = req.query;  // 쿼리 파라미터로 기사 ID 받기
    
    let query = 'SELECT * FROM deliveries';
    let queryParams = [];
    
    // 기사별 필터링이 요청된 경우 (driver_id만 사용)
    if (driver_id) {
      query += ' WHERE driver_id = ?';
      queryParams.push(driver_id);
      console.log(`🚛 기사별 배송 목록 조회: driver_id=${driver_id}`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [deliveries] = await pool.execute(query, queryParams);
    
    console.log(`📦 조회된 배송 개수: ${deliveries.length}${driver_id ? ` (기사 ID: ${driver_id})` : ''}`);
    
    res.json({
      success: true,
      count: deliveries.length,
      deliveries: deliveries,
      filter: driver_id ? { driver_id } : null
    });
  } catch (error) {
    console.error('❌ 배송 목록 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 배송 정보 수정 (기사 배정용)
app.put('/api/deliveries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 배송 정보 수정 요청: ID ${id}`);
    console.log('수정 데이터:', JSON.stringify(req.body, null, 2));
    
    // 배송 데이터 존재 확인
    const [existing] = await pool.execute('SELECT id FROM deliveries WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '해당 배송 정보를 찾을 수 없습니다.'
      });
    }
    
    // deliveries 테이블의 실제 컬럼 확인
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deliveries'
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 deliveries 테이블 컬럼:', existingColumns);
    
    // 동적 필드 업데이트 구성 (존재하는 컬럼만)
    const updateFields = [];
    const updateValues = [];
    
    // 기사 배정 관련 필드들 (존재하는 것만)
    if (req.body.driver_id !== undefined && existingColumns.includes('driver_id')) {
      updateFields.push('driver_id = ?');
      updateValues.push(req.body.driver_id);
    }
    if (req.body.status !== undefined && existingColumns.includes('status')) {
      updateFields.push('status = ?');
      updateValues.push(req.body.status);
    }
    
    // 기타 필드들 (존재하는 컬럼만)
    Object.keys(req.body).forEach(key => {
      if (!['driver_id', 'status'].includes(key) && existingColumns.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(req.body[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '업데이트할 유효한 필드가 없습니다.'
      });
    }
    
    // updated_at 추가 (존재하는 경우만)
    if (existingColumns.includes('updated_at')) {
      updateFields.push('updated_at = NOW()');
    }
    updateValues.push(id);
    
    console.log('🔄 업데이트 필드:', updateFields);
    console.log('🔄 업데이트 값:', updateValues);
    
    // 업데이트 실행
    const [result] = await pool.execute(`
      UPDATE deliveries SET ${updateFields.join(', ')} WHERE id = ?
    `, updateValues);
    
    console.log(`✅ 배송 정보 수정 완료: ID ${id}, 영향받은 행: ${result.affectedRows}`);
    
    res.json({
      success: true,
      message: '배송 정보가 성공적으로 수정되었습니다.',
      affectedRows: result.affectedRows
    });
    
  } catch (error) {
    console.error('❌ 배송 정보 수정 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 정보 수정 중 오류가 발생했습니다.',
      details: error.message
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
    const { username, user_id, password } = req.body;
    const loginId = username || user_id; // username 또는 user_id 둘 다 지원
    
    console.log('🔐 로그인 시도:', { username, user_id, loginId, passwordLength: password?.length });
    
    if (!loginId || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '사용자명(또는 user_id)과 비밀번호가 필요합니다.'
      });
    }

    // 사용자 검증 - users 테이블과 drivers 테이블 모두 확인
    let user = null;
    let userType = null;
    
    // 먼저 users 테이블에서 검색
    const [users] = await pool.execute(
      'SELECT *, "user" as user_type FROM users WHERE username = ?',
      [loginId]
    );

    if (users.length > 0) {
      user = users[0];
      userType = 'user';
    } else {
      // users 테이블에 없으면 drivers 테이블에서 user_id로 검색
      const [drivers] = await pool.execute(
        'SELECT *, "driver" as user_type, user_id as username FROM drivers WHERE user_id = ?',
        [loginId]
      );
      
      if (drivers.length > 0) {
        user = drivers[0];
        userType = 'driver';
      }
    }

    console.log('👤 사용자 검색 결과:', { loginId, found: !!user, userType });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '잘못된 사용자명 또는 비밀번호입니다.',
        debug: `사용자 '${loginId}'를 찾을 수 없습니다.`
      });
    }
    
    console.log('🔍 비밀번호 검증:', { 
      provided: password, 
      storedLength: user.password?.length,
      isHashed: user.password?.startsWith('$2a$') || user.password?.startsWith('$2b$')
    });
    
    // bcrypt를 사용한 비밀번호 검증 (해싱된 비밀번호와 평문 모두 지원)
    const bcrypt = require('bcryptjs');
    let isValidPassword = false;
    
    // 해싱된 비밀번호인지 확인 (bcrypt 해시는 $2a$ 또는 $2b$로 시작)
    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      // 해싱된 비밀번호와 비교
      isValidPassword = await bcrypt.compare(password, user.password);
      console.log('🔒 bcrypt 해시 비교 결과:', isValidPassword);
    } else {
      // 평문 비밀번호와 비교 (기존 계정 호환성)
      isValidPassword = user.password === password;
      console.log('📝 평문 비교 결과:', isValidPassword);
    }
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '잘못된 사용자명 또는 비밀번호입니다.',
        debug: '비밀번호가 일치하지 않습니다.'
      });
    }

    // 성공적인 로그인 - JWT 토큰 생성
    const actualRole = userType === 'driver' ? 'driver' : (user.role || 'user');
    const actualUsername = userType === 'driver' ? user.user_id : user.username;
    
    console.log('✅ 로그인 성공:', { username: actualUsername, role: actualRole, userType });
    
    // JWT 토큰 생성 (간단한 페이로드)
    const tokenPayload = {
      id: user.id,
      username: actualUsername,
      role: actualRole,
      name: user.name,
      userType: userType
    };
    
    // 실제 JWT 토큰 생성
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production-2023';
    const token = jwt.sign(
      tokenPayload,
      jwtSecret,
      { expiresIn: '30d' } // 30일 유효
    );
    
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

// auth/me 엔드포인트는 routes/auth.js에서 처리 (하드코딩 제거)

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
    const { username, user_id, password, name, phone, company } = req.body;
    const registerId = username || user_id; // username 또는 user_id 둘 다 지원
    
    console.log('👤 회원가입 요청:', { username, user_id, registerId, name, company });

    // 필수 필드 검증
    if (!registerId || !password || !name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '필수 필드가 누락되었습니다. (사용자명 또는 user_id, 비밀번호, 이름 필요)'
      });
    }

    // 사용자명 중복 확인
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [registerId]
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
    `, [registerId, password, name, phone || null, company || null]);

    console.log('✅ 회원가입 성공:', { id: result.insertId, registerId });

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

// 데이터베이스 스키마 전체 조회
app.get('/api/debug/schema', async (req, res) => {
  try {
    console.log('📊 데이터베이스 스키마 조회 시작');
    
    // 모든 테이블 목록 조회
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, TABLE_COMMENT
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);
    
    console.log('📋 발견된 테이블:', tables.map(t => t.TABLE_NAME).join(', '));
    
    const result = {
      success: true,
      database: await pool.execute('SELECT DATABASE() as db_name').then(r => r[0][0].db_name),
      total_tables: tables.length,
      tables: {}
    };
    
    // 각 테이블의 상세 정보 조회
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`🔍 테이블 '${tableName}' 분석 중...`);
      
      try {
        // 테이블 컬럼 정보
        const [columns] = await pool.execute(`
          SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            COLUMN_DEFAULT,
            CHARACTER_MAXIMUM_LENGTH as max_length,
            NUMERIC_PRECISION as numeric_precision,
            NUMERIC_SCALE as numeric_scale
          FROM information_schema.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [tableName]);
        
        // 테이블 row count 조회
        const [countResult] = await pool.execute(`SELECT COUNT(*) as row_count FROM \`${tableName}\``);
        
        result.tables[tableName] = {
          row_count: countResult[0].row_count,
          columns: columns.map(col => ({
            name: col.COLUMN_NAME,
            type: col.DATA_TYPE,
            nullable: col.IS_NULLABLE === 'YES',
            default: col.COLUMN_DEFAULT,
            max_length: col.max_length,
            precision: col.numeric_precision,
            scale: col.numeric_scale
          }))
        };
        
        console.log(`✅ 테이블 '${tableName}': ${columns.length}개 컬럼, ${countResult[0].row_count}개 레코드`);
        
      } catch (tableError) {
        console.error(`❌ 테이블 '${tableName}' 분석 오류:`, tableError.message);
        result.tables[tableName] = {
          error: tableError.message,
          accessible: false
        };
      }
    }
    
    console.log('✅ 데이터베이스 스키마 조회 완료');
    res.json(result);
    
  } catch (error) {
    console.error('❌ 스키마 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: '데이터베이스 스키마 조회 중 오류 발생'
    });
  }
});

// DDL 권한 테스트 및 delivery_products 테이블 생성
app.post('/api/debug/create-delivery-products-table', async (req, res) => {
  try {
    console.log('🛠️ delivery_products 테이블 생성 시도');
    
    // 먼저 현재 사용자 권한 확인
    const [privileges] = await pool.execute(`
      SHOW GRANTS FOR CURRENT_USER()
    `);
    
    console.log('🔐 현재 사용자 권한:', privileges.map(p => Object.values(p)[0]));
    
    // delivery_products 테이블 생성 시도 (PlanetScale은 외래키 제약 미지원)
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS delivery_products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        delivery_id INT NOT NULL,
        product_code VARCHAR(50) NOT NULL,
        product_weight VARCHAR(20),
        total_weight VARCHAR(20),
        product_size VARCHAR(100),
        box_size VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_delivery_id (delivery_id),
        INDEX idx_product_code (product_code)
      )
    `;
    
    console.log('📝 실행할 SQL:', createTableSQL);
    
    await pool.execute(createTableSQL);
    console.log('✅ delivery_products 테이블 생성 성공');
    
    // 테이블 생성 확인
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'delivery_products'
    `);
    
    if (tables.length > 0) {
      console.log('✅ 테이블 생성 확인됨');
      
      // 테스트 데이터 삽입
      const testData = [
        [1, 'PROD001', '50kg', '100kg', '1200x800x600mm', '1300x900x700mm'],
        [1, 'PROD002', '30kg', '60kg', '800x600x400mm', '900x700x500mm'],
        [2, 'PROD003', '75kg', '150kg', '1500x1000x800mm', '1600x1100x900mm']
      ];
      
      for (const data of testData) {
        try {
          await pool.execute(`
            INSERT INTO delivery_products (delivery_id, product_code, product_weight, total_weight, product_size, box_size)
            VALUES (?, ?, ?, ?, ?, ?)
          `, data);
          console.log('✅ 테스트 데이터 삽입:', data[1]);
        } catch (insertError) {
          console.log('⚠️ 테스트 데이터 삽입 오류 (무시):', insertError.message);
        }
      }
      
      // 최종 확인
      const [count] = await pool.execute('SELECT COUNT(*) as count FROM delivery_products');
      
      res.json({
        success: true,
        message: 'delivery_products 테이블이 성공적으로 생성되었습니다.',
        table_exists: true,
        record_count: count[0].count,
        privileges: privileges.map(p => Object.values(p)[0])
      });
      
    } else {
      res.json({
        success: false,
        message: '테이블 생성은 완료되었지만 확인되지 않음',
        table_exists: false,
        privileges: privileges.map(p => Object.values(p)[0])
      });
    }
    
  } catch (error) {
    console.error('❌ delivery_products 테이블 생성 오류:', error);
    
    // DDL 권한 오류인지 확인
    const isDDLError = error.message.includes('DDL') || 
                       error.message.includes('denied') || 
                       error.message.includes('CREATE');
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: isDDLError ? 
        'DDL 권한이 없어 테이블을 생성할 수 없습니다. 데이터베이스 관리자에게 문의하세요.' :
        'delivery_products 테이블 생성 중 오류 발생',
      is_ddl_error: isDDLError,
      error_code: error.code
    });
  }
});

// JSON 방식으로 멀티-제품 저장 (delivery_products 테이블 대안)
app.post('/api/debug/add-products-json-column', async (req, res) => {
  try {
    console.log('📦 deliveries 테이블에 products_json 컬럼 추가 시도');
    
    // 먼저 컬럼이 존재하는지 확인
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deliveries' 
      AND COLUMN_NAME = 'products_json'
    `);
    
    if (columns.length > 0) {
      return res.json({
        success: true,
        message: 'products_json 컬럼이 이미 존재합니다.',
        column_exists: true
      });
    }
    
    // products_json 컬럼 추가 시도
    const alterTableSQL = `
      ALTER TABLE deliveries 
      ADD COLUMN products_json JSON DEFAULT NULL 
      COMMENT '멀티-제품 정보를 JSON 형태로 저장'
    `;
    
    console.log('📝 실행할 SQL:', alterTableSQL);
    
    await pool.execute(alterTableSQL);
    console.log('✅ products_json 컬럼 추가 성공');
    
    // 테스트 데이터 업데이트
    const testProductsData = JSON.stringify([
      {
        product_code: 'PROD001',
        product_name: '테스트 제품1',
        product_weight: '50kg',
        product_size: '1200x800x600mm',
        box_size: '1300x900x700mm'
      },
      {
        product_code: 'PROD002', 
        product_name: '테스트 제품2',
        product_weight: '30kg',
        product_size: '800x600x400mm',
        box_size: '900x700x500mm'
      }
    ]);
    
    // 첫 번째 배송에 테스트 데이터 추가
    await pool.execute(`
      UPDATE deliveries 
      SET products_json = ? 
      WHERE id = 1
    `, [testProductsData]);
    
    console.log('✅ 테스트 데이터 업데이트 완료');
    
    res.json({
      success: true,
      message: 'products_json 컬럼이 성공적으로 추가되었습니다.',
      column_exists: true,
      test_data_updated: true,
      sample_data: testProductsData
    });
    
  } catch (error) {
    console.error('❌ products_json 컬럼 추가 오류:', error);
    
    const isDDLError = error.message.includes('DDL') || 
                       error.message.includes('denied') || 
                       error.message.includes('ALTER');
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: isDDLError ? 
        'DDL 권한이 없어 컬럼을 추가할 수 없습니다.' :
        'products_json 컬럼 추가 중 오류 발생',
      is_ddl_error: isDDLError,
      error_code: error.code
    });
  }
});

// delivery_details 테이블을 활용한 멀티-제품 관리
app.post('/api/deliveries/:deliveryId/products', async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { products } = req.body;
    
    console.log('📦 delivery_details를 이용한 제품 추가:', { deliveryId, productCount: products?.length });
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        error: 'products 배열이 필요합니다.'
      });
    }
    
    // 기존 제품 정보 삭제
    await pool.execute(`
      DELETE FROM delivery_details 
      WHERE delivery_id = ? AND detail_type = 'product'
    `, [deliveryId]);
    
    console.log('🗑️ 기존 제품 정보 삭제 완료');
    
    // 새로운 제품 정보 추가
    let addedCount = 0;
    for (const product of products) {
      if (product.product_code) {
        const productData = JSON.stringify({
          product_code: product.product_code,
          product_name: product.product_name || '',
          product_weight: product.product_weight || '',
          product_size: product.product_size || '',
          box_size: product.box_size || ''
        });
        
        await pool.execute(`
          INSERT INTO delivery_details (delivery_id, detail_type, detail_value, created_at, updated_at)
          VALUES (?, 'product', ?, NOW(), NOW())
        `, [deliveryId, productData]);
        
        addedCount++;
        console.log('✅ 제품 추가:', product.product_code);
      }
    }
    
    res.json({
      success: true,
      message: `${addedCount}개의 제품이 성공적으로 추가되었습니다.`,
      delivery_id: deliveryId,
      products_added: addedCount
    });
    
  } catch (error) {
    console.error('❌ 제품 추가 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: '제품 추가 중 오류가 발생했습니다.'
    });
  }
});

// 배송의 제품 목록 조회
app.get('/api/deliveries/:deliveryId/products', async (req, res) => {
  try {
    const { deliveryId } = req.params;
    
    console.log('📋 배송 제품 목록 조회:', deliveryId);
    
    const [products] = await pool.execute(`
      SELECT id, detail_value, created_at, updated_at
      FROM delivery_details 
      WHERE delivery_id = ? AND detail_type = 'product'
      ORDER BY created_at ASC
    `, [deliveryId]);
    
    const formattedProducts = products.map(product => {
      try {
        const productData = JSON.parse(product.detail_value);
        return {
          id: product.id,
          ...productData,
          created_at: product.created_at,
          updated_at: product.updated_at
        };
      } catch (parseError) {
        console.error('❌ JSON 파싱 오류:', parseError);
        return {
          id: product.id,
          product_code: product.detail_value,
          error: 'JSON 파싱 실패'
        };
      }
    });
    
    console.log('✅ 제품 목록 조회 완료:', formattedProducts.length, '개');
    
    res.json({
      success: true,
      delivery_id: deliveryId,
      products: formattedProducts,
      total_count: formattedProducts.length
    });
    
  } catch (error) {
    console.error('❌ 제품 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: '제품 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 특정 제품 삭제
app.delete('/api/deliveries/:deliveryId/products/:productId', async (req, res) => {
  try {
    const { deliveryId, productId } = req.params;
    
    console.log('🗑️ 제품 삭제:', { deliveryId, productId });
    
    const [result] = await pool.execute(`
      DELETE FROM delivery_details 
      WHERE id = ? AND delivery_id = ? AND detail_type = 'product'
    `, [productId, deliveryId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '삭제할 제품을 찾을 수 없습니다.'
      });
    }
    
    console.log('✅ 제품 삭제 완료');
    
    res.json({
      success: true,
      message: '제품이 성공적으로 삭제되었습니다.',
      delivery_id: deliveryId,
      product_id: productId
    });
    
  } catch (error) {
    console.error('❌ 제품 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: '제품 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 테스트용: 샘플 제품 데이터 추가
app.post('/api/debug/add-sample-products/:deliveryId', async (req, res) => {
  try {
    const { deliveryId } = req.params;
    
    const sampleProducts = [
      {
        product_code: 'PROD001',
        product_name: '소파 3인용',
        product_weight: '50kg',
        product_size: '2000x800x800mm',
        box_size: '2100x900x900mm'
      },
      {
        product_code: 'PROD002', 
        product_name: '침대 더블',
        product_weight: '75kg',
        product_size: '2000x1500x400mm',
        box_size: '2100x1600x500mm'
      },
      {
        product_code: 'PROD003',
        product_name: '옷장 4문',
        product_weight: '120kg', 
        product_size: '1800x600x2000mm',
        box_size: '1900x700x2100mm'
      }
    ];
    
    // 기존 제품 삭제
    await pool.execute(`
      DELETE FROM delivery_details 
      WHERE delivery_id = ? AND detail_type = 'product'
    `, [deliveryId]);
    
    // 샘플 제품 추가
    for (const product of sampleProducts) {
      const productData = JSON.stringify(product);
      await pool.execute(`
        INSERT INTO delivery_details (delivery_id, detail_type, detail_value, created_at, updated_at)
        VALUES (?, 'product', ?, NOW(), NOW())
      `, [deliveryId, productData]);
    }
    
    console.log('✅ 샘플 제품 데이터 추가 완료');
    
    res.json({
      success: true,
      message: `배송 ID ${deliveryId}에 ${sampleProducts.length}개의 샘플 제품이 추가되었습니다.`,
      delivery_id: deliveryId,
      products_added: sampleProducts.length,
      sample_products: sampleProducts
    });
    
  } catch (error) {
    console.error('❌ 샘플 제품 추가 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: '샘플 제품 추가 중 오류가 발생했습니다.'
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
// SCHEMA API 엔드포인트들
// ============================

// 스키마 정보 조회
app.get('/api/schema', async (req, res) => {
  try {
    console.log('📋 스키마 정보 조회 요청');
    
    // 모든 테이블 목록 조회
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, TABLE_COMMENT
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);
    
    // 각 테이블의 컬럼 정보 조회
    const schema = {};
    
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      
      const [columns] = await pool.execute(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          COLUMN_TYPE,
          COLUMN_KEY,
          EXTRA,
          COLUMN_COMMENT
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [tableName]);
      
      schema[tableName] = {
        table_info: {
          name: tableName,
          rows: table.TABLE_ROWS,
          comment: table.TABLE_COMMENT
        },
        columns: columns.map(col => ({
          name: col.COLUMN_NAME,
          type: col.DATA_TYPE,
          column_type: col.COLUMN_TYPE,
          nullable: col.IS_NULLABLE === 'YES',
          default: col.COLUMN_DEFAULT,
          key: col.COLUMN_KEY,
          extra: col.EXTRA,
          comment: col.COLUMN_COMMENT
        }))
      };
    }
    
    console.log(`✅ 스키마 정보 조회 완료: ${tables.length}개 테이블`);
    
    res.json({
      success: true,
      database: process.env.DB_NAME || 'unknown',
      tables: tables.length,
      schema: schema
    });
    
  } catch (error) {
    console.error('❌ 스키마 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '스키마 정보를 조회할 수 없습니다.',
      details: error.message
    });
  }
});

// 특정 테이블 스키마 조회
app.get('/api/schema/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    console.log('📋 테이블 스키마 조회:', tableName);
    
    // 테이블 존재 확인
    const [tableExists] = await pool.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, TABLE_COMMENT
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ?
    `, [tableName]);
    
    if (tableExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: '테이블을 찾을 수 없습니다.',
        tableName: tableName
      });
    }
    
    // 테이블 컬럼 정보 조회
    const [columns] = await pool.execute(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_TYPE,
        COLUMN_KEY,
        EXTRA,
        COLUMN_COMMENT
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [tableName]);
    
    res.json({
      success: true,
      table: {
        name: tableName,
        rows: tableExists[0].TABLE_ROWS,
        comment: tableExists[0].TABLE_COMMENT,
        columns: columns.map(col => ({
          name: col.COLUMN_NAME,
          type: col.DATA_TYPE,
          column_type: col.COLUMN_TYPE,
          nullable: col.IS_NULLABLE === 'YES',
          default: col.COLUMN_DEFAULT,
          key: col.COLUMN_KEY,
          extra: col.EXTRA,
          comment: col.COLUMN_COMMENT
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ 테이블 스키마 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '테이블 스키마를 조회할 수 없습니다.',
      details: error.message
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
    const { user_id } = req.query;
    console.log('📦 상품 목록 조회 요청', user_id ? `(user_id: ${user_id})` : '(전체)');
    
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

    // user_id 파라미터가 있으면 해당 사용자의 상품만 조회
    let query = 'SELECT * FROM products';
    let params = [];
    
    if (user_id) {
      query += ' WHERE user_id = ?';
      params.push(parseInt(user_id));
    }
    
    query += ' ORDER BY created_at DESC';

    const [products] = await pool.execute(query, params);

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
    console.log('📦 요청 데이터:', JSON.stringify(req.body, null, 2));
    
    const {
      name, maincode, subcode, weight, size,
      cost1, cost2, memo, user_id
    } = req.body;
    
    // 필수 필드 검증
    if (!name) {
      return res.status(400).json({
        success: false,
        error: '상품명은 필수 항목입니다.'
      });
    }
    
    console.log('📦 상품 생성 데이터:', { name, user_id, maincode, subcode });
    
    const [result] = await pool.execute(`
      INSERT INTO products (
        user_id, name, maincode, subcode, weight, size,
        cost1, cost2, memo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      user_id || null, name, maincode, subcode, weight, size,
      cost1 || 0, cost2 || 0, memo
    ]);
    
    console.log('✅ 상품 생성 성공:', { id: result.insertId, name });
    
    res.status(201).json({
      success: true,
      message: '상품이 성공적으로 생성되었습니다.',
      product: {
        id: result.insertId,
        name,
        maincode,
        subcode
      }
    });
    
  } catch (error) {
    console.error('❌ 상품 생성 오류:', error);
    console.error('❌ 에러 스택:', error.stack);
    console.error('❌ SQL 쿼리 관련:', error.sql);
    res.status(500).json({
      success: false,
      error: '상품 생성 중 오류가 발생했습니다.',
      details: error.message,
      sqlError: error.sql
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
    console.log('📦 상품 검색 요청:', q, '(decoded)');
    console.log('📦 검색 파라미터 타입:', typeof q, 'length:', q ? q.length : 0);
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: '검색어가 필요합니다.'
      });
    }
    
    const [products] = await pool.execute(`
      SELECT * FROM products 
      WHERE name LIKE ? OR maincode LIKE ? OR subcode LIKE ?
      ORDER BY name
      LIMIT 50
    `, [`%${q}%`, `%${q}%`, `%${q}%`]);
    
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

// === 배송 상태 업데이트 API ===

// 배송 완료 처리
app.post('/api/deliveries/complete/:id', async (req, res) => {
  const deliveryId = req.params.id;
  try {
    const { 
      completedAt, 
      driverNotes,
      customerRequestedCompletion,
      furnitureCompanyRequestedCompletion,
      completionAudioFile,
      // 기존 필드명도 지원 (하위 호환성)
      completion_notes, 
      completion_photo_url,
      completion_audio_url,
      customer_signature
    } = req.body;
    
    // 필드 매핑 (모바일 앱 필드명 우선)
    const completion_notes_final = driverNotes || completion_notes;
    const completion_audio_url_final = completionAudioFile || completion_audio_url;
    
    console.log('🎯 배송 완료 처리 요청 상세 정보:', {
      deliveryId,
      deliveryIdType: typeof deliveryId,
      completedAt,
      driverNotes: driverNotes?.substring(0, 50),
      customerRequestedCompletion,
      furnitureCompanyRequestedCompletion,
      completionAudioFile,
      completion_notes_final: completion_notes_final?.substring(0, 50),
      completion_audio_url_final,
      customer_signature: customer_signature ? '서명 데이터 있음' : '서명 데이터 없음',
      requestBody: JSON.stringify(req.body, null, 2)
    });

    // 배송 ID가 유효한지 먼저 확인
    const [existingDelivery] = await pool.execute(
      'SELECT id, status, tracking_number FROM deliveries WHERE id = ?',
      [deliveryId]
    );
    
    if (existingDelivery.length === 0) {
      console.error('❌ 배송 정보를 찾을 수 없음:', deliveryId);
      return res.status(404).json({
        success: false,
        error: '배송 정보를 찾을 수 없습니다.',
        deliveryId,
        details: '해당 ID의 배송이 존재하지 않습니다.'
      });
    }

    console.log('📋 기존 배송 정보:', existingDelivery[0]);

    // 정밀한 timestamp 처리 (한국 시간대 고려)
    const now = new Date();
    
    // 한국 시간대로 현재 시간 조정 (UTC+9)
    const koreaOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
    const koreaTime = new Date(now.getTime() + koreaOffset);
    
    // 밀리초 포함 timestamp (소수점 3자리 정밀도)
    const preciseCurrentTimestamp = Math.round(koreaTime.getTime() / 1000 * 1000) / 1000;
    let actualDeliveryTime = preciseCurrentTimestamp;
    
    if (completedAt) {
      const completedDate = new Date(completedAt);
      if (!isNaN(completedDate.getTime())) {
        // 완료 시간도 한국 시간대로 조정
        const completedKoreaTime = new Date(completedDate.getTime() + koreaOffset);
        actualDeliveryTime = Math.round(completedKoreaTime.getTime() / 1000 * 1000) / 1000;
      }
    }
    
    // timestamp 유효성 검사 (2000년 이후의 합리적한 값인지 확인)
    if (!actualDeliveryTime || actualDeliveryTime < 946684800) { // 2000-01-01 00:00:00 UTC
      actualDeliveryTime = preciseCurrentTimestamp;
    }
    
    // 최종적으로 정수형 timestamp로 변환 (MySQL 호환성)
    const finalTimestamp = Math.floor(actualDeliveryTime);

    console.log('📅 정밀한 시간 처리 정보:', {
      originalCompletedAt: completedAt,
      utcNow: now.toISOString(),
      koreaTime: koreaTime.toISOString(),
      preciseTimestamp: preciseCurrentTimestamp,
      actualDeliveryTime: actualDeliveryTime,
      finalTimestamp: finalTimestamp,
      readableKoreaTime: new Date(finalTimestamp * 1000).toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'}),
      timestampDifference: Math.abs(actualDeliveryTime - preciseCurrentTimestamp),
      isValidTimestamp: finalTimestamp > 946684800
    });

    // 실제 컬럼 존재 확인 및 데이터 타입 확인
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deliveries' 
      AND COLUMN_NAME IN ('actual_delivery', 'detail_notes', 'customer_signature', 'completion_audio_file')
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('🗃️ 존재하는 컬럼들:', columns);

    // actual_delivery 컬럼이 존재하는지 확인하고 데이터 타입 체크
    const actualDeliveryColumn = columns.find(col => col.COLUMN_NAME === 'actual_delivery');
    const hasActualDelivery = !!actualDeliveryColumn;
    
    let actualDeliveryValue = null;
    if (hasActualDelivery) {
      const dataType = actualDeliveryColumn.DATA_TYPE.toLowerCase();
      console.log('📊 actual_delivery 컬럼 정보:', {
        dataType: dataType,
        columnType: actualDeliveryColumn.COLUMN_TYPE
      });
      
      if (dataType === 'timestamp' || dataType === 'datetime') {
        // DATETIME/TIMESTAMP 타입인 경우 FROM_UNIXTIME 사용
        actualDeliveryValue = `FROM_UNIXTIME(${actualDeliveryTime})`;
      } else if (dataType === 'int' || dataType === 'bigint') {
        // INT/BIGINT 타입인 경우 timestamp 값 직접 사용
        actualDeliveryValue = actualDeliveryTime;
      } else if (dataType === 'varchar' || dataType === 'text') {
        // 문자열 타입인 경우 ISO 문자열 사용
        actualDeliveryValue = new Date(actualDeliveryTime * 1000).toISOString();
      } else {
        // 기본값: timestamp 숫자
        actualDeliveryValue = actualDeliveryTime;
      }
    }
    
    // actual_delivery 컬럼 타입에 따른 동적 처리
    let updateQuery, updateValues;
    
    if (hasActualDelivery) {
      const dataType = actualDeliveryColumn.DATA_TYPE.toLowerCase();
      console.log('🔧 actual_delivery 컬럼 처리:', {
        dataType: dataType,
        columnType: actualDeliveryColumn.COLUMN_TYPE,
        finalTimestamp: finalTimestamp,
        readableTime: new Date(finalTimestamp * 1000).toLocaleString('ko-KR')
      });
      
      if (dataType === 'datetime') {
        // DATETIME 타입: 한국 시간으로 직접 생성
        const koreaTime = new Date();
        koreaTime.setHours(koreaTime.getHours() + 9); // UTC+9 한국 시간
        const mysqlDateTime = koreaTime.toISOString().slice(0, 19).replace('T', ' ');
        
        updateQuery = `
          UPDATE deliveries 
          SET status = '배송완료',
              actual_delivery = ?,
              detail_notes = ?,
              customer_signature = ?,
              completion_audio_file = ?,
              updated_at = ?
          WHERE id = ?
        `;
        updateValues = [mysqlDateTime, completion_notes_final || null, customer_signature || null, completion_audio_url_final || null, mysqlDateTime, deliveryId];
      } else if (dataType === 'timestamp') {
        // TIMESTAMP 타입: 한국 시간으로 직접 생성
        const koreaTime = new Date();
        koreaTime.setHours(koreaTime.getHours() + 9); // UTC+9 한국 시간
        const mysqlDateTime = koreaTime.toISOString().slice(0, 19).replace('T', ' ');
        
        updateQuery = `
          UPDATE deliveries 
          SET status = '배송완료',
              actual_delivery = ?,
              detail_notes = ?,
              customer_signature = ?,
              completion_audio_file = ?,
              updated_at = ?
          WHERE id = ?
        `;
        updateValues = [mysqlDateTime, completion_notes_final || null, customer_signature || null, completion_audio_url_final || null, mysqlDateTime, deliveryId];
      } else if (dataType === 'int' || dataType === 'bigint') {
        // 정수 타입: 한국 시간 기준 UNIX timestamp
        const koreaTime = new Date();
        koreaTime.setHours(koreaTime.getHours() + 9); // UTC+9 한국 시간
        const koreaTimestamp = Math.floor(koreaTime.getTime() / 1000);
        const mysqlDateTime = koreaTime.toISOString().slice(0, 19).replace('T', ' ');
        
        updateQuery = `
          UPDATE deliveries 
          SET status = '배송완료',
              actual_delivery = ?,
              detail_notes = ?,
              customer_signature = ?,
              completion_audio_file = ?,
              updated_at = ?
          WHERE id = ?
        `;
        updateValues = [koreaTimestamp, completion_notes_final || null, customer_signature || null, completion_audio_url_final || null, mysqlDateTime, deliveryId];
      } else {
        // 기타 타입: NULL로 설정
        const koreaTime = new Date();
        koreaTime.setHours(koreaTime.getHours() + 9); // UTC+9 한국 시간
        const mysqlDateTime = koreaTime.toISOString().slice(0, 19).replace('T', ' ');
        
        updateQuery = `
          UPDATE deliveries 
          SET status = '배송완료',
              actual_delivery = NULL,
              detail_notes = ?,
              customer_signature = ?,
              completion_audio_file = ?,
              updated_at = ?
          WHERE id = ?
        `;
        updateValues = [completion_notes_final || null, customer_signature || null, completion_audio_url_final || null, mysqlDateTime, deliveryId];
      }
    } else {
      // actual_delivery 컬럼이 없는 경우
      const koreaTime = new Date();
      koreaTime.setHours(koreaTime.getHours() + 9); // UTC+9 한국 시간
      const mysqlDateTime = koreaTime.toISOString().slice(0, 19).replace('T', ' ');
      
      updateQuery = `
        UPDATE deliveries 
        SET status = '배송완료',
            detail_notes = ?,
            customer_signature = ?,
            completion_audio_file = ?,
            updated_at = ?
        WHERE id = ?
      `;
      updateValues = [completion_notes_final || null, customer_signature || null, completion_audio_url_final || null, mysqlDateTime, deliveryId];
    }

    console.log('🔧 실행할 쿼리:', updateQuery);
    console.log('🔧 쿼리 파라미터:', {
      finalTimestamp,
      completion_notes_final: completion_notes_final || 'null',
      customer_signature: customer_signature ? '서명 데이터' : 'null',
      completion_audio_url_final: completion_audio_url_final || 'null',
      deliveryId
    });

    const [result] = await pool.execute(updateQuery, updateValues);

    console.log('📊 쿼리 실행 결과:', {
      affectedRows: result.affectedRows,
      insertId: result.insertId,
      changedRows: result.changedRows,
      info: result.info,
      serverStatus: result.serverStatus,
      warningStatus: result.warningStatus
    });

    if (result.affectedRows === 0) {
      console.error('❌ 업데이트 실패 - 영향받은 행 없음:', deliveryId);
      return res.status(404).json({
        success: false,
        error: '배송 정보 업데이트에 실패했습니다.',
        deliveryId,
        details: '배송 정보가 존재하지만 업데이트되지 않았습니다.',
        queryResult: result
      });
    }

    console.log('✅ 배송 완료 처리 성공:', {
      deliveryId,
      affectedRows: result.affectedRows
    });
    
    // 현재 시간을 actual_delivery로 반환 (MySQL NOW() 결과와 일치)
    const currentTimeForResponse = Math.floor(Date.now() / 1000);
    
    res.json({
      success: true,
      message: '배송이 완료 처리되었습니다.',
      actual_delivery: currentTimeForResponse,
      deliveryId,
      affectedRows: result.affectedRows
    });

  } catch (error) {
    console.error('❌ 배송 완료 처리 전체 오류:', {
      errorMessage: error.message,
      errorCode: error.code,
      errorStack: error.stack,
      deliveryId,
      sqlState: error.sqlState,
      errno: error.errno,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      error: '배송 완료 처리 중 오류가 발생했습니다.',
      details: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        deliveryId
      }
    });
  }
});

// 배송 연기 처리
app.post('/api/deliveries/delay/:trackingNumber', async (req, res) => {
  const trackingNumber = req.params.trackingNumber;
  try {
    const { delayDate, delayReason } = req.body;
    
    console.log('⏰ 배송 연기 처리 요청:', {
      trackingNumber,
      delayDate,
      delayReason: delayReason?.substring(0, 50)
    });

    if (!delayDate || !delayReason) {
      return res.status(400).json({
        success: false,
        error: '연기 날짜와 사유가 필요합니다.'
      });
    }

    // 안전한 timestamp 처리
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    // timestamp 유효성 검사
    const actualDeliveryTime = (currentTimestamp > 946684800) ? currentTimestamp : Math.floor(Date.now() / 1000);

    const [result] = await pool.execute(`
      UPDATE deliveries 
      SET status = '배송연기',
          visit_date = ?,
          detail_notes = ?,
          actual_delivery = FROM_UNIXTIME(?),
          updated_at = NOW()
      WHERE tracking_number = ?
    `, [delayDate, delayReason, actualDeliveryTime, trackingNumber]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '배송 정보를 찾을 수 없습니다.'
      });
    }

    console.log('✅ 배송 연기 처리 성공:', trackingNumber);
    res.json({
      success: true,
      message: '배송이 연기되었습니다.',
      actual_delivery: actualDeliveryTime
    });

  } catch (error) {
    console.error('❌ 배송 연기 처리 오러:', error);
    res.status(500).json({
      success: false,
      error: '배송 연기 처리 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 배송 취소 처리
app.post('/api/deliveries/cancel/:id', async (req, res) => {
  const deliveryId = req.params.id;
  try {
    const { cancelReason, canceledAt } = req.body;
    
    console.log('❌ 배송 취소 처리 요청:', {
      deliveryId,
      cancelReason: cancelReason?.substring(0, 50),
      canceledAt
    });

    if (!cancelReason) {
      return res.status(400).json({
        success: false,
        error: '취소 사유가 필요합니다.'
      });
    }

    // 한국 시간 기준 canceled_at 처리 (배송완료 로직 참조)
    let mysqlCanceledAt;
    if (canceledAt) {
      try {
        const canceledDate = new Date(canceledAt);
        // 한국 시간 적용 (UTC+9)
        canceledDate.setHours(canceledDate.getHours() + 9);
        mysqlCanceledAt = canceledDate.toISOString().slice(0, 19).replace('T', ' ');
      } catch (error) {
        console.error('canceledAt 파싱 오류:', error);
        // 파싱 실패시 한국 시간 기준 현재 시간 사용
        const koreaTime = new Date();
        koreaTime.setHours(koreaTime.getHours() + 9);
        mysqlCanceledAt = koreaTime.toISOString().slice(0, 19).replace('T', ' ');
      }
    } else {
      // canceledAt가 없으면 한국 시간 기준 현재 시간 사용
      const koreaTime = new Date();
      koreaTime.setHours(koreaTime.getHours() + 9);
      mysqlCanceledAt = koreaTime.toISOString().slice(0, 19).replace('T', ' ');
    }

    // 안전한 timestamp 처리 (actual_delivery용)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const actualDeliveryTime = (currentTimestamp > 946684800) ? currentTimestamp : Math.floor(Date.now() / 1000);

    const [result] = await pool.execute(`
      UPDATE deliveries 
      SET status = '배송취소',
          cancel_status = 1,
          cancel_reason = ?,
          canceled_at = ?,
          actual_delivery = FROM_UNIXTIME(?),
          updated_at = NOW()
      WHERE id = ?
    `, [cancelReason, mysqlCanceledAt, actualDeliveryTime, deliveryId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '배송 정보를 찾을 수 없습니다.'
      });
    }

    console.log('✅ 배송 취소 처리 성공:', deliveryId);
    res.json({
      success: true,
      message: '배송이 취소되었습니다.',
      actual_delivery: actualDeliveryTime
    });

  } catch (error) {
    console.error('❌ 배송 취소 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: '배송 취소 처리 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// ===== DELIVERY PRODUCTS API =====

// 배송별 제품 목록 조회
app.get('/api/deliveries/:id/products', async (req, res) => {
  try {
    const { id: deliveryId } = req.params;
    
    const [products] = await pool.execute(`
      SELECT id, product_code, created_at, updated_at
      FROM delivery_products 
      WHERE delivery_id = ?
      ORDER BY created_at ASC
    `, [deliveryId]);
    
    res.json({
      success: true,
      products: products
    });
  } catch (error) {
    console.error('❌ 제품 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '제품 목록 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 배송에 제품 추가
app.post('/api/deliveries/:id/products', async (req, res) => {
  try {
    const { id: deliveryId } = req.params;
    const { product_code } = req.body;
    
    if (!product_code) {
      return res.status(400).json({
        success: false,
        error: '제품코드가 필요합니다.'
      });
    }
    
    // 중복 체크
    const [existing] = await pool.execute(`
      SELECT id FROM delivery_products 
      WHERE delivery_id = ? AND product_code = ?
    `, [deliveryId, product_code]);
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: '이미 추가된 제품코드입니다.'
      });
    }
    
    const [result] = await pool.execute(`
      INSERT INTO delivery_products (delivery_id, product_code)
      VALUES (?, ?)
    `, [deliveryId, product_code]);
    
    res.json({
      success: true,
      message: '제품이 추가되었습니다.',
      product_id: result.insertId
    });
  } catch (error) {
    console.error('❌ 제품 추가 오류:', error);
    res.status(500).json({
      success: false,
      error: '제품 추가 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 배송에서 제품 제거
app.delete('/api/deliveries/:deliveryId/products/:productId', async (req, res) => {
  try {
    const { deliveryId, productId } = req.params;
    
    const [result] = await pool.execute(`
      DELETE FROM delivery_products 
      WHERE id = ? AND delivery_id = ?
    `, [productId, deliveryId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '제품을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '제품이 제거되었습니다.'
    });
  } catch (error) {
    console.error('❌ 제품 제거 오류:', error);
    res.status(500).json({
      success: false,
      error: '제품 제거 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 배송의 모든 제품 일괄 업데이트
app.put('/api/deliveries/:id/products', async (req, res) => {
  try {
    const { id: deliveryId } = req.params;
    const { product_codes } = req.body;
    
    if (!Array.isArray(product_codes)) {
      return res.status(400).json({
        success: false,
        error: 'product_codes는 배열이어야 합니다.'
      });
    }
    
    // 트랜잭션 시작
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 기존 제품 모두 삭제
      await connection.execute(`
        DELETE FROM delivery_products WHERE delivery_id = ?
      `, [deliveryId]);
      
      // 새 제품들 추가
      if (product_codes.length > 0) {
        const values = product_codes.map(code => [deliveryId, code]);
        const placeholders = values.map(() => '(?, ?)').join(', ');
        const flatValues = values.flat();
        
        await connection.execute(`
          INSERT INTO delivery_products (delivery_id, product_code)
          VALUES ${placeholders}
        `, flatValues);
      }
      
      await connection.commit();
      
      res.json({
        success: true,
        message: '제품 목록이 업데이트되었습니다.',
        count: product_codes.length
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ 제품 일괄 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      error: '제품 일괄 업데이트 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 배송에 제품 목록 배치 저장 (새로운 엔드포인트)
app.post('/api/deliveries/:id/products/batch', async (req, res) => {
  try {
    const { id: deliveryId } = req.params;
    const { products } = req.body;
    
    console.log('📦 배송 제품 배치 저장 요청:', { deliveryId, productsCount: products?.length });
    
    if (!Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        error: 'products는 배열이어야 합니다.'
      });
    }
    
    // 트랜잭션 시작
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 기존 제품 모두 삭제
      await connection.execute(`
        DELETE FROM delivery_products WHERE delivery_id = ?
      `, [deliveryId]);
      
      console.log('🗑️ 기존 제품 삭제 완료');
      
      // 새로운 제품들 추가
      for (const product of products) {
        if (product.product_code) {
          await connection.execute(`
            INSERT INTO delivery_products (delivery_id, product_code, product_weight, total_weight, product_size, box_size)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            deliveryId, 
            product.product_code,
            product.product_weight || null,
            product.total_weight || null,
            product.product_size || null,
            product.box_size || null
          ]);
          
          console.log('✅ 제품 추가:', {
            product_code: product.product_code,
            product_weight: product.product_weight,
            total_weight: product.total_weight,
            product_size: product.product_size,
            box_size: product.box_size
          });
        }
      }
      
      await connection.commit();
      
      res.json({
        success: true,
        message: `총 ${products.length}개의 제품이 저장되었습니다.`,
        savedCount: products.filter(p => p.product_code).length
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 제품 배치 저장 오류:', error);
    res.status(500).json({
      success: false,
      error: '제품 배치 저장 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 비밀번호 디버그 엔드포인트 (임시)
app.get('/api/debug/password/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const [users] = await pool.execute(
      'SELECT id, username, password, LENGTH(password) as pw_length, updated_at FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length > 0) {
      const user = users[0];
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          password_length: user.pw_length,
          password_starts_with: user.password ? user.password.substring(0, 10) + '...' : 'null',
          is_bcrypt_hash: user.password?.startsWith('$2a$') || user.password?.startsWith('$2b$'),
          updated_at: user.updated_at
        }
      });
    } else {
      res.json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, req.body);
  next();
});

// Auth 라우트 추가 (JWT 인증 등)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Users 라우트 추가 (비밀번호 변경 등)
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// 디버그 엔드포인트: 테이블 컬럼 조회
app.get('/api/debug/columns/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [table]);
    
    res.json({
      success: true,
      table: table,
      columns: columns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 디버그 엔드포인트: 직접 SQL 실행 (UPDATE 테스트)
app.post('/api/debug/update-user', async (req, res) => {
  try {
    const { id, department, position } = req.body;
    
    // 업데이트 전 상태 확인
    const [beforeData] = await pool.execute('SELECT id, department, position FROM users WHERE id = ?', [id]);
    console.log('업데이트 전:', beforeData[0]);
    
    // 직접 SQL UPDATE 실행
    const [result] = await pool.execute(
      'UPDATE users SET department = ?, position = ?, updated_at = NOW() WHERE id = ?',
      [department, position, id]
    );
    
    // 업데이트 후 상태 확인
    const [afterData] = await pool.execute('SELECT id, department, position, updated_at FROM users WHERE id = ?', [id]);
    console.log('업데이트 후:', afterData[0]);
    
    res.json({
      success: true,
      before: beforeData[0],
      after: afterData[0],
      result: {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 디버그: 테스트 사용자 생성 엔드포인트
app.post('/api/debug/create-test-users', async (req, res) => {
  try {
    console.log('🧪 [DEBUG] 테스트 사용자 생성 요청');
    
    // 기존 데이터 확인
    const [existingUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
    console.log('📊 기존 사용자 수:', existingUsers[0].count);
    
    // 테스트 사용자들 삽입
    const testUsers = [
      { username: 'admin', password: 'admin123', name: '관리자', role: 'admin' },
      { username: 'mirae', password: '123456', name: '미래파트너', role: 'user' },
      { username: 'manager', password: '123456', name: '매니저', role: 'user' },
      { username: 'p1', password: '123456', name: '파트너1', role: 'user' },
      { username: 'd1', password: '123456', name: '기사1', role: 'driver' }
    ];
    
    const results = [];
    
    for (const user of testUsers) {
      try {
        // 중복 확인
        const [existing] = await pool.execute('SELECT id FROM users WHERE username = ?', [user.username]);
        
        if (existing.length === 0) {
          // 사용자 생성
          const [result] = await pool.execute(`
            INSERT INTO users (username, password, name, role, is_active, created_at, updated_at) 
            VALUES (?, ?, ?, ?, true, NOW(), NOW())
          `, [user.username, user.password, user.name, user.role]);
          
          results.push({
            username: user.username,
            status: 'created',
            id: result.insertId
          });
          console.log(`✅ 사용자 생성: ${user.username} (ID: ${result.insertId})`);
        } else {
          results.push({
            username: user.username,
            status: 'exists',
            id: existing[0].id
          });
          console.log(`ℹ️ 사용자 이미 존재: ${user.username} (ID: ${existing[0].id})`);
        }
      } catch (userError) {
        results.push({
          username: user.username,
          status: 'error',
          error: userError.message
        });
        console.error(`❌ 사용자 생성 실패: ${user.username} - ${userError.message}`);
      }
    }
    
    // 최종 사용자 수 확인
    const [finalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [roleStats] = await pool.execute(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY role
    `);
    
    res.json({
      success: true,
      message: '테스트 사용자 생성 완료',
      results,
      stats: {
        totalUsers: finalUsers[0].count,
        byRole: roleStats.reduce((acc, stat) => {
          acc[stat.role] = stat.count;
          return acc;
        }, {})
      }
    });
    
  } catch (error) {
    console.error('❌ [DEBUG] 테스트 사용자 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: '테스트 사용자 생성 중 오류가 발생했습니다.'
    });
  }
});

// ==========================================
// USER_DETAIL API 엔드포인트
// ==========================================

// 사용자별 상세정보 조회
app.get('/api/user-detail/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`📋 사용자 상세정보 조회 요청 - userId: ${userId}`);
    
    const [details] = await pool.execute(
      'SELECT * FROM user_detail WHERE user_id = ?',
      [userId]
    );
    
    if (details.length === 0) {
      return res.json({
        success: true,
        message: '사용자 상세정보가 없습니다.',
        data: null
      });
    }
    
    const detail = details[0];
    
    // JSON 데이터 파싱
    let parsedDetail = {};
    try {
      parsedDetail = typeof detail.detail === 'string' 
        ? JSON.parse(detail.detail) 
        : detail.detail;
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      parsedDetail = {};
    }
    
    const result = {
      id: detail.id,
      user_id: detail.user_id,
      role: detail.role,
      detail: parsedDetail,
      created_at: detail.created_at,
      updated_at: detail.updated_at
    };
    
    console.log('✅ 사용자 상세정보 조회 성공:', result);
    
    res.json({
      success: true,
      message: '사용자 상세정보 조회 성공',
      data: result
    });
    
  } catch (error) {
    console.error('❌ 사용자 상세정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 상세정보 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 사용자 상세정보 생성/업데이트
app.post('/api/user-detail/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, detail } = req.body;
    
    console.log(`📝 사용자 상세정보 생성/업데이트 요청 - userId: ${userId}, role: ${role}`);
    console.log('상세정보 데이터:', detail);
    
    // 입력값 검증
    if (!detail) {
      return res.status(400).json({
        success: false,
        message: 'detail은 필수 입력값입니다.'
      });
    }
    
    // 사용자 존재 확인
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '존재하지 않는 사용자입니다.'
      });
    }
    
    // 기존 상세정보 존재 확인
    const [existing] = await pool.execute(
      'SELECT id, role FROM user_detail WHERE user_id = ?',
      [userId]
    );
    
    // JSON 문자열로 변환
    const detailJson = JSON.stringify(detail);
    
    if (existing.length === 0) {
      // 신규 생성
      const [result] = await pool.execute(
        'INSERT INTO user_detail (user_id, role, detail) VALUES (?, ?, ?)',
        [userId, role || 'user', detailJson]
      );
      
      console.log('✅ 사용자 상세정보 생성 성공 - ID:', result.insertId);
      
      res.json({
        success: true,
        message: '사용자 상세정보가 성공적으로 생성되었습니다.',
        data: {
          id: result.insertId,
          user_id: userId,
          role: role || 'user',
          detail: detail
        }
      });
    } else {
      // 업데이트
      await pool.execute(
        'UPDATE user_detail SET role = ?, detail = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [role || existing[0].role, detailJson, userId]
      );
      
      console.log('✅ 사용자 상세정보 업데이트 성공');
      
      res.json({
        success: true,
        message: '사용자 상세정보가 성공적으로 업데이트되었습니다.',
        data: {
          user_id: userId,
          role: role || existing[0].role,
          detail: detail
        }
      });
    }
    
  } catch (error) {
    console.error('❌ 사용자 상세정보 생성/업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 상세정보 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 사용자 상세정보 업데이트 (PUT)
app.put('/api/user-detail/:userId', async (req, res) => {
  // POST와 동일한 로직 사용
  return app._router.handle(Object.assign(req, { method: 'POST' }), res);
});

// 사용자 상세정보 삭제
app.delete('/api/user-detail/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🗑️ 사용자 상세정보 삭제 요청 - userId: ${userId}`);
    
    // 기존 상세정보 존재 확인
    const [existing] = await pool.execute(
      'SELECT id FROM user_detail WHERE user_id = ?',
      [userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '삭제할 상세정보가 존재하지 않습니다.'
      });
    }
    
    await pool.execute(
      'DELETE FROM user_detail WHERE user_id = ?',
      [userId]
    );
    
    console.log('✅ 사용자 상세정보 삭제 성공');
    
    res.json({
      success: true,
      message: '사용자 상세정보가 성공적으로 삭제되었습니다.'
    });
    
  } catch (error) {
    console.error('❌ 사용자 상세정보 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 상세정보 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});