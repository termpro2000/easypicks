const { pool } = require('./config/database');

async function createDriversTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS drivers (
        driver_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        vehicle_type VARCHAR(50),
        vehicle_number VARCHAR(20),
        license_number VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ drivers 테이블 생성 완료');
    process.exit(0);
  } catch (error) {
    console.error('테이블 생성 오류:', error);
    process.exit(1);
  }
}

createDriversTable();