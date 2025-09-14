const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * DB 스키마 정보 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function getDbSchema(req, res) {
  try {
    // JWT 또는 세션 기반 인증 지원
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    // 관리자만 접근 가능
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'DB 스키마 조회는 관리자만 가능합니다.'
      });
    }

    // 현재 데이터베이스의 모든 테이블 목록 조회
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME, TABLE_COMMENT, ENGINE, TABLE_ROWS, CREATE_TIME
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);

    // 각 테이블의 컬럼 정보 조회
    const tablesWithColumns = await Promise.all(
      tables.map(async (table) => {
        const [columns] = await pool.execute(`
          SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            COLUMN_DEFAULT,
            COLUMN_COMMENT,
            COLUMN_KEY,
            EXTRA,
            CHARACTER_MAXIMUM_LENGTH,
            NUMERIC_PRECISION,
            NUMERIC_SCALE
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [table.TABLE_NAME]);

        // 외래키 정보 조회
        const [foreignKeys] = await pool.execute(`
          SELECT 
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME,
            CONSTRAINT_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = ?
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `, [table.TABLE_NAME]);

        // 인덱스 정보 조회
        const [indexes] = await pool.execute(`
          SELECT 
            INDEX_NAME,
            COLUMN_NAME,
            NON_UNIQUE,
            INDEX_TYPE,
            SEQ_IN_INDEX
          FROM INFORMATION_SCHEMA.STATISTICS
          WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = ?
          ORDER BY INDEX_NAME, SEQ_IN_INDEX
        `, [table.TABLE_NAME]);

        return {
          ...table,
          columns: columns,
          foreignKeys: foreignKeys,
          indexes: indexes
        };
      })
    );

    // 데이터베이스 기본 정보 조회
    const [dbInfo] = await pool.execute(`
      SELECT 
        SCHEMA_NAME as database_name,
        DEFAULT_CHARACTER_SET_NAME as charset,
        DEFAULT_COLLATION_NAME as collation
      FROM INFORMATION_SCHEMA.SCHEMATA 
      WHERE SCHEMA_NAME = DATABASE()
    `);

    // 전체 테이블 수와 레코드 수 통계
    const totalTables = tables.length;
    const totalRows = tables.reduce((sum, table) => sum + (table.TABLE_ROWS || 0), 0);

    res.json({
      database: dbInfo[0] || {},
      statistics: {
        totalTables,
        totalRows
      },
      tables: tablesWithColumns,
      message: 'DB 스키마 정보를 성공적으로 조회했습니다.'
    });

  } catch (error) {
    console.error('DB 스키마 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'DB 스키마 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 테이블 간 관계 정보 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function getTableRelationships(req, res) {
  try {
    const user = req.user || req.session?.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '관리자만 접근 가능합니다.'
      });
    }

    // 모든 외래키 관계 조회
    const [relationships] = await pool.execute(`
      SELECT 
        TABLE_NAME as fromTable,
        COLUMN_NAME as fromColumn,
        REFERENCED_TABLE_NAME as toTable,
        REFERENCED_COLUMN_NAME as toColumn,
        CONSTRAINT_NAME as relationshipName
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() 
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);

    res.json({
      relationships,
      message: '테이블 관계 정보를 성공적으로 조회했습니다.'
    });

  } catch (error) {
    console.error('테이블 관계 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '테이블 관계 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 모든 파트너사 사용자 목록 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function getPartnersList(req, res) {
  try {
    const user = req.user || req.session?.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '관리자만 접근 가능합니다.'
      });
    }

    // 파트너사 사용자 목록 조회 (role이 'user'이고 admin이 아닌 사용자들)
    const [partners] = await pool.execute(`
      SELECT 
        id, username, name, email, phone, company, role, is_active,
        default_sender_name, default_sender_company, default_sender_phone, 
        default_sender_address, created_at
      FROM users 
      WHERE role = 'user' AND username != 'admin'
      ORDER BY created_at DESC
    `);

    res.json({
      partners,
      count: partners.length,
      message: '파트너사 목록을 성공적으로 조회했습니다.'
    });

  } catch (error) {
    console.error('파트너사 목록 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '파트너사 목록 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 모든 파트너사 사용자 삭제 (admin 제외)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function deleteAllPartners(req, res) {
  try {
    const user = req.user || req.session?.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '관리자만 접근 가능합니다.'
      });
    }

    // 파트너사 사용자들만 삭제 (role이 'user'이고 admin이 아닌 사용자들)
    const [result] = await pool.execute(`
      DELETE FROM users 
      WHERE role = 'user' AND username != 'admin'
    `);

    res.json({
      deletedCount: result.affectedRows,
      message: `${result.affectedRows}개의 파트너사 사용자가 성공적으로 삭제되었습니다.`
    });

  } catch (error) {
    console.error('파트너사 전체 삭제 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '파트너사 삭제 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 모든 기사 목록 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function getDriversList(req, res) {
  try {
    const user = req.user || req.session?.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '관리자만 접근 가능합니다.'
      });
    }

    // drivers 테이블의 모든 기사 조회
    const [drivers] = await pool.execute(`
      SELECT 
        id, user_id, name, phone, email, vehicle_type, 
        vehicle_number, cargo_capacity, delivery_area, created_at
      FROM drivers 
      ORDER BY created_at DESC
    `);

    res.json({
      drivers,
      count: drivers.length,
      message: '기사 목록을 성공적으로 조회했습니다.'
    });

  } catch (error) {
    console.error('기사 목록 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '기사 목록 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 모든 기사 삭제
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function deleteAllDrivers(req, res) {
  try {
    const user = req.user || req.session?.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '관리자만 접근 가능합니다.'
      });
    }

    // driver_id 테이블의 모든 기사 삭제
    const [result] = await pool.execute(`
      DELETE FROM drivers
    `);

    res.json({
      deletedCount: result.affectedRows,
      message: `${result.affectedRows}개의 기사가 성공적으로 삭제되었습니다.`
    });

  } catch (error) {
    console.error('기사 전체 삭제 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '기사 삭제 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 랜덤 기사 생성
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function createRandomDriver(req, res) {
  try {
    const user = req.user || req.session?.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '기사 추가는 관리자만 가능합니다.'
      });
    }

    // 랜덤 데이터 생성을 위한 배열들
    const firstNames = ['민수', '영희', '철수', '수지', '정훈', '미영', '성호', '지은', '동현', '소영', '현우', '지영', '태민', '수현', '준호'];
    const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'];
    
    const vehicleTypes = ['승용차', '소형트럭', '1톤트럭', '2.5톤트럭', '5톤트럭', '화물차', '밴', '오토바이'];
    const cargoCapacities = ['50kg 이하', '100kg 이하', '300kg 이하', '500kg 이하', '1톤 이하', '3톤 이하', '5톤 이하'];
    const deliveryAreas = [
      '서울 전지역', '경기 남부', '경기 북부', '인천 전지역', 
      '부산 전지역', '대구 전지역', '광주 전지역', '대전 전지역',
      '울산 전지역', '강남구', '서초구', '종로구', '성동구'
    ];

    // 랜덤 데이터 생성
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomName = randomLastName + randomFirstName;
    
    const randomVehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    const randomCapacity = cargoCapacities[Math.floor(Math.random() * cargoCapacities.length)];
    const randomDeliveryArea = deliveryAreas[Math.floor(Math.random() * deliveryAreas.length)];
    
    // 랜덤 아이디 생성 (driver + 4자리 숫자)
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // 1000-9999
    const randomUserId = 'driver' + randomNumber;
    
    // 중복 확인
    const [existingDriver] = await pool.execute(
      'SELECT id FROM drivers WHERE user_id = ?',
      [randomUserId]
    );

    let finalUserId = randomUserId;
    if (existingDriver.length > 0) {
      // 중복시 숫자 변경해서 재시도
      const newRandomNumber = Math.floor(1000 + Math.random() * 9000);
      finalUserId = 'driver' + newRandomNumber;
      
      const [checkAgain] = await pool.execute(
        'SELECT id FROM drivers WHERE user_id = ?',
        [finalUserId]
      );
      
      if (checkAgain.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: '기사 아이디 생성에 실패했습니다. 다시 시도해주세요.'
        });
      }
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash('123456', 10);

    // 랜덤 연락처 생성
    const randomPhone = '010-' + 
      Math.floor(1000 + Math.random() * 9000) + '-' + 
      Math.floor(1000 + Math.random() * 9000);

    // 랜덤 이메일 생성  
    const randomEmail = finalUserId + '@delivery.com';

    // 랜덤 차량번호 생성 (예: 12가1234)
    const areaNumbers = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
    const koreanChars = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '하'];
    const randomVehicleNumber = 
      Math.floor(10 + Math.random() * 90) + 
      koreanChars[Math.floor(Math.random() * koreanChars.length)] + 
      Math.floor(1000 + Math.random() * 9000);

    // 기사 생성
    const [result] = await pool.execute(`
      INSERT INTO drivers (
        user_id, password, name, phone, email, vehicle_type, 
        vehicle_number, cargo_capacity, delivery_area, map_preference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      finalUserId,
      hashedPassword, 
      randomName,
      randomPhone,
      randomEmail,
      randomVehicleType,
      randomVehicleNumber,
      randomCapacity,
      randomDeliveryArea
    ]);

    res.status(201).json({
      message: '기사가 성공적으로 생성되었습니다.',
      driver: {
        id: result.insertId,
        user_id: finalUserId,
        name: randomName,
        phone: randomPhone,
        email: randomEmail,
        vehicle_type: randomVehicleType,
        vehicle_number: randomVehicleNumber,
        cargo_capacity: randomCapacity,
        delivery_area: randomDeliveryArea,
        defaultPassword: '123456'
      }
    });

  } catch (error) {
    console.error('기사 생성 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '기사 생성 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 랜덤 파트너사 사용자 생성
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function createRandomPartner(req, res) {
  try {
    const user = req.user || req.session?.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '파트너사 추가는 관리자만 가능합니다.'
      });
    }

    // 랜덤 데이터 생성을 위한 배열들
    const companyNames = [
      '스마트로지스', '퀵배송코리아', '익스프레스택배', '글로벌운송', 
      '스피드배송', '세이프로지스틱', '파스트카고', '프리미엄택배',
      '유니온배송', '마스터로지스', '킹덤택배', '에이스운송',
      '파워배송', '블루오션로지스', '그린택배', '골든카고'
    ];

    const firstNames = ['민수', '영희', '철수', '수지', '정훈', '미영', '성호', '지은', '동현', '소영'];
    const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
    
    // 랜덤 데이터 생성
    const randomCompany = companyNames[Math.floor(Math.random() * companyNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomName = randomLastName + randomFirstName;
    const role = 'user'; // 파트너사는 'user' 역할로 고정 (DB role 컬럼 크기 제한으로 인해)
    
    // 랜덤 아이디 생성 (회사명 앞글자 + 4자리 숫자)
    const companyInitial = randomCompany.charAt(0);
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // 1000-9999
    const randomUsername = companyInitial + randomNumber;
    
    // 중복 확인
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [randomUsername]
    );

    if (existingUser.length > 0) {
      // 중복시 숫자 변경해서 재시도
      const newRandomNumber = Math.floor(1000 + Math.random() * 9000);
      const newUsername = companyInitial + newRandomNumber;
      
      const [checkAgain] = await pool.execute(
        'SELECT id FROM users WHERE username = ?',
        [newUsername]
      );
      
      if (checkAgain.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: '사용자명 생성에 실패했습니다. 다시 시도해주세요.'
        });
      }
    }

    const finalUsername = existingUser.length > 0 ? companyInitial + Math.floor(1000 + Math.random() * 9000) : randomUsername;

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash('123456', 10);

    // 랜덤 연락처 생성
    const randomPhone = '010-' + 
      Math.floor(1000 + Math.random() * 9000) + '-' + 
      Math.floor(1000 + Math.random() * 9000);

    // 랜덤 이메일 생성  
    const randomEmail = finalUsername + '@' + randomCompany.toLowerCase() + '.com';

    // 랜덤 주소 생성
    const addresses = [
      '서울시 강남구 테헤란로', '부산시 해운대구 센텀대로', 
      '대구시 수성구 동대구로', '인천시 남동구 구월로',
      '광주시 서구 상무대로', '대전시 유성구 대학로',
      '울산시 남구 삼산로', '경기도 성남시 분당구 판교로'
    ];
    const randomAddress = addresses[Math.floor(Math.random() * addresses.length)] + ' ' + 
      Math.floor(100 + Math.random() * 900);

    // 사용자 생성
    const [result] = await pool.execute(`
      INSERT INTO users (
        username, password, name, email, phone, company, role, is_active,
        default_sender_name, default_sender_company, default_sender_phone, 
        default_sender_address, map_preference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 0)
    `, [
      finalUsername,
      hashedPassword, 
      randomName,
      randomEmail,
      randomPhone,
      randomCompany,
      role,
      randomName,      // default_sender_name
      randomCompany,   // default_sender_company  
      randomPhone,     // default_sender_phone
      randomAddress    // default_sender_address
    ]);

    res.status(201).json({
      message: '파트너사 사용자가 성공적으로 생성되었습니다.',
      user: {
        id: result.insertId,
        username: finalUsername,
        name: randomName,
        email: randomEmail, 
        phone: randomPhone,
        company: randomCompany,
        role: role,
        defaultPassword: '123456'
      }
    });

  } catch (error) {
    console.error('파트너사 사용자 생성 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '파트너사 사용자 생성 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 랜덤 배송 생성 (deliveries 테이블)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function createRandomDelivery(req, res) {
  console.log('[배송 생성] 함수 시작');
  try {
    // JWT 또는 세션 기반 인증 지원
    const user = req.user || req.session?.user;
    console.log('[배송 생성] 사용자 확인:', user ? `${user.username} (${user.role})` : '없음');
    
    if (!user) {
      console.log('[배송 생성] 인증 실패 - 사용자 없음');
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    // 관리자만 접근 가능
    if (user.role !== 'admin') {
      console.log('[배송 생성] 권한 실패 - 관리자 아님:', user.role);
      return res.status(403).json({
        error: 'Forbidden',
        message: '배송 생성은 관리자만 가능합니다.'
      });
    }

    console.log('[배송 생성] 권한 확인 완료');
    
    let result; // result 변수를 미리 선언

    // 마지막 파트너사 사용자 조회 (users 테이블에서 role이 'user'이고 admin이 아닌 마지막 사용자)
    console.log('[배송 생성] 파트너사 조회 시작');
    const [latestPartner] = await pool.execute(`
      SELECT id, username, name, company, phone, email
      FROM users 
      WHERE role = 'user' AND username != 'admin'
      ORDER BY id DESC 
      LIMIT 1
    `);
    console.log('[배송 생성] 파트너사 조회 결과:', latestPartner.length, '개');

    if (latestPartner.length === 0) {
      console.log('[배송 생성] 파트너사 없음 오류');
      return res.status(400).json({
        error: 'Bad Request',
        message: '파트너사가 존재하지 않습니다. 먼저 파트너사를 추가해주세요.'
      });
    }

    // 마지막 기사 조회 (driver_id 테이블에서 마지막 추가된 기사)
    console.log('[배송 생성] 기사 조회 시작');
    const [latestDriver] = await pool.execute(`
      SELECT id, user_id, name, phone, email, vehicle_type, vehicle_number, cargo_capacity, delivery_area
      FROM drivers 
      ORDER BY id DESC 
      LIMIT 1
    `);
    console.log('[배송 생성] 기사 조회 결과:', latestDriver.length, '개');

    if (latestDriver.length === 0) {
      console.log('[배송 생성] 기사 없음 오류');
      return res.status(400).json({
        error: 'Bad Request', 
        message: '기사가 존재하지 않습니다. 먼저 기사를 추가해주세요.'
      });
    }

    const partner = latestPartner[0];
    const driver = latestDriver[0];

    // 랜덤 배송 데이터 생성
    const deliveryTypes = ['일반', '회수', '조치', '쿠팡', '네이버'];
    const statuses = ['접수완료', '창고입고', '기사상차', '배송완료', '반품접수', '수거완료'];
    
    // 가구 배송 관련 랜덤 데이터
    const constructionTypes = ['조립', '설치', '단순배송', '철거후설치', '수거'];
    const deliveryTypeDetails = ['일반배송', '층별배송', '정시배송', '예약배송', '당일배송'];
    const furnitureCompanies = ['한샘', '이케아', '까사미아', '일룸', '에넥스', '현대리바트', '롯데하이마트'];
    const buildingTypes = ['아파트', '빌라', '단독주택', '오피스텔', '상가', '사무실'];
    const productNames = ['소파', '침대', '책상', '의자', '옷장', '식탁', '서랍장', '냉장고', '세탁기', '에어컨'];
    const emergencyContacts = ['010-1234-5678', '010-9876-5432', '010-5555-1111', '010-7777-8888'];
    
    const randomDeliveryType = deliveryTypes[Math.floor(Math.random() * deliveryTypes.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomConstructionType = constructionTypes[Math.floor(Math.random() * constructionTypes.length)];
    const randomDeliveryTypeDetail = deliveryTypeDetails[Math.floor(Math.random() * deliveryTypeDetails.length)];
    const randomFurnitureCompany = furnitureCompanies[Math.floor(Math.random() * furnitureCompanies.length)];
    const randomBuildingType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
    const randomProductName = productNames[Math.floor(Math.random() * productNames.length)];
    const randomEmergencyContact = emergencyContacts[Math.floor(Math.random() * emergencyContacts.length)];
    
    // 방문일 (사용자 입력값 또는 오늘부터 30일 이내 랜덤)
    let visitDateStr;
    if (req.body.visit_date) {
      visitDateStr = req.body.visit_date;
      console.log('[배송 생성] 사용자 지정 방문일:', visitDateStr);
    } else {
      const visitDate = new Date();
      visitDate.setDate(visitDate.getDate() + Math.floor(Math.random() * 30));
      visitDateStr = visitDate.toISOString().split('T')[0];
      console.log('[배송 생성] 랜덤 방문일:', visitDateStr);
    }
    
    // 방문시간 (09:00 ~ 18:00 사이 랜덤)
    const visitHours = ['09:00-12:00', '13:00-16:00', '16:00-18:00', '10:00-14:00', '14:00-18:00'];
    const randomVisitTime = visitHours[Math.floor(Math.random() * visitHours.length)];
    
    // 층수 (1~20층 랜덤)
    const randomFloor = Math.floor(1 + Math.random() * 20) + '층';
    
    // Boolean 값들 (0 또는 1)
    const randomHasElevator = Math.random() > 0.3 ? 1 : 0; // 70% 확률로 엘리베이터 있음
    const randomNeedsLadderTruck = Math.random() > 0.8 ? 1 : 0; // 20% 확률로 사다리차 필요
    const randomNeedsUnloading = Math.random() > 0.5 ? 1 : 0; // 50% 확률로 내림 필요
    const randomRoomMovement = Math.random() > 0.6 ? 1 : 0; // 40% 확률로 방간이동
    const randomWallInstallation = Math.random() > 0.7 ? 1 : 0; // 30% 확률로 벽시공
    
    // 가구사 상품코드 (랜덤 생성)
    const randomProductCode = randomFurnitureCompany.substring(0,2).toUpperCase() + 
                             Math.floor(100000 + Math.random() * 900000);
    
    // 무게 (1~100kg 랜덤)
    const randomWeight = Math.floor(1 + Math.random() * 100);
    
    // 상품크기와 박스크기 (랜덤 생성)
    const randomProductSize = `${Math.floor(50 + Math.random() * 200)}×${Math.floor(30 + Math.random() * 150)}×${Math.floor(20 + Math.random() * 100)}`;
    const randomBoxSize = `${Math.floor(60 + Math.random() * 220)}×${Math.floor(40 + Math.random() * 160)}×${Math.floor(30 + Math.random() * 110)}`;
    
    // 주요메모 (랜덤 생성)
    const memos = ['배송 전 연락 필수', '주차 불가능 지역', '계단 이용', '사전 예약 필수', '추가 인력 필요', '설치 도구 지참'];
    const randomMemo = memos[Math.floor(Math.random() * memos.length)];
    
    // 추가 컬럼들을 위한 랜덤 데이터
    const packageTypes = ['일반포장', '완충포장', '방수포장', '특수포장', '냉장포장'];
    const randomPackageType = packageTypes[Math.floor(Math.random() * packageTypes.length)];
    
    
    // Boolean 값들을 문자열로 변환 (기존 컬럼 스키마에 맞춤)
    const randomElevatorAvailable = randomHasElevator ? '있음' : '없음';
    const randomLadderTruck = randomNeedsLadderTruck ? '필요' : '불필요';
    const randomDisposal = randomNeedsUnloading ? '필요' : '불필요';
    const randomRoomMovementStr = randomRoomMovement ? '있음' : '없음';
    const randomWallConstructionStr = randomWallInstallation ? '필요' : '불필요';
    
    // floor_count는 층수를 의미 (floor_number와 다름)
    const randomFloorCount = Math.floor(1 + Math.random() * 50) + '층';
    
    // 추가 텍스트 필드들
    const furnitureRequestsOptions = ['조립 서비스 요청', '설치 위치 지정', '기존 가구 철거', '포장재 수거', '추가 보관'];
    const randomFurnitureRequests = furnitureRequestsOptions[Math.floor(Math.random() * furnitureRequestsOptions.length)];
    
    const driverNotesOptions = ['배송 완료', '고객 부재', '재배송 필요', '주소 확인 필요', '특별 주의 사항'];
    const randomDriverNotes = driverNotesOptions[Math.floor(Math.random() * driverNotesOptions.length)];
    
    // 배송비 (1000원 ~ 50000원)
    const randomDeliveryFee = Math.floor(1000 + Math.random() * 49000);
    
    const specialInstructionsOptions = ['문 앞 배송', '직접 전달', '부재시 경비실', '연락 후 배송', '시간 지정'];
    const randomSpecialInstructions = specialInstructionsOptions[Math.floor(Math.random() * specialInstructionsOptions.length)];
    
    
    // fragile (깨지기 쉬운 물건 여부)
    const randomFragile = Math.random() > 0.7 ? 1 : 0; // 30% 확률로 깨지기 쉬움
    
    // 보험가치 (10만원 ~ 500만원)
    const randomInsuranceValue = Math.floor(100000 + Math.random() * 4900000);
    
    // 착불금액 (0원 또는 1만원 ~ 100만원)
    const randomCodAmount = Math.random() > 0.8 ? Math.floor(10000 + Math.random() * 990000) : 0;
    
    // 예상 배송일 (오늘부터 7일 이내)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 7));
    
    // 실제 배송일 (예상배송일 이후 0-3일)
    const actualDelivery = new Date(estimatedDelivery);
    actualDelivery.setDate(actualDelivery.getDate() + Math.floor(Math.random() * 4));
    
    // 배송 시도 횟수 (1-3회)
    const randomDeliveryAttempts = Math.floor(1 + Math.random() * 3);
    
    const lastLocations = ['출발지', '경유지', '목적지 근처', '배송센터', '고객 주소지'];
    const randomLastLocation = lastLocations[Math.floor(Math.random() * lastLocations.length)];
    
    const detailNotesOptions = ['정상 배송 완료', '고객 요청사항 반영', '특이사항 없음', '추가 확인 필요', '재방문 예정'];
    const randomDetailNotes = detailNotesOptions[Math.floor(Math.random() * detailNotesOptions.length)];

    // 랜덤 주소 생성 (발송자)
    const cities = ['서울시', '부산시', '대구시', '인천시', '광주시', '대전시', '울산시'];
    const districts = ['강남구', '서초구', '송파구', '강서구', '마포구', '용산구', '중구'];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomDistrict = districts[Math.floor(Math.random() * districts.length)];
    const randomDong = Math.floor(1 + Math.random() * 999) + '동';
    const randomNumber = Math.floor(1 + Math.random() * 999) + '-' + Math.floor(1 + Math.random() * 99);

    const senderAddress = `${randomCity} ${randomDistrict} ${randomDong} ${randomNumber}`;
    
    // 고객 주소는 고정값으로 설정
    const customerAddress = "경기도 광주시 초월읍 경수길 58";

    // 랜덤 운송장 번호 생성
    const trackingNumber = 'TK' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);

    // driver_id 필드를 위한 값 생성 (driver_id 테이블의 user_id만 사용)
    const driverIdValue = driver.user_id;

    console.log('[배송 생성] 기사 정보:', {
      id: driver.id,
      user_id: driver.user_id,
      name: driver.name,
      driverIdValue: driverIdValue
    });

    try {
      // 배송 생성 (모든 46개 컬럼 포함)
      const [insertResult] = await pool.execute(`
        INSERT INTO deliveries (
          tracking_number,
          sender_name, 
          sender_address,
          package_type,
          weight,
          status,
          assigned_driver_id,
          request_type,
          construction_type,
          visit_date,
          visit_time,
          assigned_driver,
          furniture_company,
          main_memo,
          emergency_contact,
          customer_name,
          customer_phone,
          customer_address,
          building_type,
          floor_count,
          elevator_available,
          ladder_truck,
          disposal,
          room_movement,
          wall_construction,
          product_name,
          furniture_product_code,
          product_weight,
          product_size,
          box_size,
          furniture_requests,
          driver_notes,
          installation_photos,
          customer_signature,
          delivery_fee,
          special_instructions,
          fragile,
          insurance_value,
          cod_amount,
          driver_id,
          driver_name,
          estimated_delivery,
          actual_delivery,
          delivery_attempts,
          last_location,
          detail_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        trackingNumber,
        partner.name,
        senderAddress,
        randomPackageType,
        randomWeight,
        randomStatus,
        driver.id,
        randomDeliveryType,
        randomConstructionType,
        visitDateStr,
        randomVisitTime,
        driver.name,
        randomFurnitureCompany,
        randomMemo,
        randomEmergencyContact,
        '고객' + Math.floor(1 + Math.random() * 999),
        '010-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000),
        customerAddress,
        randomBuildingType,
        randomFloorCount,
        randomElevatorAvailable,
        randomLadderTruck,
        randomDisposal,
        randomRoomMovementStr,
        randomWallConstructionStr,
        randomProductName,
        randomProductCode,
        randomWeight + 'kg',
        randomProductSize,
        randomBoxSize,
        randomFurnitureRequests,
        randomDriverNotes,
        JSON.stringify([]),
        '',
        randomDeliveryFee,
        randomSpecialInstructions,
        randomFragile,
        randomInsuranceValue,
        randomCodAmount,
        driverIdValue,
        driver.name,
        estimatedDelivery,
        actualDelivery,
        randomDeliveryAttempts,
        randomLastLocation,
        randomDetailNotes
      ]);

      result = insertResult;
      console.log('[배송 생성] 삽입 완료, ID:', result.insertId);
    } catch (insertError) {
      console.error('[배송 생성] 삽입 오류:', insertError);
      console.error('[배송 생성] 오류 상세:', insertError.sqlMessage);
      throw insertError;
    }

    res.status(201).json({
      message: '배송이 성공적으로 생성되었습니다.',
      delivery: {
        id: result.insertId,
        tracking_number: trackingNumber,
        sender: {
          name: partner.name,
          company: partner.company,
          phone: partner.phone
        },
        customer: {
          name: '고객' + Math.floor(1 + Math.random() * 999),
          address: customerAddress
        },
        driver: {
          name: driver.name,
          phone: driver.phone,
          vehicle: `${driver.vehicle_type} (${driver.vehicle_number})`
        },
        delivery_type: randomDeliveryType,
        status: randomStatus
      }
    });

  } catch (error) {
    console.error('[배송 생성] 전체 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 생성 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 모든 배송 삭제
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function deleteAllDeliveries(req, res) {
  try {
    // JWT 또는 세션 기반 인증 지원
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    // 관리자만 접근 가능
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '배송 삭제는 관리자만 가능합니다.'
      });
    }

    // 모든 배송 삭제
    const [result] = await pool.execute(`
      DELETE FROM deliveries
    `);

    res.json({
      deletedCount: result.affectedRows,
      message: `${result.affectedRows}개의 배송이 성공적으로 삭제되었습니다.`
    });

  } catch (error) {
    console.error('배송 전체 삭제 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 삭제 중 오류가 발생했습니다.'
    });
  }
}

