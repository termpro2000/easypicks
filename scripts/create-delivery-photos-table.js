const pool = require('../db/connection');

async function createDeliveryPhotosTable() {
  let connection;

  try {
    // 데이터베이스 연결
    connection = await pool.getConnection();
    console.log('데이터베이스에 연결되었습니다.');

    // delivery_photos 테이블 생성 SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS delivery_photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tracking_number VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_tracking_number (tracking_number),
        INDEX idx_upload_time (upload_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='배송 사진 저장 테이블 - 파일 경로 정보만 저장';
    `;

    // 테이블 생성 실행
    await connection.execute(createTableSQL);
    console.log('✅ delivery_photos 테이블이 성공적으로 생성되었습니다.');

    // 테이블 구조 확인
    const [rows] = await connection.execute(`DESCRIBE delivery_photos`);
    console.log('\n📋 테이블 구조:');
    console.table(rows);

  } catch (error) {
    console.error('❌ 테이블 생성 중 오류 발생:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
      console.log('데이터베이스 연결이 해제되었습니다.');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  createDeliveryPhotosTable()
    .then(() => {
      console.log('\n🎉 delivery_photos 테이블 생성 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { createDeliveryPhotosTable };