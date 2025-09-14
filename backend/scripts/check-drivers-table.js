const { pool } = require('../config/database');

async function checkDriversTable() {
  try {
    console.log('🚚 drivers 테이블 확인 중...');
    
    // Show table structure
    const [columns] = await pool.execute('DESCRIBE drivers');
    console.log('📋 drivers 테이블 컬럼 정보:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    // Check if there are any drivers
    const [count] = await pool.execute('SELECT COUNT(*) as count FROM drivers');
    console.log(`📊 등록된 기사 수: ${count[0].count}개`);
    
    // Show all drivers if any exist
    if (count[0].count > 0) {
      const [drivers] = await pool.execute('SELECT * FROM drivers');
      console.log('👨‍💼 등록된 기사 목록:');
      drivers.forEach((driver, index) => {
        console.log(`  ${index + 1}. ID: ${driver.driver_id}, 이름: ${driver.name}, 사용자명: ${driver.username}, 차량: ${driver.vehicle_type}`);
      });
    } else {
      console.log('ℹ️  등록된 기사가 없습니다.');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ drivers 테이블 확인 실패:', error);
    
    // driver_id 테이블도 확인해보기
    try {
      console.log('🔍 driver_id 테이블 확인 중...');
      const [columns2] = await pool.execute('DESCRIBE driver_id');
      console.log('📋 driver_id 테이블 컬럼 정보:');
      columns2.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? `[${col.Key}]` : ''}`);
      });
      
      const [count2] = await pool.execute('SELECT COUNT(*) as count FROM driver_id');
      console.log(`📊 driver_id 테이블의 기사 수: ${count2[0].count}개`);
      
      if (count2[0].count > 0) {
        const [drivers2] = await pool.execute('SELECT * FROM driver_id');
        console.log('👨‍💼 driver_id 테이블의 기사 목록:');
        drivers2.forEach((driver, index) => {
          console.log(`  ${index + 1}. ID: ${driver.id}, 이름: ${driver.name}, 사용자명: ${driver.user_id}, 차량: ${driver.vehicle_type}`);
        });
      }
    } catch (error2) {
      console.error('driver_id 테이블도 존재하지 않습니다.');
    }
    
    process.exit(1);
  }
}

checkDriversTable();