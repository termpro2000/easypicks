# 🚚 이지픽스 배송 관리 시스템

React Native 모바일 앱과 Node.js 백엔드 서버로 구성된 완전한 배송 관리 시스템입니다.

> **최근 업데이트**: 2025-09-19 - Firebase Storage 설정 완료 및 EAS 프로덕션 빌드 구축 🎉

## 📋 목차
- [프로젝트 구조](#프로젝트-구조)
- [주요 기능](#주요-기능)
- [🆕 Status 관리 시스템](#-status-관리-시스템)
- [🔥 Firebase Storage 시스템](#-firebase-storage-시스템)
- [📱 EAS Build & Update 시스템](#-eas-build--update-시스템)
- [설치 및 실행](#설치-및-실행)
- [API 문서](#api-문서)
- [테스트 방법](#테스트-방법)
- [스크린샷](#스크린샷)
- [기술 스택](#기술-스택)

## 🏗️ 프로젝트 구조

```
hy2/
├── 📁 백엔드 서버 (Node.js + Express)
│   ├── server.js              # 서버 진입점
│   ├── package.json           # 백엔드 의존성
│   ├── .env                   # 환경 변수
│   ├── db/
│   │   ├── connection.js      # 데이터베이스 연결 (메모리 내 DB)
│   │   └── init.sql          # 데이터베이스 스키마
│   └── routes/
│       ├── auth.js           # 인증 관련 API (메모리 DB 사용)
│       └── delivery.js       # 배송 관련 API (더미 데이터)
├── 📁 React Native 모바일 앱
│   ├── mobile/
│   │   ├── App.js            # 앱 진입점
│   │   ├── package.json      # 모바일 의존성
│   │   └── src/
│   │       ├── config/
│   │       │   └── api.js    # API 설정
│   │       └── screens/
│   │           ├── LoginScreen.js
│   │           ├── RegisterScreen.js
│   │           ├── DeliveryListScreen.js
│   │           └── DeliveryDetailScreen.js
│   └── miraekorea-expo/      # Expo 프로젝트
├── 📁 웹 테스트 인터페이스
│   └── test-web/
│       └── index.html        # 웹 기반 테스트 UI
└── 📁 문서
    ├── README.md             # 이 파일
    └── expo-info.html        # Expo QR 코드 페이지
```

## ✨ 주요 기능

### 🔐 사용자 인증 시스템
- [x] **회원가입**: 사용자 ID, 비밀번호, 이름, 전화번호
- [x] **로그인**: JWT 토큰 기반 인증
- [x] **자동 로그인**: AsyncStorage 기반 상태 유지
- [x] **보안**: bcrypt 비밀번호 해싱
- [x] **기사 프로필**: 개인정보 수정, 비밀번호 변경

### 📱 배송 관리 메인 화면
- [x] **브랜드 헤더**: 이지픽스 로고 + 사용자명 + 설정 메뉴
- [x] **날짜 네비게이션**: 이전/다음 날짜 이동 (← 날짜 →)
- [x] **실시간 통계**: 전체건수/완료건수 표시
- [x] **배송순서 관리**: 자동/수동 모드 토글
- [x] **드래그 앤 드롭**: 수동 모드에서 배송 순서 변경
- [x] **일련번호**: 배송 순서에 따른 번호 자동 표시
- [x] **상차 기능**: 체크박스 기반 다중 선택 상차 처리

### 🗺️ 지도 기능
- [x] **지도로보기**: 배송지 위치를 지도에 시각화
- [x] **네이버지도 연동**: 실제 좌표 기반 마커 표시
- [x] **순서 표시**: 배송 순서에 따른 번호 마커
- [x] **슬라이더 UI**: 하단 슬라이더로 배송 목록 확인
- [x] **인터랙션**: 마커/목록 클릭 시 상세정보 팝업

### 📦 배송 정보 관리
각 배송 카드에 표시되는 핵심 정보:
- **운송장번호**: 추적 가능한 고유번호
- **고객 정보**: 이름, 주소
- **배송 상태**: 미상차/상차완료/배송중/완료 등 색상별 구분
- **요청 유형**: 일반/긴급 등 배송 타입

### 📋 배송 상세 정보 화면
포괄적인 배송 정보 관리:
- **기본 정보**: 의뢰타입, 시공유형, 방문일시, 가구회사
- **고객 정보**: 이름, 연락처, 주소, 비상연락처
- **건물 정보**: 건물형태, 층수, 엘리베이터 유무
- **특수 옵션**: 사다리차, 폐기물처리, 방간이동, 벽시공
- **메모 시스템**: 주요메모, 상품정보, 가구요청사항
- **사진 관리**: 설치 전/후 사진 촬영 및 편집
- **서명**: 디지털 서명 수집 기능

### ⚡ 고급 기능
- [x] **배송연기**: 날짜 선택 + 자동 사유 생성 + DB 업데이트
- [x] **배송취소**: 취소 사유 입력 + 취소 상태 관리 + UI 비활성화
- [x] **상차확인**: 다중 선택 + 로딩 확인 시스템
- [x] **지도 설정**: 사용자별 선호 지도 앱 설정
- [x] **데이터 동기화**: 실시간 상태 업데이트
- [x] **오프라인 지원**: AsyncStorage 기반 로컬 캐싱
- [x] **배송완료 처리**: 체크박스 기반 귀책사항 선택 + 녹음파일 업로드

## 🆕 Status 관리 시스템

### 📊 의뢰종류별 동적 Status 처리

시스템은 **의뢰종류**에 따라 자동으로 적절한 status를 표시하고 처리합니다:

#### 🎯 Status 체계 (한글명 → 영어명)

| 한글명 | 영어명 | 색상 | 설명 |
|--------|--------|------|------|
| **접수완료** | `order_received` | 🟠 주황 | 주문이 접수된 상태 |
| **배차완료** | `dispatch_completed` | 🟠 주황 | 기사에게 배정 완료 |
| **배송중** | `in_delivery` | 🔵 파랑 | 일반 배송 진행 중 |
| **수거중** | `in_collection` | 🔵 파랑 | 회수 작업 진행 중 |
| **조처중** | `in_processing` | 🔵 파랑 | 조처 작업 진행 중 |
| **배송완료** | `delivery_completed` | 🟢 초록 | 일반 배송 완료 |
| **수거완료** | `collection_completed` | 🟢 초록 | 회수 작업 완료 |
| **조처완료** | `processing_completed` | 🟢 초록 | 조처 작업 완료 |
| **배송취소** | `delivery_cancelled` | 🔴 빨강 | 배송이 취소됨 |
| **배송연기** | `delivery_postponed` | 🟠 주황 | 배송이 연기됨 |

#### 🔄 의뢰종류별 자동 Status 변환

**1. 상차 처리 시**
```
일반/네이버/쿠팡 → 배송중 (in_delivery)
회수             → 수거중 (in_collection)  
조처             → 조처중 (in_processing)
```

**2. 배송완료 처리 시**
```
일반/네이버/쿠팡 → 배송완료 (delivery_completed)
회수             → 수거완료 (collection_completed)
조처             → 조처완료 (processing_completed)
```

#### 🎨 색상 코드 체계

- **🟠 주황색 (#FF9800)**: 접수/대기/연기 상태
- **🔵 파란색 (#2196F3)**: 진행 중 상태  
- **🟢 초록색 (#4CAF50)**: 완료 상태
- **🔴 빨간색 (#F44336)**: 취소 상태
- **⚪ 회색 (#9E9E9E)**: 알 수 없음

#### 💡 스마트 Status 처리

**클라이언트 화면:**
- `DeliveryDetailScreen`: 의뢰종류를 고려한 동적 status 표시
- `DeliveryListScreen`: 완료 건수 계산 시 모든 완료 상태 포함
- `LoadingConfirmScreen`: 상차 처리 시 의뢰종류별 적절한 status 설정

-  배송완료, 수거완료, 조처완료 상태인 배송들이 녹색 라인으로 표시됨.

**서버 API:**
- **상차 처리**: 의뢰종류 확인 → 적절한 진행 상태 설정
- **완료 처리**: 의뢰종류 확인 → 적절한 완료 상태 설정  
- **연기/취소**: 통일된 상태 설정
- **호환성**: 기존 영문 status도 지원

#### 🔧 기술적 특징

- **동적 처리**: 런타임에 의뢰종류에 따라 status 결정
- **일관성**: 모든 화면에서 통일된 status 표시
- **확장성**: 새로운 의뢰종류 추가 시 쉽게 확장 가능
- **호환성**: 기존 데이터와의 하위 호환성 유지

## 🔥 Firebase Storage 시스템

### 📸 실제 사진 업로드 기능 구현 완료

시스템에서 **실제 Firebase Storage를 사용한 사진 업로드** 기능이 완전히 구현되었습니다:

#### 🔧 Firebase 설정
```javascript
// Firebase 프로젝트: easypicks-delivery
const firebaseConfig = {
  apiKey: "AIzaSyCKb2Rs9vOF6pppEO_HfQ3Qub5L9OACAng",
  authDomain: "easypicks-delivery.firebaseapp.com",
  projectId: "easypicks-delivery",
  storageBucket: "easypicks-delivery.firebasestorage.app",
  messagingSenderId: "992445415586",
  appId: "1:992445415586:web:2e00d58272a1107ca4d7fb",
  measurementId: "G-X99E25Z2BS"
}
```

#### 📱 시공설치사진 업로드
- **배송상세정보 화면**: 실제 Firebase Storage에 사진 업로드
- **갤러리/카메라**: Expo ImagePicker로 사진 선택
- **실시간 업로드**: 진행률 표시 및 완료 확인
- **저장 경로**: `delivery_photos/{trackingNumber}/`

#### 🛠️ 기술적 특징
- **환경 감지**: Expo Go vs EAS Build 자동 구분
- **에러 처리**: 업로드 실패 시 상세 오류 메시지
- **재시도 로직**: Firebase Storage 객체 재생성 메커니즘
- **디버깅**: 상세한 콘솔 로그 및 상태 확인 기능

#### 🔍 Firebase 상태 확인
프로필 화면에서 "🔥 Firebase 상태 확인" 버튼으로 실시간 Firebase Storage 설정 상태를 확인할 수 있습니다.

## 📱 EAS Build & Update 시스템

### 🚀 프로덕션 APK 빌드 구성 완료

**EAS Build를 통한 프로덕션 APK 빌드** 시스템이 완전히 구축되었습니다:

#### ⚙️ EAS 설정 (eas.json)
```json
{
  "build": {
    "production-apk": {
      "extends": "production",
      "channel": "production",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

#### 🔄 EAS Update 시스템
- **OTA 업데이트**: 앱스토어 재배포 없이 코드 업데이트
- **채널 기반**: production 채널로 업데이트 배포
- **자동/수동**: 수동 업데이트 체크 버튼 구현
- **환경 감지**: Expo Go vs EAS Build 환경 자동 구분

#### 🏗️ 빌드 프로세스
```bash
# 프로덕션 APK 빌드
eas build --platform android --profile production-apk

# OTA 업데이트 배포
eas update --branch production --message "업데이트 내용"
```

#### 📊 빌드 정보
- **자동 버전 증가**: versionCode 자동 증가 (현재: 26)
- **원격 인증서**: Expo 서버에서 키스토어 관리
- **빌드 로그**: 실시간 빌드 상태 및 로그 확인

#### 🔧 의존성 관리
- **package-lock.json 동기화**: npm ci 오류 해결
- **의존성 재생성**: 캐시 문제 방지를 위한 clean install
- **빌드 환경**: EAS Build 서버에서 일관된 환경 보장

## 🚀 설치 및 실행

### 1️⃣ 백엔드 서버 실행

```bash
# 프로젝트 디렉토리로 이동
cd /Users/lyuhyeogsang/hy2

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

**환경 변수 설정** (`.env` 파일):
```env
PORT=8080
DB_HOST=aws.connect.psdb.cloud
DB_NAME=miraekorea
DB_USER=q1nyd4zvt86otiyozkcc
DB_PASSWORD=test_password_123
JWT_SECRET=miraekorea_jwt_secret_key_2024_very_secure_token
```

### 2️⃣ 웹 테스트 인터페이스 실행

```bash
# 테스트 웹 서버 실행
cd /Users/lyuhyeogsang/hy2
python3 -m http.server 8081 --directory test-web
```

### 3️⃣ Expo 모바일 앱 실행 (선택사항)

```bash
# Expo 프로젝트로 이동
cd /Users/lyuhyeogsang/hy2/mobile/miraekorea-expo

# 의존성 설치
npm install

# Expo 개발 서버 실행
npx expo start --port 8082
```

## 🌐 API 문서

### 인증 API

#### POST `/api/auth/register` - 회원가입
```json
{
  "user_id": "testuser",
  "password": "123456",
  "name": "홍길동",
  "phone": "010-1234-5678"
}
```

**응답:**
```json
{
  "message": "회원가입이 성공적으로 완료되었습니다.",
  "user": {
    "id": 1,
    "user_id": "driver001",
    "name": "홍길동"
  }
}
```

#### POST `/api/auth/login` - 로그인
```json
{
  "user_id": "driver001",
  "password": "123456"
}
```

**응답:**
```json
{
  "message": "로그인 성공",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "user_id": "testuser",
    "name": "홍길동"
  }
}
```

### 배송 API

#### GET `/api/delivery/list` - 배송목록 조회
**헤더:** `Authorization: Bearer {token}`

**응답:**
```json
{
  "success": true,
  "deliveries": [
    {
      "id": 1,
      "tracking_number": "TK03858036886",
      "customer_name": "고객403",
      "customer_address": "서울시 강남구 테헤란로 123",
      "product_name": "소파",
      "status": "order_received",
      "request_type": "일반",
      "visit_date": "2025-09-14",
      "visit_time": "14:00"
    }
  ],
  "total": 11
}
```

#### POST `/api/delivery/postpone/:id` - 배송연기
**헤더:** `Authorization: Bearer {token}`

**요청:**
```json
{
  "postponeDate": "2025-09-20",
  "postponeReason": "2025-09-14에서 2025-09-20로 연기 되었습니다."
}
```

**응답:**
```json
{
  "success": true,
  "message": "배송이 성공적으로 연기되었습니다.",
  "data": {
    "deliveryId": 1,
    "trackingNumber": "TK03858036886",
    "customerName": "고객403",
    "newVisitDate": "2025-09-20",
    "postponeReason": "2025-09-14에서 2025-09-20로 연기 되었습니다."
  }
}
```

#### POST `/api/delivery/cancel/:id` - 배송취소
**헤더:** `Authorization: Bearer {token}`

**요청:**
```json
{
  "cancelReason": "고객 요청에 의한 배송 취소"
}
```

**응답:**
```json
{
  "success": true,
  "message": "배송이 성공적으로 취소되었습니다.",
  "data": {
    "deliveryId": "66",
    "trackingNumber": "TK03858036886",
    "customerName": "고객403",
    "cancelReason": "고객 요청에 의한 배송 취소",
    "canceledAt": "2025-09-14 07:18:38"
  }
}
```

#### PUT `/api/delivery/update-status` - 배송상태 업데이트 (상차확인)
**헤더:** `Authorization: Bearer {token}`

**요청:**
```json
{
  "updates": [
    {"id": 1, "status": "상차완료"},
    {"id": 2, "status": "상차완료"}
  ]
}
```

**응답:**
```json
{
  "success": true,
  "message": "2개 배송의 상태가 업데이트되었습니다.",
  "updatedCount": 2
}
```

#### POST `/api/delivery/complete/:id` - 배송완료 처리
**헤더:** `Authorization: Bearer {token}`

**요청:**
```json
{
  "driverNotes": "배송 완료되었습니다.",
  "customerRequestedCompletion": true,
  "furnitureCompanyRequestedCompletion": false,
  "completionAudioFile": "TK123_1234567890_evidence.mp3",
  "completedAt": "2025-09-14T07:30:00.000Z"
}
```

**응답:**
```json
{
  "success": true,
  "message": "배송이 성공적으로 완료되었습니다.",
  "data": {
    "deliveryId": "1",
    "trackingNumber": "TK03858036886",
    "customerName": "고객403",
    "completedAt": "2025-09-14 07:30:00",
    "customerRequestedCompletion": true,
    "furnitureCompanyRequestedCompletion": false,
    "completionAudioFile": "TK123_1234567890_evidence.mp3"
  }
}
```

#### POST `/api/audio/upload/:trackingNumber` - 녹음파일 업로드
**헤더:** `Authorization: Bearer {token}`
**Content-Type:** `multipart/form-data`

**요청:**
```
FormData {
  audio: File (MP3, WAV, AAC, M4A, OGG, 3GP, AMR)
}
```

**응답:**
```json
{
  "success": true,
  "message": "오디오 파일이 성공적으로 업로드되었습니다.",
  "file": {
    "fileName": "TK123_1234567890_evidence.mp3",
    "originalName": "evidence.mp3",
    "size": 1048576,
    "uploadedAt": "2025-09-14T07:25:00.000Z"
  }
}
```

## 🧪 테스트 방법

### 웹 브라우저 테스트 (추천)

1. **서버 실행 확인**
   - 백엔드: `http://localhost:8080` ✅
   - 웹 테스트: `http://localhost:8081` ✅

2. **테스트 시나리오**
   
   **Step 1: 회원가입**
   - `http://localhost:8081` 접속
   - "회원가입" 버튼 클릭
   - 정보 입력:
     - 사용자 ID: `testuser`
     - 비밀번호: `123456`
     - 이름: `홍길동`
     - 전화번호: `010-1234-5678`
   - 회원가입 완료

   **Step 2: 로그인**
   - 자동으로 로그인 화면 이동
   - 계정 정보로 로그인
   - 배송 목록 화면 자동 표시

   **Step 3: 배송 관리 기능 테스트**
   - ☰ 햄버거 메뉴 클릭
   - ← → 날짜 네비게이션 테스트
   - 통계 확인 (전체 5건 / 완료 2건)
   - 배송 카드 클릭하여 상세정보 확인
   - 로그아웃 테스트

### 모바일 앱 테스트 (Expo)

1. **휴대폰에 Expo Go 설치**
   - iOS: App Store → "Expo Go"
   - Android: Google Play → "Expo Go"

2. **앱 연결**
   - Expo Go에서 "Enter URL manually" 선택
   - URL 입력: `exp://127.0.0.1:8082`
   - 또는: `exp://192.168.233.127:8082`

3. **실제 휴대폰에서 앱 테스트**

## 📊 현재 데이터

### 데이터베이스 (MySQL - PlanetScale)
- **drivers 테이블**: 기사 정보 및 인증
- **deliveries 테이블**: 배송 정보 (11건의 실제 데이터)
- **실시간 동기화**: 상태 변경 시 즉시 DB 업데이트
- **백업 및 복구**: 클라우드 기반 안정적 데이터 관리

### 현재 배송 데이터
실제 운영 중인 11건의 배송 데이터:

| 운송장번호 | 고객명 | 상품 | 상태 | 의뢰종류 | 배송일 |
|------------|--------|------|------|---------|--------|
| TK03858036886 | 고객403 | 소파 | 접수완료 | 일반 | 2025-09-14 |
| MD2025091371925 | 김아무게 | 쇼파 | 배송중 | 네이버 | 2025-09-14 |
| CF2025091234567 | 박회수 | 냉장고 | 수거중 | 회수 | 2025-09-14 |
| JP2025091987654 | 이조처 | 세탁기 | 조처완료 | 조처 | 2025-09-13 |
| ... | ... | ... | ... | ... | ... |

### 테스트 계정
```
기사 계정: driver001 / 123456
기사 계정: driver6333 / password123
테스트용: test-token (개발환경)
```

## 💻 기술 스택

### 백엔드
- **Node.js** + **Express.js** - 서버 프레임워크
- **bcrypt** - 비밀번호 해싱
- **jsonwebtoken** - JWT 토큰 인증
- **cors** - Cross-Origin Resource Sharing
- **nodemon** - 개발 서버 자동 재시작

### 프론트엔드
- **React Native** - 모바일 앱 개발
- **Expo** - React Native 개발 환경
- **React Navigation** - 앱 내 네비게이션
- **AsyncStorage** - 로컬 데이터 저장
- **Axios** - HTTP 클라이언트

### 웹 테스트
- **HTML5** + **CSS3** + **JavaScript**
- **Fetch API** - 백엔드 통신
- **Responsive Design** - 모바일 친화적 UI

## 🛠️ 개발 환경

### 포트 사용 현황
- **8080**: 백엔드 API 서버
- **8081**: 웹 테스트 인터페이스  
- **8082**: Expo 개발 서버
- **8083**: 추가 웹 서비스 (QR 코드 페이지)

### 디렉토리 구조
```
/Users/lyuhyeogsang/hy2/
├── 백엔드 파일들
├── mobile/                  # React Native 원본
├── mobile/miraekorea-expo/ # Expo 프로젝트
├── test-web/               # 웹 테스트 파일
└── README.md               # 이 문서
```

## 🎯 향후 개발 계획

### Phase 1 - 기본 기능 완성 ✅
- [x] 사용자 인증 시스템
- [x] 배송 목록 화면
- [x] 날짜 네비게이션
- [x] 상세 정보 화면
- [x] 웹 테스트 인터페이스

### Phase 2 - 실제 데이터베이스 연동 ✅
- [x] PlanetScale MySQL 연결 복구
- [x] 실제 배송 데이터 CRUD
- [x] 배송 상태 실시간 업데이트
- [x] 사용자별 배송 목록 필터링
- [x] **의뢰종류별 동적 Status 시스템**
- [x] **배송완료 처리 체계 (귀책사항 + 녹음파일)**
- [x] **Firebase Storage 실제 사진 업로드 구현**
- [x] **EAS Build 프로덕션 APK 빌드 시스템 구축**

### Phase 3 - 고급 기능
- [ ] 푸시 알림 시스템
- [ ] GPS 위치 추적
- [ ] 실시간 채팅 (기사 ↔ 고객)
- [ ] 관리자 대시보드
- [ ] 통계 및 리포트 기능

### Phase 4 - 운영 환경
- [ ] 서버 배포 (AWS/Vercel)
- [ ] 앱스토어 배포 준비
- [ ] 성능 최적화
- [ ] 보안 강화
- [ ] 테스트 자동화

## 📞 지원 및 문의

프로젝트 관련 문의사항이나 버그 리포트는 이슈를 통해 알려주세요.

---

**미래코리아 배송 관리 시스템** - 완전한 배송 관리 솔루션 🚚✨