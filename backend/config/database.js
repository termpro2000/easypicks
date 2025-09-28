const mysql = require('mysql2/promise');

// 데이터베이스 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'aws.connect.psdb.cloud',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: true },
  // Only use well-supported MySQL2 pool options
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * 재시도 로직이 포함된 데이터베이스 실행 함수
 */
async function executeWithRetry(queryFunction, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFunction();
    } catch (error) {
      console.log(`DB 쿼리 실행 실패 (시도 ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 재시도 전 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

/**
 * partner_id 컬럼 존재 확인 및 추가 함수
 */
async function ensurePartnerIdColumn() {
  try {
    console.log('🔍 [ensurePartnerIdColumn] partner_id 컬럼 확인 중...');
    
    // deliveries 테이블의 컬럼 확인
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deliveries' 
      AND COLUMN_NAME = 'partner_id'
    `);
    
    if (columns.length === 0) {
      console.log('✅ [ensurePartnerIdColumn] partner_id 컬럼이 없음, 추가 시도 중...');
      
      try {
        await pool.execute(`
          ALTER TABLE deliveries 
          ADD COLUMN partner_id INT NULL COMMENT '파트너 ID (사용자 배송 등록시 사용)'
        `);
        console.log('✅ [ensurePartnerIdColumn] partner_id 컬럼 추가 완료');
      } catch (alterError) {
        if (alterError.code === 'ER_DBACCESS_DENIED_ERROR') {
          console.log('⚠️ [ensurePartnerIdColumn] DDL 권한 없음 - PlanetScale 제한사항');
          console.log('ℹ️ [ensurePartnerIdColumn] 관리자에게 수동으로 컬럼 추가 요청 필요:');
          console.log('   ALTER TABLE deliveries ADD COLUMN partner_id INT NULL;');
        } else {
          console.error('❌ [ensurePartnerIdColumn] partner_id 컬럼 추가 실패:', alterError);
        }
      }
    } else {
      console.log('✅ [ensurePartnerIdColumn] partner_id 컬럼이 이미 존재함');
    }
  } catch (error) {
    console.error('❌ [ensurePartnerIdColumn] 컬럼 확인 중 오류:', error);
  }
}

/**
 * 운송장 번호 생성 함수
 */
function generateTrackingNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  return `MD${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
}

module.exports = {
  pool,
  executeWithRetry,
  generateTrackingNumber,
  ensurePartnerIdColumn
};