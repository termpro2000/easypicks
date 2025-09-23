const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { executeWithRetry, pool } = require('../config/database');

// 사용자 목록 조회 (관리자 전용)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    console.log('[Users API] 사용자 목록 조회 요청');
    
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
    
    // 사용자 목록 조회
    const [users] = await executeWithRetry(() =>
      pool.execute(`
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
      `, [...params, parseInt(limit), parseInt(offset)])
    );
    
    // 전체 개수 조회
    const [countResult] = await executeWithRetry(() =>
      pool.execute(`
        SELECT COUNT(*) as total 
        FROM users 
        ${whereClause}
      `, params)
    );
    
    const total = countResult[0].total;
    
    console.log(`[Users API] 사용자 목록 조회 완료: ${users.length}개 (전체: ${total}개)`);
    
    res.json({
      success: true,
      users: users.map(user => ({
        ...user,
        is_active: Boolean(user.is_active)
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('[Users API] 사용자 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 목록을 조회할 수 없습니다.',
      details: error.message
    });
  }
});

// 특정 사용자 조회
router.get('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Users API] 사용자 조회 요청: ID ${id}`);
    
    const [users] = await executeWithRetry(() =>
      pool.execute(`
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
        WHERE id = ?
      `, [id])
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }
    
    console.log(`[Users API] 사용자 조회 완료: ${users[0].username}`);
    
    res.json({
      success: true,
      user: {
        ...users[0],
        is_active: Boolean(users[0].is_active)
      }
    });
    
  } catch (error) {
    console.error('[Users API] 사용자 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자를 조회할 수 없습니다.',
      details: error.message
    });
  }
});

// 사용자 생성
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      username,
      password,
      name,
      email,
      phone,
      company,
      role = 'user',
      is_active = true,
      default_sender_address,
      default_sender_detail_address,
      default_sender_zipcode
    } = req.body;
    
    console.log(`[Users API] 사용자 생성 요청: ${username}`);
    console.log('받은 데이터:', {
      username, password: password ? '***' : undefined, name, email, phone, company, role, is_active,
      default_sender_address, default_sender_detail_address, default_sender_zipcode
    });
    
    // 필수 필드 검증
    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        error: '사용자명, 비밀번호, 이름은 필수입니다.'
      });
    }
    
    // 사용자명 중복 확인
    const [existingUsers] = await executeWithRetry(() =>
      pool.execute('SELECT id FROM users WHERE username = ?', [username])
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        error: '이미 존재하는 사용자명입니다.'
      });
    }
    
    // 비밀번호 해싱 (실제 환경에서는 bcrypt 사용 권장)
    const hashedPassword = password; // 임시로 평문 저장
    
    // 사용자 생성
    const insertValues = [
      username, hashedPassword, name, 
      email || null, phone || null, company || null, role, is_active,
      default_sender_address || null, default_sender_detail_address || null, default_sender_zipcode || null
    ];
    
    console.log('INSERT 값들:', insertValues.map((v, i) => `${i}: ${v === undefined ? 'UNDEFINED' : v === null ? 'NULL' : typeof v === 'string' ? `"${v}"` : v}`));
    
    const [result] = await executeWithRetry(() =>
      pool.execute(`
        INSERT INTO users (
          username, password, name, email, phone, company, role, is_active,
          default_sender_address, default_sender_detail_address, default_sender_zipcode,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, insertValues)
    );
    
    console.log(`[Users API] 사용자 생성 완료: ID ${result.insertId}`);
    
    res.status(201).json({
      success: true,
      message: '사용자가 성공적으로 생성되었습니다.',
      user: {
        id: result.insertId,
        username,
        name,
        email,
        phone,
        company,
        role,
        is_active
      }
    });
    
  } catch (error) {
    console.error('[Users API] 사용자 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자를 생성할 수 없습니다.',
      details: error.message
    });
  }
});

// 사용자 수정
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      password,
      name,
      email,
      phone,
      company,
      role,
      is_active,
      default_sender_address,
      default_sender_detail_address,
      default_sender_zipcode
    } = req.body;
    
    console.log(`[Users API] 사용자 수정 요청: ID ${id}`);
    
    // 사용자 존재 확인
    const [existingUsers] = await executeWithRetry(() =>
      pool.execute('SELECT id FROM users WHERE id = ?', [id])
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }
    
    // 사용자명 중복 확인 (다른 사용자가 사용하는지)
    if (username) {
      const [duplicateUsers] = await executeWithRetry(() =>
        pool.execute('SELECT id FROM users WHERE username = ? AND id != ?', [username, id])
      );
      
      if (duplicateUsers.length > 0) {
        return res.status(409).json({
          success: false,
          error: '이미 존재하는 사용자명입니다.'
        });
      }
    }
    
    // 업데이트할 필드 구성
    const updateFields = [];
    const updateValues = [];
    
    if (username !== undefined) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    if (password !== undefined) {
      updateFields.push('password = ?');
      updateValues.push(password); // 실제 환경에서는 해싱 필요
    }
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (company !== undefined) {
      updateFields.push('company = ?');
      updateValues.push(company);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }
    if (default_sender_address !== undefined) {
      updateFields.push('default_sender_address = ?');
      updateValues.push(default_sender_address);
    }
    if (default_sender_detail_address !== undefined) {
      updateFields.push('default_sender_detail_address = ?');
      updateValues.push(default_sender_detail_address);
    }
    if (default_sender_zipcode !== undefined) {
      updateFields.push('default_sender_zipcode = ?');
      updateValues.push(default_sender_zipcode);
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);
    
    if (updateFields.length === 1) { // updated_at만 있는 경우
      return res.status(400).json({
        success: false,
        error: '업데이트할 필드가 없습니다.'
      });
    }
    
    // 사용자 업데이트
    await executeWithRetry(() =>
      pool.execute(`
        UPDATE users SET ${updateFields.join(', ')} WHERE id = ?
      `, updateValues)
    );
    
    console.log(`[Users API] 사용자 수정 완료: ID ${id}`);
    
    res.json({
      success: true,
      message: '사용자가 성공적으로 수정되었습니다.'
    });
    
  } catch (error) {
    console.error('[Users API] 사용자 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자를 수정할 수 없습니다.',
      details: error.message
    });
  }
});

// 사용자 삭제
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Users API] 사용자 삭제 요청: ID ${id}`);
    
    // 사용자 존재 확인
    const [existingUsers] = await executeWithRetry(() =>
      pool.execute('SELECT username FROM users WHERE id = ?', [id])
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }
    
    const username = existingUsers[0].username;
    
    // 사용자 삭제
    await executeWithRetry(() =>
      pool.execute('DELETE FROM users WHERE id = ?', [id])
    );
    
    console.log(`[Users API] 사용자 삭제 완료: ${username} (ID: ${id})`);
    
    res.json({
      success: true,
      message: '사용자가 성공적으로 삭제되었습니다.',
      deletedUser: {
        id: parseInt(id),
        username
      }
    });
    
  } catch (error) {
    console.error('[Users API] 사용자 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자를 삭제할 수 없습니다.',
      details: error.message
    });
  }
});

module.exports = router;