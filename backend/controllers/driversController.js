const { pool } = require('../config/database');

// drivers 테이블 확인 및 생성
const ensureDriversTable = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        vehicle_type VARCHAR(50),
        vehicle_number VARCHAR(20),
        license_number VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_name (name),
        INDEX idx_phone (phone),
        INDEX idx_vehicle_number (vehicle_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await pool.execute(createTableQuery);
    console.log('drivers 테이블 확인/생성 완료');
  } catch (error) {
    console.error('drivers 테이블 생성 실패:', error);
  }
};

// 모든 기사 조회 (users 테이블에서 role='driver')
exports.getAllDrivers = async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        id as driver_id,
        username,
        name,
        phone,
        email,
        role,
        is_active,
        last_login,
        created_at,
        updated_at
      FROM users
      WHERE role = 'driver'
      ORDER BY created_at DESC
    `;
    
    const [drivers] = await pool.execute(query);
    
    res.json({
      success: true,
      data: drivers || [],
      drivers: drivers || []
    });
  } catch (error) {
    console.error('기사 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '기사 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 기사 상세 조회 (users 테이블에서 role='driver')
exports.getDriver = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        id as driver_id,
        username,
        name,
        phone,
        email,
        role,
        is_active,
        last_login,
        created_at,
        updated_at
      FROM users
      WHERE id = ? AND role = 'driver'
    `;
    
    const [drivers] = await pool.execute(query, [id]);
    
    if (drivers.length === 0) {
      return res.status(404).json({
        success: false,
        message: '기사를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      driver: drivers[0]
    });
  } catch (error) {
    console.error('기사 상세 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '기사 정보 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 기사 등록 (users 테이블에 role='driver'로 등록)
exports.createDriver = async (req, res) => {
  try {
    const {
      username,
      password,
      name,
      phone,
      email
    } = req.body;

    // 필수 필드 확인
    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        message: '사용자명, 비밀번호, 이름은 필수입니다.'
      });
    }

    // 중복 사용자명 확인
    const checkQuery = 'SELECT id FROM users WHERE username = ?';
    const [existing] = await pool.execute(checkQuery, [username]);
    
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: '이미 존재하는 사용자명입니다.'
      });
    }

    // 기사 등록 (users 테이블에 role='driver'로)
    const insertQuery = `
      INSERT INTO users (
        username, password, name, phone, email,
        role, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'driver', 1, NOW(), NOW())
    `;
    
    const [result] = await pool.execute(insertQuery, [
      username,
      password, // 실제 환경에서는 암호화 필요
      name,
      phone || null,
      email || null
    ]);

    res.status(201).json({
      success: true,
      message: '기사가 성공적으로 등록되었습니다.',
      id: result.insertId
    });
  } catch (error) {
    console.error('기사 등록 실패:', error);
    res.status(500).json({
      success: false,
      message: '기사 등록 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 기사 정보 수정 (users 테이블에서 role='driver')
exports.updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      password,
      name,
      phone,
      email,
      is_active
    } = req.body;

    // 기사 존재 확인
    const checkQuery = 'SELECT id FROM users WHERE id = ? AND role = "driver"';
    const [existing] = await pool.execute(checkQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '기사를 찾을 수 없습니다.'
      });
    }

    // 동적 UPDATE 쿼리 생성
    const updateFields = [];
    const updateValues = [];
    
    if (username !== undefined) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    if (password !== undefined) {
      updateFields.push('password = ?');
      updateValues.push(password); // 실제 환경에서는 암호화 필요
    }
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active ? 1 : 0);
    }
    
    updateFields.push('updated_at = NOW()');
    
    const updateQuery = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = ? AND role = 'driver'
    `;
    
    updateValues.push(id);
    
    await pool.execute(updateQuery, updateValues);

    res.json({
      success: true,
      message: '기사 정보가 수정되었습니다.'
    });
  } catch (error) {
    console.error('기사 수정 실패:', error);
    res.status(500).json({
      success: false,
      message: '기사 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 기사 삭제 (users 테이블에서 role='driver')
exports.deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;

    // 기사 존재 확인
    const checkQuery = 'SELECT id FROM users WHERE id = ? AND role = "driver"';
    const [existing] = await pool.execute(checkQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '기사를 찾을 수 없습니다.'
      });
    }

    // 기사 삭제 (또는 비활성화)
    // 실제로는 is_active = 0으로 설정하는 것이 좋을 수 있음
    const deleteQuery = 'DELETE FROM users WHERE id = ? AND role = "driver"';
    await pool.execute(deleteQuery, [id]);

    res.json({
      success: true,
      message: '기사가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('기사 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '기사 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 기사 검색 (users 테이블에서 role='driver')
exports.searchDrivers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return exports.getAllDrivers(req, res);
    }
    
    const searchTerm = `%${q}%`;
    const query = `
      SELECT 
        id,
        id as driver_id,
        username,
        name,
        phone,
        email,
        role,
        is_active,
        last_login,
        created_at,
        updated_at
      FROM users
      WHERE role = 'driver'
        AND (name LIKE ? 
        OR username LIKE ?
        OR phone LIKE ?)
      ORDER BY created_at DESC
    `;
    
    const [drivers] = await pool.execute(query, [
      searchTerm, searchTerm, searchTerm
    ]);
    
    res.json({
      success: true,
      drivers: drivers || []
    });
  } catch (error) {
    console.error('기사 검색 실패:', error);
    res.status(500).json({
      success: false,
      message: '기사 검색 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};