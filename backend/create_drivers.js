const { pool } = require('./config/database');

async function updateUsersToDrivers() {
  try {
    console.log('기존 사용자를 기사로 업데이트 시작...');
    
    // driver1 사용자를 기사로 변경
    await pool.execute(`
      UPDATE users SET role = 'driver' WHERE username = 'driver1'
    `);
    console.log('✅ driver1을 기사로 변경 완료');
    
    // 추가 기사 사용자들을 위한 더미 데이터 생성
    const additionalDrivers = [
      { username: 'driver2', name: '박배송', phone: '010-2222-2222', company: '서울택배' },
      { username: 'driver3', name: '이운송', phone: '010-3333-3333', company: '경기물류' },
      { username: 'driver4', name: '최배달', phone: '010-4444-4444', company: '미래배송' }
    ];
    
    // test1 사용자도 임시로 기사 역할로 설정 (테스트용)
    await pool.execute(`
      UPDATE users SET role = 'driver', name = '테스트기사', company = '테스트운송' WHERE username = 'test1'
    `);
    console.log('✅ test1을 임시로 기사로 변경 완료');
    
    console.log('\n기사 역할 업데이트 완료!');
    
    // 현재 기사 목록 확인
    const [drivers] = await pool.execute(`
      SELECT id, username, name, phone, company, role, is_active 
      FROM users 
      WHERE role = 'driver'
    `);
    
    console.log('\n현재 등록된 기사 목록:');
    drivers.forEach(driver => {
      console.log(`- ${driver.name} (${driver.username}) - ${driver.company} - 활성: ${driver.is_active}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('기사 역할 업데이트 중 오류:', error);
    process.exit(1);
  }
}

updateUsersToDrivers();