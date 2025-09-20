const pool = require('../db/connection');

async function addDeliveryAreaField() {
  try {
    console.log('🗄️ Driver ID 테이블에 배송지역 필드 추가를 시작합니다...');

    // delivery_area 필드 추가
    try {
      console.log('📝 delivery_area 필드 추가 중...');
      await pool.execute(`
        ALTER TABLE drivers 
        ADD COLUMN delivery_area VARCHAR(255) NULL
      `);
      console.log('✅ delivery_area 필드 추가 완료');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ delivery_area 필드가 이미 존재합니다.');
      } else {
        console.error('❌ delivery_area 필드 추가 실패:', error.message);
        throw error;
      }
    }

    // 기존 테스트 계정에 샘플 배송지역 데이터 추가
    console.log('📊 기존 테스트 계정에 샘플 배송지역 데이터 추가 중...');
    
    const deliveryAreaUpdates = [
      {
        user_id: 'driver001',
        delivery_area: '서울 강남구, 서초구, 송파구'
      },
      {
        user_id: 'driver002',
        delivery_area: '부산 해운대구, 수영구, 남구'
      },
      {
        user_id: 'admin',
        delivery_area: '전국'
      }
    ];

    for (const update of deliveryAreaUpdates) {
      try {
        await pool.execute(`
          UPDATE drivers 
          SET delivery_area = ?
          WHERE user_id = ?
        `, [
          update.delivery_area,
          update.user_id
        ]);
      } catch (error) {
        console.log(`ℹ️ ${update.user_id} 배송지역 업데이트 건너뜀:`, error.message);
      }
    }

    console.log('✅ 샘플 배송지역 데이터 추가 완료');
    console.log('🎉 배송지역 필드 추가가 완료되었습니다!');
    
    // 연결 종료
    await pool.end();
    
  } catch (error) {
    console.error('❌ 배송지역 필드 추가 오류:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  addDeliveryAreaField();
}

module.exports = addDeliveryAreaField;