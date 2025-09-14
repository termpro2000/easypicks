const { pool } = require('./config/database');

async function checkUsers() {
  try {
    console.log('데이터베이스의 모든 사용자 조회...\n');
    
    // 모든 사용자 조회
    const [users] = await pool.execute(`
      SELECT id, username, name, phone, company, role, is_active, created_at
      FROM users 
      ORDER BY id
    `);
    
    console.log('현재 등록된 사용자 목록:');
    console.log('==================================================');
    users.forEach(user => {
      console.log(`ID: ${user.id} | ${user.username} | ${user.name} | 역할: ${user.role} | 활성: ${user.is_active ? 'Y' : 'N'} | 회사: ${user.company || '없음'}`);
    });
    console.log('==================================================\n');
    
    // 역할별 사용자 수 집계
    const [roleCounts] = await pool.execute(`
      SELECT role, COUNT(*) as count
      FROM users 
      GROUP BY role
    `);
    
    console.log('역할별 사용자 수:');
    roleCounts.forEach(roleCount => {
      console.log(`- ${roleCount.role}: ${roleCount.count}명`);
    });
    
    // driver 역할 사용자만 따로 조회
    const [drivers] = await pool.execute(`
      SELECT id, username, name, phone, company, is_active
      FROM users 
      WHERE role = 'driver'
    `);
    
    console.log(`\n기사(driver) 사용자 목록 (${drivers.length}명):`);
    if (drivers.length === 0) {
      console.log('- 등록된 기사가 없습니다.');
    } else {
      drivers.forEach(driver => {
        console.log(`- ${driver.name} (${driver.username}) | ${driver.phone} | ${driver.company || '회사 없음'} | 활성: ${driver.is_active ? 'Y' : 'N'}`);
      });
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('사용자 조회 중 오류:', error);
    process.exit(1);
  }
}

checkUsers();