# PlanetScale 설정 가이드

## 1. PlanetScale 계정 생성
1. https://planetscale.com 접속
2. GitHub 계정으로 가입 (추천)
3. 무료 계정으로 시작

## 2. 데이터베이스 생성
1. Dashboard → "Create database"
2. Database name: `easypicks`
3. Region: `AWS ap-southeast-1` (싱가포르 - 한국과 가장 가까움)
4. Plan: `Hobby` (무료)

## 3. 연결 정보 가져오기
1. 생성된 데이터베이스 클릭
2. "Connect" 버튼 클릭
3. "Create password" 클릭하여 비밀번호 생성
4. "Node.js" 탭 선택
5. 연결 정보 복사:
   ```
   Host: aws.connect.psdb.cloud
   Username: xxxxxxxxx
   Password: pscale_pw_xxxxxxxxx
   Database: easypicks
   ```

## 4. 환경변수 설정
`.env` 파일을 다음과 같이 수정:

```bash
# PlanetScale 데이터베이스 설정
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_USER=여기에_PlanetScale_username_입력
DB_PASSWORD=여기에_PlanetScale_password_입력
DB_NAME=easypicks
DB_CHARSET=utf8mb4
DB_TIMEZONE=+09:00
DB_SSL=true

# 기타 설정은 그대로 유지
JWT_SECRET=easypicks-jwt-secret-2024
SESSION_SECRET=easypicks-session-secret-2024
PORT=3000
```

## 5. 마이그레이션 실행
```bash
# 환경변수 설정 후 마이그레이션 실행
node migrate-to-planetscale.js
```

## 6. 서버 재시작
```bash
# 서버 재시작
node server.js
```

## 주요 이점
- ✅ 99.99% 업타임 보장
- ✅ 자동 스케일링
- ✅ 글로벌 분산 (빠른 속도)
- ✅ 무료 1GB 사용량
- ✅ 연결 불안정성 해결
- ✅ 브랜치 기능으로 DB 버전 관리

## 문제 해결
- 연결 실패 시 SSL 설정 확인
- 방화벽 문제시 모든 IP 허용됨 (PlanetScale 기본 설정)
- 속도 문제시 가까운 리전으로 변경

## 모니터링
- PlanetScale Dashboard에서 실시간 모니터링
- 쿼리 성능 분석 도구 제공
- 사용량 알림 설정 가능