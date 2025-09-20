const pool = require('../db/connection');

async function checkDeliveriesTable() {
  try {
    console.log('🔍 deliveries 테이블 구조 확인...\n');
    
    // 테이블 구조 확인
    const [columns] = await pool.execute('SHOW COLUMNS FROM deliveries');
    
    console.log('📋 deliveries 테이블 컬럼:');
    columns.forEach(col => {
      console.log(`   ${col.Field} (${col.Type}) - NULL: ${col.Null}, Default: ${col.Default}`);
    });
    
  } catch (error) {
    console.error('❌ 테이블 구조 확인 중 오류:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkDeliveriesTable();
}

module.exports = checkDeliveriesTable;