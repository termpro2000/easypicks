const pool = require('../db/connection');

async function updateDriverProfileFields() {
  try {
    console.log('🗄️ Driver ID 테이블에 프로필 필드 추가를 시작합니다...');

    // 프로필 필드들 추가
    const profileFields = [
      { name: 'email', type: 'VARCHAR(255)' },
      { name: 'vehicle_type', type: 'VARCHAR(100)' },
      { name: 'vehicle_number', type: 'VARCHAR(50)' },
      { name: 'cargo_capacity', type: 'VARCHAR(100)' }
    ];

    for (const field of profileFields) {
      try {
        console.log(`📝 ${field.name} 필드 추가 중...`);
        await pool.execute(`
          ALTER TABLE drivers 
          ADD COLUMN ${field.name} ${field.type} NULL
        `);
        console.log(`✅ ${field.name} 필드 추가 완료`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`ℹ️ ${field.name} 필드가 이미 존재합니다.`);
        } else {
          console.error(`❌ ${field.name} 필드 추가 실패:`, error.message);
        }
      }
    }

    // 기존 테스트 데이터에 샘플 프로필 정보 업데이트
    console.log('📊 기존 테스트 계정에 샘플 프로필 데이터 추가 중...');
    
    const profileUpdates = [
      {
        user_id: 'driver001',
        email: 'driver001@miraekorea.com',
        vehicle_type: '1톤 트럭',
        vehicle_number: '서울12가3456',
        cargo_capacity: '최대 1톤'
      },
      {
        user_id: 'driver002',
        email: 'driver002@miraekorea.com',
        vehicle_type: '2.5톤 트럭',
        vehicle_number: '부산34나5678',
        cargo_capacity: '최대 2.5톤'
      },
      {
        user_id: 'admin',
        email: 'admin@miraekorea.com',
        vehicle_type: '관리용 차량',
        vehicle_number: '서울56다7890',
        cargo_capacity: '해당없음'
      }
    ];

    for (const update of profileUpdates) {
      try {
        await pool.execute(`
          UPDATE drivers 
          SET email = ?, vehicle_type = ?, vehicle_number = ?, cargo_capacity = ?
          WHERE user_id = ?
        `, [
          update.email,
          update.vehicle_type,
          update.vehicle_number,
          update.cargo_capacity,
          update.user_id
        ]);
      } catch (error) {
        console.log(`ℹ️ ${update.user_id} 프로필 업데이트 건너뜀:`, error.message);
      }
    }

    console.log('✅ 샘플 프로필 데이터 추가 완료');
    console.log('🎉 Driver ID 테이블 프로필 필드 업데이트가 완료되었습니다!');
    
    // 연결 종료
    await pool.end();
    
  } catch (error) {
    console.error('❌ Driver ID 테이블 업데이트 오류:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  updateDriverProfileFields();
}

module.exports = updateDriverProfileFields;