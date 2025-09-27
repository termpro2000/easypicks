# 🚚 이지픽스 배송 관리 시스템

React Native 모바일 앱, React 웹 어드민, Node.js 백엔드 서버로 구성된 완전한 배송 관리 시스템입니다.

> **최근 업데이트**: 2025-09-27 - 파트너 선택 기반 배송접수 워크플로우 구현 완료 🎉
> 
> 🌟 **신규 기능**: 관리자 배송접수 시 필수 파트너 선택을 통한 체계적인 데이터 관리 및 추적!

## 📋 목차
- [프로젝트 구조](#프로젝트-구조)
- [주요 기능](#주요-기능)
- [🌐 웹 어드민 대시보드](#-웹-어드민-대시보드)
- [🎯 멀티-프로덕트 배송 시스템](#-멀티-프로덕트-배송-시스템)
- [👤 사용자 프로필 모달 시스템](#-사용자-프로필-모달-시스템)
- [🔐 비밀번호 변경 기능](#-비밀번호-변경-기능)
- [🗃️ User Detail 시스템 (Role 기반 추가정보 관리)](#️-user-detail-시스템-role-기반-추가정보-관리)
- [🤝 파트너 선택 기반 배송접수 워크플로우](#-파트너-선택-기반-배송접수-워크플로우)
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
├── 📁 백엔드 서버 (Node.js + Express + MySQL)
│   ├── server.js              # 서버 진입점
│   ├── package.json           # 백엔드 의존성
│   ├── .env                   # 환경 변수
│   ├── config/
│   │   └── database.js        # MySQL 데이터베이스 연결 (PlanetScale)
│   ├── controllers/
│   │   ├── authController.js  # 인증 로직
│   │   ├── deliveryController.js # 배송 관리 로직
│   │   └── driversController.js # 기사 관리 로직 (신규)
│   ├── routes/
│   │   ├── auth.js           # 인증 관련 API
│   │   ├── delivery.js       # 배송 관련 API
│   │   └── drivers.js        # 기사 관리 API (신규)
│   └── middleware/
│       └── authMiddleware.js  # JWT 인증 미들웨어
├── 📁 React 웹 어드민 대시보드 (신규)
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── admin/
│       │   │   │   ├── AdminDashboard.tsx    # 메인 대시보드
│       │   │   │   ├── AdminShippingForm.tsx # 배송 접수 폼
│       │   │   │   └── UserManagement.tsx    # 사용자 관리
│       │   │   ├── products/
│       │   │   │   └── ProductManagement.tsx # 상품 관리 (복구)
│       │   │   ├── drivers/
│       │   │   │   └── DriverManagement.tsx  # 기사 관리 (복구)
│       │   │   └── assignment/
│       │   │       └── DriverAssignment.tsx  # 기사 배정 (복구)
│       │   └── services/
│       │       └── api.ts             # API 서비스 레이어
│       ├── package.json               # 프론트엔드 의존성
│       └── vite.config.ts            # Vite 빌드 설정
├── 📁 React Native 모바일 앱
│   └── expo-mobile/
│       ├── App.js                    # 앱 진입점
│       ├── package.json              # 모바일 의존성
│       ├── app.json                  # Expo 설정
│       ├── eas.json                  # EAS Build 설정
│       └── src/
│           ├── config/
│           │   ├── api.js            # API 설정
│           │   └── firebase.js       # Firebase 설정
│           └── screens/
│               ├── LoginScreen.js
│               ├── DeliveryListScreen.js
│               └── DeliveryDetailScreen.js
└── 📁 문서
    ├── README.md                     # 이 파일
    ├── frontend/CLAUDE.md            # 웹 개발 로그 (신규)
    └── expo-mobile/CLAUDE.md         # 모바일 개발 로그
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

## 🌐 웹 어드민 대시보드

### 🎛️ 관리자 대시보드 시스템
완전한 React/TypeScript 기반 웹 어드민 인터페이스가 HTML 커버리지 파일에서 복구되어 구현되었습니다:

#### 📊 AdminDashboard (메인 허브)
- **통합 네비게이션**: 모든 관리 기능에 대한 중앙 집중식 접근
- **내부 상태 관리**: `setCurrentPage` 기반 SPA 라우팅
- **실시간 통계**: 배송 현황 및 운영 지표 대시보드
- **반응형 디자인**: Tailwind CSS 기반 모바일 친화적 UI

#### 📦 ProductManagement (상품 관리)
- **완전한 CRUD 작업**: 상품 생성, 읽기, 업데이트, 삭제
- **사진 관리**: 상품 이미지 업로드 및 편집 기능
- **QR 코드 통합**: 상품 추적을 위한 QR 코드 생성
- **모달 시스템**: 사용자 친화적인 폼 인터페이스
- **API 통합**: `productsAPI` 및 `productPhotosAPI` 완전 구현

#### 🚚 AdminShippingForm (배송 접수)
- **종합 배송 폼**: 1,040+ 줄의 완전한 단일 페이지 폼
- **파트너 선택**: 동적 파트너 선택 및 관리
- **주소 검색**: 통합 주소 검색 및 유효성 검사
- **폼 검증**: 포괄적인 클라이언트 측 유효성 검사
- **단계별 → 통합**: 이전 다단계 폼에서 현대적인 단일 폼으로 업그레이드

#### 👥 UserManagement (사용자 관리)
- **이중 탭 인터페이스**: 사용자 및 기사 관리를 위한 별도 탭
- **파트너 등록**: 주소 검색 통합을 통한 파트너 등록
- **역할 기반 접근**: 역할 기반 사용자 편집 및 삭제
- **기사 통계**: 기사 성과 추적 및 관리 지표
- **포괄적인 API**: 완전한 CRUD 작업을 위한 `userAPI`

#### 🚛 DriverManagement (기사 관리)
- **전용 기사 인터페이스**: 기사 관리를 위한 전문 구성 요소
- **차량 정보**: 차량 유형, 번호, 라이선스 관리
- **검색 및 필터링**: 고급 기사 검색 기능
- **모달 기반 폼**: 생성/편집 작업을 위한 깔끔한 모달
- **연락처 관리**: 포괄적인 기사 연락처 정보
- **백엔드 통합**: 완전한 백엔드 API 지원 및 데이터베이스 스키마

#### 🎯 DriverAssignment (기사 배정)
- **자동 배정**: 가용성 및 위치 기반 지능형 기사 배정
- **수동 배정**: 특정 요구 사항에 대한 관리자 수동 제어
- **실시간 업데이트**: 배정 상태의 실시간 동기화
- **배정 히스토리**: 배정 결정의 포괄적인 추적
- **통합 API**: 향상된 `deliveriesAPI` 및 `driversAPI` 기능

### 🔧 백엔드 API 개발

#### 새로운 Drivers API 구현
완전한 기사 관리 백엔드 시스템이 처음부터 구현되었습니다:

**컨트롤러 기능** (`driversController.js`):
- `getAllDrivers`: 페이지네이션을 통한 모든 기사 가져오기
- `getDriver`: 단일 기사 검색
- `createDriver`: 새 기사 등록
- `updateDriver`: 기사 정보 업데이트
- `deleteDriver`: 기사 제거
- `searchDrivers`: 이름, 사용자 이름, 전화번호, 차량 번호로 검색

**데이터베이스 스키마** (자동 생성):
```sql
CREATE TABLE IF NOT EXISTS drivers (
  driver_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  vehicle_type VARCHAR(50),
  vehicle_number VARCHAR(20),
  license_number VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**인증 및 보안**:
- JWT 토큰 기반 인증 모든 엔드포인트에 적용
- 입력 유효성 검사 및 데이터 정규화
- 포괄적인 오류 처리 및 로깅
- 검색 성능을 위한 데이터베이스 인덱스

### 🎨 기술적 우수성

#### 컴포넌트 아키텍처
- **일관된 오류 처리**: 모든 API에서 표준화된 오류 응답
- **인증 통합**: 보호된 모든 엔드포인트에 대한 JWT 토큰 통합
- **데이터 유효성 검사**: 필수 필드 유효성 검사 및 유형 확인
- **응답 형식**: 일관된 JSON 응답 구조

#### 상태 관리
- **모달 시스템**: 폼을 위한 재사용 가능한 모달 패턴
- **상태 관리**: 적절한 정리가 있는 로컬 상태
- **오류 경계**: 컴포넌트의 우아한 오류 처리
- **로딩 상태**: 사용자 친화적인 로딩 표시기

#### 빌드 및 배포
- **TypeScript 규정 준수**: 모든 컴포넌트가 엄격한 유형 검사를 통과
- **빌드 최적화**: 540KB+ 번들로 성공적으로 빌드
- **Vercel 통합**: git push 시 자동 배포
- **개발 워크플로**: 일관된 개발 및 테스트 프로세스

## 🎯 멀티-프로덕트 배송 시스템

### 📦 완전한 멀티-프로덕트 지원 구현 완료 (2025-09-24)

AdminShippingForm이 **하나의 배송에 여러 제품을 할당**할 수 있는 완전한 멀티-프로덕트 시스템으로 업그레이드되었습니다.

#### 🚀 주요 기능

##### 1. 실시간 제품 검색 시스템
- **스마트 검색**: 제품명 또는 코드로 실시간 검색 (2글자 이상)
- **드롭다운 UI**: 검색 결과를 직관적인 드롭다운으로 표시
- **제품 정보 표시**: 제품명, 코드, 무게, 크기 정보 한눈에 확인
- **자동 완성**: 선택한 제품의 정보 자동 입력

```javascript
// 제품 검색 API 호출
GET /api/products/search?q=소파
Response: [
  {
    id: 1, name: "3인용 소파", code: "SF001", 
    weight: "50kg", size: "2000x800x900mm"
  }
]
```

##### 2. 향상된 제품 목록 관리
- **시각적 개선**: 그라데이션 배경의 카드형 제품 목록
- **상세 정보**: 각 제품별 코드, 무게, 크기, 박스 정보 표시
- **자동 계산**: 선택된 모든 제품의 총 중량 실시간 계산
- **개별 관리**: 제품별 추가/제거 기능 및 중복 방지

##### 3. 완전한 데이터베이스 통합
```sql
-- 새로 추가된 테이블
CREATE TABLE delivery_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  delivery_id INT NOT NULL,
  product_code VARCHAR(50) NOT NULL,
  product_weight VARCHAR(50),
  total_weight VARCHAR(50),
  product_size VARCHAR(100),
  box_size VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id),
  INDEX idx_delivery_id (delivery_id),
  INDEX idx_product_code (product_code)
);
```

#### 🔧 기술적 구현

##### 백엔드 개선사항
- **멀티-프로덕트 API**: `POST /api/deliveries`에서 `products` 배열 처리
- **자동 저장**: 배송 생성 시 관련 제품들 자동으로 delivery_products 테이블 저장
- **에러 처리**: 제품별 저장 실패 시 개별 로깅 및 처리
- **응답 개선**: 저장된 제품 수를 응답에 포함

##### 프론트엔드 신규 기능
- **TypeScript 완전 지원**: 모든 컴포넌트 타입 안전성 보장
- **상태 관리**: React Hooks 기반 효율적인 상태 관리
- **UX 개선**: 로딩 스피너, hover 효과, 외부 클릭 감지
- **폼 검증**: 중복 제품 방지 및 필수 정보 검증

#### 📊 사용자 워크플로

```
1. 제품 검색 입력 → 2. 검색 결과 드롭다운 표시 → 3. 제품 선택 클릭
                    ↓
4. 제품 정보 자동 입력 → 5. "추가" 버튼 클릭 → 6. 제품 목록에 추가
                    ↓
7. 필요시 2-6 과정 반복 → 8. "배송접수완료" 클릭 → 9. 모든 데이터 저장
```

#### 🎨 UI/UX 개선사항

##### Before (단일 제품)
- 단순 텍스트 입력 필드
- 제품 정보 수동 입력 필요
- 하나의 제품만 배송에 할당 가능

##### After (멀티-프로덕트)
- 실시간 검색 드롭다운
- 제품 정보 자동 입력
- 여러 제품을 하나의 배송에 할당
- 총 중량 및 제품 수 자동 계산
- 시각적으로 개선된 제품 목록 표시

#### 📈 시스템 아키텍처

```
Frontend (AdminShippingForm)
├── 제품 검색 컴포넌트 (실시간 검색)
├── 제품 선택 드롭다운 (검색 결과 표시)
├── 선택된 제품 목록 (카드형 UI)
└── 폼 제출 (배송 + 제품 데이터)

Backend API
├── GET /api/products/search (제품 검색)
├── POST /api/deliveries (배송 생성 + 제품 저장)
└── POST /api/deliveries/:id/products/batch (제품 일괄 저장)

Database
├── deliveries (기존 배송 정보)
├── delivery_products (NEW: 배송-제품 관계)
└── products (제품 마스터 데이터)
```

#### 💡 핵심 특징

- **확장성**: 기존 단일 제품 시스템에서 무제한 제품 시스템으로 확장
- **호환성**: 기존 배송 생성 프로세스와 완전 호환
- **성능**: 효율적인 검색 및 데이터 저장 최적화
- **사용성**: 직관적인 UI와 자동화된 데이터 입력으로 사용자 편의성 극대화

#### 🎉 구현 결과

- ✅ **제품 검색**: 실시간 검색으로 원하는 제품 빠르게 찾기
- ✅ **멀티 선택**: 하나의 배송에 여러 제품 자유롭게 추가
- ✅ **자동 계산**: 총 중량, 제품 수 등 통계 자동 생성
- ✅ **데이터 무결성**: 배송과 제품 정보의 완전한 관계형 저장
- ✅ **사용자 경험**: 검색부터 저장까지 seamless한 워크플로

**커밋**: `ceb7963` - "Implement comprehensive multi-product delivery system in AdminShippingForm"

## 👤 사용자 프로필 모달 시스템

### 🖱️ 클릭 가능한 Role 배지와 완전한 프로필 관리 (2025-09-25)

AdminDashboard에서 **사용자 role 배지를 클릭**하면 로그인된 사용자의 완전한 프로필 정보를 보고 편집할 수 있는 포괄적인 모달 시스템이 구현되었습니다.

#### 🚀 주요 기능

##### 1. 클릭 가능한 Role 배지
- **Interactive UI**: 관리자/매니저/기사/파트너사 배지를 클릭 가능한 버튼으로 변경
- **Visual Feedback**: 호버 효과, 툴팁, 크기 변환 애니메이션
- **Direct Access**: 즉시 사용자 프로필 모달 열기

```typescript
// AdminDashboard.tsx - 클릭 가능한 role 배지
<button
  onClick={() => setShowUserProfile(true)}
  className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 
    cursor-pointer hover:shadow-md transform hover:scale-105 ${roleColors}`}
  title="프로필 보기/편집"
>
  {getRoleLabel(user.role)}
</button>
```

##### 2. 완전한 사용자 프로필 표시
- **현재 사용자 정보**: 로그인된 사용자의 정보를 users 테이블에서 직접 표시
- **모든 필드 커버**: 기본정보, 연락처, 회사정보, 주소, 시스템 정보
- **2컬럼 레이아웃**: 정보를 논리적 섹션으로 구성된 반응형 디자인

##### 3. 편집 모드와 읽기 모드
- **Mode Toggle**: 편집/읽기 모드 간 seamless 전환
- **Real-time Validation**: 입력 필드별 실시간 유효성 검증
- **Status Indicators**: 활성/비활성 상태, role 변경 등 시각적 표시

#### 🔧 기술적 구현

##### Frontend 컴포넌트 아키텍처
```typescript
// UserProfileModal.tsx - 완전한 프로필 관리 모달
interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;          // 로그인된 사용자 정보 직접 전달
  onUserUpdated?: () => void;
}
```

##### 상태 관리
```typescript
const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  isOpen, onClose, currentUser, onUserUpdated 
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editedUser, setEditedUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Load user profile data from currentUser prop (no API call needed)
  useEffect(() => {
    if (isOpen && currentUser) {
      setUser(currentUser as UserProfile);
      setEditedUser({ ...currentUser } as UserProfile);
    }
  }, [isOpen, currentUser]);
};
```

##### API 통합
```typescript
// services/api.ts - 사용자 정보 업데이트
export const userAPI = {
  // 사용자 ID로 조회
  getUserById: async (id: string) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // 사용자 정보 업데이트
  updateUser: async (id: string, data: any) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },
};
```

#### 📊 필드 정보 관리

**기본 정보 섹션**:
- 사용자 ID, 이름, 권한 (admin/manager/driver/user)
- 활성 상태 토글

**연락처 정보 섹션**:
- 이메일, 전화번호
- 비상연락처, 비상연락처 전화번호

**회사 정보 섹션**:
- 회사명, 부서, 직급

**주소 정보 섹션**:
- 주소, 기본 발송지 주소

**추가 정보 섹션**:
- 메모, 시스템 정보 (생성일, 수정일, 마지막 로그인)

#### 🎨 UI/UX 개선사항

##### 시각적 디자인
```css
/* 모달 디자인 - 현대적이고 직관적 */
.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 4xl;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Role 배지 호버 효과 */
.role-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

##### 사용자 경험
- **Immediate Loading**: API 호출 없이 즉시 사용자 정보 표시
- **Smart Defaults**: 기존 값 유지 및 스마트 입력 필드
- **Error Handling**: 포괄적인 에러 처리 및 사용자 피드백
- **Success Feedback**: 저장 완료 시 명확한 성공 메시지

## 🔐 비밀번호 변경 기능

### 🔒 통합된 보안 관리 시스템 (2025-09-25)

사용자 프로필 모달 내에서 **비밀번호 변경 기능**이 완전히 통합되어, 보안 관리를 위한 원스톱 솔루션을 제공합니다.

#### 🚀 주요 기능

##### 1. 통합된 비밀번호 변경 UI
- **Header Integration**: 프로필 모달 헤더에 "비밀번호 변경" 버튼 추가
- **Toggle Section**: 클릭 시 비밀번호 변경 섹션 표시/숨기기
- **Purple Theme**: 보안 기능을 나타내는 전용 퍼플 테마

##### 2. 완전한 보안 검증 시스템
- **3단계 입력**: 현재 비밀번호, 새 비밀번호, 새 비밀번호 확인
- **Real-time Validation**: 
  - 현재 비밀번호 확인
  - 새 비밀번호 최소 6자 검증
  - 비밀번호 일치 확인
- **Show/Hide Toggle**: 각 필드별 비밀번호 보기/숨기기 기능

##### 3. 사용자 친화적 인터페이스
```typescript
// 비밀번호 변경 섹션 UI
{showPasswordSection && (
  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
    <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
      <Key className="w-5 h-5" />
      비밀번호 변경
    </h4>
    
    {/* Current Password Field */}
    <div className="relative">
      <input type={showPasswords.current ? "text" : "password"} />
      <button onClick={() => togglePasswordVisibility('current')}>
        {showPasswords.current ? <EyeOff /> : <Eye />}
      </button>
    </div>
  </div>
)}
```

#### 🔧 백엔드 보안 구현

##### 비밀번호 변경 API
```javascript
// routes/users.js - 비밀번호 변경 엔드포인트
router.put('/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // 입력값 검증
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '새 비밀번호는 최소 6자 이상이어야 합니다.'
      });
    }

    // 현재 비밀번호 확인
    const [users] = await pool.execute(
      'SELECT id, username, password FROM users WHERE id = ?', [id]
    );

    if (users[0].password !== currentPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호가 올바르지 않습니다.'
      });
    }

    // 새 비밀번호로 업데이트
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', 
      [newPassword, id]
    );

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: '비밀번호 변경 중 오류가 발생했습니다.'
    });
  }
});
```

#### 🛡️ 보안 검증 플로우

##### Frontend 검증
```typescript
const handlePasswordChange = async () => {
  // 1. 필드 완성도 검증
  if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
    setPasswordError('모든 비밀번호 필드를 입력해주세요.');
    return;
  }

  // 2. 비밀번호 일치 검증
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    setPasswordError('새 비밀번호가 일치하지 않습니다.');
    return;
  }

  // 3. 길이 검증
  if (passwordData.newPassword.length < 6) {
    setPasswordError('새 비밀번호는 최소 6자 이상이어야 합니다.');
    return;
  }

  // 4. API 호출
  const response = await userAPI.changePassword({
    userId: user.id.toString(),
    currentPassword: passwordData.currentPassword,
    newPassword: passwordData.newPassword
  });
};
```

##### 상태 관리
```typescript
// 비밀번호 변경 관련 상태
const [showPasswordSection, setShowPasswordSection] = useState(false);
const [passwordData, setPasswordData] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const [showPasswords, setShowPasswords] = useState({
  current: false,
  new: false,
  confirm: false
});
const [passwordError, setPasswordError] = useState<string | null>(null);
```

#### 📱 사용자 워크플로

```
1. Role 배지 클릭 → 2. 프로필 모달 열림 → 3. "비밀번호 변경" 버튼 클릭
                    ↓
