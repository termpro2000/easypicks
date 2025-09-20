-- 운전자 필드 정리 스크립트
-- drivers 테이블은 존재하지 않으므로, 기존 운전자 관련 필드들을 driver_id로 통일

-- 1. deliveries 테이블 구조 정리
-- assigned_driver (문자열) 필드를 driver_id (INT)로 변경하여 users 테이블과 연결

-- 현재 assigned_driver 문자열 데이터를 users 테이블의 ID로 매핑하기 위한 임시 작업
-- (실제 데이터가 있다면 수동으로 매핑 필요)

-- 1-1. 새로운 driver_id 컬럼 추가 (이미 assigned_driver_id가 있다면 이를 활용)
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS driver_id INT DEFAULT NULL,
ADD INDEX IF NOT EXISTS idx_deliveries_driver_id (driver_id);

-- 1-2. 기존 assigned_driver_id 데이터를 driver_id로 복사
UPDATE deliveries 
SET driver_id = assigned_driver_id 
WHERE assigned_driver_id IS NOT NULL;

-- 1-3. assigned_driver_id 컬럼 제거 (driver_id로 통일)
ALTER TABLE deliveries 
DROP COLUMN IF EXISTS assigned_driver_id;

-- 1-4. driver_id에 외래키 제약조건 추가
ALTER TABLE deliveries 
ADD CONSTRAINT fk_deliveries_driver_id 
FOREIGN KEY (driver_id) REFERENCES users(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. delivery_details 테이블 정리
-- driver_id를 INT로 변경하고 users 테이블과 연결

-- 2-1. 새로운 driver_user_id 컬럼 추가
ALTER TABLE delivery_details 
ADD COLUMN IF NOT EXISTS driver_user_id INT DEFAULT NULL,
ADD INDEX IF NOT EXISTS idx_delivery_details_driver_user_id (driver_user_id);

-- 2-2. 기존 driver_id (문자열)를 기반으로 users 테이블에서 매핑
-- 실제 환경에서는 driver_id 문자열과 users 테이블의 user_id나 name을 매핑해야 함
-- 예시: UPDATE delivery_details dd 
--       JOIN users u ON dd.driver_id = u.user_id 
--       SET dd.driver_user_id = u.id;

-- 2-3. 기존 문자열 driver_id, driver_name 컬럼 제거
ALTER TABLE delivery_details 
DROP COLUMN IF EXISTS driver_id,
DROP COLUMN IF EXISTS driver_name;

-- 2-4. driver_user_id를 driver_id로 이름 변경
ALTER TABLE delivery_details 
CHANGE COLUMN driver_user_id driver_id INT DEFAULT NULL;

-- 2-5. driver_id에 외래키 제약조건 추가
ALTER TABLE delivery_details 
ADD CONSTRAINT fk_delivery_details_driver_id 
FOREIGN KEY (driver_id) REFERENCES users(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. deliveries 테이블에서 assigned_driver (문자열) 컬럼 제거
-- driver_id로 통일되었으므로 불필요한 assigned_driver 컬럼 제거
ALTER TABLE deliveries 
DROP COLUMN IF EXISTS assigned_driver;

-- 4. 정리된 구조 확인을 위한 뷰 생성
CREATE OR REPLACE VIEW delivery_with_driver AS
SELECT 
    d.*,
    u.name as driver_name,
    u.user_id as driver_user_id,
    u.phone as driver_phone
FROM deliveries d
LEFT JOIN users u ON d.driver_id = u.id;

-- 5. 인덱스 최적화
-- 기존 인덱스 정리 및 새로운 인덱스 추가
DROP INDEX IF EXISTS idx_deliveries_assigned_driver ON deliveries;
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_details_driver_id ON delivery_details(driver_id);

-- 변경 내용 요약:
-- 1. deliveries.assigned_driver_id → deliveries.driver_id (users.id 참조)
-- 2. deliveries.assigned_driver (문자열) → 제거 (driver_id로 대체)
-- 3. delivery_details.driver_id (문자열) → delivery_details.driver_id (INT, users.id 참조)
-- 4. delivery_details.driver_name → 제거 (조인으로 users.name 사용)
-- 5. 모든 driver_id 필드가 users 테이블의 id를 참조하도록 통일