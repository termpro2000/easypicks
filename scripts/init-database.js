const pool = require('../db/connection');

async function initDatabase() {
  try {
    console.log('🗄️ 데이터베이스 초기화를 시작합니다...');

    // 사용자 테이블 생성
    console.log('📝 사용자 테이블 생성 중...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 사용자 테이블 생성 완료');

    // 배송 테이블 생성
    console.log('📦 배송 테이블 생성 중...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tracking_number VARCHAR(50) UNIQUE NOT NULL,
        sender_name VARCHAR(100) NOT NULL,
        sender_address TEXT NOT NULL,
        receiver_name VARCHAR(100) NOT NULL,
        receiver_address TEXT NOT NULL,
        receiver_phone VARCHAR(20) NOT NULL,
        package_type VARCHAR(50),
        weight DECIMAL(5,2),
        status ENUM('pending', 'in_transit', 'delivered', 'cancelled') DEFAULT 'pending',
        assigned_driver_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 배송 테이블 생성 완료');

    // 확장된 배송 정보 테이블 생성
    console.log('📋 배송 상세정보 테이블 생성 중...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS delivery_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        delivery_id INT NOT NULL,
        request_type VARCHAR(100),
        construction_type VARCHAR(100),
        shipment_type VARCHAR(100),
        visit_date DATE,
        visit_time VARCHAR(50),
        furniture_company VARCHAR(100),
        emergency_contact VARCHAR(20),
        warehouse_info VARCHAR(200),
        order_guidance VARCHAR(100),
        pre_notification VARCHAR(100),
        building_type VARCHAR(50),
        floor_count VARCHAR(20),
        elevator_available VARCHAR(10),
        stair_movement VARCHAR(50),
        ladder_truck VARCHAR(50),
        disposal VARCHAR(100),
        room_movement VARCHAR(100),
        wall_construction VARCHAR(100),
        tollgate_cost VARCHAR(50),
        main_memo TEXT,
        happy_call_memo TEXT,
        product_info TEXT,
        furniture_request TEXT,
        driver_memo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 배송 상세정보 테이블 생성 완료');

    // 기존 데이터 확인
    const [existingDeliveries] = await pool.execute('SELECT COUNT(*) as count FROM deliveries');
    
    if (existingDeliveries[0].count === 0) {
      console.log('📊 테스트 데이터 삽입 중...');
      
      // 테스트 배송 데이터 삽입
      const deliveryData = [
        {
          tracking_number: 'MK202401001',
          sender_name: '김철수',
          sender_address: '서울시 강남구 테헤란로 123',
          receiver_name: '이영희',
          receiver_address: '부산시 해운대구 마린시티 456, 101동 502호',
          receiver_phone: '010-1234-5678',
          package_type: '일반택배',
          weight: 2.5,
          status: 'pending'
        },
        {
          tracking_number: 'MK202401002',
          sender_name: '박민수',
          sender_address: '인천시 남동구 구월로 789',
          receiver_name: '최지훈',
          receiver_address: '대구시 수성구 동대구로 321, 202호',
          receiver_phone: '010-9876-5432',
          package_type: '냉장택배',
          weight: 5.0,
          status: 'delivered'
        },
        {
          tracking_number: 'MK202401003',
          sender_name: '홍길동',
          sender_address: '광주시 서구 상무대로 654',
          receiver_name: '김민정',
          receiver_address: '울산시 남구 삼산로 987, 빌라 3층',
          receiver_phone: '010-5555-7777',
          package_type: '특송',
          weight: 1.2,
          status: 'pending'
        },
        {
          tracking_number: 'MK202401004',
          sender_name: '정수진',
          sender_address: '대전시 유성구 대학로 147',
          receiver_name: '오성민',
          receiver_address: '전주시 완산구 전주천동로 258, 101동 201호',
          receiver_phone: '010-3333-4444',
          package_type: '일반택배',
          weight: 3.8,
          status: 'delivered'
        },
        {
          tracking_number: 'MK202401005',
          sender_name: '윤재호',
          sender_address: '수원시 영통구 광교로 369',
          receiver_name: '신혜정',
          receiver_address: '춘천시 동내면 서부대성로 741, 상가 1층',
          receiver_phone: '010-8888-9999',
          package_type: '냉동택배',
          weight: 4.5,
          status: 'pending'
        }
      ];

      for (const delivery of deliveryData) {
        const [result] = await pool.execute(`
          INSERT INTO deliveries 
          (tracking_number, sender_name, sender_address, receiver_name, receiver_address, 
           receiver_phone, package_type, weight, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          delivery.tracking_number,
          delivery.sender_name,
          delivery.sender_address,
          delivery.receiver_name,
          delivery.receiver_address,
          delivery.receiver_phone,
          delivery.package_type,
          delivery.weight,
          delivery.status
        ]);

        // 배송 상세정보도 삽입
        await pool.execute(`
          INSERT INTO delivery_details 
          (delivery_id, request_type, construction_type, shipment_type, visit_date, visit_time,
           furniture_company, emergency_contact, warehouse_info, order_guidance, pre_notification,
           building_type, floor_count, elevator_available, stair_movement, ladder_truck,
           disposal, room_movement, wall_construction, tollgate_cost, main_memo,
           happy_call_memo, product_info, furniture_request, driver_memo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          result.insertId,
          '새가구 배송',
          '조립 설치',
          '직배송',
          '2024-01-15',
          '14:00-16:00',
          '한샘가구',
          '010-9999-8888',
          '김포물류센터',
          '완료',
          '필요',
          '아파트',
          '5층',
          '있음',
          '불필요',
          '불필요',
          '없음',
          '거실→침실',
          '벽걸이 TV',
          '5,000원',
          '조심스럽게 운반 요청',
          '고객 매우 만족',
          '침실세트 (침대, 옷장, 화장대)',
          '스크래치 주의',
          '주차 어려움'
        ]);
      }
      
      console.log('✅ 테스트 데이터 삽입 완료');
    } else {
      console.log('ℹ️ 기존 데이터가 있어 테스트 데이터 삽입을 건너뜁니다.');
    }

    console.log('🎉 데이터베이스 초기화가 완료되었습니다!');
    
    // 연결 종료
    await pool.end();
    
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 오류:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;