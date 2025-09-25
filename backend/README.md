# 배송 관리 시스템 백엔드 API

## 📋 프로젝트 개요

가구 배송 관리를 위한 Node.js/Express 백엔드 API 서버입니다. Railway 플랫폼에 배포되어 있으며, PlanetScale MySQL 데이터베이스를 사용합니다.

## 🚀 배포 정보

- **서버 URL**: `https://efficient-abundance-production-d603.up.railway.app`
- **플랫폼**: Railway (자동 배포)
- **데이터베이스**: PlanetScale MySQL
- **배포 방식**: GitHub 연동 자동 배포

## 📊 데이터베이스 스키마

### 주요 테이블

#### 1. `deliveries` (배송 정보)
메인 배송 테이블로 52개 필드를 지원합니다:
- 기본 정보: `id`, `tracking_number`, `sender_name`, `customer_name`
- 배송 정보: `visit_date`, `visit_time`, `status`, `driver_id`
- 제품 정보: `product_name`, `product_weight`, `product_size`, `box_size`
- 건물 정보: `building_type`, `floor_count`, `elevator_available`
- 비용 정보: `delivery_fee`, `insurance_value`, `cod_amount`

#### 2. `delivery_details` (배송 상세 정보) ⭐
**멀티-제품 저장을 위한 Key-Value 테이블**:
- `id`: 고유 ID
- `delivery_id`: 배송 ID (외래키)
- `detail_type`: 데이터 타입 ('product', 'note', 'photo' 등)
- `detail_value`: JSON 형태의 데이터 값
- `created_at`, `updated_at`: 생성/수정 시간

**제품 정보 저장 방식**:
```json
{
  "product_code": "PROD001",
  "product_name": "소파 3인용",
  "product_weight": "50kg",
  "product_size": "2000x800x800mm",
  "box_size": "2100x900x900mm"
}
```

#### 3. 사용자 관리 테이블

**users** (사용자 정보) - 통합 사용자 관리
- **역할 정의 (role)**:
  - `admin`: 관리자 - 모든 시스템 기능 접근 권한
  - `manager`: 매니저 - 제한된 관리 기능 접근 권한  
  - `user`: 파트너사 - 배송 접수 및 자체 데이터 관리
  - `driver`: 기사 - 배송 수행 및 상태 업데이트
- **주요 필드**: username, password, name, email, phone, company, role, is_active
- **파트너사 전용**: default_sender_* 필드들로 기본 발송인 정보 저장

#### 4. 기타 테이블
- `drivers`: 기사 정보 (추가 상세 정보)
- `products`: 제품 마스터
- `delivery_photos`: 배송 사진
- `user_activities`: 사용자 활동 로그

## 🔧 멀티-제품 관리 API

### delivery_details 테이블 활용 방식

PlanetScale의 DDL 권한 제한으로 인해 별도의 `delivery_products` 테이블 대신 기존 `delivery_details` 테이블을 활용합니다.

### API 엔드포인트

#### 1. 제품 추가/수정
```bash
POST /api/deliveries/:deliveryId/products
Content-Type: application/json

{
  "products": [
    {
      "product_code": "PROD001",
      "product_name": "소파 3인용",
      "product_weight": "50kg",
      "product_size": "2000x800x800mm", 
      "box_size": "2100x900x900mm"
    },
    {
      "product_code": "PROD002",
      "product_name": "침대 더블",
      "product_weight": "75kg",
      "product_size": "2000x1500x400mm",
      "box_size": "2100x1600x500mm"
    }
  ]
}
```

**응답**:
```json
{
  "success": true,
  "message": "2개의 제품이 성공적으로 추가되었습니다.",
  "delivery_id": "1",
  "products_added": 2
}
```

#### 2. 제품 목록 조회
```bash
GET /api/deliveries/:deliveryId/products
```

**응답**:
```json
{
  "success": true,
  "delivery_id": "1",
  "products": [
    {
      "id": 1,
      "product_code": "PROD001",
      "product_name": "소파 3인용",
      "product_weight": "50kg",
      "product_size": "2000x800x800mm",
      "box_size": "2100x900x900mm",
      "created_at": "2025-09-24T12:00:00.000Z",
      "updated_at": "2025-09-24T12:00:00.000Z"
    }
  ],
  "total_count": 1
}
```

#### 3. 제품 삭제
```bash
DELETE /api/deliveries/:deliveryId/products/:productId
```

#### 4. 테스트용 샘플 데이터 추가
```bash
POST /api/debug/add-sample-products/:deliveryId
```

## 📝 사용 예시

### 1. 샘플 제품 데이터 추가
```bash
curl -X POST "https://efficient-abundance-production-d603.up.railway.app/api/debug/add-sample-products/1" \
  -H "Content-Type: application/json"
```

### 2. 제품 목록 조회
```bash
curl -X GET "https://efficient-abundance-production-d603.up.railway.app/api/deliveries/1/products" \
  -H "Content-Type: application/json"
```

### 3. 새로운 제품 추가
```bash
curl -X POST "https://efficient-abundance-production-d603.up.railway.app/api/deliveries/1/products" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "product_code": "CUSTOM001",
        "product_name": "맞춤 제품",
        "product_weight": "25kg",
        "product_size": "1000x500x300mm",
        "box_size": "1100x600x400mm"
      }
    ]
  }'
```

## 🛠️ 기술적 구현 세부사항

