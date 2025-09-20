const pool = require('../db/connection');

async function checkTable() {
  try {
    console.log('deliveries 테이블 구조 확인 중...');
    
    // 테이블 구조 확인
    const [columns] = await pool.execute('DESCRIBE deliveries');
    console.log('\n=== deliveries 테이블 컬럼 구조 ===');
    columns.forEach(col => {
      console.log(`${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
    });
    
    // 기존 데이터 확인
    const [rows] = await pool.execute('SELECT * FROM deliveries LIMIT 5');
    console.log(`\n=== 기존 데이터 (${rows.length}개) ===`);
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.tracking_number} - ${row.receiver_name || row.customer_name} (${row.status})`);
    });
    
  } catch (error) {
    console.error('테이블 확인 오류:', error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkTable();
}

module.exports = { checkTable };