# 🚀 EasyPickup 배포 가이드

## 📋 배포 개요
- **프론트엔드**: Vercel (https://easypickup.kr/easypickup)
- **백엔드**: Railway (with PlanetScale Database)
- **도메인**: easypickup.kr

## 🔧 1. 프론트엔드 배포 (Vercel)

### 1.1 Vercel 프로젝트 생성
```bash
# Vercel CLI 설치 (필요시)
npm i -g vercel

# 프론트엔드 디렉토리로 이동
cd frontend

# Vercel에 배포
vercel
```

### 1.2 환경변수 설정
Vercel Dashboard에서 다음 환경변수를 설정:
```
VITE_API_URL=https://your-railway-backend-url.railway.app/api
VITE_APP_TITLE=EasyPickup
VITE_APP_ENV=production
```

### 1.3 Custom Domain 설정
1. Vercel Dashboard → Settings → Domains
2. `easypickup.kr` 도메인 추가
3. DNS 설정에서 CNAME 레코드 추가:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```
4. `/easypickup` 경로로 접근하도록 설정됨

## 🔧 2. 백엔드 배포 (Railway)

### 2.1 Railway 프로젝트 생성
```bash
# Railway CLI 설치 (필요시)
npm install -g @railway/cli

# 백엔드 디렉토리로 이동
cd backend

# Railway에 로그인
railway login

# 새 프로젝트 생성
railway init

# 배포
railway up
```

### 2.2 PlanetScale 데이터베이스 연결
Railway Dashboard에서 환경변수 설정:
```bash
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_USER=your_planetscale_username
DB_PASSWORD=your_planetscale_password
DB_NAME=easypicks
DB_CHARSET=utf8mb4
DB_TIMEZONE=+09:00
DB_SSL=true

JWT_SECRET=your_super_secure_jwt_secret_key_for_production_environment_2024
JWT_EXPIRES_IN=24h

SESSION_SECRET=your_super_secure_session_secret_key_for_production_environment_2024
SESSION_NAME=easypicks_session

NODE_ENV=production
CORS_ORIGIN=https://easypickup.kr

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/jpg,image/png,image/gif
```

### 2.3 Railway 도메인 확인
Railway에서 자동 생성된 도메인을 확인하고, 프론트엔드의 `VITE_API_URL`을 업데이트

## 🔗 3. 도메인 연결

### 3.1 DNS 설정
도메인 registrar에서 DNS 설정:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME  
Name: api
Value: your-railway-app.railway.app
```

### 3.2 SSL 인증서
- Vercel: 자동 SSL 인증서 제공
- Railway: 자동 SSL 인증서 제공

## 📝 4. 배포 후 확인사항

### 4.1 프론트엔드 확인
- [ ] https://easypickup.kr/easypickup 접근 가능
- [ ] 로그인/회원가입 기능 정상 작동
- [ ] API 호출 정상 작동
- [ ] 반응형 디자인 확인

### 4.2 백엔드 확인
- [ ] https://your-railway-app.railway.app/health 응답 확인
- [ ] 데이터베이스 연결 확인
- [ ] CORS 설정 확인
- [ ] 인증 시스템 확인

## 🛠️ 5. 배포 명령어 요약

### 프론트엔드 재배포
```bash
cd frontend
vercel --prod
```

### 백엔드 재배포
```bash
cd backend
railway up
```

### 환경변수 업데이트
```bash
# Vercel
vercel env add VITE_API_URL

# Railway
railway variables set VARIABLE_NAME=value
```

## 🔍 6. 트러블슈팅

### 일반적인 문제들
1. **CORS 에러**: 백엔드 CORS_ORIGIN 확인
2. **API 연결 실패**: VITE_API_URL 확인
3. **라우팅 문제**: vercel.json rewrites 설정 확인
4. **데이터베이스 연결**: PlanetScale 환경변수 확인

### 로그 확인
```bash
# Vercel 로그
vercel logs

# Railway 로그
railway logs
```

## 📈 7. 성능 최적화

### 프론트엔드
- ✅ Code Splitting 적용
- ✅ Image Optimization
- ✅ CDN 활용 (Vercel)

### 백엔드
- ✅ Database Connection Pooling
- ✅ Rate Limiting
- ✅ Error Handling

## 🔐 8. 보안 설정

### 환경변수 보안
- 모든 시크릿 키는 32자 이상 랜덤 문자열 사용
- 프로덕션과 개발환경 키 분리
- 정기적인 키 로테이션

### 네트워크 보안
- HTTPS 강제 사용
- CORS 정확한 도메인 설정
- Rate Limiting 적용

## 📞 지원 및 문의
배포 관련 문의사항은 개발팀에게 연락바랍니다.