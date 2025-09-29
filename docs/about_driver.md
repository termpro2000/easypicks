# 📊 drivers 테이블 사용 현황 조사 결과

## 🔧 백엔드 (Backend) 사용

### 1. **server-minimal.js** (주요 API 서버)
- **로그인 인증**: `drivers` 테이블에서 `user_id`로 기사 로그인 처리
- **테스트 API**: `/api/test/drivers` - 기사 목록 조회/삭제
- **기사 관리 API**: `/api/drivers` - CRUD 작업
- **디버그 API**: `/api/debug/driver/:user_id` - 특정 기사 검색

### 2. **controllers/driversController.js**
- 기사 관련 모든 비즈니스 로직 처리
- CRUD 작업 전담

### 3. **routes/drivers.js** 
- 기사 관련 라우팅 정의
- 인증 미들웨어 적용

### 4. **routes/test.js**
- 테스트용 기사 데이터 관리

### 5. **migrations/create_drivers_table.sql**
- 데이터베이스 스키마 정의

## 🖥️ 웹 프론트엔드 (Frontend) 사용

### 1. **기사 관리 화면**
- **`DriverManagement.tsx`**: 기사 목록/추가/수정/삭제
- **`DriverForm.tsx`**: 기사 등록 폼
- **`DriverEditForm.tsx`**: 기사 수정 폼

### 2. **기사 배정 화면**
- **`DriverAssignment.tsx`**: 기사에게 배송 주문 배정
- **주요 기능**: 기사 목록 조회, 배정 작업, 현재 담당 배송 수 계산

### 3. **관리자 대시보드**
- **`AdminDashboard.tsx`**: 기사 관리 메뉴 진입점
- **`AdminShippingForm.tsx`**: 배송 등록 시 기사 선택

### 4. **테스트 도구**
- **`TestPage.tsx`**: 기사 데이터 테스트
- **`DriversListModal.tsx`**: 기사 목록 모달
- **배송 관련 모달들**: 기사 정보 표시

### 5. **API 서비스**
- **`api.ts`**: `driversAPI` 객체로 모든 기사 API 호출 처리
  - `getAllDrivers()`: 전체 기사 목록
  - `getDriver(id)`: 특정 기사 조회
  - `createDriver(data)`: 기사 생성
  - `updateDriver(id, data)`: 기사 수정
  - `searchDrivers(term)`: 기사 검색

## 📱 모바일 앱 (expo-mobile) 사용

### 1. **배송 관련 화면**
- **`DeliveryListScreen.js`**: 배송 목록에서 담당 기사 표시
- **`DeliveryDetailScreen.js`**: 배송 상세에서 기사 정보 표시

### 2. **사용자 프로필**
- **`ProfileScreen.js`**: 기사 계정인 경우 프로필 관리

### 3. **로그인 시스템**
- 기사 계정(`dr1`)으로 모바일 앱 로그인 가능

## 🔗 데이터 연결 관계

### 1. **배송(deliveries) 테이블과 연결**
```sql
deliveries.driver_id → drivers.id
```
- 배송 주문에 기사 배정
- 기사별 담당 배송 목록 조회

### 2. **사용자 인증 시스템**
- `drivers.user_id`로 로그인 가능
- `drivers.password`로 인증 처리

### 3. **관리 시스템 연동**
- 웹에서 기사 등록 → 모바일에서 로그인 가능
- 배정 시스템에서 실시간 기사 정보 활용

## 📈 주요 사용 패턴

### 1. **관리자 워크플로우**
1. **기사 등록**: `DriverManagement` → `drivers` 테이블
2. **배송 배정**: `DriverAssignment` → `deliveries.driver_id` 업데이트
3. **모니터링**: 기사별 배송 현황 추적

### 2. **기사 워크플로우**
1. **모바일 로그인**: `drivers.user_id` 인증
2. **배송 확인**: 담당 배송 목록 조회
3. **상태 업데이트**: 배송 진행상황 관리

### 3. **시스템 연동**
- **웹 ↔ API**: RESTful API를 통한 CRUD
- **모바일 ↔ API**: 인증 및 배송 정보 조회
- **실시간 동기화**: 배정 변경사항 즉시 반영

## 🚨 중요 포인트

### 1. **보안 관련**
- 기사 로그인: `drivers` 테이블 독립 인증
- 역할 기반 접근: 기사는 자신의 배송만 조회 가능

### 2. **데이터 일관성**
- 기사 정보 변경 시 모든 화면에서 즉시 반영
- 배정 해제 시 `deliveries.driver_id` NULL 처리

### 3. **확장성**
- 기사 평가 시스템 추가 가능
- 실시간 위치 추적 연동 가능
- 배송 실적 통계 생성 가능

## 📋 API 엔드포인트 상세

### 백엔드 API (server-minimal.js)