4. 비밀번호 변경 섹션 표시 → 5. 현재 비밀번호 입력 → 6. 새 비밀번호 입력 및 확인
                    ↓
7. 실시간 검증 확인 → 8. "비밀번호 변경" 버튼 클릭 → 9. 백엔드 검증 및 업데이트
                    ↓
10. 성공 메시지 표시 → 11. 비밀번호 필드 초기화 → 12. 섹션 자동 닫기
```

#### 🎯 보안 특징

##### 클라이언트 측 보안
- **Input Masking**: 기본적으로 모든 비밀번호 필드 마스킹
- **Toggle Visibility**: 사용자 선택에 따른 비밀번호 표시/숨김
- **Auto Clear**: 성공적인 변경 후 모든 필드 자동 초기화
- **Session Security**: 변경 완료 후 필요시 페이지 새로고침

##### 서버 측 보안
- **JWT Authentication**: 인증된 사용자만 접근 가능
- **Input Validation**: 모든 입력 값 서버 측 재검증
- **Password Verification**: 현재 비밀번호 정확성 확인
- **Database Update**: 안전한 쿼리 실행 및 타임스탬프 업데이트

#### 🚀 기술적 성취

##### 통합 시스템
- **Single Modal**: 하나의 모달에서 프로필 관리와 보안 관리 통합
- **State Management**: 효율적인 상태 관리로 UI/UX 최적화
- **Error Handling**: 포괄적인 에러 처리 및 사용자 피드백
- **API Design**: RESTful API 설계로 확장성 확보

##### 사용자 경험
- **No Page Refresh**: 모달 내에서 모든 작업 완료
- **Immediate Feedback**: 실시간 검증 및 즉시 피드백
- **Intuitive UI**: 직관적인 아이콘과 색상 구분
- **Responsive Design**: 모바일 친화적 반응형 디자인

**커밋**: `50c5575` - "사용자 프로필 모달 시스템 구현: 클릭 가능한 role 배지와 완전한 프로필 편집 기능"

## 🗃️ User Detail 시스템 (Role 기반 추가정보 관리)

### 📊 완전한 Role 기반 상세정보 시스템 (2025-09-26)

사용자 프로필 모달에서 **모든 사용자 role에 대한 전용 추가정보 섹션**이 완전히 구현되었습니다. drivers 테이블을 user_detail 테이블로 대체하여 JSON 기반의 유연한 데이터 관리 시스템을 구축했습니다.

#### 🚀 주요 기능

##### 1. User Detail 테이블 구조
```sql
CREATE TABLE user_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role ENUM('admin', 'manager', 'user', 'driver') NOT NULL,
    detail JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_role (role),
    UNIQUE KEY unique_user_detail (user_id)
);
```

##### 2. Role별 추가정보 섹션

**👥 User Role (파트너사 정보)** - Building 아이콘
- **발송인명(발송업체명)** - `sender_name`: 파트너사 발송인 이름
- **발송업체명** - `sender_company`: 정식 회사명
- **발송인주소** - `sender_address`: 발송지 주소
- **상세주소** - `sender_detail_address`: 상세 주소 정보
- **긴급연락담당자** - `emergency_contact_name`: 비상시 연락할 담당자
- **긴급연락전화번호** - `emergency_contact_phone`: 비상 연락처

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

**🚛 Driver Role (기사 정보)** - Truck 아이콘
- **기사명** - `name`: 기사의 실제 이름
- **연락처** - `phone`: 연락 전화번호 (Phone 아이콘)
- **이메일** - `email`: 이메일 주소 (Mail 아이콘)
- **차량 타입** - `vehicle_type`: 차량 종류 (Truck 아이콘)
- **차량 번호** - `vehicle_number`: 차량 번호판
- **적재 용량** - `cargo_capacity`: 최대 적재 가능량
- **배송 지역** - `delivery_area`: 담당 배송 구역 (MapPin 아이콘)

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

**🛡️ Admin/Manager Role (관리자 정보)** - Shield 아이콘
- **주소** - `address`: 관리자 주소 (Home 아이콘)
- **상세주소** - `detail_address`: 상세 주소 정보 (MapPin 아이콘)
- **우편번호** - `zipcode`: 6자리 우편번호
- **메모** - `memo`: 관리자 메모 (FileText 아이콘, 여러 줄 지원)

```json
{
  "address": "서울시 강남구 테헤란로 123",
  "detail_address": "456호",
  "zipcode": "06234",
  "memo": "시스템 관리자 계정"
}
```

### 🤝 파트너 선택 기반 배송접수 워크플로우

### 📋 관리자 배송접수 프로세스 (2025-09-27)

**AdminDashboard**에서 **파트너사 선택을 통한 체계적인 배송접수 시스템**이 구현되었습니다. 이를 통해 관리자는 반드시 파트너사를 먼저 선택한 후 해당 파트너와 연결된 배송 데이터를 생성할 수 있습니다.

#### 🚀 업무 순서

```
1. 새배송접수 클릭 → 2. SelectPartnerForm 표시 → 3. 파트너사 선택 →
4. AdminShippingForm 표시 → 5. 배송접수완료 클릭 → 6. 배송데이터 생성 (user_id 포함)
```

#### 🔧 기술적 구현

##### 1. AdminDashboard 네비게이션 확장
```typescript
// 새로운 페이지 타입 추가
type AdminPageType = 'main' | 'new-order' | 'select-partner-for-shipping' | ...

