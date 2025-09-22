const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { executeWithRetry, pool } = require('../config/database');

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

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

// 파트너사 목록 조회
router.get('/partners', authenticateToken, async (req, res) => {
  try {
    console.log('[Test API] 파트너사 목록 조회 요청');
    
    const [partners] = await executeWithRetry(() =>
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
          default_sender_address,
          default_sender_detail_address,
          default_sender_zipcode,
          created_at,
          updated_at
        FROM users 
        WHERE role IN ('user', 'manager', 'admin')
        ORDER BY created_at DESC
      `)
    );

    console.log(`[Test API] 파트너사 목록 조회 완료: ${partners.length}개`);

    res.json({
      success: true,
      partners: partners.map(partner => ({
        ...partner,
        default_sender_name: partner.name,
        default_sender_company: partner.company,
        default_sender_phone: partner.phone
      }))
    });

  } catch (error) {
    console.error('[Test API] 파트너사 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '파트너사 목록을 조회할 수 없습니다.',
      details: error.message
    });
  }
});

// 모든 파트너사 삭제
router.delete('/partners', authenticateToken, async (req, res) => {
  try {
    console.log('[Test API] 모든 파트너사 삭제 요청');
    
    // 현재 로그인한 사용자는 삭제하지 않음
    const [result] = await executeWithRetry(() =>
      pool.execute(`
        DELETE FROM users 
        WHERE role IN ('user', 'manager') 
        AND id != ?
      `, [req.user.id])
    );

    console.log(`[Test API] 파트너사 삭제 완료: ${result.affectedRows}개 삭제`);

    res.json({
      success: true,
      message: `${result.affectedRows}개의 파트너사가 삭제되었습니다.`,
      deletedCount: result.affectedRows
    });

  } catch (error) {
    console.error('[Test API] 파트너사 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '파트너사 삭제에 실패했습니다.',
      details: error.message
    });
  }
});

// 기사 목록 조회
router.get('/drivers', authenticateToken, async (req, res) => {
  try {
    console.log('[Test API] 기사 목록 조회 요청');
    
    // drivers 테이블이 있는지 확인
    const [tables] = await executeWithRetry(() =>
      pool.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'drivers'
      `)
    );

    if (tables.length === 0) {
      // drivers 테이블이 없으면 빈 배열 반환
      console.log('[Test API] drivers 테이블이 존재하지 않음');
      return res.json({
        success: true,
        drivers: []
      });
    }

    const [drivers] = await executeWithRetry(() =>
      pool.execute(`
        SELECT 
          driver_id as id,
          username,
          name,
          email,
          phone,
          vehicle_type,
          vehicle_number,
          license_number,
          is_active,
          created_at,
          updated_at
        FROM drivers 
        ORDER BY created_at DESC
      `)
    );

    console.log(`[Test API] 기사 목록 조회 완료: ${drivers.length}개`);

    res.json({
      success: true,
      drivers: drivers
    });

  } catch (error) {
    console.error('[Test API] 기사 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '기사 목록을 조회할 수 없습니다.',
      details: error.message
    });
  }
});

// 모든 기사 삭제
router.delete('/drivers', authenticateToken, async (req, res) => {
  try {
    console.log('[Test API] 모든 기사 삭제 요청');
    
    // drivers 테이블이 있는지 확인
    const [tables] = await executeWithRetry(() =>
      pool.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'drivers'
      `)
    );

    if (tables.length === 0) {
      console.log('[Test API] drivers 테이블이 존재하지 않음');
      return res.json({
        success: true,
        message: '삭제할 기사가 없습니다.',
        deletedCount: 0
      });
    }

    const [result] = await executeWithRetry(() =>
      pool.execute('DELETE FROM drivers')
    );

    console.log(`[Test API] 기사 삭제 완료: ${result.affectedRows}개 삭제`);

    res.json({
      success: true,
      message: `${result.affectedRows}개의 기사가 삭제되었습니다.`,
      deletedCount: result.affectedRows
    });

  } catch (error) {
    console.error('[Test API] 기사 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '기사 삭제에 실패했습니다.',
      details: error.message
    });
  }
});

// 배송 목록 조회 (테스트용)
router.get('/deliveries', authenticateToken, async (req, res) => {
  try {
    console.log('[Test API] 배송 목록 조회 요청');
    
    const [deliveries] = await executeWithRetry(() =>
      pool.execute(`
        SELECT 
          id,
          tracking_number,
          status,
          sender_name,
          sender_address,
          customer_name,
          customer_phone,
          customer_address,
          product_name,
          visit_date,
          driver_id,
          driver_name,
          delivery_fee,
          special_instructions,
          created_at,
          updated_at
        FROM deliveries 
        ORDER BY created_at DESC
        LIMIT 100
      `)
    );

    console.log(`[Test API] 배송 목록 조회 완료: ${deliveries.length}개`);

    res.json({
      success: true,
      deliveries: deliveries
    });

  } catch (error) {
    console.error('[Test API] 배송 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '배송 목록을 조회할 수 없습니다.',
      details: error.message
    });
  }
});

// 모든 배송 삭제
router.delete('/deliveries', authenticateToken, async (req, res) => {
  try {
    console.log('[Test API] 모든 배송 삭제 요청');
    
    const [result] = await executeWithRetry(() =>
      pool.execute('DELETE FROM deliveries')
    );

    console.log(`[Test API] 배송 삭제 완료: ${result.affectedRows}개 삭제`);

    res.json({
      success: true,
      message: `${result.affectedRows}개의 배송이 삭제되었습니다.`,
      deletedCount: result.affectedRows
    });

  } catch (error) {
    console.error('[Test API] 배송 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '배송 삭제에 실패했습니다.',
      details: error.message
    });
  }
});

// 파일 업로드 테스트 엔드포인트
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    console.log('[Test API] 파일 업로드 요청:', req.file?.filename);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '파일이 업로드되지 않았습니다.'
      });
    }
    
    const fileInfo = {
      success: true,
      message: '파일 업로드 성공',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: `/uploads/${req.file.filename}`
    };
    
    console.log('[Test API] 파일 업로드 완료:', fileInfo);
    res.json(fileInfo);
    
  } catch (error) {
    console.error('[Test API] 파일 업로드 오류:', error);
    res.status(500).json({
      success: false,
      error: '파일 업로드에 실패했습니다.',
      details: error.message
    });
  }
});

// 업로드된 파일 목록 조회
router.get('/uploads', (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir).map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        uploadDate: stats.ctime,
        url: `/uploads/${filename}`
      };
    });
    
    res.json({
      success: true,
      files: files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
    });
    
  } catch (error) {
    console.error('[Test API] 파일 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '파일 목록을 조회할 수 없습니다.',
      details: error.message
    });
  }
});

module.exports = router;