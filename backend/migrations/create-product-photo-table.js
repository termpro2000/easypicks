const { pool } = require('../config/database');

async function createProductPhotoTable() {
  try {
    console.log('product_photo 테이블 생성 중...');
    
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS product_photo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT,
        mime_type VARCHAR(100),
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_product_id (product_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('product_photo 테이블 생성 완료!');
    
  } catch (error) {
    console.error('마이그레이션 오류:', error);
  } finally {
    process.exit();
  }
}

createProductPhotoTable();