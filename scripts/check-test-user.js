const pool = require('../db/connection');

async function checkTestUser() {
  try {
    console.log('🔍 test_user 확인...\n');
    
    // drivers 테이블에서 test_user 찾기
    const [drivers] = await pool.execute('SELECT * FROM drivers WHERE user_id = ?', ['test_user']);
    
    if (drivers.length === 0) {
      console.log('❌ test_user가 drivers 테이블에 없습니다.');
      console.log('➕ test_user를 추가합니다...\n');
      
      // test_user 추가
      await pool.execute(
        'INSERT INTO drivers (user_id, password, name, map_preference) VALUES (?, ?, ?, ?)',
        ['test_user', '$2b$10$defaulthash', '테스트 기사', 0]
      );
      
      console.log('✅ test_user가 추가되었습니다.');
      
      // 확인
      const [newDrivers] = await pool.execute('SELECT * FROM drivers WHERE user_id = ?', ['test_user']);
      if (newDrivers.length > 0) {
        console.log('📋 추가된 test_user 정보:');
        console.log(`   user_id: ${newDrivers[0].user_id}`);
        console.log(`   name: ${newDrivers[0].name}`);
        console.log(`   map_preference: ${newDrivers[0].map_preference}`);
      }
    } else {
      console.log('✅ test_user가 이미 존재합니다.');
      console.log('📋 test_user 정보:');
      console.log(`   user_id: ${drivers[0].user_id}`);
      console.log(`   name: ${drivers[0].name}`);
      console.log(`   map_preference: ${drivers[0].map_preference}`);
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkTestUser();
}

module.exports = checkTestUser;