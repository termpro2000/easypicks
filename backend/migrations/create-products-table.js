const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  connectionLimit: 10,
  queueLimit: 0
});

async function createProductsTable() {
  try {
    console.log('Starting products table creation...');

    // products 테이블 생성
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        weight DECIMAL(10,2),
        size VARCHAR(50),
        cost1 DECIMAL(12,2),
        cost2 DECIMAL(12,2),
        memo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.execute(createTableQuery);
    console.log('✅ Products 테이블이 성공적으로 생성되었습니다.');

    // 샘플 데이터 삽입
    const insertSampleData = `
      INSERT IGNORE INTO products (id, user_id, name, weight, size, cost1, cost2, memo) VALUES
      (1, 22, '삼성 냉장고 RT32K5035S8', 65.0, '600x650x1750mm', 150000, 180000, '2도어 냉장고, 실버'),
      (2, 23, 'LG 세탁기 F21VDD', 78.0, '600x650x850mm', 120000, 150000, '드럼세탁기 21kg, 화이트'),
      (3, 24, '한샘 식탁 세트', 45.0, '1200x800x750mm', 80000, 100000, '4인용 원목 식탁세트'),
      (4, 22, '삼성 에어컨 AR07T9170HAA', 35.0, '795x250x230mm', 90000, 110000, '벽걸이형 에어컨 7평'),
      (5, 1, '이케아 소파 EKTORP', 85.0, '2180x880x880mm', 60000, 75000, '3인용 패브릭 소파');
    `;

    await pool.execute(insertSampleData);
    console.log('✅ 샘플 데이터가 성공적으로 삽입되었습니다.');

    // 테이블 구조 확인
    const [tableInfo] = await pool.execute('DESCRIBE products');
    console.log('\n📋 Products 테이블 구조:');
    console.table(tableInfo);

    // 데이터 확인
    const [rows] = await pool.execute('SELECT * FROM products LIMIT 5');
    console.log('\n📊 샘플 데이터:');
    console.table(rows);

  } catch (error) {
    console.error('❌ Products 테이블 생성 중 오류:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// 스크립트 실행
if (require.main === module) {
  createProductsTable()
    .then(() => {
      console.log('\n🎉 Products 테이블 설정 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 테이블 생성 실패:', error);
      process.exit(1);
    });
}

module.exports = createProductsTable;