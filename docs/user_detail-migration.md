# User Detail Table Migration Guide

## 개요
drivers 테이블을 user_detail 테이블로 변경하는 마이그레이션 가이드입니다.

## 변경 사항
- **기존**: `drivers` 테이블 (드라이버 전용)
- **변경**: `user_detail` 테이블 (모든 사용자 역할별 상세정보 저장)

## user_detail 테이블 구조

### 테이블 스키마
- `id` (AUTO_INCREMENT PRIMARY KEY) - 자동 증가 ID
- `user_id` (INT NOT NULL) - users 테이블 ID와 연동 (Foreign Key)
- `role` (ENUM) - 사용자 역할 ('admin', 'manager', 'user', 'driver')
- `detail` (JSON) - 역할별 상세정보를 JSON 형식으로 저장
- `created_at` - 생성일시
- `updated_at` - 수정일시

### 제약조건
- Foreign Key: `user_id` → `users.id`
- Unique Key: 한 사용자당 하나의 상세정보만 허용

## Role별 Detail JSON 구조

### Admin Role
```json
{
  "address": "서울시 강남구 테헤란로 123",
  "detail_address": "456호",
  "zipcode": "06234",
  "memo": "시스템 관리자 메모"
}
```

### Manager Role  
```json
{
  "address": "서울시 서초구 반포대로 567",
  "detail_address": "12층 1201호", 
  "zipcode": "06789",
  "memo": "배송 관리 매니저 메모"
}
```

### User Role (파트너사/발송업체)
```json
{
  "sender_name": "미래가구",
  "sender_company": "미래가구 주식회사",
  "sender_address": "경기도 성남시 분당구 정자일로 95",
  "sender_detail_address": "네이버 그린팩토리 6층",
  "emergency_contact_name": "김담당자", 
  "emergency_contact_phone": "010-1234-5678"
}
```

### Driver Role (기존 drivers 테이블 데이터)
```json
{
  "name": "홍길동",
  "phone": "010-9876-5432",
  "email": "driver@example.com",
  "vehicle_type": "1톤 트럭",
  "vehicle_number": "12가3456",
  "cargo_capacity": "1000kg",
  "delivery_area": "서울, 경기 남부"
}
```

## 마이그레이션 SQL 스크립트

```sql
-- 1. 기존 drivers 테이블 백업 (선택사항)
CREATE TABLE drivers_backup AS SELECT * FROM drivers;

-- 2. 새로운 user_detail 테이블 생성
CREATE TABLE user_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role ENUM('admin', 'manager', 'user', 'driver') NOT NULL,
    detail JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 외래키 제약조건
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 인덱스
    INDEX idx_user_id (user_id),
    INDEX idx_role (role),
    
    -- 유니크 제약조건 (한 사용자당 하나의 상세정보)
    UNIQUE KEY unique_user_detail (user_id)
);

-- 3. 기존 drivers 데이터를 user_detail로 마이그레이션 (drivers 테이블에 데이터가 있는 경우)
INSERT INTO user_detail (user_id, role, detail)
SELECT 
    user_id,
    'driver' as role,
    JSON_OBJECT(
        'name', name,
        'phone', phone,
        'email', email,
        'vehicle_type', vehicle_type,
        'vehicle_number', vehicle_number,
        'cargo_capacity', cargo_capacity,
        'delivery_area', delivery_area
    ) as detail
FROM drivers
WHERE user_id IS NOT NULL;

-- 4. 각 role별 샘플 데이터 예시

-- admin role 샘플
INSERT INTO user_detail (user_id, role, detail) VALUES 
(1, 'admin', JSON_OBJECT(
    'address', '서울시 강남구 테헤란로 123',
    'detail_address', '456호',
    'zipcode', '06234',
    'memo', '시스템 관리자 계정'
));

-- manager role 샘플
INSERT INTO user_detail (user_id, role, detail) VALUES 
(2, 'manager', JSON_OBJECT(
    'address', '서울시 서초구 반포대로 567',
    'detail_address', '12층 1201호',
    'zipcode', '06789',
    'memo', '배송 관리 매니저'
));

-- user role 샘플 (파트너사/발송업체)
INSERT INTO user_detail (user_id, role, detail) VALUES 
(3, 'user', JSON_OBJECT(
    'sender_name', '미래가구',
    'sender_company', '미래가구 주식회사',
    'sender_address', '경기도 성남시 분당구 정자일로 95',
    'sender_detail_address', '네이버 그린팩토리 6층',
    'emergency_contact_name', '김담당자',
    'emergency_contact_phone', '010-1234-5678'
));

-- 5. drivers 테이블 삭제 (백업 후 실행)
-- DROP TABLE drivers;

-- 6. user_detail 테이블 구조 확인
DESCRIBE user_detail;

-- 7. 데이터 확인 쿼리
SELECT 
    ud.id,
    ud.user_id,
    u.username,
    u.name,
    ud.role,
    JSON_PRETTY(ud.detail) as detail_formatted,
    ud.created_at
FROM user_detail ud
JOIN users u ON ud.user_id = u.id
ORDER BY ud.id;
```

## 실행 순서

1. **백업**: `drivers_backup` 테이블 생성으로 기존 데이터 보존
2. **테이블 생성**: `user_detail` 테이블 생성
3. **데이터 마이그레이션**: 기존 drivers 데이터를 JSON 형식으로 변환하여 이전
4. **샘플 데이터**: 각 role별 샘플 데이터 추가
5. **검증**: 데이터 확인 쿼리 실행으로 마이그레이션 결과 확인
6. **정리**: 확인 후 기존 drivers 테이블 삭제

## 주의사항

- 마이그레이션 전 반드시 데이터베이스 백업을 수행하세요
- 각 단계별로 실행 결과를 확인한 후 다음 단계로 진행하세요
- drivers 테이블 삭제는 마이그레이션 검증 완료 후 실행하세요
- JSON 데이터 형식은 역할별로 일관성을 유지해야 합니다

## 마이그레이션 후 코드 변경사항

마이그레이션 완료 후 다음 코드들의 수정이 필요합니다:

### Backend API
- `routes/drivers.js` → `routes/user-detail.js`로 변경
- `controllers/driversController.js` → `controllers/userDetailController.js`로 변경
- JSON 필드 접근 방식으로 코드 수정

### Frontend
- `driversAPI` → `userDetailAPI`로 변경
- 컴포넌트들의 API 호출 부분 수정
- JSON 데이터 구조에 맞춘 폼 및 표시 로직 수정

---

**작성일**: 2025-09-26  
**상태**: 마이그레이션 준비 완료  
**테스트**: 개발 환경에서 테스트 후 운영 환경 적용 권장