# EASYPICKS Backend - Gabia 호스팅용

가비아 컨테이너 호스팅에 최적화된 백엔드 버전입니다.

## 주요 변경사항

### Node.js 버전 업그레이드
- **기존**: Node.js 18.x
- **신규**: Node.js 22.x LTS (보안 지원)

### 패키지 업그레이드
- Express.js 4 → 5
- express-rate-limit 6 → 7
- express-session 1.17 → 1.18
- MySQL2 3.6 → 3.11
- 기타 보안 패치된 최신 버전

## 가비아 호스팅 배포 가이드

### 1. 사전 준비
```bash
# Node.js 22 설치 확인
node --version  # v22.x.x

# npm 업데이트
npm install -g npm@latest
```

### 2. 의존성 설치
```bash
cd backend-gabia
npm install
```

### 3. 환경변수 설정
```bash
cp .env.example .env
# .env 파일 편집하여 가비아 환경에 맞게 설정
```

### 4. 가비아 컨테이너 호스팅 배포
```bash
# SSH로 가비아 서버 접속
ssh your-account@your-server.gabia.io

# 소스코드 업로드 (FTP/SFTP)
# 의존성 설치
npm install --production

# PM2로 프로세스 관리
npm install -g pm2
pm2 start server.js --name easypicks
pm2 startup
pm2 save
```

### 5. 포트 설정
가비아 컨테이너 호스팅에서는 기본적으로 3000 포트를 사용합니다.

### 6. SSL 설정
가비아에서 제공하는 기본 SSL 인증서 또는 Let's Encrypt 사용 가능합니다.

## 호환성 확인

### Node.js 22 호환성 테스트
```bash
# 로컬에서 Node.js 22로 테스트
nvm install 22
nvm use 22
npm test
npm start
```

### 패키지 호환성
- ✅ Express.js 5.0
- ✅ Socket.IO 4.8
- ✅ MySQL2 3.11
- ✅ JWT 9.0
- ✅ 기타 모든 패키지

## 마이그레이션 체크리스트

- [ ] Node.js 22 로컬 테스트 완료
- [ ] 패키지 업데이트 테스트 완료
- [ ] 가비아 컨테이너 호스팅 신청
- [ ] 환경변수 설정 완료
- [ ] 데이터베이스 연결 테스트
- [ ] Socket.IO 기능 테스트
- [ ] SSL 인증서 설정
- [ ] 도메인 DNS 변경 준비
- [ ] 프론트엔드 API URL 업데이트 준비

## 롤백 계획
문제 발생 시 기존 Railway 백엔드로 즉시 롤백 가능:
1. 프론트엔드 API URL을 Railway 주소로 변경
2. DNS 설정 원복
3. 가비아 환경 디버깅 후 재시도

## 지원 및 문의
- 가비아 고객센터: 1544-4370
- 기술 문의: 가비아 라이브러리 참조