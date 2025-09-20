const pool = require('../db/connection');

async function initDriverDatabase() {
  try {
    console.log('🗄️ Drivers 데이터베이스 초기화를 시작합니다...');

    // drivers 테이블 생성
    console.log('📝 Drivers 테이블 생성 중...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Drivers 테이블 생성 완료');

    // 기존 데이터 확인
    const [existingDrivers] = await pool.execute('SELECT COUNT(*) as count FROM drivers');
    
    if (existingDrivers[0].count === 0) {
      console.log('📊 테스트 driver 계정 데이터 삽입 중...');
      
      // 테스트 driver 계정 데이터 삽입
      const bcrypt = require('bcrypt');
      const saltRounds = 10;
      
      const driverData = [
        {
          user_id: 'driver001',
          password: await bcrypt.hash('password123', saltRounds),
          name: '김운전',
          phone: '010-1111-2222'
        },
        {
          user_id: 'driver002',
          password: await bcrypt.hash('password123', saltRounds),
          name: '박배달',
          phone: '010-3333-4444'
        },
        {
          user_id: 'admin',
          password: await bcrypt.hash('admin123', saltRounds),
          name: '관리자',
          phone: '010-9999-0000'
        }
      ];

      for (const driver of driverData) {
        await pool.execute(`
          INSERT INTO drivers 
          (user_id, password, name, phone) 
          VALUES (?, ?, ?, ?)
        `, [
          driver.user_id,
          driver.password,
          driver.name,
          driver.phone
        ]);
      }
      
      console.log('✅ 테스트 driver 계정 데이터 삽입 완료');
      console.log('테스트 계정:');
      console.log('- driver001 / password123');
      console.log('- driver002 / password123');
      console.log('- admin / admin123');
    } else {
      console.log('ℹ️ 기존 driver 데이터가 있어 테스트 데이터 삽입을 건너뜁니다.');
    }

    console.log('🎉 Drivers 데이터베이스 초기화가 완료되었습니다!');
    
    // 연결 종료
    await pool.end();
    
  } catch (error) {
    console.error('❌ Drivers 데이터베이스 초기화 오류:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  initDriverDatabase();
}

module.exports = initDriverDatabase;