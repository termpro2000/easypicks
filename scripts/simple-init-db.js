const pool = require('../db/connection');

async function simpleInitDB() {
  try {
    console.log('✅ 데이터베이스 연결 성공');

    // 기존 테이블 확인
    try {
      const [tables] = await pool.execute("SHOW TABLES LIKE 'deliveries'");
      if (tables.length === 0) {
        console.log('📋 deliveries 테이블 생성 중...');
        await pool.execute(`
          CREATE TABLE deliveries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tracking_number VARCHAR(50) UNIQUE NOT NULL,
            request_type VARCHAR(20) DEFAULT '일반',
            status VARCHAR(20) DEFAULT 'pending',
            construction_type VARCHAR(50),
            shipment_type VARCHAR(50),
            visit_date DATE,
            visit_time VARCHAR(50),
            assigned_driver VARCHAR(50),
            furniture_company VARCHAR(100),
            main_memo TEXT,
            emergency_contact VARCHAR(20),
            customer_name VARCHAR(100),
            customer_phone VARCHAR(20),
            customer_address TEXT,
            building_type VARCHAR(50),
            floor_count VARCHAR(20),
            elevator_available VARCHAR(10),
            ladder_truck VARCHAR(10),
            disposal VARCHAR(10),
            room_movement VARCHAR(10),
            wall_construction VARCHAR(10),
            product_name VARCHAR(200),
            furniture_product_code VARCHAR(100),
            product_weight VARCHAR(20),
            product_size VARCHAR(100),
            box_size VARCHAR(100),
            furniture_requests TEXT,
            driver_notes TEXT,
            installation_photos JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        console.log('  ✅ deliveries 테이블 생성 완료');
      }
    } catch (error) {
      console.log('  ⚠️  deliveries 테이블 이미 존재하거나 생성 실패:', error.message);
    }

    // 샘플 데이터 삽입
    console.log('📦 샘플 데이터 삽입 중...');

    // 데이터 1
    try {
      await pool.execute(`
        INSERT INTO deliveries (
          tracking_number, request_type, status, construction_type, shipment_type,
          visit_date, visit_time, assigned_driver, furniture_company, main_memo, emergency_contact,
          customer_name, customer_phone, customer_address,
          building_type, floor_count, elevator_available, ladder_truck, disposal, room_movement, wall_construction,
          product_name, furniture_product_code, product_weight, product_size, box_size,
          furniture_requests, driver_notes, installation_photos
        ) VALUES (
          'MK202401001', '일반', 'pending', '조립설치', '직배송',
          '2024-01-17', '14:00-18:00', '김기사', '한샘가구', '신속 배송 요청', '010-9999-8888',
          '이영희', '010-1234-5678', '부산시 해운대구 마린시티 456',
          '아파트', '15층', '있음', '불필요', '없음', '있음', '필요',
          '3인용 소파 세트', 'HSM-SF-001', '45kg', '220 x 90 x 80cm', '230 x 100 x 90cm',
          '소파 배치 시 TV 보는 각도 고려 부탁드립니다.', '엘리베이터 사용 가능, 고객 매우 친절함',
          JSON_ARRAY('https://picsum.photos/300/300?random=1', 'https://picsum.photos/300/300?random=2')
        )
      `);
      console.log('  ✅ 샘플 데이터 1 삽입 완료');
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('  ⚠️  샘플 데이터 1 이미 존재');
      } else {
        console.log('  ❌ 샘플 데이터 1 삽입 실패:', error.message);
      }
    }

    // 데이터 2
    try {
      await pool.execute(`
        INSERT INTO deliveries (
          tracking_number, request_type, status, construction_type, shipment_type,
          visit_date, visit_time, assigned_driver, furniture_company, main_memo, emergency_contact,
          customer_name, customer_phone, customer_address,
          building_type, floor_count, elevator_available, ladder_truck, disposal, room_movement, wall_construction,
          product_name, furniture_product_code, product_weight, product_size, box_size,
          furniture_requests, driver_notes, installation_photos
        ) VALUES (
          'MK202401002', '쿠방', 'in_transit', '단순배송', '물류센터경유',
          '2024-01-16', '09:00-12:00', '이기사', '이케아', '냉장상품 - 온도관리 주의', '010-8888-7777',
          '최지훈', '010-9876-5432', '대구시 수성구 동대구로 321',
          '빌라', '5층', '없음', '필요', '있음', '있음', '불필요',
          '냉장고 (4도어)', 'IKEA-RF-402', '85kg', '180 x 60 x 70cm', '190 x 70 x 80cm',
          '냉장고 설치 후 전원 연결 및 동작 테스트 필수', '5층 엘리베이터 없음, 사다리차 이용함',
          JSON_ARRAY('https://picsum.photos/300/300?random=5', 'https://picsum.photos/300/300?random=6')
        )
      `);
      console.log('  ✅ 샘플 데이터 2 삽입 완료');
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('  ⚠️  샘플 데이터 2 이미 존재');
      } else {
        console.log('  ❌ 샘플 데이터 2 삽입 실패:', error.message);
      }
    }

    // 데이터 확인
    console.log('🔍 삽입된 데이터 확인...');
    const [deliveries] = await pool.execute('SELECT tracking_number, customer_name, status, product_name FROM deliveries');
    console.log('배송 데이터:', deliveries);

    console.log('🎉 데이터베이스 초기화 완료!');

  } catch (error) {
    console.error('❌ 데이터베이스 초기화 오류:', error.message);
    console.error('세부 정보:', error);
  }
}

if (require.main === module) {
  simpleInitDB();
}

module.exports = { simpleInitDB };