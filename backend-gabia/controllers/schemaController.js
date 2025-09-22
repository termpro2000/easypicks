const { pool, executeWithRetry } = require('../config/database');

/**
 * 데이터베이스 스키마 정보를 조회하는 함수
 */
async function getSchemaInfo(req, res) {
  try {
    console.log('스키마 정보 조회 시작');
    
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

    console.log(`테이블 ${tables.length}개 조회 완료`);

    // 각 테이블의 컬럼 정보 조회
    const tableDetails = await Promise.all(
      tables.map(async (table) => {
        try {
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
            columns: columns
          };
        } catch (error) {
          console.error(`테이블 ${table.table_name} 컬럼 정보 조회 오류:`, error);
          return {
            ...table,
            columns: []
          };
        }
      })
    );

    // 외래키 정보 조회
    const [foreignKeys] = await executeWithRetry(() =>
      pool.execute(`
        SELECT 
          TABLE_NAME as table_name,
          COLUMN_NAME as column_name,
          REFERENCED_TABLE_NAME as referenced_table,
          REFERENCED_COLUMN_NAME as referenced_column,
          CONSTRAINT_NAME as constraint_name
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY TABLE_NAME, COLUMN_NAME
      `)
    );

    console.log(`외래키 ${foreignKeys.length}개 조회 완료`);

    // 인덱스 정보 조회
    const [indexes] = await executeWithRetry(() =>
      pool.execute(`
        SELECT 
          TABLE_NAME as table_name,
          INDEX_NAME as index_name,
          COLUMN_NAME as column_name,
          NON_UNIQUE as non_unique,
          SEQ_IN_INDEX as seq_in_index
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
      `)
    );

    console.log(`인덱스 ${indexes.length}개 조회 완료`);

    // 데이터베이스 이름 조회
    const [dbInfo] = await executeWithRetry(() =>
      pool.execute('SELECT DATABASE() as database_name')
    );
    
    // 테이블별로 외래키와 인덱스 매핑
    const tablesWithDetails = (tableDetails || []).map(table => {
      const tableForeignKeys = (foreignKeys || []).filter(fk => fk.table_name === table.table_name);
      const tableIndexes = (indexes || []).filter(idx => idx.table_name === table.table_name);
      
      return {
        table_name: table.table_name,
        table_comment: table.table_comment || '',
        table_rows: table.table_rows || 0,
        auto_increment: null,
        create_time: table.create_time,
        update_time: table.update_time,
        columns: (table.columns || []).map(col => ({
          COLUMN_NAME: col.column_name,
          DATA_TYPE: col.data_type,
          IS_NULLABLE: col.is_nullable,
          COLUMN_DEFAULT: col.column_default,
          COLUMN_COMMENT: col.column_comment || '',
          COLUMN_KEY: col.column_key || '',
          EXTRA: col.extra || '',
          CHARACTER_MAXIMUM_LENGTH: col.max_length,
          NUMERIC_PRECISION: col.numeric_precision,
          NUMERIC_SCALE: col.numeric_scale
        })),
        foreign_keys: tableForeignKeys.map(fk => ({
          COLUMN_NAME: fk.column_name,
          REFERENCED_TABLE_NAME: fk.referenced_table,
          REFERENCED_COLUMN_NAME: fk.referenced_column
        })),
        indexes: tableIndexes
      };
    });

    const schemaInfo = {
      database_name: dbInfo[0]?.database_name || 'unknown',
      tables: tablesWithDetails
    };

    console.log('스키마 정보 조회 성공:', { 
      database: schemaInfo.database_name, 
      tables: schemaInfo.tables.length 
    });

    res.json(schemaInfo);

  } catch (error) {
    console.error('스키마 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: '스키마 정보를 불러올 수 없습니다.'
    });
  }
}

/**
 * 특정 테이블의 상세 정보를 조회하는 함수
 */
async function getTableDetails(req, res) {
  try {
    const { tableName } = req.params;
    
    if (!tableName) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: '테이블명이 필요합니다.'
      });
    }

    console.log(`테이블 상세 정보 조회: ${tableName}`);

    // 테이블 기본 정보
    const [tableInfo] = await executeWithRetry(() =>
      pool.execute(`
        SELECT 
          TABLE_NAME as table_name,
          TABLE_COMMENT as table_comment,
          TABLE_ROWS as table_rows,
          DATA_LENGTH as data_length,
          INDEX_LENGTH as index_length,
          CREATE_TIME as create_time,
          UPDATE_TIME as update_time,
          ENGINE as engine,
          TABLE_COLLATION as collation
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ?
      `, [tableName])
    );

    if (tableInfo.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: '테이블을 찾을 수 없습니다.'
      });
    }

    // 컬럼 정보
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
          NUMERIC_SCALE as numeric_scale,
          ORDINAL_POSITION as position
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [tableName])
    );

    // 샘플 데이터 (최대 5개)
    let sampleData = [];
    try {
      const [samples] = await executeWithRetry(() =>
        pool.execute(`SELECT * FROM ?? LIMIT 5`, [tableName])
      );
      sampleData = samples;
    } catch (error) {
      console.warn(`샘플 데이터 조회 실패 (${tableName}):`, error.message);
    }

    const tableDetails = {
      ...tableInfo[0],
      columns: columns,
      sampleData: sampleData,
      columnCount: columns.length,
      sampleCount: sampleData.length
    };

    console.log(`테이블 ${tableName} 상세 정보 조회 완료`);

    res.json({
      success: true,
      data: tableDetails
    });

  } catch (error) {
    console.error('테이블 상세 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: '테이블 상세 정보를 불러올 수 없습니다.'
    });
  }
}

module.exports = {
  getSchemaInfo,
  getTableDetails
};