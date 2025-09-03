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

async function createDeliveriesTable() {
  let connection;
  
  try {
    console.log('🚀 Deliveries 테이블 생성 시작...');
    
    // PlanetScale 연결
    connection = await mysql.createConnection(planetscaleConfig);
    console.log('✅ PlanetScale 연결 성공');
    
    // Deliveries 테이블 생성 (41개 필드)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS deliveries (
        -- 기본 필드 (9개)
        id INT PRIMARY KEY AUTO_INCREMENT,
        tracking_number VARCHAR(50) UNIQUE NOT NULL,
        sender_name VARCHAR(100) NOT NULL,
        sender_addr VARCHAR(300) NOT NULL,
        receiver_name VARCHAR(100) NOT NULL,
        receiver_addr VARCHAR(300) NOT NULL,
        receiver_phone VARCHAR(20) NOT NULL,
        package_type VARCHAR(50),
        weight DECIMAL(10,2),
        status ENUM('pending', 'in_transit', 'delivered', 'cancelled') DEFAULT 'pending',
        assigned_drv_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- 확장 필드 (27개) - ERD 문서 기준
        request_type VARCHAR(100),
        construction_type VARCHAR(100),
        shipment_type VARCHAR(100),
        visit_date DATE,
        visit_time TIME,
        assigned_driver VARCHAR(100),
        furniture_company VARCHAR(200),
        main_memo TEXT,
        emergency_contact VARCHAR(100),
        customer_name VARCHAR(100),
        customer_phone VARCHAR(20),
        customer_address VARCHAR(300),
        building_type VARCHAR(100),
        floor_count INT,
        elevator_available BOOLEAN,
        ladder_truck BOOLEAN,
        disposal BOOLEAN,
        room_movement BOOLEAN,
        wall_construction BOOLEAN,
        product_name VARCHAR(200),
        furniture_product_code VARCHAR(100),
        product_weight DECIMAL(10,2),
        product_size VARCHAR(100),
        box_size VARCHAR(100),
        furniture_requests TEXT,
        driver_notes TEXT,
        installation_photos JSON,
        customer_signature LONGTEXT,
        
        -- 인덱스
        INDEX idx_tracking_number (tracking_number),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        INDEX idx_assigned_drv_id (assigned_drv_id)
      ) ENGINE=InnoDB
    `);
    console.log('✅ deliveries 테이블 생성 완료');
    
    // delivery_details 테이블 생성 (배송 상세 로그)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS delivery_details (
        id INT PRIMARY KEY AUTO_INCREMENT,
        delivery_id INT NOT NULL,
        detail_type VARCHAR(50) NOT NULL,
        detail_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_delivery_id (delivery_id),
        INDEX idx_detail_type (detail_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB
    `);
    console.log('✅ delivery_details 테이블 생성 완료');
    
    // driver_id 테이블 생성 (운전기사 정보)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS driver_id (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        delivery_area VARCHAR(200),
        vehicle_type VARCHAR(100),
        vehicle_number VARCHAR(50),
        cargo_capacity DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user_id (user_id),
        INDEX idx_delivery_area (delivery_area)
      ) ENGINE=InnoDB
    `);
    console.log('✅ driver_id 테이블 생성 완료');
    
    console.log('🎉 모든 테이블 생성 완료!');
    console.log('📊 생성된 테이블:');
    console.log('   - deliveries: 41개 필드 (기본 정보 + 확장 필드)');
    console.log('   - delivery_details: 배송 상세 로그');
    console.log('   - driver_id: 운전기사 정보');
    
  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDeliveriesTable();