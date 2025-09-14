const { pool } = require('./config/database');

async function checkSchema() {
  try {
    console.log('users 테이블 스키마 확인...\n');
    
    // 테이블 구조 확인
    const [columns] = await pool.execute(`
      DESCRIBE users
    `);
    
    console.log('users 테이블 구조:');
    console.log('==================================================');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} | NULL: ${col.Null} | 기본값: ${col.Default} | Extra: ${col.Extra}`);
    });
    console.log('==================================================\n');
    
    // role 컬럼의 ENUM 값들 확인
    const roleColumn = columns.find(col => col.Field === 'role');
    if (roleColumn) {
      console.log('role 컬럼 상세 정보:');
      console.log(`타입: ${roleColumn.Type}`);
      console.log(`허용 값: ${roleColumn.Type.match(/enum\((.*)\)/)?.[1] || '확인 불가'}`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('스키마 확인 중 오류:', error);
    process.exit(1);
  }
}

checkSchema();