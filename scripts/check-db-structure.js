const pool = require('../db/connection');

async function checkDBStructure() {
  try {
    console.log('🔍 데이터베이스 구조 확인 중...');

    // 모든 테이블 조회
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('📋 기존 테이블들:', tables);

    // deliveries 테이블이 있다면 구조 확인
    const deliveriesTable = tables.find(table => 
      Object.values(table)[0] === 'deliveries'
    );

    if (deliveriesTable) {
      console.log('\n📦 deliveries 테이블 구조:');
      const [columns] = await pool.execute('DESCRIBE deliveries');
      console.table(columns);

      // 데이터 개수 확인
      const [count] = await pool.execute('SELECT COUNT(*) as count FROM deliveries');
      console.log('\n📊 deliveries 테이블 데이터 개수:', count[0].count);

      // 샘플 데이터 조회 (있다면)
      if (count[0].count > 0) {
        const [sample] = await pool.execute('SELECT * FROM deliveries LIMIT 2');
        console.log('\n💾 샘플 데이터:');
        console.log(sample);
      }
    } else {
      console.log('\n❌ deliveries 테이블이 존재하지 않습니다.');
    }

  } catch (error) {
    console.error('❌ 데이터베이스 구조 확인 오류:', error.message);
    console.error('세부 정보:', error);
  }
}

if (require.main === module) {
  checkDBStructure();
}

module.exports = { checkDBStructure };