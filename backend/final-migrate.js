const mysql = require('mysql2/promise');
const fs = require('fs');

async function migrateToPlanetScale() {
  let connection;
  
  try {
    console.log('🚀 PlanetScale 마이그레이션 시작...');
    
    // 연결 설정
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'aws.connect.psdb.cloud',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: true }
    });
    console.log('✅ PlanetScale 연결 성공');
    
    // 기존 테이블 삭제
    await connection.execute('DROP TABLE IF EXISTS user_activities');
    await connection.execute('DROP TABLE IF EXISTS shipping_orders');  
    await connection.execute('DROP TABLE IF EXISTS users');
    console.log('🧹 기존 테이블 정리 완료');
    
    // 테이블 생성
    await connection.execute(`CREATE TABLE users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(20),
      company VARCHAR(100),
      role ENUM('admin', 'manager', 'user') DEFAULT 'user',
      is_active BOOLEAN DEFAULT TRUE,
      default_sender_name VARCHAR(100),
      default_sender_company VARCHAR(100),
      default_sender_phone VARCHAR(20),
      default_sender_address VARCHAR(300),
      default_sender_detail_address VARCHAR(200),
      default_sender_zipcode VARCHAR(10),
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    
    await connection.execute(`CREATE TABLE shipping_orders (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      sender_name VARCHAR(100) NOT NULL,
      sender_phone VARCHAR(20) NOT NULL,
      sender_email VARCHAR(100),
      sender_company VARCHAR(100),
      sender_address VARCHAR(300) NOT NULL,
      sender_detail_address VARCHAR(200),
      sender_zipcode VARCHAR(10) NOT NULL,
      receiver_name VARCHAR(100) NOT NULL,
      receiver_phone VARCHAR(20) NOT NULL,
      receiver_email VARCHAR(100),
      receiver_company VARCHAR(100),
      receiver_address VARCHAR(300) NOT NULL,
      receiver_detail_address VARCHAR(200),
      receiver_zipcode VARCHAR(10) NOT NULL,
      product_name VARCHAR(200) NOT NULL,
      product_sku VARCHAR(100),
      product_quantity INT DEFAULT 1,
      seller_info VARCHAR(200),
      has_elevator BOOLEAN DEFAULT FALSE,
      can_use_ladder_truck BOOLEAN DEFAULT FALSE,
      preferred_delivery_date DATE,
      is_fragile BOOLEAN DEFAULT FALSE,
      is_frozen BOOLEAN DEFAULT FALSE,
      requires_signature BOOLEAN DEFAULT FALSE,
      insurance_amount DECIMAL(15,2) DEFAULT 0,
      delivery_memo TEXT,
      special_instructions TEXT,
      status ENUM('접수완료', '배송준비', '배송중', '배송완료', '취소', '반송') DEFAULT '접수완료',
      tracking_number VARCHAR(50) UNIQUE,
      tracking_company VARCHAR(50),
      estimated_delivery DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id)
    )`);
    
    await connection.execute(`CREATE TABLE user_activities (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(50),
      target_id INT,
      details JSON,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id)
    )`);
    
    console.log('✅ 테이블 생성 완료');
    
    // 백업 데이터 로드
    const backup = JSON.parse(fs.readFileSync('gabia_backup.json', 'utf8'));
    console.log('📂 백업 파일 로드 완료');
    
    // 날짜 포맷 함수
    const formatDateTime = (dateStr) => {
      if (!dateStr) return null;
      return new Date(dateStr).toISOString().slice(0, 19).replace('T', ' ');
    };
    
    const formatDate = (dateStr) => {
      if (!dateStr) return null;
      return new Date(dateStr).toISOString().slice(0, 10);
    };
    
    // 사용자 데이터 마이그레이션
    console.log(`👥 사용자 데이터 마이그레이션 중... (${backup.users.length}개)`);
    for (const user of backup.users) {
      await connection.execute(
        'INSERT INTO users (id, username, password, name, email, phone, company, role, is_active, default_sender_name, default_sender_company, default_sender_phone, default_sender_address, default_sender_detail_address, default_sender_zipcode, last_login, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.username, user.password, user.name, user.email, user.phone, user.company, user.role, user.is_active, user.default_sender_name, user.default_sender_company, user.default_sender_phone, user.default_sender_address, user.default_sender_detail_address, user.default_sender_zipcode, formatDateTime(user.last_login), formatDateTime(user.created_at), formatDateTime(user.updated_at)]
      );
    }
    console.log('✅ 사용자 데이터 마이그레이션 완료');
    
    // undefined를 null로 변환하는 함수
    const nullify = (value) => value === undefined ? null : value;
    
    // 배송 주문 데이터 마이그레이션
    console.log(`📦 배송 주문 데이터 마이그레이션 중... (${backup.shipping_orders.length}개)`);
    for (const order of backup.shipping_orders) {
      // 기존 데이터 구조를 새로운 구조로 매핑
      const productName = order.product_name || order.package_type || '일반 상품';
      const productSku = order.product_sku || null;
      const productQuantity = order.product_quantity || 1;
      
      await connection.execute(
        'INSERT INTO shipping_orders (id, user_id, sender_name, sender_phone, sender_email, sender_company, sender_address, sender_detail_address, sender_zipcode, receiver_name, receiver_phone, receiver_email, receiver_company, receiver_address, receiver_detail_address, receiver_zipcode, product_name, product_sku, product_quantity, seller_info, has_elevator, can_use_ladder_truck, preferred_delivery_date, is_fragile, is_frozen, requires_signature, insurance_amount, delivery_memo, special_instructions, status, tracking_number, tracking_company, estimated_delivery, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [nullify(order.id), nullify(order.user_id), nullify(order.sender_name), nullify(order.sender_phone), nullify(order.sender_email), nullify(order.sender_company), nullify(order.sender_address), nullify(order.sender_detail_address), nullify(order.sender_zipcode), nullify(order.receiver_name), nullify(order.receiver_phone), nullify(order.receiver_email), nullify(order.receiver_company), nullify(order.receiver_address), nullify(order.receiver_detail_address), nullify(order.receiver_zipcode), productName, productSku, productQuantity, nullify(order.seller_info), nullify(order.has_elevator), nullify(order.can_use_ladder_truck), formatDate(order.preferred_delivery_date), nullify(order.is_fragile), nullify(order.is_frozen), nullify(order.requires_signature), nullify(order.insurance_amount), nullify(order.delivery_memo), nullify(order.special_instructions), nullify(order.status), nullify(order.tracking_number), nullify(order.tracking_company), formatDate(order.estimated_delivery), formatDateTime(order.created_at), formatDateTime(order.updated_at)]
      );
    }
    console.log('✅ 배송 주문 데이터 마이그레이션 완료');
    
    // 사용자 활동 데이터 마이그레이션
    console.log(`📊 사용자 활동 데이터 마이그레이션 중... (${backup.user_activities.length}개)`);
    for (const activity of backup.user_activities) {
      await connection.execute(
        'INSERT INTO user_activities (id, user_id, action, target_type, target_id, details, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [activity.id, activity.user_id, activity.action, activity.target_type, activity.target_id, activity.details, activity.ip_address, activity.user_agent, formatDateTime(activity.created_at)]
      );
    }
    console.log('✅ 사용자 활동 데이터 마이그레이션 완료');
    
    console.log('🎉 PlanetScale 마이그레이션 완료!');
    console.log('📊 마이그레이션된 데이터:');
    console.log(`   - 사용자: ${backup.users.length}개`);
    console.log(`   - 배송 주문: ${backup.shipping_orders.length}개`);
    console.log(`   - 사용자 활동: ${backup.user_activities.length}개`);
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrateToPlanetScale();