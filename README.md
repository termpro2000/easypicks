# 🚚 이지픽스 배송 관리 시스템

React Native 모바일 앱, React 웹 어드민, Node.js 백엔드 서버로 구성된 완전한 배송 관리 시스템입니다.

> **최근 업데이트**: 2025-09-29 - 회원가입 폼 간소화 및 UI 개선 완료 🎉
> 
> 🌟 **신규 기능**: 파트너 회원가입 필드 검증 및 데이터베이스 저장 확인 시스템!

## 📋 목차
- [프로젝트 구조](#프로젝트-구조)
- [핵심 기능](#핵심-기능)
- [🌐 웹 어드민 대시보드](#-웹-어드민-대시보드)
- [📱 모바일 앱 기능](#-모바일-앱-기능)
- [🔥 Firebase Storage 시스템](#-firebase-storage-시스템)
- [🗄️ 데이터베이스 구조](#️-데이터베이스-구조)
- [설치 및 실행](#설치-및-실행)
- [기술 스택](#기술-스택)

## 🏗️ 프로젝트 구조

```
hy2/
├── 📁 backend/                    # Node.js + Express + MySQL
│   ├── server.js                 # 서버 진입점
│   ├── controllers/              # 비즈니스 로직
│   │   ├── authController.js     # 인증 관리
│   │   ├── deliveryController.js # 배송 관리
│   │   ├── deliveryDetailsController.js # 상품 정보
│   │   └── driversController.js  # 기사 관리
│   └── routes/                   # API 라우팅
├── 📁 frontend/                   # React 웹 어드민
│   ├── src/components/
│   │   ├── admin/               # 관리자 기능
│   │   ├── delivery/            # 배송 관리
│   │   ├── products/            # 상품 관리
│   │   └── drivers/             # 기사 관리
│   └── src/utils/
│       └── firebaseStorage.ts   # Firebase 통합
└── 📁 expo-mobile/               # React Native 모바일 앱
    ├── src/screens/
    │   ├── DeliveryListScreen.js
    │   └── DeliveryDetailScreen.js
    └── src/utils/
        └── firebaseStorage.js   # Firebase 통합
```

## ✨ 핵심 기능

### 🔐 사용자 인증 및 권한 관리
- **JWT 토큰 기반 인증**: 안전한 로그인/로그아웃
- **Role 기반 권한**: admin, manager, driver, user 구분
- **사용자 프로필 관리**: 개인정보 수정, 비밀번호 변경
- **User Detail 시스템**: Role별 추가 정보 관리 (JSON 기반)

#### 💾 로그인 정보 저장 방식

**🌐 웹 애플리케이션**
- **저장소**: `localStorage`
- **키**: `jwt_token`
- **데이터**: JWT 토큰 문자열
- **지속성**: 브라우저 종료 후에도 유지

**📱 모바일 애플리케이션**  
- **저장소**: `AsyncStorage`
- **키**: 
  - `auth_token` - JWT 토큰
  - `user_info` - 사용자 정보 (JSON 문자열)
- **지속성**: 앱 삭제 전까지 유지

**🔄 저장 데이터 구조**
```json
// JWT 토큰
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// 사용자 정보 (모바일)
{
  "id": 19,
  "username": "dr1", 
  "role": "user",
  "name": "김철수기사",
  "userType": "driver"
}
```

**🔒 보안 특징**
- **자동 만료**: JWT 토큰 만료 시 자동 제거
- **인증 실패 처리**: 401/403 응답 시 토큰 자동 삭제
- **토큰 검증**: 모든 API 요청 시 자동 토큰 검증

### 📦 배송 관리 시스템
- **완전한 52필드 지원**: 모든 배송 정보 체계적 관리
- **멀티-프로덕트 지원**: 하나의 배송에 여러 상품 할당
- **실시간 상태 추적**: 접수→배차→배송→완료 전 과정 관리
- **의뢰종류별 Status**: 일반/회수/조처 등 자동 상태 변환
- **파트너 선택 기반 접수**: 필수 파트너 연결로 데이터 무결성 보장

### 🗺️ 지도 및 네비게이션
- **지도 통합**: Google Maps 기반 배송지 시각화
- **네비게이션 연결**: 기사님 선호 지도 앱 연동
- **배송 순서 최적화**: 드래그 앤 드롭 순서 변경

## 🌐 웹 어드민 대시보드

### 📊 AdminDashboard (통합 관리 허브)
- **중앙 집중식 네비게이션**: 모든 관리 기능 접근
- **실시간 통계**: 배송 현황 및 운영 지표
- **사용자 프로필 모달**: 클릭 가능한 role 배지

### 📦 배송 관리
- **AdminShippingForm**: 1,040+ 줄 완전한 배송 접수 폼
  - 제품별 배송비용(cost1) 필드 추가
  - 6컬럼 선택된 제품 목록 (배송비용 포함)
  - 총 배송비용 자동 계산 및 요약 표시
- **ShippingOrderForm**: 사용자 정보 자동 채우기 시스템
  - 발송인 정보 자동 완성 (이름, 주소, 연락처)
  - 파트너 추가 정보 통합 (회사명, 사업자번호, 대표자명, 업종)
  - 다중 데이터 소스 활용 (사용자 기본 정보 + 상세 정보 API)
- **DeliveryDetail**: 완전한 배송 정보 표시 및 편집
- **시공설치사진 통합**: Firebase Storage 사진 실시간 확인
- **상품 테이블**: delivery_details 테이블 기반 동적 상품 표시

### 👥 사용자 및 기사 관리
- **UserManagement**: 이중 탭 인터페이스 (사용자/기사)
- **DriverManagement**: 전용 기사 관리 인터페이스
- **DriverAssignment**: 자동/수동 기사 배정 시스템

### 📦 상품 관리
- **ProductManagement**: 완전한 CRUD 작업
- **QR 코드 통합**: 상품 추적용 QR 코드 생성
- **사진 관리**: 상품 이미지 업로드 및 편집
- **배송비용 검색**: f_price 테이블 기반 자동 비용 계산
- **역할 기반 접근**: admin/manager만 비용 정보 수정 가능

## 📱 모바일 앱 기능

### 🚚 배송 관리
- **배송 목록**: 날짜별 배송 현황 및 통계
- **배송 상세**: 52개 필드 완전 지원
- **상태 업데이트**: 상차→배송중→완료 실시간 처리
- **배송 연기/취소**: 사유 입력 및 자동 상태 관리

### 📷 시공설치사진 시스템
- **사진 추가**: 갤러리/카메라 선택 (최대 10장)
- **Firebase 업로드**: 실시간 진행률 표시
- **사진 관리**: 편집 모드, 개별 삭제 기능
- **큰 화면 보기**: 모달 확대 및 편집 기능

### 🗺️ 지도 기능
- **배송지 시각화**: Google Maps 기반 마커 표시
- **네비게이션 연결**: 기사님 선호 앱 설정
- **순서 표시**: 배송 순서 번호 마커

### ✍️ 서명 및 완료 처리
- **디지털 서명**: 고객 서명 수집
- **귀책사항 체크**: 고객/가구회사 요청 완료 구분
- **녹음파일 업로드**: 완료 증빙 자료 관리

## 🔥 Firebase Storage 시스템

### 📸 통합 사진 관리
- **프로젝트**: easypicks-delivery
- **저장 구조**: `delivery-photos/{trackingNumber}/`
- **지원 형식**: JPG, PNG, WebP (최대 10MB)

### 🔄 모바일 ↔ 웹 연동
```javascript
// 모바일 앱: 사진 업로드
await uploadMultipleDeliveryPhotos(imageUris, trackingNumber, onProgress);

// 웹 어드민: 사진 표시
const photos = await getDeliveryPhotos(trackingNumber);
```

### ✨ 웹 어드민 사진 기능 (신규)
- **실시간 로딩**: Firebase Storage에서 자동 사진 로드
- **갤러리 뷰**: 반응형 그리드 레이아웃 (2×3×4열)
- **모달 확대**: 클릭으로 전체 화면 사진 보기
- **호버 효과**: 마우스 오버 시 확대 및 Eye 아이콘
- **사진 인덱스**: 각 사진 번호 표시
- **상태 표시**: 로딩, 빈 상태, 사진 개수 요약

## 🗄️ 데이터베이스 구조

### 📊 주요 테이블
- **deliveries**: 52개 필드 완전한 배송 정보
- **delivery_details**: JSON 기반 상품 정보 (멀티-프로덕트)
- **users**: 통합 사용자 관리 (모든 role)
- **user_detail**: Role별 추가 정보 (JSON 저장)
- **drivers**: 기사 전용 정보 (차량, 라이선스 등)
- **f_price**: 설치기사 10%인상 배송단가표 (카테고리별 비용 정보)

### 🔗 관계형 구조
```sql
deliveries (1) ←→ (N) delivery_details  -- 배송-상품 관계
users (1) ←→ (1) user_detail            -- 사용자-상세정보
users (1) ←→ (N) deliveries             -- 파트너-배송 관계
```

## 🚀 설치 및 실행

### 1️⃣ 백엔드 서버
```bash
cd /Users/lyuhyeogsang/hy2
npm install
npm run dev  # 포트 8080
```

### 2️⃣ 웹 어드민
```bash
cd /Users/lyuhyeogsang/hy2/frontend
npm install
npm run dev  # 포트 5173
```

### 3️⃣ 모바일 앱
```bash
cd /Users/lyuhyeogsang/hy2/expo-mobile
npm install
npx expo start  # QR 코드로 연결
```

### 📱 EAS Build & Update
```bash
# APK 빌드
eas build --platform android --profile production-apk

# OTA 업데이트
eas update --branch production --message "업데이트 내용"
```

## 💻 기술 스택

### 백엔드
- **Node.js + Express.js**: RESTful API 서버
- **MySQL (PlanetScale)**: 클라우드 데이터베이스
- **JWT**: 토큰 기반 인증
- **bcrypt**: 비밀번호 해싱
- **multer**: 파일 업로드 처리

### 프론트엔드 (웹)
- **React + TypeScript**: 타입 안전한 컴포넌트
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **Lucide React**: 아이콘 라이브러리
- **Firebase**: Storage 통합
- **Vite**: 빠른 빌드 도구

### 모바일
- **React Native + Expo**: 크로스 플랫폼 앱
- **Expo ImagePicker**: 사진/카메라 액세스
- **AsyncStorage**: 로컬 데이터 저장
- **React Navigation**: 앱 내 네비게이션
- **Firebase Storage**: 사진 업로드

### 배포 인프라
- **Railway**: 백엔드 자동 배포
- **Vercel**: 프론트엔드 자동 배포  
- **EAS Build**: 모바일 앱 빌드 서비스
- **Firebase**: 파일 저장소

## 🎯 최신 업데이트 (2025-09-29)

### ✅ 파트너 회원가입 필드 검증 및 데이터베이스 저장 확인 시스템
- **AuthPage 회원가입 폼 간소화**: company 필드 제거로 필수 정보만으로 가입 가능
- **ProductManagement UI 개선**: '파트너 선택으로 돌아가기' → '돌아가기' 텍스트 간소화
- **백엔드 API 검증**: 파트너 회원가입 시 모든 필드(username, name, phone) 정상 저장 확인
- **필드 처리 최적화**: 
  - 프론트엔드에서 모든 데이터 정상 전송 ✅
  - 백엔드에서 필드별 타입 검증 및 로깅 ✅
  - 데이터베이스 필수 필드 저장 완료 ✅
- **추가정보 분리**: 파트너 회사 정보는 별도 추가정보 시스템에서 관리

### ✅ 데이터베이스 연동 테스트 시스템
- **회원가입 API 테스트**: CURL 기반 필드별 데이터 저장 검증
- **로그 분석 시스템**: 백엔드 실시간 로그로 필드 처리 상태 확인
- **DDL 제약사항 해결**: PlanetScale 권한 제한으로 company 컬럼 미포함 처리
- **개발환경 최적화**: 
  - 로컬 백엔드 서버 포트 8080 ✅
  - 프론트엔드 개발 서버 포트 5173 ✅
  - 데이터베이스 연결 상태 정상 ✅

### ✅ 제품별 배송비용 관리 시스템
- **AdminShippingForm 개선**: 제품 정보 섹션에 배송비용(cost1) 필드 추가
- **ShippingOrderForm 개선**: 제품별 배송비용 입력 및 관리 기능
- **선택된 제품 목록**: 6컬럼 그리드로 배송비용 표시 (통화 포맷팅)
- **요약 계산**: 총 배송비용 자동 계산 및 표시
- **데이터 통합**: 제품 추가/수정 시 cost1 값 자동 저장

### ✅ 발송인 정보 자동화 시스템
- **ShippingOrderForm 자동 채우기**: 컴포넌트 로드 시 사용자 정보로 발송인 섹션 자동 채움
- **파트너 정보 통합**: 사용자 프로필의 파트너 추가 정보를 발송인 섹션에 포함
- **다중 데이터 소스**: 기본 사용자 정보 + 사용자 상세 정보 API 활용
- **신규 필드 추가**: 
  - 발송인 전화번호, 이메일
  - 회사명, 사업자번호, 대표자명, 업종
- **폼 제출 통합**: 모든 파트너 정보 필드를 배송 데이터에 포함

### ✅ 이전 업데이트 (배송비용 검색 시스템)
- **f_price 테이블 구축**: Excel 배송단가표를 MySQL 테이블로 변환
- **ProductPriceModal**: 카테고리/사이즈 선택으로 자동 비용 계산
- **API 통합**: 한국어 카테고리 지원 및 URL 인코딩 처리
- **ProductForm/EditProductForm**: 배송비용검색 버튼 통합

### ✅ 역할 기반 접근 제어
- **admin/manager 전용**: 배송비용 섹션 수정 권한 제한
- **권한 표시**: 비권한 사용자에게 시각적 제한 표시
- **UI 개선**: 섹션별 권한 배지 및 비활성화 스타일링

### ✅ UserDashboard 상품관리 시스템
- **상품관리 카드 추가**: UserDashboard에 새로운 상품관리 버튼 생성
- **ProductManagement 통합**: role 기반 필터링으로 사용자별 상품 관리
- **자동 권한 제어**: user 역할은 자신의 상품만, admin/manager는 선택된 파트너 상품 관리
- **완전한 CRUD 보안**: 등록/수정/삭제 모든 작업에 권한 검증 적용
- **접근 거부 UI**: 권한 없는 상품 수정 시도 시 명확한 안내 메시지

### ✅ 이전 업데이트 (2025-09-28)
- **Firebase Storage 웹 연동**: 모바일 업로드 사진 웹에서 실시간 확인
- **DeliveryDetail 개선**: 메모및 지시사항 하단에 시공설치사진 섹션 추가
- **delivery_details 통합**: 웹과 동일한 로직으로 상품 테이블 표시

### 🔄 시스템 아키텍처
```
파트너 회원가입 (AuthPage) → 백엔드 API → 데이터베이스 저장 (users 테이블)
     ↓                         ↓                    ↓
모바일 앱 (사진 업로드) → Firebase Storage → 웹 어드민 (실시간 확인)
     ↓                         ↓                    ↓
웹 어드민 (배송 접수) → delivery_details → 모바일 앱 (상품 표시)
     ↓                         ↓                    ↓
UserDashboard (상품관리) → ProductManagement → role 기반 필터링
     ↓                         ↓                    ↓
ShippingOrderForm (자동 채우기) → 사용자 프로필 → 파트너 정보 통합
     ↓                              ↓                    ↓
제품별 배송비용 (cost1) → AdminShippingForm → 총 비용 계산
```

### 🔐 권한 체계
```
파트너 회원가입:
├── 필수 필드: username, password, name ✅
├── 선택 필드: phone ✅
└── 제거된 필드: company (추가정보에서 별도 관리)

user (파트너사):
├── 자신의 상품만 조회/등록/수정/삭제
├── 배송비용 섹션 접근 제한 (보기만 가능)
└── UserDashboard 상품관리 카드 접근

admin/manager:
├── 선택된 파트너의 상품 관리
├── 배송비용 섹션 완전 접근
├── ProductManagement 모든 기능 사용
└── 권한 제한 없음
```

---

**이지픽스 배송 관리 시스템** - 완전한 배송 관리 솔루션 🚚✨