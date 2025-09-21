const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { executeWithRetry, pool } = require('../config/database');

// 데이터베이스 스키마 정보 조회 (스키마 뷰어용)
router.get('/db-schema', authenticateToken, async (req, res) => {
  try {
    console.log('[Test API] DB 스키마 정보 조회 요청');
    
    // 테이블 목록 조회
    const [tables] = await executeWithRetry(() =>
      pool.execute(`
        SELECT 
          TABLE_NAME as table_name,
          TABLE_COMMENT as table_comment,
          TABLE_ROWS as table_rows,
          DATA_LENGTH as data_length,
          INDEX_LENGTH as index_length,
          CREATE_TIME as create_time,
          UPDATE_TIME as update_time
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME
      `)
    );

    // 각 테이블의 컬럼 정보 조회
    const tablesWithColumns = await Promise.all(
      tables.map(async (table) => {
        const [columns] = await executeWithRetry(() =>
          pool.execute(`
            SELECT 
              COLUMN_NAME as column_name,
              DATA_TYPE as data_type,
              IS_NULLABLE as is_nullable,
              COLUMN_DEFAULT as column_default,
              COLUMN_KEY as column_key,
              EXTRA as extra,
              COLUMN_COMMENT as column_comment,
              CHARACTER_MAXIMUM_LENGTH as max_length,
              NUMERIC_PRECISION as numeric_precision,
              NUMERIC_SCALE as numeric_scale
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
          `, [table.table_name])
        );

        return {
          ...table,
          columns
        };
      })
    );

    // 외래키 정보 조회
    const [foreignKeys] = await executeWithRetry(() =>
      pool.execute(`
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

    // 인덱스 정보 조회
    const [indexes] = await executeWithRetry(() =>
      pool.execute(`
        SELECT 
          TABLE_NAME as table_name,
          INDEX_NAME as index_name,
          COLUMN_NAME as column_name,
          NON_UNIQUE as non_unique,
          INDEX_TYPE as index_type
        FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
      `)
    );

    const summary = {
      totalTables: tables.length,
      totalColumns: tablesWithColumns.reduce((sum, table) => sum + table.columns.length, 0),
      totalForeignKeys: foreignKeys.length,
      totalIndexes: [...new Set(indexes.map(idx => `${idx.table_name}.${idx.index_name}`))].length
    };

    console.log('[Test API] DB 스키마 정보 조회 완료:', summary);

    res.json({
      success: true,
      data: {
        tables: tablesWithColumns || [],
        foreignKeys: foreignKeys || [],
        indexes: indexes || [],
        summary: summary || {
          totalTables: 0,
          totalColumns: 0,
          totalForeignKeys: 0,
          totalIndexes: 0
        }
      }
    });

  } catch (error) {
    console.error('[Test API] DB 스키마 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'DB 스키마 정보를 조회할 수 없습니다.',
      details: error.message
    });
  }
});

// 테이블 관계 정보 조회
router.get('/table-relationships', authenticateToken, async (req, res) => {
  try {
    console.log('[Test API] 테이블 관계 정보 조회 요청');
    
    // 외래키 관계 정보 조회
    const [foreignKeys] = await executeWithRetry(() => 
      pool.execute(`
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
      pool.execute('SELECT 1 as test')
    );

    console.log('[Test API] 데이터베이스 연결 테스트 성공');

    res.json({
      success: true,
      data: {
        connected: true,
        timestamp: new Date().toISOString(),
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