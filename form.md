# EasyPicks 프로젝트 컴포넌트 목록 및 기능 정리

## 프로젝트 개요
EasyPicks는 배송 관리 시스템으로, React + TypeScript + Vite로 구축된 프론트엔드 애플리케이션입니다. 역할 기반 접근 제어(관리자/매니저/파트너)를 제공합니다.

## 핵심 애플리케이션 컴포넌트

### 1. **App.tsx**
- **위치**: `/src/App.tsx`
- **기능**: 메인 애플리케이션 컴포넌트
- **특징**:
  - 역할 기반 라우팅 (관리자/매니저 vs 파트너)
  - 인증 상태 관리
  - 배송 상세 라우팅 (`/delivery/:id`)
  - 공개 추적 페이지 접근
  - 알림 시스템 통합

## 인증 컴포넌트

### 1. **AuthPage.tsx**
- **위치**: `/src/components/auth/AuthPage.tsx`
- **타입**: 폼 컴포넌트
- **기능**: 로그인/회원가입 통합 페이지
- **특징**:
  - 로그인/회원가입 토글 기능
  - 아이디 중복 확인
  - 비밀번호 표시/숨김 토글
  - react-hook-form을 사용한 폼 검증

## 관리자 컴포넌트

### 1. **AdminDashboard.tsx**
- **위치**: `/src/components/admin/AdminDashboard.tsx`
- **타입**: 대시보드 컴포넌트
- **기능**: 관리자 메인 화면
- **특징**:
  - 3×2 그리드 레이아웃 (6개 메인 기능)
  - 메뉴: 새배송접수, 기사배정, 상품관리, 사용자관리, 기사관리, 테스트
  - 관리자/매니저 전용 접근
  - 카드 기반 UI 디자인

### 2. **UserManagement.tsx**
- **위치**: `/src/components/admin/UserManagement.tsx`
- **타입**: 관리 컴포넌트 (모달 포함)
- **기능**: 사용자 및 기사 관리
- **특징**:
  - **이중 탭 시스템**: 사용자 탭, 기사 탭
  - **사용자 관리**:
    - 파트너사 등록 모달
    - 주소 검색 통합된 사용자 편집 모달
    - 검색 및 필터 기능
    - 역할 기반 권한 (관리자/매니저/파트너)
    - 완전한 CRUD 작업
  - **기사 관리**:
    - 배송 데이터에서 동적 기사 목록
    - 통계 표시 (현재 주문, 총 배송)

### 3. **AdminShippingForm.tsx**
- **위치**: `/src/components/admin/AdminShippingForm.tsx`
- **타입**: 복합 폼 컴포넌트 (관리자 전용)
- **기능**: 관리자용 배송 접수 폼
- **특징**:
  - **고유 관리자 기능**: 파트너사 선택 및 검색
  - **8개 정보 섹션**:
    1. 파트너사 선택 (관리자 전용)
    2. 발송인 정보
    3. 고객 정보 (방문지)
    4. 배송 유형 및 일정
    5. 건물 및 접근성 정보
    6. 제품 정보 (모달 선택 포함)
    7. 배송 비용 및 옵션
    8. 메모 및 특별 지시사항
  - **고급 기능**:
    - Daum 주소 검색 통합
    - 제품 선택 모달
    - 선택된 파트너의 기본 정보 자동 입력
    - 26개 이상 필드를 포함한 종합 폼

## 파트너 컴포넌트

### 1. **PartnerDashboard.tsx**
- **위치**: `/src/components/partner/PartnerDashboard.tsx`
- **타입**: 대시보드 컴포넌트 (파트너 전용)
- **기능**: 파트너 메인 화면
- **특징**:
  - 2×2 그리드 레이아웃 (4개 메인 기능)
  - 메뉴: 배송조회, 배송접수, 상품조회, 상품등록
  - 파트너 전용 브랜딩 및 스타일링

### 2. **PartnerShippingForm.tsx**
- **위치**: `/src/components/partner/PartnerShippingForm.tsx`
- **타입**: 폼 컴포넌트 (파트너 전용)
- **기능**: 파트너용 배송 접수 폼
- **특징**:
  - 파트너 전용 배송 등록 폼
  - 사용자 기본값 자동 설정
  - AdminShippingForm과 동일한 디자인 및 필드

### 3. **기타 파트너 컴포넌트**:
- **PartnerProductForm.tsx**: 제품 등록 폼
- **PartnerProductList.tsx**: 제품 목록 및 관리
- **PartnerDeliveryList.tsx**: 배송 상태 추적
- **PartnerDeliveryDetail.tsx**: 상세 배송 정보
- **PartnerTrackingPage.tsx**: 배송 추적 인터페이스

## 대시보드 및 추적 컴포넌트

### 1. **Dashboard.tsx**
- **위치**: `/src/components/dashboard/Dashboard.tsx`
- **타입**: 메인 대시보드 컴포넌트 (관리자/매니저)
- **기능**: 배송 관리 대시보드
- **특징**:
  - **실시간 데이터 업데이트**: 10초 자동 새로고침 (가시성 감지)
  - **통계 카드**: 총 주문, 대기, 창고, 완료 배송
  - **고급 검색 및 필터링**: 다중 필드 검색 및 상태 필터
  - **반응형 디자인**: 데스크톱 테이블 뷰, 모바일 카드 뷰
  - **데이터 내보내기**: 날짜 범위 필터링으로 Excel/CSV 내보내기
  - **상태 관리**: 실시간 상태 배지 업데이트

### 2. **OrderDetailModal.tsx**
- **위치**: `/src/components/dashboard/OrderDetailModal.tsx`
- **타입**: 모달 컴포넌트
- **기능**: 상세 주문 정보 표시

### 3. **TrackingPage.tsx**
- **위치**: `/src/components/tracking/TrackingPage.tsx`
- **타입**: 추적 페이지 컴포넌트
- **기능**: 공개 배송 추적 인터페이스

## 모달 컴포넌트

### 1. **제품 선택 모달**:
- **ProductSelectionModal.tsx**: 제품 선택 인터페이스
- **QRCodeScannerModal.tsx**: QR 코드 스캔 기능
- **LabelPhotographyModal.tsx**: 라벨 사진 촬영

### 2. **테스트 및 관리 모달**:
- **PartnersListModal.tsx**: 파트너 관리 인터페이스
- **DriversListModal.tsx**: 기사 선택 및 관리
- **DeliveriesListModal.tsx**: 배송 목록 모달
- **DeliveryCreateModal.tsx**: 빠른 배송 생성

### 3. **유틸리티 모달**:
- **DbSchemaViewer.tsx**: 데이터베이스 스키마 시각화 (관리자 도구)

## 폼 컴포넌트

### 1. **ShippingOrderForm.tsx**
- **위치**: `/src/components/shipping/ShippingOrderForm.tsx`
- **타입**: 메인 배송 폼 컴포넌트
- **기능**: 일반 배송 주문 폼 (비관리자 버전)

### 2. **전문화된 폼**:
- **AdminShippingForm.tsx**: 관리자 전용 강화된 폼
- **PartnerShippingForm.tsx**: 파트너 전용 배송 폼
- **PartnerProductForm.tsx**: 제품 등록 폼

## 관리 컴포넌트

### 1. **ProductManagement.tsx**
- **위치**: `/src/components/products/ProductManagement.tsx`
- **타입**: 제품 CRUD 관리
- **기능**: 제품 생성, 편집, 삭제, 검색

### 2. **DriverManagement.tsx**
- **위치**: `/src/components/drivers/DriverManagement.tsx`
- **타입**: 기사 CRUD 관리
- **기능**: 기사 등록, 관리, 배정

### 3. **DriverAssignment.tsx**
- **위치**: `/src/components/assignment/DriverAssignment.tsx`
- **타입**: 배정 관리
- **기능**: 기사-배송 배정 인터페이스

## 유틸리티 컴포넌트

### 1. **알림 컴포넌트**:
- **ToastContainer.tsx**: 토스트 알림 시스템
- **NotificationPermission.tsx**: 브라우저 알림 권한 처리기

### 2. **지도 컴포넌트**:
- **SimpleNaverMap.tsx**: 배송 추적용 네이버 맵 통합

### 3. **프로필 컴포넌트**:
- **UserProfile.tsx**: 사용자 프로필 관리 및 설정

### 4. **테스트 컴포넌트**:
- **TestPage.tsx**: 데이터베이스 작업을 포함한 관리자 테스트 인터페이스

## 지원 인프라

### 1. **훅 (/hooks/ 디렉토리)**:
- **useAuth.ts**:
  - **기능**: 완전한 인증 상태 관리
  - **5일 자동 로그인**: 자동 새로고침이 있는 로컬 세션 저장
  - **JWT 토큰 관리**: 토큰 저장, 검증, 갱신
  - **세션 관리**: 서버/클라이언트 세션 동기화

- **useNotification.ts**: 브라우저 알림 관리

### 2. **서비스 (/services/ 디렉토리)**:
- **api.ts**:
  - **포괄적인 API 계층**: 10개 이상 API 모듈
  - **인증 API**: 로그인, 등록, 세션 관리
  - **배송 API**: 배송 CRUD 작업
  - **사용자 관리 API**: 파트너 및 기사 관리
  - **제품 API**: 제품 CRUD 작업
  - **QR 코드 API**: QR 코드 제품 통합
  - **테스트 API**: 데이터베이스 테스트 및 관리

