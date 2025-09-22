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

module.exports = router;