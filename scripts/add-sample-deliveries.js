const pool = require('../db/connection');

// 오늘 날짜를 YYYY-MM-DD 형식으로 생성하는 함수
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const sampleDeliveries = [
  {
    tracking_number: 'MK202501001',
    sender_name: '김철수',
    sender_address: '서울시 강남구 테헤란로 123',
    sender_phone: '010-1111-2222',
    receiver_name: '이영희',
    receiver_address: '부산시 해운대구 마린시티 456',
    receiver_phone: '010-1234-5678',
    package_type: '일반택배',
    weight: 2.5,
    status: 'pending',
    request_type: '새가구 배송',
    construction_type: '조립 설치',
    shipment_type: '직배송',
    visit_date: getTodayDate(),
    visit_time: '14:00-16:00',
    assigned_driver: '김기사',
    furniture_company: '한샘가구',
    main_memo: '신속 배송 요청',
    emergency_contact: '010-9999-8888',
    building_type: '아파트',
    floor_count: '15층',
    elevator_available: '있음',
    ladder_truck: '불필요',
    disposal: '없음',
    room_movement: '있음',
    wall_construction: '필요',
    product_name: '3인용 소파 세트',
    furniture_product_code: 'HSM-SF-001',
    product_weight: '45kg',
    product_size: '220 x 90 x 80cm',
    box_size: '230 x 100 x 90cm',
    furniture_requests: '소파 배치 시 TV 보는 각도 고려 부탁드립니다.',
    driver_notes: '엘리베이터 사용 가능, 고객 매우 친절함'
  },
  {
    tracking_number: 'MK202501002',
    sender_name: '박민수',
    sender_address: '인천시 남동구 구월로 789',
    sender_phone: '010-2222-3333',
    receiver_name: '최지훈',
    receiver_address: '대구시 수성구 동대구로 321',
    receiver_phone: '010-9876-5432',
    package_type: '냉장택배',
    weight: 5.0,
    status: 'pending',
    request_type: '중고가구 교체',
    construction_type: '해체 후 설치',
    shipment_type: '택배배송',
    visit_date: getTodayDate(),
    visit_time: '09:00-12:00',
    assigned_driver: '이기사',
    furniture_company: '이케아',
    main_memo: '냉장상품 - 온도관리 주의',
    emergency_contact: '010-8888-7777',
    building_type: '빌라',
    floor_count: '5층',
    elevator_available: '없음',
    ladder_truck: '필요',
    disposal: '있음',
    room_movement: '있음',
    wall_construction: '불필요',
    product_name: '냉장고 (4도어)',
    furniture_product_code: 'IKEA-RF-402',
    product_weight: '85kg',
    product_size: '180 x 60 x 70cm',
    box_size: '190 x 70 x 80cm',
    furniture_requests: '냉장고 설치 후 전원 연결 및 동작 테스트 필수',
    driver_notes: '5층 엘리베이터 없음, 사다리차 이용함'
  },
  {
    tracking_number: 'MK202501003',
    sender_name: '홍길동',
    sender_address: '광주시 서구 상무대로 654',
    sender_phone: '010-3333-4444',
    receiver_name: '김민정',
    receiver_address: '울산시 남구 삼산로 987',
    receiver_phone: '010-5555-7777',
    package_type: '특송',
    weight: 1.2,
    status: 'completed',
    request_type: '새가구 배송',
    construction_type: '전문설치',
    shipment_type: '당일배송',
    visit_date: getTodayDate(),
    visit_time: '08:00-09:00',
    assigned_driver: '박기사',
    furniture_company: '까사미아',
    main_memo: '특송 - 당일 배송 완료',
    emergency_contact: '010-7777-6666',
    building_type: '단독주택',
    floor_count: '2층',
    elevator_available: '없음',
    ladder_truck: '불필요',
    disposal: '없음',
    room_movement: '없음',
    wall_construction: '필요',
    product_name: '벽걸이 TV 65인치',
    furniture_product_code: 'CASA-TV-065',
    product_weight: '28kg',
    product_size: '145 x 83 x 8cm',
    box_size: '155 x 93 x 18cm',
    furniture_requests: '벽걸이 설치 시 전선 정리 깔끔하게 부탁합니다.',
    driver_notes: '벽시공 완료, 고객 서명 받음'
  }
];

async function addSampleDeliveries() {
  try {
    console.log('샘플 배송 데이터 추가 시작...');
    
    for (const delivery of sampleDeliveries) {
      try {
        await pool.execute(`
          INSERT INTO deliveries (
            tracking_number, sender_name, sender_address, sender_phone,
            receiver_name, receiver_address, receiver_phone, package_type, weight, status,
            request_type, construction_type, shipment_type, visit_date, visit_time,
            assigned_driver, furniture_company, main_memo, emergency_contact,
            building_type, floor_count, elevator_available, ladder_truck, disposal,
            room_movement, wall_construction, product_name, furniture_product_code,
            product_weight, product_size, box_size, furniture_requests, driver_notes,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          delivery.tracking_number, delivery.sender_name, delivery.sender_address, delivery.sender_phone,
          delivery.receiver_name, delivery.receiver_address, delivery.receiver_phone, 
          delivery.package_type, delivery.weight, delivery.status,
          delivery.request_type, delivery.construction_type, delivery.shipment_type, 
          delivery.visit_date, delivery.visit_time, delivery.assigned_driver, 
          delivery.furniture_company, delivery.main_memo, delivery.emergency_contact,
          delivery.building_type, delivery.floor_count, delivery.elevator_available, 
          delivery.ladder_truck, delivery.disposal, delivery.room_movement, 
          delivery.wall_construction, delivery.product_name, delivery.furniture_product_code,
          delivery.product_weight, delivery.product_size, delivery.box_size, 
          delivery.furniture_requests, delivery.driver_notes
        ]);
        
        console.log(`✓ ${delivery.tracking_number} 추가 완료`);
      } catch (insertError) {
        if (insertError.code === 'ER_DUP_ENTRY') {
          console.log(`- ${delivery.tracking_number} 이미 존재함 (스킵)`);
        } else {
          console.error(`✗ ${delivery.tracking_number} 추가 실패:`, insertError.message);
        }
      }
    }
    
    // 추가된 데이터 확인
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM deliveries');
    console.log(`\n총 배송 데이터 수: ${rows[0].count}개`);
    
  } catch (error) {
    console.error('샘플 데이터 추가 오류:', error);
  } finally {
    await pool.end();
    console.log('데이터베이스 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  addSampleDeliveries();
}

module.exports = { addSampleDeliveries };