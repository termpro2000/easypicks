-- =================================================================
-- PlanetScale DB 콘솔에서 실행할 컬럼 추가 스크립트
-- 사용자 프로필 폼에서 사용하는 필드들을 users 테이블에 추가
-- =================================================================

-- 1. 비상연락처 (Emergency Contact)
ALTER TABLE users ADD COLUMN emergency_contact VARCHAR(100) NULL COMMENT '비상연락처 이름';

-- 2. 비상연락처 전화번호 (Emergency Phone)  
ALTER TABLE users ADD COLUMN emergency_phone VARCHAR(20) NULL COMMENT '비상연락처 전화번호';

-- 3. 주소 (Address) - 일반 주소 필드
ALTER TABLE users ADD COLUMN address TEXT NULL COMMENT '주소 정보';

-- 4. 메모 (Notes) - 사용자 관련 메모
ALTER TABLE users ADD COLUMN notes TEXT NULL COMMENT '사용자 관련 메모 및 추가 정보';

-- =================================================================
-- 추가된 컬럼 확인을 위한 쿼리
-- =================================================================
DESCRIBE users;

-- 또는 다음 쿼리로 새로 추가된 컬럼들만 확인
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN ('emergency_contact', 'emergency_phone', 'address', 'notes')
ORDER BY ORDINAL_POSITION;