#### 기사 관리 API
```bash
GET    /api/drivers                    # 기사 목록 조회
POST   /api/drivers                    # 기사 생성
PUT    /api/drivers/:id                # 기사 수정
DELETE /api/drivers/:id                # 기사 삭제
```

#### 테스트 API
```bash
GET    /api/test/drivers               # 테스트용 기사 목록
DELETE /api/test/drivers               # 테스트용 기사 전체 삭제
```

#### 디버그 API
```bash
GET    /api/debug/driver/:user_id      # 특정 user_id로 기사 검색
GET    /api/schema/drivers             # drivers 테이블 스키마 조회
```

#### 인증 관련
```bash
POST   /api/auth/login                 # 기사 로그인 (user_id/username 지원)
```

### 프론트엔드 API 호출 (driversAPI)

#### 기본 CRUD
```javascript
driversAPI.getAllDrivers()             // 전체 기사 목록
driversAPI.getDriver(id)               // 특정 기사 조회
driversAPI.createDriver(data)          // 기사 생성
driversAPI.updateDriver(id, data)      // 기사 수정
driversAPI.searchDrivers(term)         // 기사 검색
```

## 🗃️ 데이터베이스 스키마

### drivers 테이블 구조
```sql
CREATE TABLE drivers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(50) UNIQUE NOT NULL,     -- 로그인 ID
  password VARCHAR(255) NOT NULL,          -- 비밀번호
  name VARCHAR(100),                       -- 기사 이름
  phone VARCHAR(20),                       -- 전화번호
  email VARCHAR(255),                      -- 이메일
  vehicle_type VARCHAR(100),               -- 차량 유형
  vehicle_number VARCHAR(50),              -- 차량 번호
  cargo_capacity VARCHAR(100),             -- 적재 용량
  delivery_area VARCHAR(255),              -- 배송 지역
  map_preference INT DEFAULT 0,            -- 지도 앱 설정
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 현재 데이터 현황 (2025-09-23 기준)
- **총 레코드**: 6개
- **주요 기사**:
  - `dr1` (김철수기사) - 테스트 계정
  - 업데이트된기사, 테스트기사 등

## 🔄 데이터 플로우

### 1. 기사 등록 플로우
```
웹 관리자 → DriverManagement.tsx → driversAPI.createDriver() 
→ POST /api/drivers → drivers 테이블 INSERT → 즉시 로그인 가능
```

### 2. 기사 배정 플로우
```
웹 관리자 → DriverAssignment.tsx → 기사 선택 → 주문 선택 
→ deliveriesAPI.updateDelivery() → PUT /api/deliveries/:id 
→ deliveries.driver_id 업데이트
```

### 3. 모바일 로그인 플로우
```
모바일 앱 → LoginScreen → user_id/password 입력 
→ POST /api/auth/login → drivers 테이블 검색 → JWT 토큰 발급
```

### 4. 배송 조회 플로우
```
모바일 앱 → DeliveryListScreen → 토큰으로 인증 
→ GET /api/deliveries → driver_id 필터링 → 담당 배송만 표시
```

## 🎯 비즈니스 로직

### 1. 기사 배정 로직
- **자동 배정**: 거리, 기사 상태, 작업량 분석 (미구현)
- **수동 배정**: 관리자가 직접 기사와 주문 매칭
- **배정 취소**: driver_id를 NULL로 설정

### 2. 기사 상태 관리
- **활성/비활성**: is_active 필드로 관리
- **현재 담당 배송**: deliveries 테이블과 JOIN으로 실시간 계산
- **배송 이력**: 과거 담당 배송 통계

### 3. 권한 관리
- **기사 계정**: 자신의 배송만 조회/수정 가능
- **관리자 계정**: 모든 기사 및 배송 관리 가능

## 🚀 향후 확장 계획

### 1. 실시간 기능
- **위치 추적**: GPS 기반 실시간 위치 업데이트
- **상태 알림**: 배송 상태 변경 시 푸시 알림
- **채팅 시스템**: 고객-기사 간 실시간 소통

### 2. 성능 최적화
- **기사 검색**: 이름, 지역, 차량 타입별 인덱스 추가
- **배정 알고리즘**: AI 기반 최적 기사 매칭
- **캐싱**: 자주 조회되는 기사 정보 Redis 캐싱

### 3. 데이터 분석
- **배송 실적**: 기사별 배송 완료율, 평균 시간
- **고객 평가**: 기사 서비스 평점 시스템
- **효율성 분석**: 경로 최적화 및 연료 효율성

이처럼 `drivers` 테이블은 **기사 관리의 핵심**으로, 웹 관리 시스템부터 모바일 앱까지 전체 플랫폼에서 광범위하게 활용되고 있으며, 향후 더욱 확장 가능한 구조로 설계되어 있습니다.