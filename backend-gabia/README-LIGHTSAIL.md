# AWS Lightsail 배포 가이드

EASYPICKS 백엔드를 AWS Lightsail 컨테이너 서비스에 배포하는 단계별 가이드입니다.

## 📋 사전 준비사항

### 1. AWS 계정 및 CLI 설정
```bash
# AWS CLI 설치 (macOS)
brew install awscli

# AWS CLI 설정
aws configure
# Access Key ID: [Your Access Key]
# Secret Access Key: [Your Secret Key] 
# Default region: ap-northeast-1
# Default output format: json
```

### 2. Docker 설치
```bash
# macOS
brew install docker

# Docker Desktop 실행 확인
docker --version
```

### 3. 환경변수 준비
`.env` 파일에 다음 변수들이 설정되어 있는지 확인:
```
NODE_ENV=production
PORT=3000
DB_HOST=your-planetscale-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

## 🚀 단계별 배포 가이드

### 1단계: AWS Lightsail 서비스 생성
```bash
# 서비스 생성 및 설정
./aws-lightsail-setup.sh
```

이 스크립트는 다음 작업을 수행합니다:
- Lightsail 컨테이너 서비스 생성 (Medium, 2GB RAM)
- 정적 IP 주소 할당
- 서비스 준비 상태까지 대기

### 2단계: Docker 이미지 빌드
```bash
# Docker 이미지 빌드 및 테스트
./docker-build.sh
```

빌드되는 내용:
- Node.js 22 Alpine 베이스 이미지
- 보안 최적화 (non-root 사용자)
- Health check 포함
- 프로덕션 최적화

### 3단계: 환경변수 설정
`lightsail-deployment.json` 파일의 환경변수를 실제 값으로 업데이트:
```json
{
  "containers": {
    "backend": {
      "environment": {
        "DB_HOST": "actual-host",
        "DB_USER": "actual-user",
        "DB_PASSWORD": "actual-password",
        "DB_NAME": "actual-database",
        "JWT_SECRET": "actual-jwt-secret",
        "SESSION_SECRET": "actual-session-secret",
        "CORS_ORIGIN": "https://actual-frontend-domain.com"
      }
    }
  }
}
```

### 4단계: Docker Hub에 이미지 푸시
```bash
# Docker Hub 로그인
docker login

# 이미지 푸시
docker push easypicks/backend:latest
```

### 5단계: Lightsail에 배포
```bash
# 배포 실행
./deploy-to-lightsail.sh
```

배포 과정:
- 환경변수 확인
- 컨테이너 서비스 배포
- Health check 확인
- 서비스 URL 출력

## 🧪 배포 후 테스트

### 기본 테스트
```bash
# Health check
curl https://your-service-url/health

# API 테스트
curl https://your-service-url/debug
```

### 전체 기능 테스트
- [ ] `/health` - 서비스 상태
- [ ] `/debug` - 디버그 정보
- [ ] `/api/products` - 상품 API
- [ ] `/api/auth` - 인증 API
- [ ] `/api/deliveries` - 배송 API
- [ ] Socket.IO 연결 테스트

## 🌐 도메인 설정 (선택사항)

### 1. 인증서 생성
```bash
aws lightsail create-certificate \
  --certificate-name easypicks-cert \
  --domain-name api.yourdomain.com
```

### 2. 도메인 연결
```bash
aws lightsail attach-certificate-to-distribution \
  --distribution-name easypicks-backend \
  --certificate-name easypicks-cert
```

### 3. DNS 설정
Route 53 또는 도메인 등록기관에서:
- A 레코드: `api.yourdomain.com` → Lightsail 정적 IP

## 📊 모니터링 설정

### CloudWatch 메트릭
자동으로 수집되는 메트릭:
- CPU 사용률
- 메모리 사용률
- 네트워크 트래픽
- HTTP 응답 시간

### 알람 설정
```bash
# CPU 사용률 알람
aws lightsail put-alarm \
  --alarm-name "HighCPUUtilization" \
  --metric-name "CPUUtilization" \
  --monitored-resource-name "easypicks-backend" \
  --comparison-operator "GreaterThanThreshold" \
  --threshold 80
```

## 🔄 업데이트 및 롤백

### 새 버전 배포
```bash
# 새 이미지 빌드
docker build -t easypicks/backend:v2.0.1 .
docker push easypicks/backend:v2.0.1

# deployment.json 업데이트 후 배포
./deploy-to-lightsail.sh
```

### 롤백
```bash
# 이전 버전으로 deployment.json 수정 후
./deploy-to-lightsail.sh
```

## 💰 비용 관리

### 예상 월 비용
- **Medium 컨테이너**: $20/월
- **정적 IP**: $3.5/월
- **데이터 전송**: 무료 (월 50GB까지)
- **총 예상**: $23.5/월

### 비용 최적화
- 트래픽이 적은 경우 Small ($10/월)로 다운그레이드 가능
- 개발 환경은 Nano ($7/월) 사용 권장

## 🚨 문제 해결

### 일반적인 문제

#### 1. 배포 실패
```bash
# 로그 확인
aws lightsail get-container-log \
  --service-name easypicks-backend \
  --container-name backend
```

#### 2. Health check 실패
- `/health` 엔드포인트 응답 확인
- 환경변수 설정 확인
- 데이터베이스 연결 확인

#### 3. 이미지 빌드 실패
- Dockerfile 문법 확인
- .dockerignore 파일 확인
- 의존성 설치 오류 확인

### 로그 확인
```bash
# 실시간 로그 보기
aws lightsail get-container-log \
  --service-name easypicks-backend \
  --container-name backend \
  --start-time 2025-09-22T12:00:00Z
```

## 📞 지원

### AWS 지원
- [AWS Lightsail 문서](https://docs.aws.amazon.com/lightsail/)
- AWS 지원 센터

### 커뮤니티
- AWS 포럼
- Stack Overflow

---

## 📝 체크리스트

배포 완료 후 확인사항:
- [ ] 서비스 정상 실행 확인
- [ ] Health check 통과
- [ ] 모든 API 엔드포인트 테스트
- [ ] Socket.IO 연결 테스트
- [ ] 도메인 연결 (선택)
- [ ] 모니터링 알람 설정
- [ ] 백업 계획 수립
- [ ] 문서 업데이트

**배포 완료 시 Railway와 병렬 운영 시작!**