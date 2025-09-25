const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { pool } = require('../config/database');

// 테이블 스키마 확인 엔드포인트
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    console.log('[Schema API] users 테이블 스키마 조회');
    
    const [columns] = await pool.execute(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY,
        EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('[Schema API] users 테이블 컬럼:', columns.length);
    
    res.json({
      success: true,
      table: 'users',
      columns: columns
    });
    
  } catch (error) {
    console.error('[Schema API] 스키마 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '스키마를 조회할 수 없습니다.',
      details: error.message
    });
  }
});

module.exports = router;