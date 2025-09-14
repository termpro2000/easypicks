const { pool } = require('./config/database');

async function removeUnusedUserFields() {
  try {
    console.log('사용하지 않는 user 테이블 필드들 삭제 중...\n');
    
    // 삭제될 필드들 확인
    console.log('삭제될 필드들:');
    console.log('- default_sender_name');
    console.log('- default_sender_company');
    console.log('- default_sender_phone');
    console.log('');
    
    // 삭제 전 백업을 위한 데이터 확인
    const [users] = await pool.execute(`
      SELECT id, username, name, 
             default_sender_name, default_sender_company, default_sender_phone
      FROM users 
      WHERE default_sender_name IS NOT NULL 
         OR default_sender_company IS NOT NULL 
         OR default_sender_phone IS NOT NULL
      LIMIT 5
    `);
    
    if (users.length > 0) {
      console.log('삭제될 필드에 데이터가 있는 사용자들:');
      users.forEach(user => {
        console.log(`- ID: ${user.id}, 사용자: ${user.username}, 이름: ${user.name}`);
        console.log(`  기본발송인이름: ${user.default_sender_name || 'null'}`);
        console.log(`  기본발송인회사: ${user.default_sender_company || 'null'}`);
        console.log(`  기본발송인전화: ${user.default_sender_phone || 'null'}`);
      });
      console.log('\n경고: 위 데이터들이 삭제됩니다!');
      console.log('계속하려면 스크립트를 다시 실행하세요.\n');
      process.exit(0);
    }
    
    console.log('삭제될 데이터가 없거나 모두 null입니다. 필드 삭제를 진행합니다.\n');
    
    // 필드 삭제 실행
    await pool.execute('ALTER TABLE users DROP COLUMN default_sender_name');
    console.log('✓ default_sender_name 필드 삭제 완료');
    
    await pool.execute('ALTER TABLE users DROP COLUMN default_sender_company');
    console.log('✓ default_sender_company 필드 삭제 완료');
    
    await pool.execute('ALTER TABLE users DROP COLUMN default_sender_phone');
    console.log('✓ default_sender_phone 필드 삭제 완료');
    
    console.log('\n모든 불필요한 필드가 성공적으로 삭제되었습니다!');
    
    // 최종 테이블 구조 확인
    console.log('\n현재 users 테이블 구조:');
    const [columns] = await pool.execute('DESCRIBE users');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('필드 삭제 중 오류:', error);
    process.exit(1);
  }
}

removeUnusedUserFields();