// 새배송접수 클릭 시 파트너 선택 우선
case '새배송접수':
  setCurrentPage('select-partner-for-shipping');
  break;
```

##### 2. SelectPartnerForm 통합
- **재사용 가능한 컴포넌트**: 상품관리와 배송접수에서 동일한 SelectPartnerForm 사용
- **역할 필터링**: `users.role = 'user'` 조건으로 파트너사만 표시
- **검색 및 선택**: 파트너사 검색 후 선택 시 ID와 이름 전달

```typescript
// 파트너 선택 후 AdminShippingForm으로 이동
onPartnerSelect={(partnerId, partnerName) => {
  setSelectedPartnerId(partnerId);
  setSelectedPartnerName(partnerName);
  setCurrentPage('new-order');
}}
```

##### 3. AdminShippingForm 강화
- **파트너 정보 표시**: 헤더에 선택된 파트너명 표시
- **자동 연결**: 배송 데이터 생성 시 `user_id`에 선택된 파트너 ID 자동 포함
- **Props 인터페이스 확장**:

```typescript
interface AdminShippingFormProps {
  onNavigateBack: () => void;
  selectedPartnerId?: number | null;
  selectedPartnerName?: string;
}
```

##### 4. 데이터베이스 연동
```javascript
// 배송 데이터 생성 시 파트너 ID 포함
const deliveryData = {
  sender_name: data.sender_name,
  customer_name: data.customer_name,
  // ... 기타 필드들
  user_id: selectedPartnerId,  // 선택된 파트너 ID 자동 포함
};
```

#### 📊 사용자 경험 개선

##### Before (기존 시스템)
- 새배송접수 → AdminShippingForm 직접 이동
- 파트너 정보 수동 입력 또는 누락 가능
- 배송 데이터와 파트너 연결 불확실

##### After (개선된 시스템)
- 새배송접수 → 파트너 선택 → AdminShippingForm 이동
- 선택된 파트너 정보 헤더에 표시
- 배송 데이터에 파트너 ID 자동 연결 보장

#### 🎯 비즈니스 가치

##### 1. 데이터 무결성 보장
- **필수 파트너 선택**: 모든 배송 건이 특정 파트너와 연결됨
- **누락 방지**: 파트너 정보 입력 누락 원천 차단
- **추적 가능성**: 배송 건별 파트너사 추적 완벽 지원

##### 2. 운영 효율성 향상
- **체계적 프로세스**: 일관된 배송접수 절차
- **파트너 관리**: 파트너별 배송 현황 관리 용이
- **권한 관리**: 관리자의 체계적인 파트너사 관리

##### 3. 확장성 확보
- **멀티 테넌트**: 여러 파트너사 동시 관리 가능
- **역할 분리**: 파트너별 데이터 분리 및 권한 관리
- **통계 분석**: 파트너별 배송 성과 분석 기반 마련

#### 📱 사용자 워크플로우

```
관리자 로그인 → AdminDashboard 접근 → [새배송접수] 클릭
                    ↓
