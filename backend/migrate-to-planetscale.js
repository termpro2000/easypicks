const mysql = require('mysql2/promise');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// PlanetScale 연결 설정
const planetscaleConfig = {
  host: process.env.DB_HOST || 'aws.connect.psdb.cloud',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  timezone: '+09:00',
  ssl: {
    rejectUnauthorized: true
  }
};

async function migrateToPlanetScale() {
  let connection;
  
  try {
    console.log('🚀 PlanetScale 마이그레이션 시작...');
    
    // PlanetScale 연결
    connection = await mysql.createConnection(planetscaleConfig);
    console.log('✅ PlanetScale 연결 성공');
    
    // 백업 파일 읽기
    if (!fs.existsSync('gabia_backup.json')) {
      throw new Error('백업 파일을 찾을 수 없습니다. 먼저 백업을 실행하세요.');
    }
    
    const backup = JSON.parse(fs.readFileSync('gabia_backup.json', 'utf8'));
    console.log('📂 백업 파일 로드 완료');
    
    // 테이블 생성
    await createTables(connection);
    
    // 데이터 마이그레이션
    await migrateUsers(connection, backup.users);
    await migrateShippingOrders(connection, backup.shipping_orders);
    await migrateUserActivities(connection, backup.user_activities);
    
    console.log('🎉 마이그레이션 완료!');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createTables(connection) {
  console.log('📋 테이블 생성 중...');
  
  // Users 테이블
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(20),
      company VARCHAR(100),
      role ENUM('admin', 'manager', 'user') DEFAULT 'user',
      is_active BOOLEAN DEFAULT TRUE,
      
      -- 기본 발송인 정보 설정
      default_sender_name VARCHAR(100),
      default_sender_company VARCHAR(100),
      default_sender_phone VARCHAR(20),
      default_sender_address VARCHAR(300),
      default_sender_detail_address VARCHAR(200),
      default_sender_zipcode VARCHAR(10),
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  
  // Shipping orders 테이블
  await connection.execute(`
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
      
      -- FOREIGN KEY (user_id) REFERENCES users(id) -- PlanetScale는 외래키 제약조건 미지원
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  
  // User activities 테이블
  await connection.execute(`
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
      
      -- FOREIGN KEY (user_id) REFERENCES users(id) -- PlanetScale는 외래키 제약조건 미지원
      INDEX idx_user_id (user_id) ON DELETE CASCADE,
      INDEX idx_user_created (user_id, created_at),
      INDEX idx_action_created (action, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  
  console.log('✅ 테이블 생성 완료');
}

async function migrateUsers(connection, users) {
  console.log(`👥 사용자 데이터 마이그레이션 중... (${users.length}개)`);
  
  for (const user of users) {
    await connection.execute(`
      INSERT INTO users (
        id, username, password, name, email, phone, company, role, is_active,
        default_sender_name, default_sender_company, default_sender_phone, 
        default_sender_address, default_sender_detail_address, default_sender_zipcode,
        last_login, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user.id, user.username, user.password, user.name, user.email, user.phone, user.company, user.role, user.is_active,
      user.default_sender_name, user.default_sender_company, user.default_sender_phone,
      user.default_sender_address, user.default_sender_detail_address, user.default_sender_zipcode,
      user.last_login, user.created_at, user.updated_at
    ]);
  }
  
  console.log('✅ 사용자 데이터 마이그레이션 완료');
}

async function migrateShippingOrders(connection, orders) {
  console.log(`📦 배송 주문 데이터 마이그레이션 중... (${orders.length}개)`);
  
  for (const order of orders) {
    await connection.execute(`
      INSERT INTO shipping_orders (
        id, user_id, sender_name, sender_phone, sender_email, sender_company, sender_address, sender_detail_address, sender_zipcode,
        receiver_name, receiver_phone, receiver_email, receiver_company, receiver_address, receiver_detail_address, receiver_zipcode,
        product_name, product_sku, product_quantity, seller_info,
        has_elevator, can_use_ladder_truck, preferred_delivery_date,
        is_fragile, is_frozen, requires_signature, insurance_amount,
        delivery_memo, special_instructions, status, tracking_number, tracking_company, estimated_delivery,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      order.id, order.user_id, order.sender_name, order.sender_phone, order.sender_email, order.sender_company, 
      order.sender_address, order.sender_detail_address, order.sender_zipcode,
      order.receiver_name, order.receiver_phone, order.receiver_email, order.receiver_company,
      order.receiver_address, order.receiver_detail_address, order.receiver_zipcode,
      order.product_name, order.product_sku, order.product_quantity, order.seller_info,
      order.has_elevator, order.can_use_ladder_truck, order.preferred_delivery_date,
      order.is_fragile, order.is_frozen, order.requires_signature, order.insurance_amount,
      order.delivery_memo, order.special_instructions, order.status, order.tracking_number, order.tracking_company, order.estimated_delivery,
      order.created_at, order.updated_at
    ]);
  }
  
  console.log('✅ 배송 주문 데이터 마이그레이션 완료');
}

async function migrateUserActivities(connection, activities) {
  console.log(`📊 사용자 활동 데이터 마이그레이션 중... (${activities.length}개)`);
  
  for (const activity of activities) {
    await connection.execute(`
      INSERT INTO user_activities (
        id, user_id, action, target_type, target_id, details, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      activity.id, activity.user_id, activity.action, activity.target_type, activity.target_id,
      activity.details, activity.ip_address, activity.user_agent, activity.created_at
    ]);
  }
  
  console.log('✅ 사용자 활동 데이터 마이그레이션 완료');
}

// 연결 정보 확인
console.log('🔧 PlanetScale 연결 정보 확인...');
console.log('Host:', planetscaleConfig.host);
console.log('Database:', planetscaleConfig.database);
console.log('User:', planetscaleConfig.user);

migrateToPlanetScale();