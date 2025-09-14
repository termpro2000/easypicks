const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// 재시도 로직을 위한 헬퍼 함수
const executeWithRetry = async (query, params = [], maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const [result] = await pool.execute(query, params);
      return result;
    } catch (error) {
      console.error(`데이터베이스 쿼리 시도 ${attempt}/${maxRetries} 실패:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 재시도 전 대기 시간 (지수 백오프)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

// 모든 기사 조회
const getAllDrivers = async (req, res) => {
  try {
    console.log('[기사 목록 조회] 시작');

    const query = `
      SELECT 
        id as driver_id,
        user_id as username,
        name,
        phone,
        email,
        vehicle_type,
        vehicle_number,
        cargo_capacity as license_number,
        1 as is_active,
        created_at,
        updated_at
      FROM drivers 
      ORDER BY created_at DESC
    `;

    const drivers = await executeWithRetry(query);
    
    console.log(`[기사 목록 조회] ${drivers.length}개 조회 완료`);
    
    res.json({
      success: true,
      drivers: drivers,
      total: drivers.length
    });

  } catch (error) {
    console.error('기사 목록 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '기사 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
};

// 특정 기사 조회
const getDriver = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[기사 상세 조회] ID: ${id}`);

    const query = `
      SELECT 
        id as driver_id,
        user_id as username,
        name,
        phone,
        email,
        vehicle_type,
        vehicle_number,
        cargo_capacity as license_number,
        1 as is_active,
        created_at,
        updated_at
      FROM drivers 
      WHERE id = ?
    `;

    const drivers = await executeWithRetry(query, [id]);
    
    if (drivers.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '기사를 찾을 수 없습니다.'
      });
    }

    console.log(`[기사 상세 조회] 완료`);
    
    res.json({
      success: true,
      driver: drivers[0]
    });

  } catch (error) {
    console.error('기사 상세 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '기사 정보를 불러오는 중 오류가 발생했습니다.'
    });
  }
};

// 새 기사 생성
const createDriver = async (req, res) => {
  try {
    console.log('[기사 생성] 요청 수신');
    console.log('요청 데이터:', req.body);

    const {
      username,
      password,
      name,
      phone,
      email,
      vehicle_type,
      vehicle_number,
      license_number
    } = req.body;

    // 필수 필드 검증
    if (!username || !password || !name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '사용자명, 비밀번호, 이름은 필수입니다.'
      });
    }

    // 사용자명 중복 확인
    const checkQuery = 'SELECT id FROM drivers WHERE user_id = ?';
    const existingDrivers = await executeWithRetry(checkQuery, [username]);
    
    if (existingDrivers.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: '이미 존재하는 사용자명입니다.'
      });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO drivers (
        user_id, password, name, phone, email, vehicle_type, vehicle_number, cargo_capacity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      username,
      hashedPassword,
      name,
      phone || null,
      email || null,
      vehicle_type || null,
      vehicle_number || null,
      license_number || null
    ];

    const result = await executeWithRetry(query, values);
    
    console.log(`[기사 생성] 완료 - ID: ${result.insertId}`);
    
    res.status(201).json({
      success: true,
      message: '기사가 성공적으로 생성되었습니다.',
      driverId: result.insertId
    });

  } catch (error) {
    console.error('기사 생성 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '기사 생성 중 오류가 발생했습니다.'
    });
  }
};

// 기사 수정
const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[기사 수정] ID: ${id}`);
    console.log('수정 데이터:', req.body);

    const {
      username,
      password,
      name,
      phone,
      email,
      vehicle_type,
      vehicle_number,
      license_number,
      is_active
    } = req.body;

    // 기사 존재 여부 확인
    const checkQuery = 'SELECT id FROM drivers WHERE id = ?';
    const existingDrivers = await executeWithRetry(checkQuery, [id]);
    
    if (existingDrivers.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '수정할 기사를 찾을 수 없습니다.'
      });
    }

    // 사용자명 중복 확인 (현재 기사 제외)
    if (username) {
      const duplicateCheckQuery = 'SELECT id FROM drivers WHERE user_id = ? AND id != ?';
      const duplicateDrivers = await executeWithRetry(duplicateCheckQuery, [username, id]);
      
      if (duplicateDrivers.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: '이미 존재하는 사용자명입니다.'
        });
      }
    }

    let query = `
      UPDATE drivers SET
        user_id = ?,
        name = ?,
        phone = ?,
        email = ?,
        vehicle_type = ?,
        vehicle_number = ?,
        cargo_capacity = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    let values = [
      username,
      name,
      phone || null,
      email || null,
      vehicle_type || null,
      vehicle_number || null,
      license_number || null,
      id
    ];

    // 비밀번호가 제공된 경우에만 업데이트
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = `
        UPDATE drivers SET
          username = ?,
          password = ?,
          name = ?,
          phone = ?,
          email = ?,
          vehicle_type = ?,
          vehicle_number = ?,
          license_number = ?,
          is_active = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE driver_id = ?
      `;
      values = [
        username,
        hashedPassword,
        name,
        phone || null,
        email || null,
        vehicle_type || null,
        vehicle_number || null,
        license_number || null,
        id
      ];
    }

    await executeWithRetry(query, values);
    
    console.log(`[기사 수정] 완료`);
    
    res.json({
      success: true,
      message: '기사 정보가 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('기사 수정 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '기사 수정 중 오류가 발생했습니다.'
    });
  }
};

// 기사 삭제
const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[기사 삭제] ID: ${id}`);

    // 기사 존재 여부 확인
    const checkQuery = 'SELECT id FROM drivers WHERE id = ?';
    const existingDrivers = await executeWithRetry(checkQuery, [id]);
    
    if (existingDrivers.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '삭제할 기사를 찾을 수 없습니다.'
      });
    }

    const query = 'DELETE FROM drivers WHERE id = ?';
    await executeWithRetry(query, [id]);
    
    console.log(`[기사 삭제] 완료`);
    
    res.json({
      success: true,
      message: '기사가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('기사 삭제 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '기사 삭제 중 오류가 발생했습니다.'
    });
  }
};

// 기사 검색
const searchDrivers = async (req, res) => {
  try {
    const { q } = req.query;
    console.log(`[기사 검색] 검색어: ${q}`);

    if (!q) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '검색어를 입력해주세요.'
      });
    }

    const query = `
      SELECT 
        id as driver_id,
        user_id as username,
        name,
        phone,
        email,
        vehicle_type,
        vehicle_number,
        cargo_capacity as license_number,
        1 as is_active,
        created_at,
        updated_at
      FROM drivers 
      WHERE name LIKE ? OR user_id LIKE ? OR phone LIKE ? OR vehicle_number LIKE ?
      ORDER BY created_at DESC
    `;

    const searchTerm = `%${q}%`;
    const drivers = await executeWithRetry(query, [searchTerm, searchTerm, searchTerm, searchTerm]);
    
    console.log(`[기사 검색] ${drivers.length}개 검색 완료`);
    
    res.json({
      success: true,
      drivers: drivers,
      total: drivers.length,
      searchTerm: q
    });

  } catch (error) {
    console.error('기사 검색 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '기사 검색 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getAllDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  searchDrivers
};