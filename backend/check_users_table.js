const { pool } = require('./config/database');

async function checkUsersTable() {
  try {
    console.log('users 테이블 구조 확인...\n');
    
    // 테이블 구조 확인
    const [columns] = await pool.execute(`DESCRIBE users`);
    
    console.log('users 테이블 구조:');
    console.log('==================================================');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} | NULL: ${col.Null} | 기본값: ${col.Default}`);
    });
    console.log('==================================================\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('users 테이블 확인 중 오류:', error);
    process.exit(1);
  }
}

checkUsersTable();