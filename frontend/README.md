# 배송접수 웹앱 프론트엔드

한국 물류 업체를 위한 배송 접수 관리 시스템의 프론트엔드 웹 애플리케이션입니다.

## 🚀 배포 정보

- **배포 URL**: https://fdapp-rokx.vercel.app
- **배포 플랫폼**: Vercel
- **상태**: ✅ 운영 중

## 🔧 기술 스택

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **HTTP Client**: Axios
- **Form Management**: React Hook Form
- **Icons**: Lucide React
- **Authentication**: JWT Token + localStorage

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── auth/               # 인증 관련 컴포넌트
│   │   ├── admin/              # 관리자 전용 컴포넌트
│   │   │   ├── AdminDashboard.tsx    # 현대적 카드 기반 관리자 대시보드
│   │   │   ├── AdminShippingForm.tsx # 배송 접수 양식
│   │   │   └── UserManagement.tsx    # 사용자 관리 시스템
│   │   ├── dashboard/          # 대시보드 컴포넌트
│   │   │   ├── UserDashboard.tsx     # 현대적 카드 기반 사용자 대시보드
│   │   │   └── Dashboard.tsx         # 상세 주문 관리 컴포넌트
│   │   ├── partner/            # 파트너사 전용 컴포넌트
│   │   ├── test/               # 테스트 및 개발자 도구
│   │   └── common/             # 공통 UI 컴포넌트
│   ├── hooks/              # 커스텀 훅
│   │   └── useAuth.ts          # JWT 인증 훅
│   ├── services/           # API 서비스
│   │   └── api.ts              # JWT API 클라이언트
│   ├── types/              # TypeScript 타입 정의
│   │   └── index.ts            # 전역 타입
│   ├── utils/              # 유틸리티 함수
│   ├── App.tsx             # 메인 애플리케이션
│   └── main.tsx            # 애플리케이션 진입점
├── public/                 # 정적 파일
├── dist/                   # 빌드 결과물
└── package.json            # 의존성 및 스크립트
```

## 🔐 인증 시스템

### JWT 토큰 기반 인증
- **저장소**: localStorage (`jwt_token`)
- **전송**: Authorization Bearer 헤더
- **자동 관리**: API 인터셉터로 자동 헤더 설정
- **만료 처리**: 자동 토큰 제거 및 재로그인 유도

### 인증 플로우
1. 로그인 시 JWT 토큰을 localStorage에 저장
2. 모든 API 요청에 자동으로 Authorization 헤더 추가
3. 토큰 만료 시 자동 제거 및 로그아웃 처리
4. 페이지 새로고침 시 토큰 유효성 확인

## 🌐 주요 기능

### 사용자 기능
- **로그인/로그아웃**: JWT 토큰 기반 인증
- **회원가입**: 아이디 중복 확인 포함
- **배송 접수**: 발송인/수취인 정보 입력 및 접수
- **배송 추적**: 운송장 번호로 실시간 조회
- **접수 내역**: 본인 접수한 배송 목록 확인

### 관리자 기능 (AdminDashboard)
- **현대적 카드 인터페이스**: 8개 기능 카드로 직관적 관리
- **실시간 통계**: 배송, 기사, 사용자, 상품 현황 실시간 표시
- **새배송접수**: AdminShippingForm과 완벽 통합
- **배송현황**: 실시간 배송 상태 추적 및 관리
- **기사배정/관리**: 배송기사 배정 및 관리 시스템
- **사용자관리**: 전체 사용자 CRUD 관리
- **상품관리**: 제품 마스터 데이터 관리
- **개발도구**: 시스템 테스트 및 디버깅 도구

### 사용자 기능 (UserDashboard)
- **사용자 맞춤 인터페이스**: 6개 기능 카드로 간편한 관리
- **새배송접수**: 간편한 배송 접수 양식
- **배송현황**: 본인 배송 현황 실시간 확인
- **주문관리**: 상세 주문 목록 및 관리 (Dashboard 컴포넌트 연동)
- **통계보기**: 개인 배송 성공률 및 분석
- **리포트**: 월별 완료 건수 및 리포트 생성
- **설정**: 개인 계정 및 환경설정

### 반응형 디자인
- **모바일 최적화**: 태블릿, 스마트폰 지원
- **터치 친화적**: 모바일 디바이스 사용성 고려
- **다크 모드**: 사용자 선호에 따른 테마 변경

## 🛠 설치 및 실행

### 로컬 개발 환경

```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env 파일 생성)
cp .env.example .env

# 개발 서버 실행
npm run dev

# 타입 체크
npm run type-check

# 린트 검사
npm run lint

# 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

### 환경변수

```env
# API 설정
VITE_API_URL=http://localhost:3000/api

# 개발 환경 설정
VITE_NODE_ENV=development
```

## 🚀 배포 가이드

### Vercel 배포
1. Vercel 계정 생성 및 GitHub 연결
2. 프로젝트 import
3. Framework Preset: Vite 선택
4. 환경변수 설정:
   ```env
   VITE_API_URL=https://fdapp-production.up.railway.app/api
   ```
5. 자동 배포 실행

### 빌드 최적화
- **코드 분할**: 라우트별 lazy loading
- **트리 쉐이킹**: 미사용 코드 제거
- **번들 최적화**: Vite의 Rollup 기반 최적화
- **이미지 최적화**: WebP 형태로 자동 변환

## 🎨 UI/UX 설계

### 디자인 시스템 v3.0
- **현대적 카드 인터페이스**: 그라데이션 배경과 glassmorphism 효과
- **컬러 팔레트**: 그라데이션 기반 다채로운 색상 체계
  - 관리자: 빨강 계열, 매니저: 파란색 계열, 사용자: 초록색 계열
- **타이포그래피**: 그라데이션 텍스트와 가독성 높은 폰트 시스템
- **애니메이션**: 호버 스케일, 펄스, 백드롭 블러 효과
- **아이콘**: Lucide React 일관된 아이콘 세트 + 상태 표시 아이콘
- **레이아웃**: 반응형 그리드 시스템 (1-2-3 컬럼 자동 조정)

### 사용자 경험
- **직관적 네비게이션**: 메뉴 구조 단순화
- **빠른 로딩**: 코드 분할 및 최적화
- **에러 처리**: 명확한 에러 메시지 제공
- **접근성**: 키보드 네비게이션 및 스크린 리더 지원

## 📱 모바일 최적화

### 반응형 브레이크포인트
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px  
- **Desktop**: > 1024px

### 모바일 전용 기능
- **터치 제스처**: 스와이프, 탭 최적화
- **가상 키보드**: 입력 필드 최적화
- **오프라인 지원**: 기본적인 캐싱 지원

## 🔍 상태 관리

### Context API 기반
```typescript
// 인증 상태 관리
const AuthContext = createContext<AuthContextType>()

// 사용자 정보, 로그인 상태 전역 관리
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginData) => Promise<void>
  logout: () => Promise<void>
}
```

## 🛡️ 보안 기능

### 클라이언트 보안
- **XSS 방지**: React의 기본 XSS 보호
- **CSRF 방지**: JWT 토큰 기반 인증
- **민감정보 보호**: localStorage 보안 관리
- **입력 검증**: React Hook Form 기반 유효성 검사

### 토큰 보안
- **자동 만료**: 24시간 토큰 유효기간
- **자동 정리**: 만료된 토큰 자동 제거
- **재인증**: 토큰 만료 시 자동 로그아웃

## 📊 성능 최적화

### 번들 크기 최적화
- **코드 분할**: 라우트별 청크 분리
- **트리 쉐이킹**: 미사용 코드 제거
- **외부 라이브러리**: CDN 활용

### 렌더링 최적화
- **React.memo**: 불필요한 리렌더링 방지
- **useMemo/useCallback**: 계산 결과 캐싱
- **Lazy Loading**: 필요시에만 컴포넌트 로드

## 🧪 테스트 및 디버깅

### 개발자 도구 활용
- **Console 로깅**: JWT 인증 플로우 디버깅
- **Network 탭**: API 요청/응답 확인
- **Application 탭**: localStorage 토큰 확인

### 에러 추적
- **Error Boundary**: React 에러 포착 및 표시
- **Try-catch**: API 에러 핸들링
- **사용자 친화적**: 명확한 에러 메시지

## 📝 개발 가이드라인

### 코딩 컨벤션
- **TypeScript**: 엄격한 타입 검사
- **ESLint**: 코드 품질 유지
- **Prettier**: 일관된 코드 포맷
- **Import 순서**: 외부 → 내부 → 상대경로

### 컴포넌트 설계
- **단일 책임**: 하나의 컴포넌트는 하나의 역할
- **Props 타이핑**: 모든 Props에 타입 정의
- **재사용성**: 공통 컴포넌트 분리
- **접근성**: ARIA 레이블 및 키보드 네비게이션

## 📈 개발 이력

### v1.0.0 (2024-08-28)
- ✅ React + TypeScript + Vite 기본 셋업
- ✅ JWT 토큰 기반 인증 시스템 구현
- ✅ 배송 접수 및 관리 UI 구현
- ✅ 관리자 대시보드 및 사용자 관리
- ✅ Vercel 프로덕션 배포 완료
- ✅ Railway 백엔드와 크로스도메인 인증 연동
- ✅ 모바일 반응형 디자인 구현
- ✅ 실시간 배송 추적 시스템

### v3.0.0 (2025-09-25) - 현대적인 대시보드 시스템 전면 개편
- ✅ **AdminDashboard 완전 재설계**
  - 기존 6개 정사각형 버튼 → 8개 현대적 카드 기반 모듈형 인터페이스
  - 실시간 통계 표시 (배송, 기사, 사용자, 상품 현황)
  - 그라데이션 배경과 호버 애니메이션 효과
  - 상태 표시 아이콘 (경고, 성공, 에러) 자동 표시
  - 5초마다 자동 데이터 새로고침
  
- ✅ **UserDashboard 신규 개발**
  - AdminDashboard와 동일한 현대적 디자인 언어 적용
  - 6개 사용자 맞춤 카드: 새배송접수, 배송현황, 주문관리, 통계보기, 리포트, 설정
  - 역할별 차별화된 통계 및 기능 제공
  - 기존 Dashboard 컴포넌트와 매끄러운 통합

- ✅ **통합된 디자인 시스템**
  - Glassmorphism 헤더 디자인 (backdrop blur 효과)
  - 반응형 그리드 레이아웃 (1-2-3 컬럼 자동 조정)
  - 실시간 상태 인디케이터와 펄스 애니메이션
  - 그라데이션 텍스트와 아이콘 통합 시스템
  - 역할별 색상 코딩 (관리자: 빨강, 매니저: 파랑, 사용자: 초록)

- ✅ **향상된 UX/UI 기능**
  - 카드별 실시간 통계 표시 및 자동 업데이트
  - 호버 시 스케일 효과와 그림자 애니메이션
  - 백그라운드 패턴과 오버레이 효과
  - 터치 친화적 인터랙션 최적화
  - 모바일/태블릿/데스크톱 완벽 대응

- ✅ **라우팅 및 아키텍처 개선**
  - App.tsx에서 역할 기반 대시보드 자동 선택
  - 기존 Dashboard 컴포넌트를 주문 관리 세부 기능으로 재활용
  - 모듈형 페이지 네비게이션 시스템 구현
  - 플레이스홀더 페이지로 향후 확장성 준비

### v3.1.0 (2025-09-27) - DeliveryDetail 제품 테이블 시스템 구현
- ✅ **동적 제품 정보 표시 시스템**
  - 기존 정적 제품 필드 → delivery_details 테이블 기반 동적 제품 테이블 구현
  - delivery_id 기반 제품 필터링으로 정확한 데이터 표시
  - AdminShippingForm → delivery_details → DeliveryDetail 완전한 데이터 플로우 구축
  
- ✅ **API 통합 및 상태 관리**
  - deliveryDetailsAPI.getDeliveryProducts() 메서드 활용
  - React hooks 기반 제품 데이터 상태 관리 (products, productsLoading)
  - useEffect로 컴포넌트 마운트시 자동 데이터 로딩
  - 포괄적인 에러 핸들링 및 콘솔 로깅

- ✅ **전문적인 테이블 UI/UX**
  - 5컬럼 제품 테이블: 상품코드, 상품명, 상품크기, 박스크기, 무게
  - 로딩 상태: "상품 정보를 불러오는 중..." 인디케이터
  - 빈 상태: Package 아이콘과 "등록된 상품 정보가 없습니다" 메시지
  - 데이터 상태: 호버 효과가 있는 반응형 테이블
  - 헤더에 제품 개수 표시: "상품 정보 (3개)"

- ✅ **데이터베이스 연동 및 성능**
  - delivery_details 테이블의 JSON 저장 데이터 활용
  - 백엔드 JSON 파싱 및 배열 처리 자동화
  - 인덱스 최적화된 데이터베이스 쿼리 (delivery_id, detail_type 인덱스)
  - TypeScript Product 인터페이스로 타입 안전성 보장

- ✅ **호환성 및 확장성**
  - 기존 배송 특성 표시 기능 보존 (취급주의, 냉동, 서명필요)
  - 모바일/태블릿/데스크톱 반응형 디자인 지원
  - 수평 스크롤 지원으로 많은 제품 데이터 처리 가능
  - 향후 제품 편집, 추가, 삭제 기능 확장 준비

## 🤝 기여 방법

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다.

## 🆘 문제 해결

### 일반적인 문제들

**Q: 로그인 후 401 에러 발생**
- 브라우저 개발자도구 → Application → Local Storage에서 `jwt_token` 확인
- Console 탭에서 JWT 관련 로그 확인
- 토큰 만료 시간 확인 (24시간)

**Q: 빌드 에러**
- `npm run type-check`로 TypeScript 에러 확인
- `npm run lint`로 ESLint 에러 확인
- Node.js 버전 확인 (>=18 권장)

**Q: 환경변수 인식 안됨**
- 환경변수 이름이 `VITE_`로 시작하는지 확인
- `.env` 파일이 루트 디렉토리에 있는지 확인
- 서버 재시작 후 확인

---

🤖 **Generated with Claude Code** - 현대적이고 안전한 웹 애플리케이션을 목표로 합니다.