# 미래코리아 배송관리시스템 데이터베이스 구조도

## 📊 전체 테이블 구조 (2025-01-09 현재)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   driver_id     │    │   deliveries    │    │delivery_details │
│                 │    │                 │    │                 │
│ • id (PK)       │    │ • id (PK)       │    │ • id (PK)       │
│ • user_id (UNI) │    │ • tracking_num  │    │ • delivery_id   │
│ • password      │    │   (UNI)         │    │ • detail_type   │
│ • name          │    │ • sender_name   │    │ • detail_value  │
│ • phone         │    │ • sender_addr   │    │ • created_at    │
│ • email         │    │ • receiver_name │    │ • updated_at    │
│ • delivery_area │    │ • receiver_addr │    └─────────────────┘
│ • vehicle_type  │    │ • receiver_phone│
│ • vehicle_number│    │ • package_type  │    ┌─────────────────┐
│ • cargo_capacity│    │ • weight        │    │shipping_orders  │
│ • created_at    │    │ • status        │    │                 │
│ • updated_at    │    │ • assigned_drv_id│   │ • id (PK)       │
└─────────────────┘    │ • created_at    │    │ • order_number  │
                       │ • updated_at    │    │ • customer_name │
┌─────────────────┐    │                 │    │ • order_date    │
│ user_activities │    │ === 확장 필드 ===│    │ • total_amount  │
│                 │    │ • request_type  │    │ • status        │
│ • id (PK)       │    │ • construction  │    │ • created_at    │
│ • user_id       │    │ • shipment_type │    │ • updated_at    │
│ • activity_type │    │ • visit_date    │    └─────────────────┘
│ • description   │    │ • visit_time    │
│ • timestamp     │    │ • assigned_drv  │    ┌─────────────────┐
│ • ip_address    │    │ • furniture_co  │    │     users       │
│ • user_agent    │    │ • main_memo     │    │                 │
└─────────────────┘    │ • emergency_con │    │ • id (PK)       │
                       │ • customer_name │    │ • username (UNI)│
                       │ • customer_phone│    │ • email         │
                       │ • customer_addr │    │ • password_hash │
                       │ • building_type │    │ • full_name     │
                       │ • floor_count   │    │ • phone         │
                       │ • elevator_avail│    │ • role          │
                       │ • ladder_truck  │    │ • is_active     │
                       │ • disposal      │    │ • created_at    │
                       │ • room_movement │    │ • updated_at    │
                       │ • wall_construct│    └─────────────────┘
                       │ • product_name  │
                       │ • furniture_code│
                       │ • product_weight│
                       │ • product_size  │
                       │ • box_size      │
                       │ • furniture_req │
                       │ • driver_notes  │
                       │ • install_photos│ (JSON)
                       │ • customer_sig  │ (LONGTEXT)
                       └─────────────────┘
```

## 🔑 주요 테이블별 상세 구조

### 1. **driver_id** (운전기사 인증)
- **목적**: 배송기사 전용 인증 및 프로필 관리
- **주요 필드**:
  - `user_id` (UNIQUE): 기사 로그인 ID
  - `password`: 암호화된 비밀번호
  - `delivery_area`: 담당 배송 지역
  - `vehicle_type`, `vehicle_number`, `cargo_capacity`: 차량 정보

### 2. **deliveries** (핵심 배송 데이터)
- **목적**: 모든 배송 정보를 통합 관리하는 중앙 테이블
- **기본 배송 정보**:
  - `tracking_number` (UNIQUE): 배송 추적번호
  - `sender_*`: 발송인 정보
  - `receiver_*`: 수취인 정보
  - `status`: pending/in_transit/delivered/cancelled

- **확장 배송 정보** (27개 추가 필드):
  - **요청 정보**: `request_type`, `construction_type`, `shipment_type`
  - **방문 정보**: `visit_date`, `visit_time`, `assigned_driver`
  - **현장 정보**: `building_type`, `floor_count`, `elevator_available`, `ladder_truck`
  - **상품 정보**: `product_name`, `furniture_product_code`, `product_weight`
  - **특별 기능**: 
    - `installation_photos` (JSON): 설치 사진 배열
    - `customer_signature` (LONGTEXT): 고객 서명 Base64 데이터

### 3. **delivery_details** (배송 상세 정보)
- **목적**: 배송 과정의 세부 로그 및 상태 변화 기록
- **구조**: Key-Value 형태로 유연한 데이터 저장

### 4. **shipping_orders** (배송 주문)
- **목적**: 주문 관리 및 배송과 연결

### 5. **user_activities** (사용자 활동 로그)
- **목적**: 시스템 사용 추적 및 감사

### 6. **users** (기본 사용자)
- **목적**: 일반 사용자 관리 (현재 driver_id로 대체됨)

## 📈 데이터 현황 (2025-01-09)

```
📊 deliveries 테이블: 5개 레코드
  ├── MK202401001: 3인용 소파 세트 (서명 저장됨) ✅
  ├── MK202401002: 냉장고 (4도어)
  ├── MK202401003: 특송
  ├── MK202401004: 일반택배
  └── MK202401005: 냉동택배

🔐 driver_id 테이블: 3개 기사 계정
  ├── driver001: 김기사
  ├── driver002: 이기사
  └── testdriver: 테스트기사 ✅
```

## 🎯 핵심 기능별 데이터 매핑

### 📱 모바일/웹 앱 기능
```
로그인 시스템     → driver_id.user_id, password
프로필 관리       → driver_id.* (모든 필드)
배송 목록        → deliveries.* (기본 정보)
배송 상세        → deliveries.* (전체 41개 필드)
고객 서명        → deliveries.customer_signature
설치 사진        → deliveries.installation_photos (JSON)
```

### 📋 배송 상세 화면 섹션별 매핑
```
방문지 정보      → customer_name, customer_phone, customer_address
기본 정보        → request_type, construction_type, visit_date, etc.
현장 정보        → building_type, floor_count, elevator_available, etc.  
상품 정보        → product_name, furniture_product_code, product_size, etc.
설치 사진        → installation_photos (JSON 배열)
가구사 요청사항   → furniture_requests (TEXT)
기사님 메모      → driver_notes (TEXT)
고객 서명        → customer_signature (LONGTEXT Base64)
```

## 🔄 주요 관계 및 제약조건

- **driver_id.user_id**: UNIQUE 제약으로 중복 기사 ID 방지
- **deliveries.tracking_number**: UNIQUE 제약으로 추적번호 고유성 보장
- **deliveries.status**: ENUM 제약으로 상태값 표준화
- **deliveries.installation_photos**: JSON 타입으로 다중 이미지 URL 저장
- **deliveries.customer_signature**: LONGTEXT로 대용량 Base64 이미지 데이터 저장

---
*최종 업데이트: 2025-01-09*
*총 테이블: 6개 | 총 필드: 130개+ | 핵심 테이블: deliveries (41개 필드)*