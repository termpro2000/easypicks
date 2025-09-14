const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('PlanetScale 연결 테스트 시작...');
    console.log(`호스트: ${process.env.DB_HOST}`);
    console.log(`포트: ${process.env.DB_PORT}`);
    console.log(`사용자: ${process.env.DB_USER}`);
    console.log(`데이터베이스: ${process.env.DB_NAME}`);
    console.log(`SSL: ${process.env.DB_SSL}`);
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? {} : false,
      connectTimeout: 10000,
      acquireTimeout: 10000,
      timeout: 10000
    });
    
    console.log('연결 성공!');
    
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('쿼리 테스트 성공:', rows);
    
    await connection.end();
    console.log('연결 종료');
    
  } catch (error) {
    console.error('연결 실패:', error.message);
    console.error('에러 코드:', error.code);
    console.error('전체 에러:', error);
  }
}

testConnection();