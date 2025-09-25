const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { pool } = require('../config/database');

// 부서와 직급 컬럼 추가 엔드포인트
router.post('/users/add-columns', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    console.log('[Schema API] users 테이블에 department, position 컬럼 추가 시작');
    
    // 먼저 컬럼이 존재하는지 확인
    const [existingColumns] = await pool.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      AND COLUMN_NAME IN ('department', 'position')
    `);
    
    const existingColumnNames = existingColumns.map(col => col.COLUMN_NAME);
    console.log('[Schema API] 기존 컬럼:', existingColumnNames);
    
    const results = [];
    
    // department 컬럼 추가 (없는 경우만)
    if (!existingColumnNames.includes('department')) {
      try {
        await pool.execute(`
          ALTER TABLE users 
          ADD COLUMN department VARCHAR(100) NULL COMMENT '부서명'
        `);
        results.push('department 컬럼 추가 성공');
        console.log('[Schema API] department 컬럼 추가 완료');
      } catch (error) {
        results.push(`department 컬럼 추가 실패: ${error.message}`);
        console.error('[Schema API] department 컬럼 추가 오류:', error);
      }
    } else {
      results.push('department 컬럼이 이미 존재함');
    }
    
    // position 컬럼 추가 (없는 경우만)
    if (!existingColumnNames.includes('position')) {
      try {
        await pool.execute(`
          ALTER TABLE users 
          ADD COLUMN position VARCHAR(100) NULL COMMENT '직급/직책'
        `);
        results.push('position 컬럼 추가 성공');
        console.log('[Schema API] position 컬럼 추가 완료');
      } catch (error) {
        results.push(`position 컬럼 추가 실패: ${error.message}`);
        console.error('[Schema API] position 컬럼 추가 오류:', error);
      }
    } else {
      results.push('position 컬럼이 이미 존재함');
    }
    
    res.json({
      success: true,
      message: 'users 테이블 컬럼 추가 작업 완료',
      results: results
    });
    
  } catch (error) {
    console.error('[Schema API] 컬럼 추가 오류:', error);
    res.status(500).json({
      success: false,
      error: '컬럼 추가 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

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