SelectPartnerForm 표시 → 파트너 검색/선택 → [선택] 클릭
                    ↓
AdminShippingForm 표시 (파트너명 헤더 표시) → 배송 정보 입력
                    ↓
[배송접수완료] 클릭 → 배송데이터 생성 (user_id 포함) → 성공 메시지
```

#### 🔗 시스템 통합

##### 기존 시스템과의 호환성
- **상품관리**: 동일한 SelectPartnerForm 재사용으로 일관성 유지
- **기존 배송 데이터**: 기존 배송 건들과 완전 호환
- **API 구조**: 기존 deliveries API 구조 유지하며 user_id 필드만 추가

##### 향후 확장 방향
- **파트너별 대시보드**: 파트너사별 전용 관리 화면
- **권한 기반 접근**: 파트너사별 데이터 접근 권한 관리
- **통계 및 리포팅**: 파트너별 배송 성과 분석 시스템

**커밋**: `ddd69c4` - "Implement partner selection workflow for delivery registration"

### 🔧 기술적 구현

##### Backend API 시스템
- **GET /api/user-detail/:userId** - 사용자별 상세정보 조회
- **POST /api/user-detail/:userId** - 상세정보 생성/업데이트
- **PUT /api/user-detail/:userId** - 상세정보 업데이트
- **DELETE /api/user-detail/:userId** - 상세정보 삭제
- **JSON 파싱**: 자동 JSON 파싱 및 에러 처리
- **데이터 검증**: 사용자 존재 확인 및 입력값 검증

##### Frontend 통합
```typescript
// API 연동
export const userDetailAPI = {
  getUserDetail: async (userId: string) => { ... },
  createOrUpdateUserDetail: async (userId: string, data: any) => { ... },
  updateUserDetail: async (userId: string, data: any) => { ... },
  deleteUserDetail: async (userId: string) => { ... }
};

// 상태 관리
const [userDetail, setUserDetail] = useState<any>(null);
const [editedUserDetail, setEditedUserDetail] = useState<any>({});
const [isLoadingDetail, setIsLoadingDetail] = useState(false);
```

#### 🎨 UI/UX 특징

##### 시각적 디자인
- **Role별 전용 아이콘**: Building(파트너사), Truck(기사), Shield(관리자)
- **필드별 아이콘**: Phone, Mail, Home, MapPin, FileText 등 의미있는 아이콘
- **동적 제목**: role에 따라 "관리자 추가정보" 또는 "매니저 추가정보"
- **일관된 레이아웃**: 모든 role에서 통일된 그리드 레이아웃

##### 사용자 경험
- **편집 모드**: 편집 버튼 클릭 시에만 필드 수정 가능
- **자동 로드**: 모달 오픈 시 user_detail 자동 로드 및 표시
- **통합 저장**: 기본 사용자 정보와 추가정보 동시 저장
- **로딩 상태**: 모든 섹션에서 일관된 스피너 로딩 표시
- **입력 검증**: email, tel 타입, maxLength 등 적절한 제한
- **다양한 입력**: input, textarea로 데이터 특성에 맞는 UI

#### 📊 데이터 마이그레이션

##### 기존 drivers 테이블에서 user_detail로 이전
```sql
-- 기존 drivers 데이터를 user_detail로 마이그레이션
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
```

##### PlanetScale 호환성
- **외래키 제약조건 없음**: PlanetScale의 제약사항에 맞춘 설계
- **인덱스 최적화**: 검색 성능을 위한 user_id, role 인덱스
- **유니크 제약조건**: 한 사용자당 하나의 상세정보만 허용

#### 🔄 시스템 아키텍처

**데이터 플로우**:
```
사용자 프로필 모달 열기 → user_detail API 호출 → JSON 파싱 →
Role별 UI 렌더링 → 편집 모드 → 데이터 수정 → 통합 저장 →
기본 사용자 정보 + user_detail 동시 업데이트
```

**확장성**:
- **새로운 Role 추가**: 쉽게 새로운 role과 필드 추가 가능
- **유연한 스키마**: JSON 기반으로 필드 변경에 유연하게 대응
- **버전 호환성**: 기존 데이터와의 하위 호환성 유지

#### 🎯 핵심 성과

- ✅ **완전한 Role 커버리지**: user, driver, admin, manager 모든 역할 지원
- ✅ **유연한 데이터 구조**: JSON 기반으로 role별 다양한 필드 지원
- ✅ **일관된 사용자 경험**: 모든 role에서 통일된 UI/UX 패턴
- ✅ **확장 가능한 아키텍처**: 새로운 role과 필드 추가가 용이한 구조
- ✅ **데이터 무결성**: user_detail과 users 테이블 간 완전한 연동
- ✅ **성능 최적화**: 인덱스와 쿼리 최적화로 빠른 데이터 액세스
- ✅ **최적화된 UI 구조**: 시스템 정보를 맨 아래 배치하여 편집 가능한 정보 우선순위 조정

#### 🔄 UI/UX 구조 개선 (2025-09-26)

**사용자 프로필 모달 섹션 순서 최적화**:
1. **기본 정보** - 사용자 ID, 이름, 연락처, 권한 등 핵심 정보
2. **Role별 추가정보** - 편집 가능한 상세 정보 (우선순위 높음)
   - 👥 User: 파트너사 정보 (Building 아이콘)
   - 🚛 Driver: 기사 및 차량 정보 (Truck 아이콘)
   - 🛡️ Admin/Manager: 관리자 정보 (Shield 아이콘)
3. **시스템 정보** - 읽기 전용 정보 (최하단 배치)
   - 사용자 ID, 생성일, 수정일, 마지막 로그인

**사용성 개선 효과**:
- **편집 우선순위**: 실제 편집 가능한 정보가 상단에 배치
- **시각적 계층**: 중요도에 따른 논리적 정보 구조
- **효율적 워크플로**: 기본 정보 → 상세 정보 → 시스템 정보 순서로 자연스러운 탐색

**커밋**: 
- `65fe574` - "Implement user_detail table system with role-based additional information"
- `7280b0d` - "Complete role-based additional information sections in UserProfileModal"

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

#### PUT `/api/users/:id/password` - 비밀번호 변경
**헤더:** `Authorization: Bearer {token}`

**요청:**
```json
{
  "currentPassword": "current123",
  "newPassword": "newpassword123"
}
```

**응답:**
```json
{
  "success": true,
  "message": "비밀번호가 성공적으로 변경되었습니다."
}
```

**오류 응답:**
```json
{
  "success": false,
  "message": "현재 비밀번호가 올바르지 않습니다."
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
- **deliveries 테이블**: 배송 정보 (52개 필드 완전 지원)
- **delivery_products 테이블**: 멀티-프로덕트 관리 (신규)
- **products 테이블**: 제품 마스터 데이터 및 검색
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
- [x] **사용자 프로필 모달 시스템 (클릭 가능한 role 배지)**
- [x] **통합 비밀번호 변경 기능 (보안 관리)**
- [x] **User Detail 시스템 구현 (Role별 추가정보 관리)**
- [x] **JSON 기반 유연한 데이터 구조 및 PlanetScale 호환성**

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