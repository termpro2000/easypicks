const pool = require('../db/connection');

async function checkDriverTable() {
  try {
    console.log('🚚 drivers 테이블 구조 확인...\n');
    
    // 테이블 구조 확인
    const [columns] = await pool.execute('SHOW COLUMNS FROM drivers');
    
    console.log('📋 drivers 테이블 컬럼:');
    columns.forEach(col => {
      console.log(`   ${col.Field} (${col.Type}) - NULL: ${col.Null}, Default: ${col.Default}`);
    });
    
    // 샘플 데이터 확인
    const [drivers] = await pool.execute('SELECT user_id, name FROM drivers LIMIT 3');
    
    console.log('\n👤 샘플 드라이버 데이터:');
    if (drivers.length > 0) {
      drivers.forEach(driver => {
        console.log(`   user_id: ${driver.user_id}, name: ${driver.name}`);
      });
    } else {
      console.log('   등록된 드라이버가 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ drivers 테이블 확인 중 오류:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkDriverTable();
}

module.exports = checkDriverTable;