/**
 * deliveries 테이블에 추가 컬럼들 생성
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function addDriverIdColumn(req, res) {
  try {
    // JWT 또는 세션 기반 인증 지원
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    // 관리자만 접근 가능
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '테이블 수정은 관리자만 가능합니다.'
      });
    }

    // 가구 배송 관리용 컬럼들 추가
    await pool.execute(`
      ALTER TABLE deliveries 
      ADD COLUMN IF NOT EXISTS driver_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS construction_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS delivery_type_detail VARCHAR(50),
      ADD COLUMN IF NOT EXISTS visit_date DATE,
      ADD COLUMN IF NOT EXISTS visit_time VARCHAR(20),
      ADD COLUMN IF NOT EXISTS assigned_driver VARCHAR(100),
      ADD COLUMN IF NOT EXISTS furniture_company VARCHAR(100),
      ADD COLUMN IF NOT EXISTS main_memo TEXT,
      ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(50),
      ADD COLUMN IF NOT EXISTS building_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS floor_number VARCHAR(20),
      ADD COLUMN IF NOT EXISTS has_elevator TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS needs_ladder_truck TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS needs_unloading TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS room_movement TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS wall_installation TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS product_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS furniture_product_code VARCHAR(100),
      ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS product_size VARCHAR(100),
      ADD COLUMN IF NOT EXISTS box_size VARCHAR(100)
    `);

    // 인덱스 추가
    await pool.execute(`
      ALTER TABLE deliveries 
      ADD INDEX IF NOT EXISTS idx_driver_id (driver_id),
      ADD INDEX IF NOT EXISTS idx_construction_type (construction_type),
      ADD INDEX IF NOT EXISTS idx_visit_date (visit_date),
      ADD INDEX IF NOT EXISTS idx_furniture_company (furniture_company)
    `);

    res.json({
      message: 'deliveries 테이블에 가구 배송 관리 컬럼들이 성공적으로 추가되었습니다.'
    });

  } catch (error) {
    console.error('컬럼 추가 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '컬럼 추가 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 모든 배송 목록 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function getDeliveriesList(req, res) {
  try {
    // JWT 또는 세션 기반 인증 지원
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    // 관리자만 접근 가능
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '배송 목록 조회는 관리자만 가능합니다.'
      });
    }

    // 모든 배송 목록 조회 (모든 51개 필드 포함)
    const [deliveries] = await pool.execute(`
      SELECT * FROM deliveries 
      ORDER BY created_at DESC
    `);

    res.json({
      deliveries,
      count: deliveries.length,
      message: '배송 목록을 성공적으로 조회했습니다.'
    });

  } catch (error) {
    console.error('배송 목록 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 목록 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 커스텀 배송 생성 (사용자가 모든 필드를 직접 입력)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function createCustomDelivery(req, res) {
  try {
    // JWT 또는 세션 기반 인증 지원
    const user = req.user || req.session?.user;

    console.log('[커스텀 배송 생성] 함수 시작');
    console.log('[커스텀 배송 생성] 사용자 확인:', user ? `${user.username} (${user.role})` : '없음');

    // 관리자만 접근 가능
    if (!user) {
      console.log('[커스텀 배송 생성] 인증 실패 - 사용자 없음');
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    if (user.role !== 'admin') {
      console.log('[커스텀 배송 생성] 권한 없음:', user.role);
      return res.status(403).json({
        error: 'Forbidden',
        message: '관리자 권한이 필요합니다.'
      });
    }

    console.log('[커스텀 배송 생성] 권한 확인 완료');

    // 요청 데이터 추출
    const deliveryData = req.body;
    console.log('[커스텀 배송 생성] 받은 데이터:', deliveryData);

    let insertResult;
    try {
      // 배송 생성
      [insertResult] = await pool.execute(`
        INSERT INTO deliveries (
          tracking_number,
          sender_name, 
          sender_address,
          weight,
          status,
          driver_id,
          request_type,
          construction_type,
          visit_date,
          visit_time,
          furniture_company,
          main_memo,
          emergency_contact,
          customer_name,
          customer_phone,
          customer_address,
          building_type,
          floor_count,
          elevator_available,
          ladder_truck,
          disposal,
          room_movement,
          wall_construction,
          product_name,
          furniture_product_code,
          product_weight,
          product_size,
          box_size,
          furniture_requests,
          driver_notes,
          installation_photos,
          customer_signature,
          delivery_fee,
          special_instructions,
          fragile,
          insurance_value,
          cod_amount,
          estimated_delivery,
          actual_delivery,
          delivery_attempts,
          last_location,
          detail_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        deliveryData.tracking_number || null,
        deliveryData.sender_name || null,
        deliveryData.sender_address || null,
        deliveryData.weight || null,
        deliveryData.status || '접수완료',
        deliveryData.driver_id && !isNaN(deliveryData.driver_id) ? parseInt(deliveryData.driver_id) : 
        deliveryData.assigned_driver_id && !isNaN(deliveryData.assigned_driver_id) ? parseInt(deliveryData.assigned_driver_id) : null,
        deliveryData.request_type || null,
        deliveryData.construction_type || null,
        deliveryData.visit_date || null,
        deliveryData.visit_time || null,
        deliveryData.furniture_company || null,
        deliveryData.main_memo || null,
        deliveryData.emergency_contact || null,
        deliveryData.customer_name || null,
        deliveryData.customer_phone || null,
        deliveryData.customer_address || null,
        deliveryData.building_type || null,
        deliveryData.floor_count || null,
        deliveryData.elevator_available || null,
        deliveryData.ladder_truck || null,
        deliveryData.disposal || null,
        deliveryData.room_movement || null,
        deliveryData.wall_construction || null,
        deliveryData.product_name || null,
        deliveryData.furniture_product_code || null,
        deliveryData.product_weight || null,
        deliveryData.product_size || null,
        deliveryData.box_size || null,
        deliveryData.furniture_requests || null,
        deliveryData.driver_notes || null,
        deliveryData.installation_photos ? deliveryData.installation_photos : JSON.stringify([]),
        deliveryData.customer_signature || '',
        deliveryData.delivery_fee || null,
        deliveryData.special_instructions || null,
        deliveryData.fragile ? 1 : 0,
        deliveryData.insurance_value || null,
        deliveryData.cod_amount || null,
        null, // estimated_delivery - always null to avoid datetime format issues
        null, // actual_delivery - always null to avoid datetime format issues
        deliveryData.delivery_attempts || null,
        deliveryData.last_location || null,
        deliveryData.detail_notes || null
      ]);

      console.log('[커스텀 배송 생성] 삽입 완료, ID:', insertResult.insertId);

    } catch (insertError) {
      console.error('[커스텀 배송 생성] 삽입 오류:', insertError);
      console.error('[커스텀 배송 생성] 오류 상세:', insertError.sqlMessage);
      throw insertError;
    }

    res.status(201).json({
      message: '커스텀 배송이 성공적으로 생성되었습니다.',
      delivery: {
        id: insertResult ? insertResult.insertId : 'unknown',
        tracking_number: deliveryData.tracking_number,
        sender_name: deliveryData.sender_name,
        customer_name: deliveryData.customer_name,
        status: deliveryData.status
      }
    });

  } catch (error) {
    console.error('[커스텀 배송 생성] 전체 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '커스텀 배송 생성 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 3명의 특정 파트너사 생성
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function create3Partners(req, res) {
  try {
    // JWT 또는 세션 기반 인증 지원
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    // 관리자만 접근 가능
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '파트너사 생성은 관리자만 가능합니다.'
      });
    }

    console.log('[3명 파트너사 생성] 시작');

    // 생성할 3명의 파트너사 데이터
    const partnersData = [
      {
        username: 'pt001',
        password: '123456',
        name: '업체1',
        email: 'pt001@gmail.com',
        phone: '010-1111-1111',
        company: '첫번째담당자',
        role: 'user',
        default_sender_address: '경기 성남시 분당구 고기로 25',
        default_sender_zipcode: '13547'
      },
      {
        username: 'pt002',
        password: '123456',
        name: '업체2',
        email: 'pt002@gmail.com',
        phone: '010-2222-2222',
        company: '두번째담당자',
        role: 'user',
        default_sender_address: '경기 성남시 분당구 고기로 256-10',
        default_sender_zipcode: '13547'
      },
      {
        username: 'pt003',
        password: '123456',
        name: '업체3',
        email: 'pt003@gmail.com',
        phone: '010-3333-3333',
        company: '세번째담당자',
        role: 'user',
        default_sender_address: '경기 성남시 분당구 대왕판교로 372',
        default_sender_zipcode: '13547'
      }
    ];

    const createdUsers = [];

    for (const partnerData of partnersData) {
      // 기존 사용자명 중복 확인
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE username = ?',
        [partnerData.username]
      );

      if (existingUsers.length > 0) {
        console.log(`[3명 파트너사 생성] 사용자명 ${partnerData.username} 이미 존재함, 건너뜀`);
        continue;
      }

      // 비밀번호 해시
      const hashedPassword = await bcrypt.hash(partnerData.password, 10);

      // 사용자 생성
      const [result] = await pool.execute(`
        INSERT INTO users (
          username, password, name, email, phone, company, role, is_active,
          default_sender_address, default_sender_zipcode, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        partnerData.username,
        hashedPassword,
        partnerData.name,
        partnerData.email,
        partnerData.phone,
        partnerData.company,
        partnerData.role,
        true,
        partnerData.default_sender_address,
        partnerData.default_sender_zipcode
      ]);

      const userId = result.insertId;
      console.log(`[3명 파트너사 생성] ${partnerData.username} 생성 완료 (ID: ${userId})`);

      createdUsers.push({
        id: userId,
        username: partnerData.username,
        name: partnerData.name,
        company: partnerData.company
      });
    }

    console.log(`[3명 파트너사 생성] 완료 - ${createdUsers.length}명 생성됨`);

    res.json({
      success: true,
      message: `${createdUsers.length}명의 파트너사가 성공적으로 생성되었습니다.`,
      users: createdUsers
    });

  } catch (error) {
    console.error('[3명 파트너사 생성] 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '파트너사 생성 중 오류가 발생했습니다.'
    });
  }
}

module.exports = {
  getDbSchema,
  getTableRelationships,
  getPartnersList,
  deleteAllPartners,
  getDriversList,
  deleteAllDrivers,
  createRandomDriver,
  createRandomPartner,
  createRandomDelivery,
  createCustomDelivery,
  deleteAllDeliveries,
  addDriverIdColumn,
  getDeliveriesList,
  create3Partners
};