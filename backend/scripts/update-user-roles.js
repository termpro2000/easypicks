const { pool } = require('../config/database');

async function updateUserRoles() {
  try {
    console.log('🔄 users 테이블 role 컬럼 업데이트 시작...');
    
    // 현재 ENUM 값 확인
    console.log('📋 현재 role 컬럼 정보 확인...');
    const [columns] = await pool.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'role'
    `);
    
    if (columns.length > 0) {
      console.log('현재 role 컬럼 타입:', columns[0].COLUMN_TYPE);
    }
    
    // ENUM에 DRIVER 역할 추가
    console.log('✏️  DRIVER 역할 추가 중...');
    await pool.execute(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'manager', 'user', 'driver') 
      DEFAULT 'user'
    `);
    
    console.log('✅ DRIVER 역할이 성공적으로 추가되었습니다!');
    
    // 업데이트된 ENUM 값 확인
    const [updatedColumns] = await pool.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'role'
    `);
    
    if (updatedColumns.length > 0) {
      console.log('업데이트된 role 컬럼 타입:', updatedColumns[0].COLUMN_TYPE);
    }
    
    // 현재 사용 중인 role 값들 확인
    const [roleData] = await pool.execute('SELECT DISTINCT role FROM users WHERE role IS NOT NULL ORDER BY role');
    console.log('\n👥 현재 사용 중인 role 값들:');
    roleData.forEach(row => {
      console.log(`  - ${row.role}`);
    });
    
    console.log('\n🎉 users 테이블 role 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    if (error.message.includes('Access denied')) {
      console.log('💡 PlanetScale DDL 제한으로 인해 스키마 변경이 제한될 수 있습니다.');
      console.log('   대신 백엔드 로직에서 DRIVER 역할을 처리하도록 구현합니다.');
    }
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  updateUserRoles();
}

module.exports = updateUserRoles;