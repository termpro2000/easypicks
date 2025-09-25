-- =================================================================
-- Users 테이블 구조 변경 스크립트 (기본 필드만 유지)
-- PlanetScale DB 콘솔에서 실행
-- =================================================================

-- 1. 기존 users 테이블 백업 생성 (권장)
CREATE TABLE users_backup_old AS SELECT * FROM users;

-- 2. 기본 필드만 유지하는 새 users 테이블 생성
CREATE TABLE users_new (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    role ENUM('admin', 'user', 'driver') DEFAULT 'user' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- 3. 기존 데이터를 새 테이블로 이전 (기본 필드만)
INSERT INTO users_new (
    id, username, password, name, phone, email, role, is_active, 
    last_login, created_at, updated_at
)
SELECT 
    id, username, password, name, phone, email, role, is_active,
    last_login, created_at, updated_at
FROM users;

-- 4. 기존 테이블을 임시 이름으로 변경
RENAME TABLE users TO users_old;

-- 5. 새 테이블을 users로 변경
RENAME TABLE users_new TO users;

-- =================================================================
-- 확인 쿼리
-- =================================================================

-- 새 테이블 구조 확인
DESCRIBE users;

-- 데이터 개수 확인
SELECT COUNT(*) as total_users FROM users;

-- 샘플 데이터 확인 
SELECT id, username, name, role, is_active, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- =================================================================
-- 롤백 방법 (필요시)
-- =================================================================
-- 문제가 있을 경우 아래 명령으로 롤백 가능:
-- DROP TABLE users;
-- RENAME TABLE users_old TO users;

-- =================================================================
-- 정리 (성공 확인 후)
-- =================================================================
-- 백업 테이블 제거 (성공 확인 후에만 실행):
-- DROP TABLE users_backup_old;
-- DROP TABLE users_old;