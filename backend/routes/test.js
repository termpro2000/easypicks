const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { executeWithRetry } = require('../utils/database');

// 테이블 관계 정보 조회
router.get('/table-relationships', authenticateToken, async (req, res) => {
  try {
    console.log('[Test API] 테이블 관계 정보 조회 요청');
    
    // 외래키 관계 정보 조회
    const [foreignKeys] = await executeWithRetry(() => 
      req.db.execute(`
        SELECT 
          TABLE_NAME as table_name,
          COLUMN_NAME as column_name,
          CONSTRAINT_NAME as constraint_name,
          REFERENCED_TABLE_NAME as referenced_table_name,
          REFERENCED_COLUMN_NAME as referenced_column_name
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY TABLE_NAME, COLUMN_NAME
      `)
    );

    // 테이블 간 관계 통계
    const relationshipStats = {
      totalRelationships: foreignKeys.length,
      tablesWithRelationships: [...new Set(foreignKeys.map(fk => fk.table_name))].length,
      referencedTables: [...new Set(foreignKeys.map(fk => fk.referenced_table_name))].length
    };

    console.log('[Test API] 테이블 관계 정보 조회 완료:', relationshipStats);

    res.json({
      success: true,
      data: {
        relationships: foreignKeys,
        statistics: relationshipStats
      }
    });

  } catch (error) {
    console.error('[Test API] 테이블 관계 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '테이블 관계 정보를 조회할 수 없습니다.',
      details: error.message
    });
  }
});

// 데이터베이스 연결 테스트
router.get('/connection', authenticateToken, async (req, res) => {
  try {
    console.log('[Test API] 데이터베이스 연결 테스트 요청');
    
    const [result] = await executeWithRetry(() => 
      req.db.execute('SELECT 1 as test, NOW() as current_time')
    );

    console.log('[Test API] 데이터베이스 연결 테스트 성공');

    res.json({
      success: true,
      data: {
        connected: true,
        timestamp: result[0].current_time,
        message: '데이터베이스 연결이 정상적으로 작동합니다.'
      }
    });

  } catch (error) {
    console.error('[Test API] 데이터베이스 연결 테스트 실패:', error);
    res.status(500).json({
      success: false,
      error: '데이터베이스 연결 테스트에 실패했습니다.',
      details: error.message
    });
  }
});

// API 상태 테스트
router.get('/api-status', authenticateToken, async (req, res) => {
  try {
    console.log('[Test API] API 상태 테스트 요청');
    
    const status = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    };

    console.log('[Test API] API 상태 테스트 완료');

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('[Test API] API 상태 테스트 오류:', error);
    res.status(500).json({
      success: false,
      error: 'API 상태를 조회할 수 없습니다.',
      details: error.message
    });
  }
});

module.exports = router;