const mysql = require('mysql2/promise');

// PlanetScale 연결 설정
const planetscaleConfig = {
  host: 'aws.connect.psdb.cloud',
  port: 3306,
  user: 'q1nyd4zvt86otiyozkcc',
  password: 'pscale_pw_rNdZk9r1xV2hV2y5dNE5ZmdAcnOUf4SikO5tKS8t5Ce',
  database: 'miraekorea',
  charset: 'utf8mb4',
  timezone: '+09:00',
  ssl: {
    rejectUnauthorized: true
  }
};

async function checkTableSchema() {
  let connection;
  
  try {
    console.log('🔍 deliveries 테이블 스키마 확인...');
    
    connection = await mysql.createConnection(planetscaleConfig);
    console.log('✅ PlanetScale 연결 성공');

    // 테이블 구조 확인
    const [columns] = await connection.execute('DESCRIBE deliveries');
    
    console.log('\n📋 deliveries 테이블 컬럼 정보:');
    console.log('컬럼명                     | 타입                | Null | Key | Default | Extra');
    console.log('---------------------------|---------------------|------|-----|---------|----------');
    
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(25)} | ${col.Type.padEnd(18)} | ${col.Null.padEnd(4)} | ${col.Key.padEnd(3)} | ${(col.Default || 'NULL').toString().padEnd(7)} | ${col.Extra}`);
    });

    // 샘플 데이터 하나 조회
    const [sampleRow] = await connection.execute('SELECT * FROM deliveries LIMIT 1');
    if (sampleRow.length > 0) {
      console.log('\n📄 샘플 데이터:');
      console.log(JSON.stringify(sampleRow[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ 스키마 확인 실패:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTableSchema();