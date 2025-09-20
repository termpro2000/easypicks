const pool = require('../db/connection');

async function checkUsersTable() {
  try {
    console.log('👥 users 테이블 구조 확인...\n');
    
    // 테이블 구조 확인
    const [columns] = await pool.execute('SHOW COLUMNS FROM users');
    
    console.log('📋 users 테이블 컬럼:');
    columns.forEach(col => {
      console.log(`   ${col.Field} (${col.Type}) - NULL: ${col.Null}, Default: ${col.Default}`);
    });
    
    // 샘플 데이터 확인 (첫 번째 컬럼 사용)
    const firstCol = columns[0].Field;
    const [users] = await pool.execute(`SELECT ${firstCol}, map_preference FROM users LIMIT 3`);
    
    console.log('\n👤 샘플 사용자 데이터:');
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`   ${user[firstCol]}: map_preference = ${user.map_preference}`);
      });
    } else {
      console.log('   등록된 사용자가 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ users 테이블 확인 중 오류:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkUsersTable();
}

module.exports = checkUsersTable;