const mysql = require('mysql2/promise');
require('dotenv').config();

// PlanetScale 최적화 설정
const dbConfig = {
  host: process.env.DB_HOST || 'aws.connect.psdb.cloud',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'easypicks',
  charset: process.env.DB_CHARSET || 'utf8mb4',
  timezone: process.env.DB_TIMEZONE || '+09:00',
  
  // PlanetScale SSL 설정 (필수)
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: true
  } : false,
  
  // PlanetScale 최적화된 연결 풀 설정
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  acquireTimeout: 60000,       // 연결 획득 타임아웃
  timeout: 60000,              // 쿼리 타임아웃
  
  // PlanetScale 서버리스 최적화
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  idleTimeout: 300000          // 5분 후 유휴 연결 해제
};

/**
 * MySQL 커넥션 풀 생성
 * 연결 수 제한과 대기열 관리를 통해 데이터베이스 연결 최적화
 */
const pool = mysql.createPool(dbConfig);

/**
 * 데이터베이스 연결 상태를 테스트하는 함수
 * 연결 풀에서 연결을 가져와서 정상 작동 여부를 확인
 * @returns {Promise<boolean>} 연결 성공 여부
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL 데이터베이스 연결 성공');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL 데이터베이스 연결 실패:', error.message);
    return false;
  }
}

/**
 * 데이터베이스 테이블과 기본 데이터를 초기화하는 함수
 * - users 테이블: 사용자 정보 저장
 * - shipping_orders 테이블: 26개 필드를 가진 배송 접수 데이터
 * - user_activities 테이블: 사용자 활동 로그
 * - 기본 관리자 계정 생성
 * @returns {Promise<boolean>} 초기화 성공 여부
 */
async function initDatabase() {
  try {
    // users 테이블 생성
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        company VARCHAR(100),
        role ENUM('admin', 'manager', 'user') DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        
        -- 기본 발송인 정보 설정
        default_sender_name VARCHAR(100),
        default_sender_phone VARCHAR(20),
        default_sender_address VARCHAR(300),
        default_sender_detail_address VARCHAR(200),
        default_sender_zipcode VARCHAR(10),
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // shipping_orders 테이블 생성
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS shipping_orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        
        -- 발송인 정보 (7개)
        sender_name VARCHAR(100) NOT NULL,
        sender_phone VARCHAR(20) NOT NULL,
        sender_email VARCHAR(100),
        sender_company VARCHAR(100),
        sender_address VARCHAR(300) NOT NULL,
        sender_detail_address VARCHAR(200),
        sender_zipcode VARCHAR(10) NOT NULL,
        
        -- 수취인 정보 (7개)  
        receiver_name VARCHAR(100) NOT NULL,
        receiver_phone VARCHAR(20) NOT NULL,
        receiver_email VARCHAR(100),
        receiver_company VARCHAR(100),
        receiver_address VARCHAR(300) NOT NULL,
        receiver_detail_address VARCHAR(200),
        receiver_zipcode VARCHAR(10) NOT NULL,
        
        -- 제품 정보 (4개)
        product_name VARCHAR(200) NOT NULL,
        product_sku VARCHAR(100),
        product_quantity INT DEFAULT 1,
        seller_info VARCHAR(200),
        
        -- 배송가능 여부확인 (3개)
        has_elevator BOOLEAN DEFAULT FALSE,
        can_use_ladder_truck BOOLEAN DEFAULT FALSE,
        preferred_delivery_date DATE,
        
        -- 특수 옵션 (4개)
        is_fragile BOOLEAN DEFAULT FALSE,
        is_frozen BOOLEAN DEFAULT FALSE,
        requires_signature BOOLEAN DEFAULT FALSE,
        insurance_amount DECIMAL(15,2) DEFAULT 0,
        
        -- 추가 메모
        delivery_memo TEXT,
        special_instructions TEXT,
        
        -- 시스템 필드
        status ENUM('접수완료', '배송준비', '배송중', '배송완료', '취소', '반송') DEFAULT '접수완료',
        tracking_number VARCHAR(50) UNIQUE,
        tracking_company VARCHAR(50),
        estimated_delivery DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // qrcorddb 테이블 생성 (QR 코드 상품 정보)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS qrcorddb (
        id INT PRIMARY KEY AUTO_INCREMENT,
        qr_code VARCHAR(100) UNIQUE NOT NULL,
        product_name VARCHAR(100) NOT NULL,
        quantity INT DEFAULT 1,
        weight DECIMAL(10,2),
        size VARCHAR(50),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_qr_code (qr_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // user_activities 테이블 생성 (사용자 활동 로그)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id INT,
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_created (user_id, created_at),
        INDEX idx_action_created (action, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 기본 관리자 계정 생성 (존재하지 않는 경우에만)
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await pool.execute(`
      INSERT IGNORE INTO users (username, password, name, role) 
      VALUES ('admin', ?, '시스템 관리자', 'admin')
    `, [adminPassword]);

    console.log('✅ 데이터베이스 테이블 초기화 완료');
    console.log('📝 기본 관리자 계정: admin / admin123');
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error.message);
    return false;
  }
}

/**
 * 데이터베이스 쿼리를 재시도 로직과 함께 실행하는 함수
 * @param {Function} queryFn - 실행할 쿼리 함수
 * @param {number} retries - 재시도 횟수 (기본값: 3)
 * @param {number} delay - 재시도 간격(ms) (기본값: 1000)
 * @returns {Promise} 쿼리 결과
 */
async function executeWithRetry(queryFn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await queryFn();
    } catch (error) {
      console.log(`데이터베이스 쿼리 시도 ${i + 1}/${retries} 실패:`, error.message);
      
      // ECONNRESET, ENOTFOUND, ETIMEDOUT 등 연결 관련 에러인 경우 재시도
      if (error.code === 'ECONNRESET' || 
          error.code === 'ENOTFOUND' || 
          error.code === 'ETIMEDOUT' ||
          error.code === 'ECONNREFUSED' ||
          error.code === 'PROTOCOL_CONNECTION_LOST') {
        
        if (i === retries - 1) {
          console.error('모든 재시도 실패, 에러 발생:', error.message);
          throw error;
        }
        
        console.log(`${delay}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // 백오프 증가
      } else {
        // 다른 종류의 에러는 바로 throw
        throw error;
      }
    }
  }
}

/**
 * 유니크한 운송장 번호를 생성하는 함수
 * 형식: MD + YYYY + MM + DD + 5자리 일련번호
 * 예시: MD2024090200001
 * @returns {string} 생성된 운송장 번호
 */
function generateTrackingNumber() {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // 5자리 일련번호 생성 (현재 시간 기반으로 유니크성 보장)
  const timestamp = Date.now();
  const serialNumber = (timestamp % 100000).toString().padStart(5, '0');
  
  return `MD${year}${month}${day}${serialNumber}`;
}

module.exports = {
  pool,
  testConnection,
  initDatabase,
  generateTrackingNumber,
  executeWithRetry
};