const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // 개발 환경에서 테스트 토큰 허용
  if (token === 'test-token' || !process.env.JWT_SECRET) {
    req.user = { user_id: 'test_user' };
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: '액세스 토큰이 필요합니다.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    }
    req.user = user;
    next();
  });
};


// 데이터베이스 테이블 구조 확인 API (개발용)
router.get('/db-tables', authenticateToken, async (req, res) => {
  try {
    console.log('데이터베이스 테이블 목록 조회 시작');
    
    // 모든 테이블 목록 가져오기
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('조회된 테이블들:', tables);
    
    // drivers 테이블 존재 여부 확인
    const hasDriversTable = tables.some(table => 
      Object.values(table)[0].toLowerCase() === 'drivers'
    );
    
    let driversTableInfo = null;
    if (hasDriversTable) {
      // drivers 테이블 구조 확인
      const [driversStructure] = await pool.execute('DESCRIBE drivers');
      
      // drivers 테이블 데이터 개수 확인
      const [driversCount] = await pool.execute('SELECT COUNT(*) as count FROM drivers');
      
      driversTableInfo = {
        exists: true,
        structure: driversStructure,
        rowCount: driversCount[0].count
      };
    }
    
    // deliveries 테이블에서 driver 관련 필드 확인
    const [deliveriesStructure] = await pool.execute('DESCRIBE deliveries');
    const driverFields = deliveriesStructure.filter(field => 
      field.Field.toLowerCase().includes('driver')
    );
    
    // delivery_details 테이블에서 driver 관련 필드 확인 (테이블이 존재하는 경우)
    let deliveryDetailsDriverFields = [];
    try {
      const [deliveryDetailsStructure] = await pool.execute('DESCRIBE delivery_details');
      deliveryDetailsDriverFields = deliveryDetailsStructure.filter(field => 
        field.Field.toLowerCase().includes('driver')
      );
    } catch (error) {
      console.log('delivery_details 테이블이 존재하지 않거나 접근할 수 없습니다.');
    }
    
    res.json({
      success: true,
      tables: tables.map(table => Object.values(table)[0]),
      driversTable: driversTableInfo,
      driverRelatedFields: {
        deliveries: driverFields,
        delivery_details: deliveryDetailsDriverFields
      }
    });
    
  } catch (error) {
    console.error('데이터베이스 구조 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '데이터베이스 구조 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// drivers 테이블 삭제 및 관련 필드 정리 API (개발용)
router.post('/cleanup-drivers-table', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    console.log('drivers 테이블 정리 작업 시작');
    
    // 트랜잭션 시작
    await connection.beginTransaction();
    
    const results = [];
    
    // 1. drivers 테이블과 관련된 외래키 확인 및 제거
    try {
      // deliveries 테이블에서 drivers 테이블을 참조하는 외래키가 있는지 확인
      const [foreignKeys] = await connection.execute(`
        SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE REFERENCED_TABLE_SCHEMA = DATABASE() 
        AND REFERENCED_TABLE_NAME = 'drivers'
      `);
      
      results.push({ step: '외래키 확인', result: `${foreignKeys.length}개의 외래키 발견` });
      
      // 외래키 제거
      for (const fk of foreignKeys) {
        await connection.execute(`ALTER TABLE ${fk.TABLE_NAME} DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
        results.push({ step: '외래키 제거', result: `${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME} 제거됨` });
      }
    } catch (error) {
      results.push({ step: '외래키 확인/제거', error: error.message });
    }
    
    // 2. drivers 테이블 삭제
    try {
      await connection.execute('DROP TABLE IF EXISTS drivers');
      results.push({ step: 'drivers 테이블 삭제', result: '성공' });
    } catch (error) {
      results.push({ step: 'drivers 테이블 삭제', error: error.message });
    }
    
    // 3. deliveries 테이블의 불필요한 driver 관련 필드 정리
    // 먼저 현재 컬럼 존재 여부 확인
    const [deliveriesColumns] = await connection.execute('DESCRIBE deliveries');
    const columnNames = deliveriesColumns.map(col => col.Field);
    
    // assigned_driver 컬럼 제거
    if (columnNames.includes('assigned_driver')) {
      try {
        await connection.execute('ALTER TABLE deliveries DROP COLUMN assigned_driver');
        results.push({ step: 'assigned_driver 컬럼 제거', result: '성공' });
      } catch (error) {
        results.push({ step: 'assigned_driver 컬럼 제거', error: error.message });
      }
    }
    
    // driver_name 컬럼 제거
    if (columnNames.includes('driver_name')) {
      try {
        await connection.execute('ALTER TABLE deliveries DROP COLUMN driver_name');
        results.push({ step: 'driver_name 컬럼 제거', result: '성공' });
      } catch (error) {
        results.push({ step: 'driver_name 컬럼 제거', error: error.message });
      }
    }
    
    // driver_id (varchar) 컬럼 제거
    if (columnNames.includes('driver_id')) {
      try {
        await connection.execute('ALTER TABLE deliveries DROP COLUMN driver_id');
        results.push({ step: 'driver_id(varchar) 컬럼 제거', result: '성공' });
      } catch (error) {
        results.push({ step: 'driver_id(varchar) 컬럼 제거', error: error.message });
      }
    }
    
    // assigned_driver_id를 driver_id로 이름 변경
    if (columnNames.includes('assigned_driver_id')) {
      try {
        await connection.execute('ALTER TABLE deliveries CHANGE COLUMN assigned_driver_id driver_id INT DEFAULT NULL');
        results.push({ step: 'assigned_driver_id → driver_id 변경', result: '성공' });
      } catch (error) {
        results.push({ step: 'assigned_driver_id → driver_id 변경', error: error.message });
      }
    }
    
    // driver_id에 users 테이블 참조 외래키 추가
    try {
      await connection.execute(`
        ALTER TABLE deliveries 
        ADD CONSTRAINT fk_deliveries_driver_id 
        FOREIGN KEY (driver_id) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      results.push({ step: 'driver_id 외래키 추가', result: '성공' });
    } catch (error) {
      results.push({ step: 'driver_id 외래키 추가', error: error.message });
    }
    
    // 4. 인덱스 정리
    try {
      // 기존 인덱스가 있는지 확인 후 추가
      const [indexes] = await connection.execute(`
        SHOW INDEX FROM deliveries WHERE Key_name = 'idx_deliveries_driver_id'
      `);
      
      if (indexes.length === 0) {
        await connection.execute('CREATE INDEX idx_deliveries_driver_id ON deliveries(driver_id)');
        results.push({ step: 'driver_id 인덱스 추가', result: '성공' });
      } else {
        results.push({ step: 'driver_id 인덱스 추가', result: '이미 존재함' });
      }
    } catch (error) {
      results.push({ step: '인덱스 추가', error: error.message });
    }
    
    // 트랜잭션 커밋
    await connection.commit();
    
    res.json({
      success: true,
      message: 'drivers 테이블 정리 작업이 완료되었습니다.',
      results: results
    });
    
  } catch (error) {
    // 트랜잭션 롤백
    await connection.rollback();
    console.error('drivers 테이블 정리 오류:', error);
    res.status(500).json({
      success: false,
      error: 'drivers 테이블 정리 중 오류가 발생했습니다.',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// delivery_details 테이블 사용 현황 조사 API (개발용)
router.get('/check-delivery-details', authenticateToken, async (req, res) => {
  try {
    console.log('delivery_details 테이블 사용 현황 조사 시작');
    
    const results = {};
    
    // 1. delivery_details 테이블 구조 확인
    try {
      const [structure] = await pool.execute('DESCRIBE delivery_details');
      results.tableStructure = structure;
    } catch (error) {
      results.tableStructure = { error: error.message };
    }
    
    // 2. delivery_details 테이블 데이터 개수 확인
    try {
      const [count] = await pool.execute('SELECT COUNT(*) as count FROM delivery_details');
      results.dataCount = count[0].count;
    } catch (error) {
      results.dataCount = { error: error.message };
    }
    
    // 3. delivery_details 테이블의 샘플 데이터 (있는 경우)
    try {
      const [sampleData] = await pool.execute('SELECT * FROM delivery_details LIMIT 5');
      results.sampleData = sampleData;
    } catch (error) {
      results.sampleData = { error: error.message };
    }
    
    // 4. deliveries와 delivery_details 간의 관계 확인
    try {
      const [joinCheck] = await pool.execute(`
        SELECT 
          d.id as delivery_id,
          d.tracking_number,
          dd.id as detail_id,
          dd.delivery_id as detail_delivery_id
        FROM deliveries d 
        LEFT JOIN delivery_details dd ON d.id = dd.delivery_id 
        LIMIT 5
      `);
      results.relationshipCheck = joinCheck;
    } catch (error) {
      results.relationshipCheck = { error: error.message };
    }
    
    // 5. delivery_details에서 실제 사용되는 필드 확인 (NULL이 아닌 데이터)
    try {
      const [fieldUsage] = await pool.execute(`
        SELECT 
          COUNT(*) as total_rows,
          COUNT(delivery_fee) as delivery_fee_count,
          COUNT(special_instructions) as special_instructions_count,
          COUNT(delivery_time_preference) as delivery_time_preference_count,
          COUNT(fragile) as fragile_count,
          COUNT(insurance_value) as insurance_value_count,
          COUNT(cod_amount) as cod_amount_count,
          COUNT(driver_memo) as driver_memo_count,
          COUNT(estimated_delivery) as estimated_delivery_count,
          COUNT(actual_delivery) as actual_delivery_count,
          COUNT(delivery_attempts) as delivery_attempts_count,
          COUNT(last_location) as last_location_count,
          COUNT(notes) as notes_count
        FROM delivery_details
      `);
      results.fieldUsage = fieldUsage[0];
    } catch (error) {
      results.fieldUsage = { error: error.message };
    }
    
    res.json({
      success: true,
      analysis: results
    });
    
  } catch (error) {
    console.error('delivery_details 조사 오류:', error);
    res.status(500).json({
      success: false,
      error: 'delivery_details 조사 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// delivery_details 테이블 완전 제거 API (개발용)
router.post('/remove-delivery-details-table', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    console.log('delivery_details 테이블 완전 제거 작업 시작');
    
    // 트랜잭션 시작
    await connection.beginTransaction();
    
    const results = [];
    
    // 1. delivery_details 테이블과 관련된 외래키 확인 및 제거
    try {
      const [foreignKeys] = await connection.execute(`
        SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE REFERENCED_TABLE_SCHEMA = DATABASE() 
        AND (REFERENCED_TABLE_NAME = 'delivery_details' OR TABLE_NAME = 'delivery_details')
      `);
      
      results.push({ step: '외래키 확인', result: `${foreignKeys.length}개의 외래키 발견` });
      
      // 외래키 제거
      for (const fk of foreignKeys) {
        try {
          await connection.execute(`ALTER TABLE ${fk.TABLE_NAME} DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
          results.push({ step: '외래키 제거', result: `${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME} 제거됨` });
        } catch (error) {
          results.push({ step: '외래키 제거', error: `${fk.CONSTRAINT_NAME}: ${error.message}` });
        }
      }
    } catch (error) {
      results.push({ step: '외래키 확인/제거', error: error.message });
    }
    
    // 2. delivery_details 테이블 백업 (필요시)
    try {
      const [backupData] = await connection.execute('SELECT COUNT(*) as count FROM delivery_details');
      results.push({ step: '데이터 백업 확인', result: `${backupData[0].count}개 레코드 (백업 불필요)` });
    } catch (error) {
      results.push({ step: '데이터 백업 확인', error: error.message });
    }
    
    // 3. delivery_details 테이블 완전 삭제
    try {
      await connection.execute('DROP TABLE IF EXISTS delivery_details');
      results.push({ step: 'delivery_details 테이블 삭제', result: '성공' });
    } catch (error) {
      results.push({ step: 'delivery_details 테이블 삭제', error: error.message });
    }
    
    // 4. 관련 인덱스 정리 (다른 테이블에서)
    try {
      // deliveries 테이블에서 delivery_details 관련 불필요한 인덱스 확인
      const [indexes] = await connection.execute(`
        SHOW INDEX FROM deliveries WHERE Key_name LIKE '%delivery_details%'
      `);
      
      for (const index of indexes) {
        try {
          await connection.execute(`DROP INDEX ${index.Key_name} ON deliveries`);
          results.push({ step: '관련 인덱스 제거', result: `${index.Key_name} 제거됨` });
        } catch (error) {
          results.push({ step: '관련 인덱스 제거', error: `${index.Key_name}: ${error.message}` });
        }
      }
    } catch (error) {
      results.push({ step: '관련 인덱스 정리', error: error.message });
    }
    
    // 트랜잭션 커밋
    await connection.commit();
    
    res.json({
      success: true,
      message: 'delivery_details 테이블이 완전히 제거되었습니다.',
      results: results
    });
    
  } catch (error) {
    // 트랜잭션 롤백
    await connection.rollback();
    console.error('delivery_details 테이블 제거 오류:', error);
    res.status(500).json({
      success: false,
      error: 'delivery_details 테이블 제거 중 오류가 발생했습니다.',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// driver_id 테이블 구조 및 사용 현황 조사 API (개발용)
router.get('/check-driver-id-table', authenticateToken, async (req, res) => {
  try {
    console.log('driver_id 테이블 구조 및 사용 현황 조사 시작');
    
    const results = {};
    
    // 1. driver_id 테이블 구조 확인
    try {
      const [structure] = await pool.execute('DESCRIBE drivers');
      results.tableStructure = structure;
    } catch (error) {
      results.tableStructure = { error: error.message };
    }
    
    // 2. driver_id 테이블 데이터 개수 및 샘플 확인
    try {
      const [count] = await pool.execute('SELECT COUNT(*) as count FROM drivers');
      results.dataCount = count[0].count;
      
      if (count[0].count > 0) {
        const [sampleData] = await pool.execute('SELECT * FROM drivers LIMIT 5');
        results.sampleData = sampleData;
      } else {
        results.sampleData = [];
      }
    } catch (error) {
      results.dataCount = { error: error.message };
      results.sampleData = { error: error.message };
    }
    
    // 3. driver_id 테이블을 참조하는 외래키 확인
    try {
      const [foreignKeys] = await pool.execute(`
        SELECT 
          TABLE_NAME, 
          COLUMN_NAME, 
          CONSTRAINT_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE REFERENCED_TABLE_SCHEMA = DATABASE() 
        AND REFERENCED_TABLE_NAME = 'drivers'
      `);
      results.referencingTables = foreignKeys;
    } catch (error) {
      results.referencingTables = { error: error.message };
    }
    
    // 4. deliveries 테이블에서 driver_id 필드 사용 현황 확인
    try {
      const [driverUsage] = await pool.execute(`
        SELECT 
          COUNT(*) as total_deliveries,
          COUNT(driver_id) as with_driver_id,
          COUNT(DISTINCT driver_id) as unique_drivers
        FROM deliveries
      `);
      results.deliveriesDriverUsage = driverUsage[0];
    } catch (error) {
      results.deliveriesDriverUsage = { error: error.message };
    }
    
    // 5. users 테이블과 driver_id 테이블 데이터 비교
    try {
      const [usersCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
      const [driversCount] = await pool.execute('SELECT COUNT(*) as count FROM drivers');
      
      results.dataComparison = {
        users_count: usersCount[0].count,
        drivers_count: driversCount[0].count
      };
    } catch (error) {
      results.dataComparison = { error: error.message };
    }
    
    res.json({
      success: true,
      analysis: results
    });
    
  } catch (error) {
    console.error('driver_id 테이블 조사 오류:', error);
    res.status(500).json({
      success: false,
      error: 'driver_id 테이블 조사 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// driver_id 테이블을 drivers로 이름 변경 API (개발용)
router.post('/rename-driver-id-to-drivers', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    console.log('driver_id 테이블을 drivers로 이름 변경 작업 시작');
    
    // 트랜잭션 시작
    await connection.beginTransaction();
    
    const results = [];
    
    // 1. driver_id 테이블이 존재하는지 확인
    try {
      const [tableExists] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'drivers'
      `);
      
      if (tableExists[0].count === 0) {
        throw new Error('driver_id 테이블이 존재하지 않습니다.');
      }
      
      results.push({ step: 'driver_id 테이블 존재 확인', result: '성공' });
    } catch (error) {
      results.push({ step: 'driver_id 테이블 존재 확인', error: error.message });
      throw error;
    }
    
    // 2. drivers 테이블이 이미 존재하는지 확인
    try {
      const [driversExists] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'drivers'
      `);
      
      if (driversExists[0].count > 0) {
        throw new Error('drivers 테이블이 이미 존재합니다. 기존 drivers 테이블을 삭제한 후 진행하세요.');
      }
      
      results.push({ step: 'drivers 테이블 중복 확인', result: '중복 없음' });
    } catch (error) {
      results.push({ step: 'drivers 테이블 중복 확인', error: error.message });
      throw error;
    }
    
    // 3. 기존 데이터 백업 정보
    try {
      const [dataCount] = await connection.execute('SELECT COUNT(*) as count FROM driver_id');
      results.push({ step: '데이터 백업 정보', result: `${dataCount[0].count}개 레코드 이전 예정` });
    } catch (error) {
      results.push({ step: '데이터 백업 정보', error: error.message });
    }
    
    // 4. driver_id 테이블을 drivers로 이름 변경
    try {
      await connection.execute('RENAME TABLE driver_id TO drivers');
      results.push({ step: 'driver_id → drivers 테이블 이름 변경', result: '성공' });
    } catch (error) {
      results.push({ step: 'driver_id → drivers 테이블 이름 변경', error: error.message });
      throw error;
    }
    
    // 5. 변경 후 확인
    try {
      const [newTableExists] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'drivers'
      `);
      
      const [dataCountAfter] = await connection.execute('SELECT COUNT(*) as count FROM drivers');
      
      results.push({ 
        step: '변경 후 확인', 
        result: `drivers 테이블 생성됨, ${dataCountAfter[0].count}개 레코드 이전 완료` 
      });
    } catch (error) {
      results.push({ step: '변경 후 확인', error: error.message });
    }
    
    // 트랜잭션 커밋
    await connection.commit();
    
    res.json({
      success: true,
      message: 'driver_id 테이블이 drivers로 성공적으로 변경되었습니다.',
      results: results,
      nextStep: '이제 관련 코드에서 driver_id 테이블 참조를 drivers로 변경해야 합니다.'
    });
    
  } catch (error) {
    // 트랜잭션 롤백
    await connection.rollback();
    console.error('driver_id → drivers 변경 오류:', error);
    res.status(500).json({
      success: false,
      error: 'driver_id 테이블 이름 변경 중 오류가 발생했습니다.',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

router.get('/list', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = 'SELECT * FROM deliveries';
    let params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    console.log('배송 리스트 조회 요청');
    const [deliveries] = await pool.execute(query, params);
    console.log('조회된 배송 개수:', deliveries.length);
    
    if (deliveries.length > 0) {
      console.log('첫 번째 배송 데이터 키들:', Object.keys(deliveries[0]));
      console.log('첫 번째 배송 샘플:', {
        tracking_number: deliveries[0].tracking_number,
        customer_name: deliveries[0].customer_name,
        product_name: deliveries[0].product_name,
        request_type: deliveries[0].request_type
      });
    }

    // 배송 데이터 처리 (설치 사진 JSON 파싱)
    const processedDeliveries = deliveries.map(delivery => {
      let installationPhotos = [];
      if (delivery.installation_photos) {
        try {
          installationPhotos = JSON.parse(delivery.installation_photos);
        } catch (e) {
          installationPhotos = [];
        }
      }
      
      return {
        ...delivery,
        installationPhotos
      };
    });

    // 데이터가 없으면 빈 배열 반환
    if (processedDeliveries.length === 0) {
      return res.json({
        success: true,
        deliveries: [],
        total: 0
      });
    }

    res.json({
      success: true,
      deliveries: processedDeliveries,
      total: processedDeliveries.length
    });
  } catch (error) {
    console.error('배송목록 조회 오류:', error);
    
    // 데이터베이스 오류 시 빈 배열 반환
    res.status(500).json({
      success: false,
      error: '배송목록 조회 중 오류가 발생했습니다.',
      deliveries: [],
      total: 0
    });
  }
});

// 새로운 배송 추가
router.post('/add', authenticateToken, async (req, res) => {
  try {
    // 오늘 날짜를 YYYY-MM-DD 형식으로 생성
    const getTodayDate = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // 기본값과 함께 배송 데이터 생성
    const deliveryData = {
      tracking_number: req.body.tracking_number || `TK${Date.now()}`,
      customer_name: req.body.customer_name || '고객명',
      customer_phone: req.body.customer_phone || '010-0000-0000',
      customer_address: req.body.customer_address || '주소 미입력',
      sender_name: req.body.sender_name || '발송인',
      sender_address: req.body.sender_address || '발송지 주소',
      package_type: req.body.package_type || '일반택배',
      weight: req.body.weight || 1.0,
      status: req.body.status || 'pending',
      request_type: req.body.request_type || '새가구 배송',
      construction_type: req.body.construction_type || '조립 설치',
      shipment_type: req.body.shipment_type || '직배송',
      visit_date: req.body.visit_date || getTodayDate(), // 오늘 날짜 자동 설정
      visit_time: req.body.visit_time || '14:00-16:00',
      assigned_driver: req.body.assigned_driver || '담당기사',
      furniture_company: req.body.furniture_company || '가구회사',
      main_memo: req.body.main_memo || '',
      emergency_contact: req.body.emergency_contact || '',
      building_type: req.body.building_type || '아파트',
      floor_count: req.body.floor_count || '1층',
      elevator_available: req.body.elevator_available || '있음',
      ladder_truck: req.body.ladder_truck || '불필요',
      disposal: req.body.disposal || '없음',
      room_movement: req.body.room_movement || '없음',
      wall_construction: req.body.wall_construction || '불필요',
      product_name: req.body.product_name || '상품명',
      furniture_product_code: req.body.furniture_product_code || 'CODE-001',
      product_weight: req.body.product_weight || '1kg',
      product_size: req.body.product_size || '10x10x10cm',
      box_size: req.body.box_size || '20x20x20cm',
      furniture_requests: req.body.furniture_requests || '',
      driver_notes: req.body.driver_notes || ''
    };

    console.log('새로운 배송 추가 요청:', deliveryData.tracking_number);
    console.log('visit_date 값:', deliveryData.visit_date);

    // 데이터베이스에 배송 정보 추가
    const insertSQL = `
      INSERT INTO deliveries (
        tracking_number, customer_name, customer_phone, customer_address,
        sender_name, sender_address, package_type, weight, status,
        request_type, construction_type, shipment_type, visit_date, visit_time,
        assigned_driver, furniture_company, main_memo, emergency_contact,
        building_type, floor_count, elevator_available, ladder_truck, disposal,
        room_movement, wall_construction, product_name, furniture_product_code,
        product_weight, product_size, box_size, furniture_requests, driver_notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await pool.execute(insertSQL, [
      deliveryData.tracking_number, deliveryData.customer_name, deliveryData.customer_phone, deliveryData.customer_address,
      deliveryData.sender_name, deliveryData.sender_address, deliveryData.package_type, deliveryData.weight, deliveryData.status,
      deliveryData.request_type, deliveryData.construction_type, deliveryData.shipment_type, deliveryData.visit_date, deliveryData.visit_time,
      deliveryData.assigned_driver, deliveryData.furniture_company, deliveryData.main_memo, deliveryData.emergency_contact,
      deliveryData.building_type, deliveryData.floor_count, deliveryData.elevator_available, deliveryData.ladder_truck, deliveryData.disposal,
      deliveryData.room_movement, deliveryData.wall_construction, deliveryData.product_name, deliveryData.furniture_product_code,
      deliveryData.product_weight, deliveryData.product_size, deliveryData.box_size, deliveryData.furniture_requests, deliveryData.driver_notes
    ]);

    console.log('데이터베이스 저장 완료, ID:', result.insertId);

    // 실시간 업데이트 브로드캐스트
    const io = req.app.get('io');
    if (io) {
      io.to('delivery_updates').emit('delivery_added', {
        id: result.insertId,
        tracking_number: deliveryData.tracking_number,
        status: deliveryData.status,
        customer_name: deliveryData.customer_name
      });
    }

    console.log(`새 배송 추가 완료: ${deliveryData.tracking_number} (ID: ${result.insertId})`);

    res.json({
      success: true,
      message: '배송이 성공적으로 추가되었습니다.',
      data: {
        id: result.insertId,
        tracking_number: deliveryData.tracking_number,
        visit_date: deliveryData.visit_date,
        status: deliveryData.status
      }
    });

  } catch (error) {
    console.error('배송 추가 오류:', error);
    res.status(500).json({
      success: false,
      error: '배송 추가 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 고객 서명 저장
router.post('/signature/:tracking_number', authenticateToken, async (req, res) => {
  try {
    const { tracking_number } = req.params;
    const { signatureData } = req.body;

    if (!signatureData) {
      return res.status(400).json({ error: '서명 데이터가 필요합니다.' });
    }

    // 데이터베이스에 서명 저장
    const [result] = await pool.execute(
      'UPDATE deliveries SET customer_signature = ? WHERE tracking_number = ?',
      [signatureData, tracking_number]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '배송 정보를 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      message: '고객 서명이 저장되었습니다.'
    });
  } catch (error) {
    console.error('서명 저장 오류:', error);
    res.status(500).json({ error: '서명 저장 중 오류가 발생했습니다.' });
  }
});

// 고객 서명 조회
router.get('/signature/:tracking_number', authenticateToken, async (req, res) => {
  try {
    const { tracking_number } = req.params;

    const [rows] = await pool.execute(
      'SELECT customer_signature FROM deliveries WHERE tracking_number = ?',
      [tracking_number]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '배송 정보를 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      signatureData: rows[0].customer_signature
    });
  } catch (error) {
    console.error('서명 조회 오류:', error);
    res.status(500).json({ error: '서명 조회 중 오류가 발생했습니다.' });
  }
});

// tracking_number로 배송 상세 조회 (delivery_details 포함)
router.get('/detail/:tracking_number', authenticateToken, async (req, res) => {
  try {
    const { tracking_number } = req.params;
    
    // 더미 상세 데이터
    const dummyDetails = {
      'MK202401001': {
        id: 1,
        tracking_number: 'MK202401001',
        sender_name: '김철수',
        sender_address: '서울시 강남구 테헤란로 123',
        sender_phone: '010-1111-2222',
        receiver_name: '이영희',
        receiver_address: '부산시 해운대구 마린시티 456',
        receiver_phone: '010-1234-5678',
        package_type: '일반택배',
        weight: 2.5,
        status: 'pending',
        created_at: '2024-01-15T09:00:00Z',
        requestType: '일반',
        constructionType: '조립설치',
        shipmentType: '직배송',
        visitDate: '2024-01-17',
        visitTime: '14:00-18:00',
        assignedDriver: '김기사',
        furnitureCompany: '한샘가구',
        mainMemo: '신속 배송 요청',
        emergencyContact: '010-9999-8888',
        buildingType: '아파트',
        floorCount: '15층',
        elevatorAvailable: '있음',
        ladderTruck: '불필요',
        disposal: '없음',
        roomMovement: '있음',
        wallConstruction: '필요',
        productName: '3인용 소파 세트',
        furnitureProductCode: 'HSM-SF-001',
        productWeight: '45kg',
        productSize: '220 x 90 x 80cm',
        boxSize: '230 x 100 x 90cm',
        installationPhotos: [
          'https://picsum.photos/300/300?random=1',
          'https://picsum.photos/300/300?random=2',
          'https://picsum.photos/300/300?random=3',
          'https://picsum.photos/300/300?random=4'
        ],
        furnitureRequests: '소파 배치 시 TV 보는 각도 고려 부탁드립니다.',
        driverNotes: '엘리베이터 사용 가능, 고객 매우 친절함',
        details: {
          delivery_fee: 3500,
          special_instructions: '문앞 배송 요청',
          delivery_time_preference: '오후 2-6시',
          fragile: false,
          insurance_value: 50000,
          cod_amount: 0,
          driver_id: null,
          driver_name: null,
          estimated_delivery: '2024-01-17T15:00:00Z',
          actual_delivery: null,
          delivery_attempts: 0,
          last_location: '물류센터',
          notes: '신속 배송 요청'
        }
      },
      'MK202401002': {
        id: 2,
        tracking_number: 'MK202401002',
        sender_name: '박민수',
        sender_address: '인천시 남동구 구월로 789',
        sender_phone: '010-2222-3333',
        receiver_name: '최지훈',
        receiver_address: '대구시 수성구 동대구로 321',
        receiver_phone: '010-9876-5432',
        package_type: '냉장택배',
        weight: 5.0,
        status: 'in_transit',
        created_at: '2024-01-15T10:30:00Z',
        requestType: '쿠방',
        constructionType: '단순배송',
        shipmentType: '물류센터경유',
        visitDate: '2024-01-16',
        visitTime: '09:00-12:00',
        assignedDriver: '이기사',
        furnitureCompany: '이케아',
        mainMemo: '냉장상품 - 온도관리 주의',
        emergencyContact: '010-8888-7777',
        buildingType: '빌라',
        floorCount: '5층',
        elevatorAvailable: '없음',
        ladderTruck: '필요',
        disposal: '있음',
        roomMovement: '있음',
        wallConstruction: '불필요',
        productName: '냉장고 (4도어)',
        furnitureProductCode: 'IKEA-RF-402',
        productWeight: '85kg',
        productSize: '180 x 60 x 70cm',
        boxSize: '190 x 70 x 80cm',
        installationPhotos: [
          'https://picsum.photos/300/300?random=5',
          'https://picsum.photos/300/300?random=6'
        ],
        furnitureRequests: '냉장고 설치 후 전원 연결 및 동작 테스트 필수',
        driverNotes: '5층 엘리베이터 없음, 사다리차 이용함',
        details: {
          delivery_fee: 5500,
          special_instructions: '냉장 보관 필수',
          delivery_time_preference: '오전 중',
          fragile: true,
          insurance_value: 100000,
          cod_amount: 85000,
          driver_id: 'D001',
          driver_name: '김배송',
          estimated_delivery: '2024-01-16T11:00:00Z',
          actual_delivery: null,
          delivery_attempts: 1,
          last_location: '대구 물류센터',
          notes: '냉장상품 - 온도관리 주의'
        }
      },
      'MK202401003': {
        id: 3,
        tracking_number: 'MK202401003',
        sender_name: '홍길동',
        sender_address: '광주시 서구 상무대로 654',
        sender_phone: '010-3333-4444',
        receiver_name: '김민정',
        receiver_address: '울산시 남구 삼산로 987',
        receiver_phone: '010-5555-7777',
        package_type: '특송',
        weight: 1.2,
        status: 'delivered',
        created_at: '2024-01-15T14:15:00Z',
        requestType: '일반',
        constructionType: '전문설치',
        shipmentType: '당일배송',
        visitDate: '2024-01-16',
        visitTime: '08:00-09:00',
        assignedDriver: '박기사',
        furnitureCompany: '까사미아',
        mainMemo: '특송 - 당일 배송 완료',
        emergencyContact: '010-7777-6666',
        buildingType: '단독주택',
        floorCount: '2층',
        elevatorAvailable: '없음',
        ladderTruck: '불필요',
        disposal: '없음',
        roomMovement: '없음',
        wallConstruction: '필요',
        productName: '벽걸이 TV 65인치',
        furnitureProductCode: 'CASA-TV-065',
        productWeight: '28kg',
        productSize: '145 x 83 x 8cm',
        boxSize: '155 x 93 x 18cm',
        installationPhotos: [
          'https://picsum.photos/300/300?random=7',
          'https://picsum.photos/300/300?random=8',
          'https://picsum.photos/300/300?random=9'
        ],
        furnitureRequests: '벽걸이 설치 시 전선 정리 깔끔하게 부탁합니다.',
        driverNotes: '벽시공 완료, 고객 서명 받음',
        details: {
          delivery_fee: 8000,
          special_instructions: '본인 확인 후 전달',
          delivery_time_preference: '평일 오전',
          fragile: false,
          insurance_value: 200000,
          cod_amount: 0,
          driver_id: 'D002',
          driver_name: '이특송',
          estimated_delivery: '2024-01-16T09:00:00Z',
          actual_delivery: '2024-01-16T08:45:00Z',
          delivery_attempts: 1,
          last_location: '배송완료',
          notes: '특송 - 당일 배송 완료'
        }
      }
    };
    
    // 통합된 deliveries 테이블에서 직접 조회
    try {
      const [deliveries] = await pool.execute(`
        SELECT * FROM deliveries WHERE tracking_number = ?
      `, [tracking_number]);
      
      if (deliveries.length > 0) {
        const delivery = deliveries[0];
        
        // installation_photos JSON 파싱
        let installationPhotos = [];
        if (delivery.installation_photos) {
          try {
            installationPhotos = JSON.parse(delivery.installation_photos);
          } catch (e) {
            console.log('사진 JSON 파싱 오류:', e.message);
            installationPhotos = [];
          }
        }

        // 통합된 테이블에서 모든 데이터를 직접 사용
        // 기존 호환성을 위해 details 객체도 같이 제공
        const details = {
          delivery_fee: delivery.delivery_fee,
          special_instructions: delivery.special_instructions,
          delivery_time_preference: delivery.delivery_time_preference,
          fragile: delivery.fragile,
          insurance_value: delivery.insurance_value,
          cod_amount: delivery.cod_amount,
          driver_id: delivery.driver_id,
          driver_name: delivery.driver_name,
          estimated_delivery: delivery.estimated_delivery,
          actual_delivery: delivery.actual_delivery,
          delivery_attempts: delivery.delivery_attempts,
          last_location: delivery.last_location,
          notes: delivery.detail_notes  // 필드명 변경: notes -> detail_notes
        };
        
        // 통합된 배송 정보 반환 (모든 필드 포함)
        const responseData = {
          ...delivery,
          installationPhotos,
          details  // 기존 호환성을 위해 details도 포함
        };
        
        return res.json({
          success: true,
          delivery: responseData
        });
      }
    } catch (dbError) {
      console.log('데이터베이스 조회 실패, 더미 데이터로 폴백:', dbError.message);
    }
    
    // 데이터베이스에 데이터가 없거나 오류 시 더미 데이터 사용
    const delivery = dummyDetails[tracking_number];
    
    if (!delivery) {
      return res.status(404).json({ error: '배송 정보를 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      delivery
    });
  } catch (error) {
    console.error('배송 상세 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 먼저 데이터베이스에서 조회 시도
    try {
      const [deliveries] = await pool.execute(
        'SELECT * FROM deliveries WHERE id = ?',
        [id]
      );
      
      if (deliveries.length > 0) {
        return res.json({
          success: true,
          delivery: deliveries[0]
        });
      }
    } catch (dbError) {
      console.log('데이터베이스 조회 실패, 더미 데이터로 폴백:', dbError.message);
    }
    
    // 데이터베이스에 데이터가 없을 경우
    return res.status(404).json({ error: '배송 정보를 찾을 수 없습니다.' });
  } catch (error) {
    console.error('배송 상세 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      'order_received', 'dispatch_completed', 'in_delivery', 'in_collection', 'in_processing',
      'delivery_completed', 'collection_completed', 'processing_completed', 
      'delivery_cancelled', 'delivery_postponed',
      // 기존 호환성을 위한 항목들
      'pending', 'in_transit', 'delivered', 'cancelled', 'completed'
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: '유효하지 않은 상태입니다.' 
      });
    }

    // 먼저 데이터베이스에서 업데이트 시도
    try {
      const [result] = await pool.execute(
        'UPDATE deliveries SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );
      
      if (result.affectedRows > 0) {
        const [updatedDelivery] = await pool.execute(
          'SELECT * FROM deliveries WHERE id = ?',
          [id]
        );
        
        // 실시간 업데이트 브로드캐스트
        const io = req.app.get('io');
        io.to('delivery_updates').emit('delivery_status_updated', {
          id: parseInt(id),
          status: status,
          delivery: updatedDelivery[0],
          timestamp: new Date().toISOString()
        });
        
        return res.json({
          success: true,
          message: '배송 상태가 업데이트되었습니다.',
          delivery: updatedDelivery[0]
        });
      }
    } catch (dbError) {
      console.log('데이터베이스 업데이트 실패, 더미 데이터로 폴백:', dbError.message);
    }

    // 데이터베이스 업데이트 실패 시
    return res.status(404).json({ error: '배송 정보를 찾을 수 없습니다.' });
  } catch (error) {
    console.error('배송 상태 업데이트 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 배송 상태 업데이트 (상차 완료용)
router.put('/:id/update', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    console.log(`배송 ${id} 상태 업데이트 요청:`, { status });

    // 먼저 기존 배송 정보와 의뢰종류 조회
    const [deliveryInfo] = await pool.execute(
      'SELECT id, request_type FROM deliveries WHERE id = ?',
      [id]
    );

    if (deliveryInfo.length === 0) {
      return res.status(404).json({
        success: false,
        error: '배송 정보를 찾을 수 없습니다.'
      });
    }

    const delivery = deliveryInfo[0];
    let newStatus = status;

    // 상차 완료 처리인 경우, 의뢰종류에 따라 적절한 status 설정
    if (status === '상차완료' || status === 'loaded' || status === 'in_transit') {
      switch (delivery.request_type) {
        case '회수':
          newStatus = 'in_collection';
          break;
        case '조처':
          newStatus = 'in_processing';
          break;
        default: // 일반, 네이버, 쿠팡 등
          newStatus = 'in_delivery';
          break;
      }
    }

    console.log(`의뢰종류: ${delivery.request_type}, 새로운 status: ${newStatus}`);

    // 데이터베이스 업데이트 시도
    try {
      const updateQuery = `
        UPDATE deliveries 
        SET status = ?, updated_at = NOW()
        WHERE id = ?
      `;
      
      const [result] = await pool.execute(updateQuery, [newStatus, id]);
      
      if (result.affectedRows > 0) {
        // 업데이트된 배송 정보 조회
        const [updatedDelivery] = await pool.execute(`
          SELECT * FROM deliveries WHERE id = ?
        `, [id]);
        
        console.log(`배송 ${id} 상태 업데이트 성공:`, status);
        
        return res.json({
          success: true,
          message: '배송 상태가 업데이트되었습니다.',
          delivery: updatedDelivery[0]
        });
      } else {
        return res.status(404).json({ 
          success: false,
          error: '배송 정보를 찾을 수 없습니다.' 
        });
      }
    } catch (dbError) {
      console.error('데이터베이스 업데이트 실패:', dbError.message);
      return res.status(500).json({ 
        success: false,
        error: '데이터베이스 업데이트 실패' 
      });
    }
  } catch (error) {
    console.error('배송 상태 업데이트 오류:', error);
    res.status(500).json({ 
      success: false,
      error: '서버 오류가 발생했습니다.' 
    });
  }
});

// 배송연기 처리
router.post('/postpone/:id', authenticateToken, async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const { postponeDate, postponeReason } = req.body;
    
    console.log('배송연기 요청:', {
      deliveryId,
      postponeDate,
      postponeReason,
      userId: req.user.user_id
    });
    
    // 입력 검증
    if (!postponeDate || !postponeReason) {
      return res.status(400).json({
        success: false,
        error: '연기 날짜와 사유를 입력해주세요.'
      });
    }
    
    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(postponeDate)) {
      return res.status(400).json({
        success: false,
        error: '올바른 날짜 형식이 아닙니다. (YYYY-MM-DD)'
      });
    }
    
    // 연기 날짜가 과거가 아닌지 확인
    const today = new Date().toISOString().split('T')[0];
    if (postponeDate <= today) {
      return res.status(400).json({
        success: false,
        error: '연기 날짜는 오늘 이후로 설정해주세요.'
      });
    }
    
    // 배송 정보 존재 여부 확인
    const [deliveryCheck] = await pool.execute(
      'SELECT id, tracking_number, customer_name, status FROM deliveries WHERE id = ?',
      [deliveryId]
    );
    
    if (deliveryCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: '배송 정보를 찾을 수 없습니다.'
      });
    }
    
    const delivery = deliveryCheck[0];
    
    // 이미 완료된 배송은 연기할 수 없음
    if (delivery.status === 'completed' || delivery.status === 'delivered' || delivery.status === '수거완료') {
      return res.status(400).json({
        success: false,
        error: '이미 완료된 배송은 연기할 수 없습니다.'
      });
    }
    
    // 배송 연기 처리 (status, visit_date 업데이트 및 연기 사유 저장)
    const [updateResult] = await pool.execute(
      `UPDATE deliveries SET 
         status = 'delivery_postponed',
         visit_date = ?, 
         driver_notes = CONCAT(COALESCE(driver_notes, ''), IF(COALESCE(driver_notes, '') = '', '', '\n'), '배송연기 (', ?, '): ', ?),
         updated_at = NOW()
       WHERE id = ?`,
      [postponeDate, postponeDate, postponeReason, deliveryId]
    );
    
    if (updateResult.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        error: '배송연기 처리에 실패했습니다.'
      });
    }
    
    console.log('배송연기 처리 완료:', {
      deliveryId,
      trackingNumber: delivery.tracking_number,
      customerName: delivery.customer_name,
      newVisitDate: postponeDate,
      reason: postponeReason
    });
    
    res.json({
      success: true,
      message: '배송이 성공적으로 연기되었습니다.',
      data: {
        deliveryId,
        trackingNumber: delivery.tracking_number,
        customerName: delivery.customer_name,
        newVisitDate: postponeDate,
        postponeReason
      }
    });
    
  } catch (error) {
    console.error('배송연기 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

// 배송연기 처리 (trackingNumber 기반) - 클라이언트 호환성을 위한 추가 엔드포인트
router.post('/delay/:trackingNumber', authenticateToken, async (req, res) => {
  try {
    const trackingNumber = req.params.trackingNumber;
    const { delayDate, delayReason } = req.body;
    
    console.log('배송연기 요청 (trackingNumber 기반):', {
      trackingNumber,
      delayDate,
      delayReason,
      userId: req.user.user_id
    });
    
    // 입력 검증
    if (!delayDate || !delayReason) {
      return res.status(400).json({
        success: false,
        error: '연기 날짜와 사유를 입력해주세요.'
      });
    }
    
    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(delayDate)) {
      return res.status(400).json({
        success: false,
        error: '올바른 날짜 형식이 아닙니다. (YYYY-MM-DD)'
      });
    }
    
    // 연기 날짜가 오늘 이후인지 확인
    const today = new Date().toISOString().split('T')[0];
    if (delayDate <= today) {
      return res.status(400).json({
        success: false,
        error: '연기 날짜는 내일 이후여야 합니다.'
      });
    }
    
    // tracking_number로 배송 정보 조회
    const [deliveries] = await pool.execute(
      'SELECT id, tracking_number, customer_name, status FROM deliveries WHERE tracking_number = ?',
      [trackingNumber]
    );
    
    if (deliveries.length === 0) {
      return res.status(404).json({
        success: false,
        error: '해당 운송장번호의 배송정보를 찾을 수 없습니다.'
      });
    }
    
    const delivery = deliveries[0];
    const deliveryId = delivery.id;
    
    // 배송 연기 처리 (status, visit_date 업데이트 및 연기 사유 저장)
    const [updateResult] = await pool.execute(
      `UPDATE deliveries SET 
         status = 'delivery_postponed',
         visit_date = ?, 
         driver_notes = CONCAT(COALESCE(driver_notes, ''), IF(COALESCE(driver_notes, '') = '', '', '\n'), '배송연기 (', ?, '): ', ?),
         updated_at = NOW()
       WHERE id = ?`,
      [delayDate, delayDate, delayReason, deliveryId]
    );
    
    if (updateResult.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        error: '배송연기 처리에 실패했습니다.'
      });
    }
    
    console.log('배송연기 처리 완료 (trackingNumber 기반):', {
      deliveryId,
      trackingNumber,
      newVisitDate: delayDate,
      reason: delayReason
    });
    
    // 성공 응답
    res.json({
      success: true,
      message: '배송이 성공적으로 연기되었습니다.',
      data: {
        deliveryId,
        trackingNumber: delivery.tracking_number,
        customerName: delivery.customer_name,
        newVisitDate: delayDate,
        postponeReason: delayReason
      }
    });
    
  } catch (error) {
    console.error('배송연기 처리 오류 (trackingNumber 기반):', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

// 데이터베이스 스키마 업데이트 - 배송완료처리 필드 추가 (필요시)
router.post('/setup-completion-fields', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    console.log('배송완료처리 필드 추가 작업 시작');
    
    await connection.beginTransaction();
    
    const results = [];
    
    // 현재 deliveries 테이블 구조 확인
    const [columns] = await connection.execute('DESCRIBE deliveries');
    const columnNames = columns.map(col => col.Field);
    
    // customer_requested_completion 필드 추가 (TINYINT, 0=미선택, 1=선택)
    if (!columnNames.includes('customer_requested_completion')) {
      await connection.execute(`
        ALTER TABLE deliveries 
        ADD COLUMN customer_requested_completion TINYINT(1) DEFAULT 0 COMMENT '고객요청에 의한 배송완료처리(소비자 귀책사항)'
      `);
      results.push({ field: 'customer_requested_completion', result: '추가됨' });
    } else {
      results.push({ field: 'customer_requested_completion', result: '이미 존재함' });
    }
    
    // furniture_company_requested_completion 필드 추가 (TINYINT, 0=미선택, 1=선택)  
    if (!columnNames.includes('furniture_company_requested_completion')) {
      await connection.execute(`
        ALTER TABLE deliveries 
        ADD COLUMN furniture_company_requested_completion TINYINT(1) DEFAULT 0 COMMENT '가구사요청에 의한 배송완료처리(가구사 귀책사항)'
      `);
      results.push({ field: 'furniture_company_requested_completion', result: '추가됨' });
    } else {
      results.push({ field: 'furniture_company_requested_completion', result: '이미 존재함' });
    }
    
    // completion_audio_file 필드 추가 (TEXT)
    if (!columnNames.includes('completion_audio_file')) {
      await connection.execute(`
        ALTER TABLE deliveries 
        ADD COLUMN completion_audio_file TEXT COMMENT '배송완료 증빙 녹음파일 경로'
      `);
      results.push({ field: 'completion_audio_file', result: '추가됨' });
    } else {
      results.push({ field: 'completion_audio_file', result: '이미 존재함' });
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: '배송완료처리 관련 필드 설정이 완료되었습니다.',
      results: results
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('배송완료처리 필드 추가 오류:', error);
    res.status(500).json({
      success: false,
      error: '배송완료처리 필드 추가 중 오류가 발생했습니다.',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// 데이터베이스 스키마 업데이트 - 취소 필드 추가 (필요시)
router.post('/setup-cancel-fields', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    console.log('배송취소 필드 추가 작업 시작');
    
    await connection.beginTransaction();
    
    const results = [];
    
    // 현재 deliveries 테이블 구조 확인
    const [columns] = await connection.execute('DESCRIBE deliveries');
    const columnNames = columns.map(col => col.Field);
    
    // cancel_status 필드 추가 (TINYINT, 0=미취소, 1=취소)
    if (!columnNames.includes('cancel_status')) {
      await connection.execute(`
        ALTER TABLE deliveries 
        ADD COLUMN cancel_status TINYINT(1) DEFAULT 0 COMMENT '취소상태(0:미취소,1:취소)'
      `);
      results.push({ field: 'cancel_status', result: '추가됨' });
    } else {
      results.push({ field: 'cancel_status', result: '이미 존재함' });
    }
    
    // cancel_reason 필드 추가 (TEXT)
    if (!columnNames.includes('cancel_reason')) {
      await connection.execute(`
        ALTER TABLE deliveries 
        ADD COLUMN cancel_reason TEXT COMMENT '취소사유'
      `);
      results.push({ field: 'cancel_reason', result: '추가됨' });
    } else {
      results.push({ field: 'cancel_reason', result: '이미 존재함' });
    }
    
    // canceled_at 필드 추가 (DATETIME)
    if (!columnNames.includes('canceled_at')) {
      await connection.execute(`
        ALTER TABLE deliveries 
        ADD COLUMN canceled_at DATETIME NULL COMMENT '취소일시'
      `);
      results.push({ field: 'canceled_at', result: '추가됨' });
    } else {
      results.push({ field: 'canceled_at', result: '이미 존재함' });
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: '취소 관련 필드 설정이 완료되었습니다.',
      results: results
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('취소 필드 추가 오류:', error);
    res.status(500).json({
      success: false,
      error: '취소 필드 추가 중 오류가 발생했습니다.',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// 배송 취소 처리
router.post('/cancel/:id', authenticateToken, async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const { cancelReason } = req.body;
    
    console.log('배송취소 요청:', {
      deliveryId,
      cancelReason,
      userId: req.user.user_id
    });
    
    // 입력 검증
    if (!cancelReason || cancelReason.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '취소 사유를 입력해주세요.'
      });
    }
    
    // 배송 정보 존재 여부 확인
    const [deliveryCheck] = await pool.execute(
      'SELECT id, tracking_number, customer_name, status, canceled_at FROM deliveries WHERE id = ?',
      [deliveryId]
    );
    
    if (deliveryCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: '배송 정보를 찾을 수 없습니다.'
      });
    }
    
    const delivery = deliveryCheck[0];
    
    // 이미 취소된 배송은 다시 취소할 수 없음
    if (delivery.canceled_at) {
      return res.status(400).json({
        success: false,
        error: '이미 취소된 배송입니다.'
      });
    }
    
    // 이미 완료된 배송은 취소할 수 없음
    if (delivery.status === 'completed' || delivery.status === 'delivered' || delivery.status === '수거완료') {
      return res.status(400).json({
        success: false,
        error: '이미 완료된 배송은 취소할 수 없습니다.'
      });
    }
    
    // 현재 시간
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // 배송 취소 처리 (cancel_status, cancel_reason, canceled_at 업데이트)
    const [updateResult] = await pool.execute(
      `UPDATE deliveries SET 
         cancel_status = 1,
         cancel_reason = ?, 
         canceled_at = ?,
         status = 'delivery_cancelled',
         driver_notes = CONCAT(COALESCE(driver_notes, ''), IF(COALESCE(driver_notes, '') = '', '', '\n'), '배송취소 (', ?, '): ', ?),
         updated_at = NOW()
       WHERE id = ?`,
      [cancelReason.trim(), now, now, cancelReason.trim(), deliveryId]
    );
    
    if (updateResult.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        error: '배송 취소 처리에 실패했습니다.'
      });
    }
    
    console.log('배송 취소 처리 완료:', {
      deliveryId,
      trackingNumber: delivery.tracking_number,
      customerName: delivery.customer_name,
      cancelReason: cancelReason.trim(),
      canceledAt: now
    });
    
    // 실시간 업데이트 브로드캐스트
    const io = req.app.get('io');
    if (io) {
      io.to('delivery_updates').emit('delivery_cancelled', {
        id: parseInt(deliveryId),
        status: 'delivery_cancelled',
        cancelReason: cancelReason.trim(),
        timestamp: now
      });
    }
    
    res.json({
      success: true,
      message: '배송이 성공적으로 취소되었습니다.',
      data: {
        deliveryId,
        trackingNumber: delivery.tracking_number,
        customerName: delivery.customer_name,
        cancelReason: cancelReason.trim(),
        canceledAt: now
      }
    });
    
  } catch (error) {
    console.error('배송 취소 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

// 배송완료 처리 (체크박스 데이터 및 오디오 파일 포함)
router.post('/complete/:id', authenticateToken, async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const { 
      driverNotes, 
      customerRequestedCompletion, 
      furnitureCompanyRequestedCompletion, 
      completionAudioFile,
      completedAt 
    } = req.body;
    
    console.log('배송완료 처리 요청:', {
      deliveryId,
      driverNotes,
      customerRequestedCompletion,
      furnitureCompanyRequestedCompletion,
      completionAudioFile,
      userId: req.user.user_id
    });
    
    // 배송 정보 존재 여부 및 의뢰종류 확인
    const [deliveryCheck] = await pool.execute(
      'SELECT id, tracking_number, customer_name, status, request_type FROM deliveries WHERE id = ?',
      [deliveryId]
    );
    
    if (deliveryCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: '배송 정보를 찾을 수 없습니다.'
      });
    }
    
    const delivery = deliveryCheck[0];
    
    // 의뢰종류에 따른 완료 status 결정
    let completedStatus;
    switch (delivery.request_type) {
      case '회수':
        completedStatus = 'collection_completed';
        break;
      case '조처':
        completedStatus = 'processing_completed';
        break;
      default: // 일반, 네이버, 쿠팡 등
        completedStatus = 'delivery_completed';
        break;
    }
    
    // 이미 취소된 배송은 완료 처리할 수 없음
    if (delivery.status === 'delivery_cancelled' || delivery.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: '취소된 배송은 완료 처리할 수 없습니다.'
      });
    }
    
    // 현재 시간 (MySQL datetime 형식으로 변환)
    const now = completedAt ? 
      new Date(completedAt).toISOString().slice(0, 19).replace('T', ' ') :
      new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // 배송완료 처리 (의뢰종류에 따른 적절한 status 설정)
    const [updateResult] = await pool.execute(
      `UPDATE deliveries SET 
         status = ?,
         driver_notes = ?,
         customer_requested_completion = ?,
         furniture_company_requested_completion = ?,
         completion_audio_file = ?,
         actual_delivery = ?,
         updated_at = NOW()
       WHERE id = ?`,
      [
        completedStatus,
        driverNotes || '',
        customerRequestedCompletion ? 1 : 0,
        furnitureCompanyRequestedCompletion ? 1 : 0,
        completionAudioFile || null,
        now,
        deliveryId
      ]
    );
    
    if (updateResult.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        error: '배송완료 처리에 실패했습니다.'
      });
    }
    
    console.log('배송완료 처리 성공:', {
      deliveryId,
      trackingNumber: delivery.tracking_number,
      customerName: delivery.customer_name,
      completedAt: now,
      audioFile: completionAudioFile
    });
    
    // 실시간 업데이트 브로드캐스트
    const io = req.app.get('io');
    if (io) {
      io.to('delivery_updates').emit('delivery_completed', {
        id: parseInt(deliveryId),
        status: completedStatus,
        requestType: delivery.request_type,
        completedAt: now,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: '배송이 성공적으로 완료되었습니다.',
      data: {
        deliveryId,
        trackingNumber: delivery.tracking_number,
        customerName: delivery.customer_name,
        completedAt: now,
        customerRequestedCompletion: customerRequestedCompletion,
        furnitureCompanyRequestedCompletion: furnitureCompanyRequestedCompletion,
        completionAudioFile: completionAudioFile
      }
    });
    
  } catch (error) {
    console.error('배송완료 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

module.exports = router;