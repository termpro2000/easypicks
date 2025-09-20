const pool = require('../db/connection');

async function createTestDelivery() {
  try {
    console.log('🚚 테스트 배송 데이터 생성...\n');
    
    // MK202401001 배송 데이터 생성
    const testDeliveryData = {
      tracking_number: 'MK202401001',
      sender_name: '테스트 발송자',
      sender_address: '서울시 강남구 테헤란로 123',
      receiver_name: '테스트 수신자',
      receiver_phone: '010-9876-5432',
      receiver_address: '서울시 서초구 서초대로 456',
      package_type: 'furniture',
      status: 'delivered'
    };
    
    // 기존 데이터 확인
    const [existing] = await pool.execute(
      'SELECT tracking_number FROM deliveries WHERE tracking_number = ?',
      [testDeliveryData.tracking_number]
    );
    
    if (existing.length > 0) {
      console.log('✅ MK202401001 배송 데이터가 이미 존재함');
    } else {
      // 새 배송 데이터 삽입
      await pool.execute(`
        INSERT INTO deliveries (
          tracking_number, sender_name, sender_address,
          receiver_name, receiver_phone, receiver_address, package_type,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        testDeliveryData.tracking_number,
        testDeliveryData.sender_name,
        testDeliveryData.sender_address,
        testDeliveryData.receiver_name,
        testDeliveryData.receiver_phone,
        testDeliveryData.receiver_address,
        testDeliveryData.package_type,
        testDeliveryData.status
      ]);
      
      console.log('✅ MK202401001 테스트 배송 데이터 생성 완료');
    }
    
    // 생성된 데이터 확인
    const [result] = await pool.execute(
      'SELECT tracking_number, sender_name, receiver_name, status FROM deliveries WHERE tracking_number = ?',
      [testDeliveryData.tracking_number]
    );
    
    console.log('📦 생성된 배송 데이터:');
    console.log(`   추적번호: ${result[0].tracking_number}`);
    console.log(`   발송자: ${result[0].sender_name}`);
    console.log(`   수신자: ${result[0].receiver_name}`);
    console.log(`   상태: ${result[0].status}`);
    
  } catch (error) {
    console.error('❌ 테스트 배송 데이터 생성 중 오류:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  createTestDelivery();
}

module.exports = createTestDelivery;