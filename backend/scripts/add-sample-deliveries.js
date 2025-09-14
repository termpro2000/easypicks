const { pool, generateTrackingNumber } = require('../config/database');

async function addSampleDeliveries() {
  try {
    console.log('📦 샘플 배송 데이터 추가 시작...');

    const sampleDeliveries = [
      {
        sender_name: '김발송자',
        sender_addr: '서울특별시 강남구 테헤란로 123',
        receiver_name: '박수취인',
        receiver_addr: '서울특별시 서초구 서초대로 456',
        receiver_phone: '010-2345-6789',
        customer_name: '박수취인',
        customer_phone: '010-2345-6789',
        customer_address: '서울특별시 서초구 서초대로 456',
        product_name: '사무용 책상',
        status: 'pending',
        weight: 25.5,
        visit_date: '2025-09-12',
        visit_time: '14:00:00'
      },
      {
        sender_name: '이상품업체',
        sender_addr: '부산광역시 해운대구 센텀중앙로 78',
        receiver_name: '최구매자',
        receiver_addr: '인천광역시 남동구 구월로 321',
        receiver_phone: '010-3456-7890',
        customer_name: '최구매자',
        customer_phone: '010-3456-7890',
        customer_address: '인천광역시 남동구 구월로 321',
        product_name: '3인용 소파',
        status: 'in_transit',
        weight: 45.0,
        visit_date: '2025-09-11',
        visit_time: '10:30:00'
      },
      {
        sender_name: '가구마켓',
        sender_addr: '대구광역시 중구 동성로 99',
        receiver_name: '정고객',
        receiver_addr: '광주광역시 서구 상무대로 567',
        receiver_phone: '010-4567-8901',
        customer_name: '정고객',
        customer_phone: '010-4567-8901',
        customer_address: '광주광역시 서구 상무대로 567',
        product_name: '침대 매트리스',
        status: 'delivered',
        weight: 30.2,
        visit_date: '2025-09-10',
        visit_time: '16:00:00'
      }
    ];

    for (const delivery of sampleDeliveries) {
      const tracking_number = generateTrackingNumber();
      
      await pool.execute(`
        INSERT INTO deliveries (
          tracking_number, sender_name, sender_addr, receiver_name, receiver_addr, receiver_phone,
          customer_name, customer_phone, customer_address, product_name, status, weight,
          visit_date, visit_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        tracking_number,
        delivery.sender_name,
        delivery.sender_addr,
        delivery.receiver_name,
        delivery.receiver_addr,
        delivery.receiver_phone,
        delivery.customer_name,
        delivery.customer_phone,
        delivery.customer_address,
        delivery.product_name,
        delivery.status,
        delivery.weight,
        delivery.visit_date,
        delivery.visit_time
      ]);

      console.log(`✅ 배송 데이터 추가 완료: ${tracking_number}`);
    }

    console.log('🎉 모든 샘플 배송 데이터 추가 완료!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 샘플 데이터 추가 실패:', error);
    process.exit(1);
  }
}

addSampleDeliveries();