## 기능별 컴포넌트 구성

### **인증 시스템**
- AuthPage.tsx (로그인/등록)
- useAuth.ts (상태 관리)
- API 인증 메서드

### **관리자 관리 인터페이스**
- AdminDashboard.tsx (메인 관리자 허브)
- UserManagement.tsx (사용자/기사 관리)
- AdminShippingForm.tsx (강화된 배송 폼)
- ProductManagement.tsx, DriverManagement.tsx

### **파트너 인터페이스**
- PartnerDashboard.tsx (파트너 허브)
- 파트너 전용 폼 및 목록
- 제품 관리 도구

### **배송 및 추적 시스템**
- Dashboard.tsx (메인 배송 대시보드)
- 추적 컴포넌트
- 상태 관리 도구
- 실시간 업데이트

### **폼 시스템**
- 다양한 사용자 역할을 위한 전문화된 폼
- 모달 기반 선택 인터페이스
- 주소 검색 통합
- QR 코드를 사용한 제품 선택

### **테스트 및 개발 도구**
- TestPage.tsx (관리자 테스트 인터페이스)
- 데이터베이스 스키마 뷰어
- 데이터 생성 도구

## 주요 기술적 특징

1. **역할 기반 접근 제어**: 관리자, 매니저, 파트너 역할에 따른 다른 인터페이스
2. **실시간 업데이트**: 가시성 감지가 있는 자동 새로고침 대시보드
3. **반응형 디자인**: 모바일 및 데스크톱 최적화된 인터페이스
4. **고급 폼**: 검증 및 자동 입력이 있는 다단계 폼
5. **모달 기반 워크플로우**: 복잡한 상호작용을 위한 광범위한 모달 사용
6. **통합 서비스**: QR 코드, 지도, 주소 검색, 사진 촬영
7. **포괄적인 API 계층**: 오류 처리가 있는 완전한 REST API 통합
8. **세션 관리**: JWT 토큰 관리가 있는 5일 자동 로그인

## 컴포넌트 파일 경로 요약

```
/src/components/
├── admin/
│   ├── AdminDashboard.tsx           # 관리자 메인 대시보드
│   ├── AdminShippingForm.tsx        # 관리자용 배송접수 폼
│   └── UserManagement.tsx           # 사용자/기사 관리
├── assignment/
│   └── DriverAssignment.tsx         # 기사 배정
├── auth/
│   └── AuthPage.tsx                 # 로그인/회원가입
├── dashboard/
│   ├── Dashboard.tsx                # 메인 배송 대시보드
│   └── OrderDetailModal.tsx         # 주문 상세 모달
├── delivery/
│   └── DeliveryDetailView.tsx       # 배송 상세 보기
├── drivers/
│   └── DriverManagement.tsx         # 기사 관리
├── map/
│   └── SimpleNaverMap.tsx           # 네이버 지도
├── notifications/
│   ├── NotificationPermission.tsx   # 알림 권한
│   └── ToastContainer.tsx           # 토스트 알림
├── partner/
│   ├── PartnerDashboard.tsx         # 파트너 대시보드
│   ├── PartnerShippingForm.tsx      # 파트너용 배송접수 폼
│   ├── PartnerProductForm.tsx       # 파트너용 상품등록 폼
│   ├── PartnerProductList.tsx       # 파트너용 상품목록
│   ├── PartnerDeliveryList.tsx      # 파트너용 배송목록
│   ├── PartnerDeliveryDetail.tsx    # 파트너용 배송상세
│   ├── PartnerTrackingPage.tsx      # 파트너용 추적
│   ├── ProductSelectionModal.tsx    # 상품 선택 모달
│   ├── QRCodeScannerModal.tsx       # QR 코드 스캐너
│   └── LabelPhotographyModal.tsx    # 라벨 촬영 모달
├── products/
│   └── ProductManagement.tsx        # 상품 관리
├── profile/
│   └── UserProfile.tsx              # 사용자 프로필
├── shipping/
│   └── ShippingOrderForm.tsx        # 일반 배송 폼
├── test/
│   ├── TestPage.tsx                 # 테스트 페이지
│   ├── DbSchemaViewer.tsx           # DB 스키마 뷰어
│   ├── PartnersListModal.tsx        # 파트너 목록 모달
│   ├── DriversListModal.tsx         # 기사 목록 모달
│   ├── DeliveriesListModal.tsx      # 배송 목록 모달
│   └── DeliveryCreateModal.tsx      # 배송 생성 모달
└── tracking/
    └── TrackingPage.tsx             # 공개 추적 페이지
```

이 EasyPicks 프론트엔드는 다양한 사용자 역할에 맞춤화된 정교한 사용자 인터페이스와 포괄적인 비즈니스 로직 구현을 갖춘 완전한 배송 관리 시스템을 나타냅니다.