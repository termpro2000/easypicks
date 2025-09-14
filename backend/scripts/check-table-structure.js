const { pool } = require('../config/database');

async function checkTableStructure() {
  try {
    console.log('🔍 deliveries 테이블 구조 확인 중...');
    
    // Show table structure
    const [columns] = await pool.execute('DESCRIBE deliveries');
    console.log('📋 deliveries 테이블 컬럼 정보:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default !== null ? `DEFAULT(${col.Default})` : ''}`);
    });
    
    // Check if there are any existing deliveries
    const [count] = await pool.execute('SELECT COUNT(*) as count FROM deliveries');
    console.log(`📊 기존 데이터 개수: ${count[0].count}개`);
    
    // Show sample data if any exists
    if (count[0].count > 0) {
      const [samples] = await pool.execute('SELECT * FROM deliveries LIMIT 3');
      console.log('📝 샘플 데이터:');
      samples.forEach((row, index) => {
        console.log(`  ${index + 1}. ID: ${row.id}, 상태: ${row.status}, 생성일: ${row.created_at}`);
      });
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 테이블 구조 확인 실패:', error);
    process.exit(1);
  }
}

checkTableStructure();