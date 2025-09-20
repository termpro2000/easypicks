-- 배송 정보 테이블
CREATE TABLE IF NOT EXISTS deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- 기본 정보
    request_type VARCHAR(20) DEFAULT '일반',
    status VARCHAR(20) DEFAULT 'pending',
    construction_type VARCHAR(50),
    shipment_type VARCHAR(50),
    visit_date DATE,
    visit_time VARCHAR(50),
    assigned_driver VARCHAR(50),
    furniture_company VARCHAR(100),
    main_memo TEXT,
    emergency_contact VARCHAR(20),
    
    -- 방문지 정보 (고객 정보)
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    
    -- 현장 정보
    building_type VARCHAR(50),
    floor_count VARCHAR(20),
    elevator_available VARCHAR(10),
    ladder_truck VARCHAR(10),
    disposal VARCHAR(10),
    room_movement VARCHAR(10),
    wall_construction VARCHAR(10),
    
    -- 상품 정보
    product_name VARCHAR(200),
    furniture_product_code VARCHAR(100),
    product_weight VARCHAR(20),
    product_size VARCHAR(100),
    box_size VARCHAR(100),
    
    -- 가구사 요청사항 및 기사 메모
    furniture_requests TEXT,
    driver_notes TEXT,
    
    -- 설치 사진 (JSON 형태로 저장)
    installation_photos JSON,
    
    -- 시스템 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 배송 상세 정보 테이블 (기존 호환성 유지)
CREATE TABLE IF NOT EXISTS delivery_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delivery_id INT,
    delivery_fee DECIMAL(10,2),
    special_instructions TEXT,
    delivery_time_preference VARCHAR(100),
    fragile BOOLEAN DEFAULT FALSE,
    insurance_value DECIMAL(10,2),
    cod_amount DECIMAL(10,2),
    driver_id VARCHAR(50),
    driver_name VARCHAR(100),
    estimated_delivery TIMESTAMP,
    actual_delivery TIMESTAMP,
    delivery_attempts INT DEFAULT 0,
    last_location VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 인덱스 추가
CREATE INDEX idx_deliveries_tracking ON deliveries(tracking_number);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_visit_date ON deliveries(visit_date);
CREATE INDEX idx_delivery_details_delivery_id ON delivery_details(delivery_id);