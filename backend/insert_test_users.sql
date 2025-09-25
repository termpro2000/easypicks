-- =================================================================
-- 테스트 사용자 데이터 삽입 스크립트
-- PlanetScale DB 콘솔에서 실행
-- =================================================================

-- 기존 데이터 확인
SELECT COUNT(*) as existing_users FROM users;

-- 테스트 사용자들 삽입
INSERT INTO users (username, password, name, role, is_active, created_at, updated_at) 
VALUES 
('admin', 'admin123', '관리자', 'admin', true, NOW(), NOW()),
('mirae', '123456', '미래파트너', 'user', true, NOW(), NOW()),
('manager', '123456', '매니저', 'user', true, NOW(), NOW()),
('p1', '123456', '파트너1', 'user', true, NOW(), NOW()),
('d1', '123456', '기사1', 'driver', true, NOW(), NOW());

-- 삽입 결과 확인
SELECT id, username, name, role, is_active, created_at 
FROM users 
ORDER BY id DESC;

-- 총 사용자 수 확인
SELECT COUNT(*) as total_users FROM users;

-- 역할별 사용자 수 확인
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;