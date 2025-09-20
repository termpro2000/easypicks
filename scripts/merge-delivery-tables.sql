-- delivery_details의 모든 필드를 deliveries 테이블에 추가
-- 기존 데이터 호환성을 위해 ALTER TABLE 사용

ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS special_instructions TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_time_preference VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fragile BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS insurance_value DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cod_amount DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS driver_id VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS driver_name VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS actual_delivery TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_location VARCHAR(200) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS detail_notes TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS customer_signature LONGTEXT DEFAULT NULL;

-- 기존 delivery_details 데이터를 deliveries로 이전
UPDATE deliveries d
LEFT JOIN delivery_details dd ON d.id = dd.delivery_id
SET 
    d.delivery_fee = dd.delivery_fee,
    d.special_instructions = dd.special_instructions,
    d.delivery_time_preference = dd.delivery_time_preference,
    d.fragile = dd.fragile,
    d.insurance_value = dd.insurance_value,
    d.cod_amount = dd.cod_amount,
    d.driver_id = dd.driver_id,
    d.driver_name = dd.driver_name,
    d.estimated_delivery = dd.estimated_delivery,
    d.actual_delivery = dd.actual_delivery,
    d.delivery_attempts = dd.delivery_attempts,
    d.last_location = dd.last_location,
    d.detail_notes = dd.notes
WHERE dd.id IS NOT NULL;

-- 새로운 인덱스 추가 (성능 향상을 위해)
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_estimated_delivery ON deliveries(estimated_delivery);
CREATE INDEX IF NOT EXISTS idx_deliveries_actual_delivery ON deliveries(actual_delivery);

-- delivery_details 테이블은 데이터 이전 후 필요시 삭제 (주석 처리)
-- DROP TABLE delivery_details;