### 데이터 저장 구조
```sql
-- delivery_details 테이블 구조
INSERT INTO delivery_details (
  delivery_id,     -- 배송 ID
  detail_type,     -- 'product' (고정값)
  detail_value,    -- JSON 형태의 제품 정보
  created_at,
  updated_at
) VALUES (
  1,
  'product', 
  '{"product_code":"PROD001","product_name":"소파","product_weight":"50kg"}',
  NOW(),
  NOW()
);
```

### JSON 데이터 구조
```typescript
interface ProductData {
  product_code: string;      // 필수: 제품 코드
  product_name?: string;     // 선택: 제품명
  product_weight?: string;   // 선택: 제품 무게
  product_size?: string;     // 선택: 제품 크기
  box_size?: string;         // 선택: 박스 크기
}
```

### 장점
1. **DDL 권한 불필요**: 기존 테이블 활용
2. **확장성**: JSON을 통한 유연한 데이터 구조
3. **관리 편의성**: 하나의 배송에 여러 제품 연결
4. **타입 안전성**: detail_type으로 데이터 분류

### 제한사항
1. **외래키 제약 없음**: PlanetScale 제약으로 referential integrity 수동 관리 필요
2. **JSON 검색 제한**: MySQL JSON 함수 활용 필요
3. **데이터 정합성**: 애플리케이션 레벨에서 검증 필요

## 👥 사용자 역할 시스템

### 역할별 기능 및 권한

#### 1. `admin` (관리자)
- **전체 시스템 관리**: 모든 API 엔드포인트 접근
- **사용자 관리**: 사용자 생성, 수정, 삭제
- **배송 관리**: 모든 배솨 정보 열람 및 수정
- **기사 배정**: 자동/수동 기사 배정
- **시스템 설정**: 디버그 도구 사용

#### 2. `manager` (매니저)
- **제한된 관리**: 대부분의 관리 기능 사용
- **배송 모니터링**: 배송 현황 확인 및 관리
- **사용자 지원**: 파트너사 및 기사 지원
- **보고서 열람**: 통계 및 분석 데이터 열람

#### 3. `user` (파트너사)
- **배송 접수**: 자체 배송 요청 등록
- **데이터 관리**: 자신의 배송 데이터 확인 및 수정
- **기본설정**: default_sender_* 필드로 기본 발송인 정보 설정
- **제품 관리**: 자신의 제품 등록 및 관리
- **배송 추적**: 진행 상황 확인

#### 4. `driver` (기사)
- **배송 수행**: 배정된 배솨 확인 및 수행
- **상태 업데이트**: 배송 진행 상황 업데이트
- **사진 업로드**: 설치 완료 사진 및 서명 등록
- **위치 업데이트**: 실시간 위치 정보 공유
- **모바일 얱**: 전용 모바일 인터페이스 사용

### 역할 배정 예시

#### 사용자 생성 API
```bash
POST /api/users
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "username": "partner001",
  "password": "secure123",
  "name": "삼성가구",
  "company": "삼성가구 주식회사",
  "role": "user",
  "phone": "02-1234-5678",
  "email": "contact@samsung-furniture.co.kr",
  "default_sender_address": "서울시 강남구 테헤란로 123"
}
```

#### 기사 등록 API
```bash
POST /api/users
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "username": "driver001",
  "password": "driver123",
  "name": "김기사",
  "role": "driver",
  "phone": "010-1234-5678",
  "email": "driver001@easypicks.kr"
}
```

### 보안 고려사항

1. **역할 기반 접근 제어**: 모든 API 엔드포인트에 역할 검증 미들웨어 적용
2. **비밀번호 암호화**: 실제 환경에서 bcrypt 등 사용 버요
3. **세션 관리**: JWT 토큰을 통한 안전한 인증 체계
4. **권한 분리**: 각 역할에 맞는 최소 권한 원칙 적용

## 🔍 디버그 및 모니터링

### 스키마 조회 API
```bash
GET /api/debug/schema
```
전체 데이터베이스 스키마 정보를 조회합니다.

### 테이블 상태 확인
```bash
GET /api/debug/tables  
```
주요 테이블의 레코드 수와 샘플 데이터를 확인합니다.

## 🚀 배포 및 개발

### 로컬 개발
```bash
npm install
npm start
```

### Railway 배포
GitHub main 브랜치에 push하면 자동 배포됩니다.

### 환경 변수
- `DB_HOST`: 데이터베이스 호스트
- `DB_USER`: 데이터베이스 사용자명  
- `DB_PASSWORD`: 데이터베이스 비밀번호
- `DB_NAME`: 데이터베이스명

## 📈 향후 계획

1. **성능 최적화**: JSON 검색 인덱스 추가
2. **데이터 검증**: Joi/Yup를 통한 스키마 검증
3. **트랜잭션 관리**: 복합 작업의 ACID 보장
4. **캐싱**: Redis를 통한 응답 성능 개선
5. **로깅**: 구조화된 로그 시스템 도입

---

**최근 업데이트**: 2025-09-25
**문서 버전**: 1.1.0

### 주요 변경 사항 (v1.1.0)
- **사용자 역할 시스템 개선**: 4가지 역할 명확한 정의 및 관리
- **DRIVER 역할 추가**: 기사 전용 역할 및 기능 분리
- **백엔드 역할 검증**: PlanetScale DDL 제한 상황에서 로직 레벨 처리
- **프론트엔드 표시 개선**: 역할별 명확한 한국어 표시 및 색상 구분