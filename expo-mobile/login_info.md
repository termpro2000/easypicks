# 로그인 정보 및 데이터 저장 구조

## 계정 유형별 데이터 저장

### 1. 기사 계정 (drivers 테이블)
**예시 계정:**
- ID: `dr1`
- 비밀번호: `123456`
- 이름: `김철수기사`

**저장 위치:** `drivers` 테이블
**필드 구조:**
- `user_id`: 로그인 ID (예: dr1)
- `password`: 비밀번호
- `name`: 기사 이름
- `phone`: 전화번호 (선택)
- `email`: 이메일 (선택)
- `vehicle_type`: 차량 유형 (선택)
- `vehicle_number`: 차량 번호 (선택)
- `created_at`: 생성 시간
- `updated_at`: 수정 시간

**로그인 방식:**
- 웹앱: `username` 필드로 전송
- 모바일앱: `user_id` 필드로 전송
- 백엔드: 둘 다 지원 (`loginId = username || user_id`)

### 2. 일반 사용자 계정 (users 테이블)
**회원가입 방법:** expo-mobile 앱에서 회원가입

**저장 위치:** `users` 테이블
**필드 구조:**
- `username`: 로그인 ID (expo 앱의 user_id 값)
- `password`: 비밀번호 (평문 저장 - 개발용)
- `name`: 사용자 이름
- `phone`: 전화번호 (선택)
- `company`: 회사명 (null)
- `role`: 자동으로 `'user'` 설정
- `is_active`: 자동으로 `1` (활성)
- `email`: 이메일 (선택)
- `created_at`: 생성 시간
- `updated_at`: 수정 시간

**추가 필드들:**
- `default_sender_*`: 기본 발송자 정보 필드들
- `map_preference`: 지도 앱 설정 (0=네이버, 1=카카오, 2=티맵, 3=구글)
- `last_login`: 마지막 로그인 시간

## 로그인 API 호환성

### 통합 인증 시스템
백엔드 로그인 API (`POST /api/auth/login`)는 다음 두 가지 방식을 모두 지원:

**웹앱 방식:**
```json
{
  "username": "dr1",
  "password": "123456"
}
```

**모바일앱 방식:**
```json
{
  "user_id": "dr1", 
  "password": "123456"
}
```

### 사용자 검색 로직
1. **users 테이블 검색**: `SELECT * FROM users WHERE username = ?`
2. **drivers 테이블 검색**: `SELECT * FROM drivers WHERE user_id = ?` (users에서 찾지 못한 경우)
3. **역할 설정**: 
   - users 테이블 사용자: 기존 role 값 사용
   - drivers 테이블 사용자: `role: "driver"` 설정

## 회원가입 API 호환성

### 통합 회원가입 시스템
백엔드 회원가입 API (`POST /api/auth/register`)도 동일하게 지원:

**웹앱 방식:**
```json
{
  "username": "newuser",
  "password": "123456",
  "name": "새 사용자",
  "phone": "010-1234-5678"
}
```

**모바일앱 방식:**
```json
{
  "user_id": "newuser",
  "password": "123456", 
  "name": "새 사용자",
  "phone": "010-1234-5678"
}
```

### 회원가입 처리 로직
1. **필드 통합**: `registerId = username || user_id`
2. **중복 확인**: `SELECT id FROM users WHERE username = ?`
3. **사용자 생성**: `users` 테이블에 저장
4. **기본값 설정**: `role='user'`, `is_active=1`

## 데이터베이스 현황

### users 테이블
- **총 레코드**: 12개
- **역할 구성**: admin, manager, user
- **컬럼 수**: 19개
- **주요 사용자**:
  - admin (관리자)
  - h3177 (관리자)
  - pt001~pt003 (업체 계정)
  - testuser001 (테스트 계정)

### drivers 테이블  
- **총 레코드**: 6개
- **컬럼 수**: 13개
- **주요 기사**:
  - dr1 (김철수기사)
  - 업데이트된기사, 테스트기사 등

## API 엔드포인트

### 인증 관련
- `POST /api/auth/login` - 통합 로그인
- `POST /api/auth/register` - 통합 회원가입

### 사용자 관리
- `GET /api/users` - 사용자 목록
- `POST /api/users` - 사용자 생성
- `PUT /api/users/:id` - 사용자 수정
- `DELETE /api/users/:id` - 사용자 삭제

### 기사 관리
- `GET /api/drivers` - 기사 목록
- `POST /api/drivers` - 기사 생성
- `PUT /api/drivers/:id` - 기사 수정

### 디버그 도구
- `GET /api/debug/tables` - 테이블 상태 확인
- `GET /api/debug/driver/:user_id` - 특정 기사 검색
- `GET /api/schema/:tableName` - 테이블 스키마 조회

## 보안 고려사항

### 현재 구현 (개발용)
- 비밀번호 평문 저장
- 간단한 JWT 토큰 (`token-{userId}-{timestamp}`)
- 기본 인증 체크

### 프로덕션 권장사항
- bcrypt를 이용한 비밀번호 해싱
- 실제 JWT 라이브러리 사용
- 토큰 만료 시간 설정
- Rate limiting 적용
- HTTPS 강제 사용

## 문제 해결 이력

### 로그인 실패 문제 (2025-09-23)
**문제**: 모바일 앱에서 로그인 실패 ("bad request")
**원인**: 필드명 불일치 (앱: user_id, 백엔드: username)
**해결**: 백엔드에서 두 필드 모두 지원하도록 수정

### 회원가입 실패 문제 (2025-09-23)  
**문제**: 모바일 앱에서 회원가입 실패
**원인**: 로그인과 동일한 필드명 불일치
**해결**: 회원가입 API도 두 필드 모두 지원하도록 수정

### 기사 배정 실패 문제 (2025-09-23)
**문제**: 기사 배정 시 500 에러 발생
**원인**: 
1. PUT /api/deliveries/:id 엔드포인트 없음 (404)
2. 존재하지 않는 컬럼 참조 (driver_name, assigned_driver)
3. 잘못된 status enum 값 ('배송준비' → '배차완료')
**해결**: 
1. PUT 엔드포인트 추가
2. 동적 컬럼 검증 구현
3. 올바른 enum 값 사용

## 향후 개발 방향

### 사용자 관리 개선
- 사용자 프로필 사진 추가
- 이메일 인증 시스템
- 비밀번호 재설정 기능
- 소셜 로그인 연동

### 기사 관리 개선
- 기사 위치 추적
- 실시간 배송 상태 업데이트
- 기사 평가 시스템
- 배송 실적 통계

### 보안 강화
- 2FA (Two-Factor Authentication)
- 세션 관리 개선
- API 접근 권한 세분화
- 로그 모니터링 시스템