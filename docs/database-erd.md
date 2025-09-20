# 미래코리아 배송관리 시스템 - 데이터베이스 ERD

## 📊 데이터베이스 구성도

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        미래코리아 배송관리 시스템 DB                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────┐        ┌──────────────────────────┐        ┌────────────────────────────────┐
│        users          │        │       deliveries         │        │      delivery_details          │
├───────────────────────┤        ├──────────────────────────┤        ├────────────────────────────────┤
│ 🔑 id (PK)           │        │ 🔑 id (PK)              │        │ 🔑 id (PK)                    │
│ 🔒 user_id (UNIQUE)  │        │ 🔒 tracking_number (UK) │        │ 🔗 delivery_id (FK)           │
│ 🔐 password          │        │ 👤 sender_name          │        │ 📋 request_type                │
│ 👤 name              │        │ 📍 sender_address        │        │ 🏗️ construction_type           │
│ 📞 phone             │        │ 👤 receiver_name         │        │ 📦 shipment_type               │
│ ⏰ created_at        │        │ 📍 receiver_address      │        │ 📅 visit_date                  │
│ ⏰ updated_at        │        │ 📞 receiver_phone        │        │ ⏰ visit_time                  │
└───────────────────────┘        │ 📦 package_type          │        │ 🏢 furniture_company           │
                                │ ⚖️ weight                │        │ 🚨 emergency_contact           │
                                │ 📊 status                │        │ 🏭 warehouse_info              │
                                │ 🚛 assigned_driver_id    │        │ 📖 order_guidance             │
                                │ ⏰ created_at            │        │ 📢 pre_notification           │
                                │ ⏰ updated_at            │        │ 🏠 building_type              │
                                └──────────────────────────┘        │ 🏢 floor_count                │
                                                                   │ 🛗 elevator_available          │
                                                                   │ 🚶 stair_movement              │
                                                                   │ 🚛 ladder_truck                │
                                                                   │ 🗑️ disposal                    │
                                                                   │ 🚪 room_movement               │
                                                                   │ 🔧 wall_construction           │
                                                                   │ 💰 tollgate_cost               │
                                                                   │ 📝 main_memo                   │
                                                                   │ 😊 happy_call_memo             │
                                                                   │ 📦 product_info                │
                                                                   │ 🪑 furniture_request           │
                                                                   │ 🚛 driver_memo                 │
                                                                   │ ⏰ created_at                  │
                                                                   │ ⏰ updated_at                  │
                                                                   └────────────────────────────────┘

                                         │ 1                              │ 1
                                         │                                │
                                         │ has                            │ has
                                         │                                │
                                         │ *                              │ *
                                ┌─────────────────┐                ┌─────────────────┐
                                │   (관계 없음)    │                │   delivery_id   │
                                │                 │                │   references    │
                                │   users는       │                │   deliveries.id │
                                │   인증용으로만   │                └─────────────────┘
                                │   사용됨        │
                                └─────────────────┘
```

## 🏗️ 테이블 상세 정보

### 1. `users` 테이블 - 사용자 정보
- **목적**: 기사 로그인 인증 관리
- **주요 필드**:
  - `user_id`: 기사 로그인 아이디 (UNIQUE)
  - `password`: 암호화된 비밀번호
  - `name`: 기사 이름
  - `phone`: 연락처

### 2. `deliveries` 테이블 - 기본 배송 정보
- **목적**: 배송의 핵심 정보 저장
- **주요 필드**:
  - `tracking_number`: 운송장번호 (UNIQUE)
  - `sender_*`: 발송인 정보
  - `receiver_*`: 수취인 정보
  - `status`: 배송 상태 (pending, in_transit, delivered, cancelled)
  - `assigned_driver_id`: 담당 기사 ID

### 3. `delivery_details` 테이블 - 확장 배송 정보
- **목적**: 가구/설치 관련 상세 배송 정보 저장
- **주요 필드**:
  - `request_type`: 배송 요청 유형
  - `construction_type`: 설치 유형
  - `furniture_company`: 가구 업체
  - `building_type`: 건물 유형
  - `elevator_available`: 엘리베이터 유무
  - `main_memo`: 주요 메모
  - `driver_memo`: 기사 메모

## 🔗 관계 설명

1. **users ↔ deliveries**: 직접적인 관계 없음
   - users는 인증용으로만 사용
   - deliveries의 assigned_driver_id는 현재 users.id를 참조하지 않음

2. **deliveries ↔ delivery_details**: 1:1 관계
   - delivery_details.delivery_id → deliveries.id
   - 각 배송마다 하나의 상세 정보 레코드

## 📈 데이터 흐름

```
1. 기사 로그인 → users 테이블 조회
2. 배송 목록 조회 → deliveries 테이블 조회
3. 배송 상세 조회 → deliveries + delivery_details JOIN
4. 배송 상태 업데이트 → deliveries.status 업데이트
```

## 🚀 확장 가능성

### 추후 개선 방안:
1. **users와 deliveries 연결**: assigned_driver_id를 users.id와 외래키로 연결
2. **배송 히스토리 테이블**: 상태 변경 이력 추적
3. **알림 테이블**: 실시간 알림 관리
4. **파일 첨부 테이블**: 배송 관련 이미지/문서 저장

## 💾 현재 상태

- **PlanetScale MySQL** 사용
- **외래키 제약조건 없음** (PlanetScale 특성)
- **더미 데이터** 포함으로 개발/테스트 지원
- **실시간 업데이트** WebSocket 지원
