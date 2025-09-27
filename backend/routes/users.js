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
      whereClause += ' AND (username LIKE ? OR name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
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
          role,
          is_active,
          last_login,
          created_at,
          updated_at
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
          role,
          is_active,
          last_login,
          created_at,
          updated_at
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
    console.log('[Users API] 사용자 생성 요청 시작');
    console.log('요청 본문:', JSON.stringify(req.body, null, 2));
    
    const username = req.body.username;
    const password = req.body.password;
    const name = req.body.name;
    const email = req.body.email || null;
    const phone = req.body.phone || null;
    const role = req.body.role || 'user';
    
    // 허용된 role 값들 확인 (모든 역할 포함)
    const allowedRoles = ['admin', 'manager', 'user', 'driver'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `허용되지 않은 역할입니다. 허용된 역할: ${allowedRoles.join(', ')}`
      });
    }
    const is_active = req.body.is_active !== undefined ? req.body.is_active : true;
    
    console.log('처리된 데이터:', {
      username, password: password ? '***' : 'NO_PASSWORD', name, email, phone, role, is_active
    });
    
    // 필수 필드 검증
    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        error: '사용자명, 비밀번호, 이름은 필수입니다.'
      });
    }
    
    // 사용자명 중복 확인
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        error: '이미 존재하는 사용자명입니다.'
      });
    }
    
    // 데이터베이스 스키마 확인 후 동적 INSERT
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('기존 컬럼들:', existingColumns);
    
    // 기본 필드만 사용하여 INSERT
    const basicFields = ['username', 'password', 'name'];
    const basicValues = [username, password, name];
    
    // 선택적 필드들 (존재하는 컬럼만)
    const optionalFields = [
      { name: 'email', value: email },
      { name: 'phone', value: phone },
      { name: 'role', value: role },
      { name: 'is_active', value: is_active }
    ];
    
    const validOptionalFields = optionalFields.filter(field => existingColumns.includes(field.name));
    
    const allFields = [...basicFields, ...validOptionalFields.map(f => f.name), 'created_at', 'updated_at'];
    const allValues = [...basicValues, ...validOptionalFields.map(f => f.value), 'NOW()', 'NOW()'];
    
    console.log('사용할 필드들:', allFields);
    console.log('사용할 값들:', allValues.map((v, i) => `${i}: ${v === null ? 'NULL' : typeof v === 'string' && v !== 'NOW()' ? `"${v}"` : v}`));
    
    const placeholders = allValues.map(v => v === 'NOW()' ? 'NOW()' : '?').join(', ');
    const actualValues = allValues.filter(v => v !== 'NOW()');
    
    const [result] = await pool.execute(`
      INSERT INTO users (${allFields.join(', ')}) 
      VALUES (${placeholders})
    `, actualValues);
    
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
  console.log(`=== PUT /api/users/${req.params.id} 시작 ===`);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  try {
    const { id } = req.params;
    const {
      username,
      password,
      name,
      email,
      phone,
      role,
      is_active
    } = req.body;
    
    console.log(`[Users API] 사용자 수정 요청: ID ${id}`);
    console.log(`[Users API] 요청 본문:`, req.body);
    console.log(`[Users API] password 값:`, password, typeof password);
    
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
    if (password !== undefined && password !== null && password.trim() !== '') {
      // 비밀번호 해싱 (빈 문자열이 아닐 때만)
      const bcrypt = require('bcryptjs');
      console.log(`[Users API] 비밀번호 해싱 시작: ${password.length}자`);
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
      console.log(`[Users API] 비밀번호 해싱 완료: ${password.length}자 -> 해시`);
    } else if (password !== undefined) {
      console.log(`[Users API] 비밀번호 업데이트 건너뜀: 빈 값 (${typeof password})`);
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
    if (role !== undefined) {
      // 허용된 role 값들 확인
      const allowedRoles = ['admin', 'manager', 'user', 'driver'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: `허용되지 않은 역할입니다. 허용된 역할: ${allowedRoles.join(', ')}`
        });
      }
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);
    
    if (updateFields.length === 1) { // updated_at만 있는 경우
      return res.status(400).json({
        success: false,
        error: '업데이트할 필드가 없습니다.'
      });
    }
    
    // 업데이트 전 데이터 확인
    const [beforeData] = await executeWithRetry(() =>
      pool.execute('SELECT id, username, password, LENGTH(password) as pw_length, updated_at FROM users WHERE id = ?', [id])
    );
    console.log(`[Users API] 업데이트 전 데이터:`, beforeData[0]);
    
    // 사용자 업데이트
    console.log(`[Users API] 실행할 쿼리:`, `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`);
    console.log(`[Users API] 쿼리 파라미터:`, updateValues);
    
    const [result] = await executeWithRetry(() =>
      pool.execute(`
        UPDATE users SET ${updateFields.join(', ')} WHERE id = ?
      `, updateValues)
    );
    
    console.log(`[Users API] SQL UPDATE 실행 결과:`, {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows,
      insertId: result.insertId,
      info: result.info,
      warningCount: result.warningCount
    });
    
    // 업데이트 후 데이터 확인
    const [afterData] = await executeWithRetry(() =>
      pool.execute('SELECT id, username, password, LENGTH(password) as pw_length, updated_at FROM users WHERE id = ?', [id])
    );
    console.log(`[Users API] 업데이트 후 데이터:`, afterData[0]);
    console.log(`[Users API] 데이터 변경 여부:`, {
      passwordChanged: beforeData[0].password !== afterData[0].password,
      updatedAtChanged: beforeData[0].updated_at !== afterData[0].updated_at
    });
    
    res.json({
      success: true,
      message: '사용자 정보가 성공적으로 수정되었습니다.',
      affectedRows: result.affectedRows
    });
    
  } catch (error) {
    console.error('=== PUT /api/users/:id ERROR ===');
    console.error('[Users API] 사용자 수정 오류:', error);
    console.error('Error stack:', error.stack);
    console.error('Request ID:', req.params.id);
    console.error('Request body:', req.body);
    res.status(500).json({
      success: false,
      error: '사용자를 수정할 수 없습니다.',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// 테스트용 간단한 사용자 생성 (인증 없음)
router.post('/test-create', async (req, res) => {
  try {
    console.log('[Users API] 테스트 사용자 생성 시작');
    console.log('요청 본문:', JSON.stringify(req.body, null, 2));
    
    const username = req.body.username || 'test_user';
    const password = req.body.password || 'test123';
    const name = req.body.name || '테스트 사용자';
    
    console.log('필수 필드:', { username, password, name });
    
    // 간단한 INSERT만 수행
    const [result] = await pool.execute(`
      INSERT INTO users (username, password, name, created_at, updated_at) 
      VALUES (?, ?, ?, NOW(), NOW())
    `, [username, password, name]);
    
    console.log(`[Users API] 테스트 사용자 생성 완료: ID ${result.insertId}`);
    
    res.status(201).json({
      success: true,
      message: '테스트 사용자가 성공적으로 생성되었습니다.',
      user: {
        id: result.insertId,
        username,
        name
      }
    });
    
  } catch (error) {
    console.error('[Users API] 테스트 사용자 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '테스트 사용자를 생성할 수 없습니다.',
      details: error.message
    });
  }
});

// 비밀번호 변경
router.put('/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    console.log(`[Users API] 비밀번호 변경 요청: 사용자 ID ${id}`);

    // 입력값 검증
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '새 비밀번호는 최소 6자 이상이어야 합니다.'
      });
    }

    // 사용자 존재 확인 및 현재 비밀번호 검증
    const [users] = await executeWithRetry(() =>
      pool.execute('SELECT id, username, password FROM users WHERE id = ?', [id])
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const user = users[0];

    // 현재 비밀번호 확인 (단순 문자열 비교 - 프로덕션에서는 bcrypt 사용 권장)
    if (user.password !== currentPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호가 올바르지 않습니다.'
      });
    }

    // 새 비밀번호로 업데이트
    await executeWithRetry(() =>
      pool.execute('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [newPassword, id])
    );

    console.log(`[Users API] 비밀번호 변경 완료: 사용자 ID ${id} (${user.username})`);

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    });

  } catch (error) {
    console.error('[Users API] 비밀번호 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 변경 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

module.exports = router;