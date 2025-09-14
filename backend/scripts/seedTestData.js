const mysql = require('mysql2/promise');

// PlanetScale 연결 설정
const planetscaleConfig = {
  host: process.env.DB_HOST || 'aws.connect.psdb.cloud',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  timezone: '+09:00',
  ssl: {
    rejectUnauthorized: true
  }
};

async function seedTestData() {
  let connection;
  
  try {
    console.log('🚀 테스트 데이터 추가 시작...');
    
    // PlanetScale 연결
    connection = await mysql.createConnection(planetscaleConfig);
    console.log('✅ PlanetScale 연결 성공');

    // 기존 데이터 확인
    const [existingData] = await connection.execute('SELECT COUNT(*) as count FROM deliveries');
    console.log(`현재 deliveries 테이블 데이터 수: ${existingData[0].count}`);

    // 테스트 데이터 추가
    const testDeliveries = [
      {
        tracking_number: 'TEST001',
        sender_name: '테스트 발송인',
        sender_addr: '서울시 강남구 테헤란로 123',
        receiver_name: '테스트 수취인',
        receiver_addr: '서울시 서초구 반포대로 456',
        receiver_phone: '010-1234-5678',
        package_type: '소포',
        weight: 5.5,
        status: 'pending',
        request_type: '가구배송',
        customer_name: '김고객',
        customer_phone: '010-9876-5432',
        customer_address: '서울시 서초구 반포대로 456',
        building_type: '아파트',
        floor_count: 15,
        elevator_available: true,
        ladder_truck: false,
        product_name: '책상',
        main_memo: '조심히 운반해주세요'
      },
      {
        tracking_number: 'TEST002', 
        sender_name: '이케아',
        sender_addr: '경기도 고양시 일산동구 중앙로 1200',
        receiver_name: '박고객',
        receiver_addr: '서울시 마포구 홍익로 100',
        receiver_phone: '010-2345-6789',
        package_type: '가구',
        weight: 25.0,
        status: 'in_transit',
        request_type: '가구설치',
        customer_name: '박설치',
        customer_phone: '010-8765-4321',
        customer_address: '서울시 마포구 홍익로 100',
        building_type: '빌라',
        floor_count: 4,
        elevator_available: false,
        ladder_truck: true,
        product_name: '침대프레임',
        main_memo: '2층 설치, 사다리차 필요'
      },
      {
        tracking_number: 'TEST003',
        sender_name: '한샘',
        sender_addr: '서울시 영등포구 여의도동 123',
        receiver_name: '최고객',
        receiver_addr: '인천시 연수구 송도대로 789',
        receiver_phone: '010-3456-7890',
        package_type: '가전',
        weight: 15.2,
        status: 'delivered',
        request_type: '가전설치',
        customer_name: '최설치',
        customer_phone: '010-7654-3210',
        customer_address: '인천시 연수구 송도대로 789',
        building_type: '아파트',
        floor_count: 25,
        elevator_available: true,
        ladder_truck: false,
        product_name: '냉장고',
        main_memo: '설치 완료됨'
      }
    ];

    for (const delivery of testDeliveries) {
      try {
        await connection.execute(`
          INSERT INTO deliveries (
            tracking_number, sender_name, sender_addr, receiver_name, receiver_addr, receiver_phone,
            package_type, weight, status, request_type, customer_name, customer_phone, 
            customer_address, building_type, floor_count, elevator_available, ladder_truck,
            product_name, main_memo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          delivery.tracking_number, delivery.sender_name, delivery.sender_addr,
          delivery.receiver_name, delivery.receiver_addr, delivery.receiver_phone,
          delivery.package_type, delivery.weight, delivery.status, delivery.request_type,
          delivery.customer_name, delivery.customer_phone, delivery.customer_address,
          delivery.building_type, delivery.floor_count, delivery.elevator_available,
          delivery.ladder_truck, delivery.product_name, delivery.main_memo
        ]);
        console.log(`✅ 테스트 데이터 추가: ${delivery.tracking_number}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  중복 데이터 스킵: ${delivery.tracking_number}`);
        } else {
          console.error(`❌ 데이터 추가 실패: ${delivery.tracking_number}`, error.message);
        }
      }
    }

    // 최종 데이터 수 확인
    const [finalData] = await connection.execute('SELECT COUNT(*) as count FROM deliveries');
    console.log(`최종 deliveries 테이블 데이터 수: ${finalData[0].count}`);

    // 샘플 데이터 조회
    const [sampleData] = await connection.execute(`
      SELECT id, tracking_number, sender_name, customer_name, status, created_at 
      FROM deliveries 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 샘플 데이터:');
    sampleData.forEach(row => {
      console.log(`  ID: ${row.id} | ${row.tracking_number} | ${row.customer_name} | ${row.status}`);
    });
    
    console.log('\n🎉 테스트 데이터 추가 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 데이터 추가 실패:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedTestData();