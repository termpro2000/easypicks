# EASYPICKS 배송 관리 시스템 - 백엔드

한국 물류 업체를 위한 스마트 배송 접수 관리 시스템의 백엔드 API 서버입니다.  
**5일간 자동 로그인 기능**이 포함된 차세대 배송 관리 플랫폼입니다.

## 🚀 배포 정보

- **배포 URL**: https://fdapp-production.up.railway.app
- **배포 플랫폼**: Railway
- **상태**: ✅ 운영 중

## 🔧 기술 스택

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL (PlanetScale)
- **Authentication**: JWT + Session + LocalStorage (트리플 하이브리드)
- **Password Hashing**: bcryptjs
- **Rate Limiting**: express-rate-limit
- **CORS**: cors
- **Frontend**: React 18 + TypeScript + Vite

## 📁 프로젝트 구조

```
backend/
├── controllers/           # 비즈니스 로직 컨트롤러
│   ├── authController.js     # 사용자 인증 (JWT + 세션)
│   ├── deliveriesController.js # 배송 관리 (신규)
│   ├── driversController.js   # 기사 관리 (신규)
│   ├── productsController.js  # 상품 관리 (신규)
│   ├── shippingController.js # 배송 접수 관리
│   ├── userController.js     # 사용자 관리 (관리자)
│   └── exportController.js   # 데이터 내보내기
├── middleware/           # 미들웨어
│   └── auth.js              # JWT/세션 인증 미들웨어
├── routes/              # API 라우터
│   ├── auth.js             # 인증 라우트
│   ├── deliveries.js       # 배송 관리 라우트 (신규)
│   ├── drivers.js          # 기사 관리 라우트 (신규)
│   ├── products.js         # 상품 관리 라우트 (신규)
│   ├── shipping.js         # 배송 접수 라우트
│   ├── users.js            # 사용자 관리 라우트
│   └── exports.js          # 내보내기 라우트
├── config/              # 설정 파일
│   └── database.js         # 데이터베이스 설정
├── migrations/          # 데이터베이스 마이그레이션 (신규)
│   ├── create-deliveries-table.js # 배송 테이블 생성
│   └── create-products-table.js   # 상품 테이블 생성
├── scripts/             # 유틸리티 스크립트
│   ├── setupDatabase.js    # DB 초기화 스크립트
│   └── add-sample-deliveries.js # 샘플 데이터 추가
├── login.md            # 🔐 로그인 시스템 상세 문서 (신규)
└── server.js            # 메인 서버 파일
```

## 🔐 인증 시스템 v2.0 ✨

> 📖 **상세 문서**: [login.md](./login.md) 참조

### 트리플 하이브리드 인증 (신규)
- **JWT 토큰**: API 인증용 (30일 만료)
- **서버 세션**: Express 세션 (백워드 호환)
- **로컬 세션**: localStorage 기반 (5일 자동 로그인) 🆕

### 🚀 5일 자동 로그인 기능 (NEW!)
```typescript
// 자동 로그인 체크
💾 로컬 세션 발견 → 즉시 로그인 → 백그라운드 서버 검증
```

### 주요 특징
- **즉시 로그인**: 페이지 로드시 서버 호출 없이 즉시 인증
- **스마트 만료**: 5일간 미사용시 자동 로그아웃
- **활동 추적**: 1시간마다 활동 시간 자동 업데이트
- **완전 로그아웃**: 모든 세션 데이터 즉시 제거

## 🌐 API 엔드포인트

### 인증 API
- `POST /api/auth/login` - 로그인 (JWT 토큰 발급)
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/register` - 회원가입
- `GET /api/auth/me` - 현재 사용자 정보
- `GET /api/auth/check-username/:username` - 아이디 중복 확인

### 배송 관리 API (신규 확장)
- `POST /api/deliveries` - 배송 생성 🔐
- `GET /api/deliveries` - 배송 목록 (페이지네이션) 🔐
- `GET /api/deliveries/:id` - 배송 상세 🔐
- `PUT /api/deliveries/:id` - 배송 정보 수정 🔐
- `PATCH /api/deliveries/:id/status` - 배송 상태 업데이트 🔐
- `GET /api/deliveries/tracking/:trackingNumber` - 배송 추적 (공개)

### 기사 관리 API (신규)
- `GET /api/drivers` - 기사 목록 🔐
- `POST /api/drivers` - 기사 등록 🔐
- `GET /api/drivers/:id` - 기사 상세 🔐
- `PUT /api/drivers/:id` - 기사 정보 수정 🔐
- `DELETE /api/drivers/:id` - 기사 삭제 🔐
- `GET /api/drivers/search?q=keyword` - 기사 검색 🔐

### 상품 관리 API (신규)
- `GET /api/products` - 상품 목록 (사용자별 필터링) 🔐
- `POST /api/products` - 상품 등록 (자동 user_id 설정) 🔐
- `GET /api/products/:id` - 상품 상세 (권한 확인) 🔐
- `PUT /api/products/:id` - 상품 정보 수정 (권한 확인) 🔐
- `DELETE /api/products/:id` - 상품 삭제 (권한 확인) 🔐
- `GET /api/products/search?q=keyword` - 상품 검색 (사용자별) 🔐

### 배송 접수 API (기존)
- `POST /api/shipping/orders` - 배송 접수 생성 🔐
- `GET /api/shipping/orders` - 배송 접수 목록 🔐
- `GET /api/shipping/orders/:id` - 배송 접수 상세 🔐
- `GET /api/shipping/tracking/:trackingNumber` - 운송장 추적 (공개)

### 사용자 관리 API (관리자 전용)
- `GET /api/users` - 사용자 목록 🔐👑
- `POST /api/users` - 사용자 생성 🔐👑
- `PUT /api/users/:id` - 사용자 정보 수정 🔐👑
- `DELETE /api/users/:id` - 사용자 삭제 🔐👑

### 데이터 내보내기 API
- `GET /api/exports/orders` - 배송 데이터 내보내기 🔐
- `GET /api/exports/statistics` - 통계 데이터 내보내기 🔐

> 🔐 = 인증 필요, 👑 = 관리자 권한 필요

## 🛠 설치 및 실행

### 로컬 개발 환경

```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env 파일 생성)
cp .env.example .env

# 데이터베이스 초기화
npm run setup-db

# 배송 테이블 생성 (신규)
node migrations/create-deliveries-table.js

# 샘플 데이터 추가 (선택사항)
node scripts/add-sample-deliveries.js

# 개발 서버 실행
npm run dev
```

### 환경변수

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=shipping_webapp

# 서버 설정
PORT=3000
NODE_ENV=development

# 인증 설정
SESSION_SECRET=your-session-secret-key
JWT_SECRET=shipping-webapp-jwt-secret-2024

# CORS 설정
FRONTEND_URL=http://localhost:5173
```

## 🚀 배포 가이드

### Railway 배포
1. Railway 프로젝트 생성
2. GitHub 저장소 연결
3. 환경변수 설정
4. MySQL 데이터베이스 연결
5. 자동 배포 실행

### 환경변수 설정 (프로덕션)
```env
NODE_ENV=production
DATABASE_URL=mysql://user:password@host:port/database
SESSION_SECRET=your-production-session-secret
JWT_SECRET=shipping-webapp-jwt-secret-2024
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## 🔒 보안 기능

- **Rate Limiting**: IP당 15분에 100회 요청 제한
- **CORS Protection**: 허용된 도메인만 접근 가능
- **Password Hashing**: bcryptjs로 비밀번호 암호화
- **JWT Security**: 30일 토큰 만료 (클라이언트 5일 자동 로그아웃)
- **Session Security**: httpOnly, secure 쿠키
- **Local Session**: 5일 자동 만료 + 활동 기반 연장
- **SQL Injection Prevention**: Prepared statements 사용

## 🐛 디버깅 및 모니터링

### 로그 확인
- **Railway Console**: 실시간 로그 확인
- **Error Tracking**: 상세한 에러 스택 추적
- **JWT Debugging**: 토큰 생성/검증 로그

### Health Check
```bash
curl https://fdapp-production.up.railway.app/health
```

## 📝 개발 이력

### v3.0.1 (2025-09-10) 🔧 **상품등록 오류 수정**
- 🔧 **상품 컨트롤러 수정** - searchProducts 함수의 user_id 사용 통일
- 🔧 **상품 검색 권한 추가** - user 권한은 본인 상품만, admin은 모든 상품 검색
- 🔧 **데이터베이스 일관성** - 모든 API에서 user_id 통일 사용
- ✅ **상품등록 기능 정상화** - 데이터베이스 스키마 일관성 확보

### v3.0.0 (2024-09-10) 🎯 **업체용 시스템 완성**
- 🆕 **업체용 대시보드** (PartnerDashboard) - 2x2 그리드 레이아웃
- 🆕 **업체용 배송관리** - 배송조회, 배송등록 (셀 기반 레이아웃)
- 🆕 **업체용 상품관리** - 상품조회, 상품등록 (멀티테넌시)
- 🆕 **사용자별 데이터 격리** - users.id ↔ deliveries.user_id ↔ products.user_id
- 🆕 **권한 기반 API** - user 권한은 본인 데이터만, admin은 모든 데이터
- 🆕 **상품 관리 API** - 완전한 CRUD + 검색 기능
- 🔧 **데이터베이스 최적화** - user_id 기반 데이터 관리 통일
- 🔧 **인증 미들웨어** - 모든 민감한 API에 인증 필수

### v2.0.0 (2024-09-10) ✨
- 🆕 **5일 자동 로그인 시스템 구현**
- 🆕 **트리플 하이브리드 인증** (JWT + Session + LocalStorage)
- 🆕 **배송 관리 시스템** (deliveries API)
- 🆕 **기사 관리 시스템** (drivers API)
- 🆕 **기사 배정 화면** (드래그 앤 드롭 배정)
- 🔧 **JWT 토큰 만료 연장** (24시간 → 30일)
- 🔧 **로컬 세션 자동 정리** 시스템
- 📚 **상세 문서화** (login.md)

### v1.0.0 (2024-08-28)
- ✅ 기본 배송 접수 시스템 구현
- ✅ 사용자 인증 및 권한 관리  
- ✅ JWT + Session 하이브리드 인증 구현
- ✅ Railway 프로덕션 배포
- ✅ Vercel-Railway 크로스도메인 인증 해결
- ✅ 실시간 배송 추적 시스템
- ✅ 데이터 내보내기 기능

## 🤝 기여 방법

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이센스

이 프로젝트는 ISC 라이센스를 따릅니다.

## 🆘 문제 해결

### 일반적인 문제들

**Q: 401 Unauthorized 에러**
- 로컬 세션 만료 확인 (5일 초과)
- JWT 토큰 만료 확인 (30일 초과)
- 브라우저 localStorage의 `login_session` 확인
- 로그인 상태 재확인

**Q: CORS 에러**
- FRONTEND_URL 환경변수 확인
- 허용된 도메인 목록 확인

**Q: 데이터베이스 연결 실패**
- DATABASE_URL 환경변수 확인
- PlanetScale MySQL 서버 상태 확인
- 연결 풀 설정 확인

**Q: 자동 로그인이 작동하지 않음** 🆕
- localStorage에서 `login_session` 데이터 확인
- 브라우저 개발자 도구 콘솔 로그 확인
- 5일 비활성 기간 확인
- 서버와 클라이언트 시간 동기화 확인

### 🧪 테스트 계정

#### **관리자 계정**
- **아이디**: `admin` / **비밀번호**: `admin123`
- **권한**: 모든 기능 접근 가능 (전체 데이터 관리)
- **자동 로그인**: 5일간 유지
- **접근 화면**: 관리자 대시보드 (배송관리, 기사관리, 사용자관리)

#### **업체 계정** (role: 'user')
- **권한**: 본인 데이터만 접근 가능 (멀티테넌시)
- **자동 로그인**: 5일간 유지
- **접근 화면**: 업체용 대시보드 (배송조회/등록, 상품조회/등록)

### 📊 로그인 시스템 모니터링
```bash
# 브라우저 콘솔에서 세션 상태 확인
localStorage.getItem('login_session')

# 자동 로그인 로그 패턴
💾 로컬 세션 발견 - 자동 로그인 시도: admin
✅ 서버 세션도 유효함
🔓 로그아웃 완료, 모든 세션 제거됨
```

---

## 🏢 **업체용 시스템 구조**

### **멀티테넌시 아키텍처**
```
users (업체 계정)
├── id: 1 → deliveries.user_id: 1  (A업체 배송 데이터)
├── id: 2 → deliveries.user_id: 2  (B업체 배송 데이터)
└── id: 3 → products.user_id: 3    (C업체 상품 데이터)
```

### **권한 분리**
- 🔵 **Admin/Manager**: 모든 데이터 접근 가능
- 🟢 **User (업체)**: 본인 데이터만 접근 가능

### **업체용 대시보드 구성**
```
┌─────────────────┬─────────────────┐
│   배송조회      │   배송등록      │
│   (본인 배송)   │   (셀 레이아웃) │
├─────────────────┼─────────────────┤
│   상품조회      │   상품등록      │
│   (카드 형태)   │   (셀 레이아웃) │
└─────────────────┴─────────────────┘
```

### **데이터 보안**
- ✅ **API 레벨 필터링**: WHERE user_id = ? 자동 적용
- ✅ **권한 확인**: 타 업체 데이터 접근 시도시 404 반환
- ✅ **자동 소유권**: 생성시 현재 로그인 사용자로 user_id 자동 설정

---

🤖 **Generated with Claude Code** - v3.0.0 업체용 시스템 완성 (2024-09-10)