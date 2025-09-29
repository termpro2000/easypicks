# AWS Lightsail 점진적 마이그레이션 계획

## 📋 마이그레이션 개요

### 목표
- **기존 Railway**: 운영 서비스 유지 (무중단)
- **신규 AWS Lightsail**: 병렬 구축 후 점진적 이전
- **최종 목표**: 안정성 향상 + 월 8,450원 비용 절약

### 마이그레이션 전략
1. **병렬 운영**: Railway + Lightsail 동시 운영
2. **점진적 이전**: 기능별/사용자별 단계적 이전
3. **롤백 준비**: 언제든 Railway로 복구 가능
4. **완전 이전**: 안정성 확인 후 Railway 종료

## 🏗️ 1단계: AWS Lightsail 환경 구축 (1-2일)

### 1.1 AWS 계정 및 Lightsail 설정
```bash
# AWS CLI 설치 및 설정
aws configure
aws lightsail get-regions
```

### 1.2 Lightsail 컨테이너 서비스 생성
**추천 스펙**: Medium (2GB RAM, 1 vCPU) - $20/월
- **서비스명**: easypicks-backend
- **리전**: ap-northeast-1 (도쿄) - 한국 최적화
- **스케일**: 1개 노드 시작

### 1.3 필요 리소스
- [ ] Lightsail 컨테이너 서비스
- [ ] 정적 IP 주소 ($3.5/월)
- [ ] SSL 인증서 (무료)
- [ ] 도메인 연결

## 🐳 2단계: Docker 컨테이너 준비 (2-3시간)

### 2.1 Dockerfile 최적화
```dockerfile
FROM node:22-alpine

WORKDIR /app

# 보안 최적화
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 의존성 설치
COPY package*.json ./
RUN npm ci --omit=dev

# 소스 복사
COPY . .
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
```

### 2.2 Docker 이미지 빌드 및 테스트
```bash
cd backend-gabia
docker build -t easypicks-backend .
docker run -p 3000:3000 --env-file .env easypicks-backend
```

### 2.3 AWS ECR 또는 Docker Hub 설정
```bash
# AWS ECR 생성 (선택사항)
aws ecr create-repository --repository-name easypicks-backend

# 또는 Docker Hub 사용
docker tag easypicks-backend:latest yourusername/easypicks-backend:latest
docker push yourusername/easypicks-backend:latest
```

## ⚙️ 3단계: Lightsail 배포 설정 (2-3시간)

### 3.1 컨테이너 배포 구성
```json
{
  "serviceName": "easypicks-backend",
  "power": "medium",
  "scale": 1,
  "containers": {
    "backend": {
      "image": "yourusername/easypicks-backend:latest",
      "ports": {
        "3000": "HTTP"
      },
      "environment": {
        "NODE_ENV": "production",
        "PORT": "3000",
        "DB_HOST": "your-planetscale-host",
        "DB_USER": "your-db-user",
        "DB_PASSWORD": "your-db-password",
        "DB_NAME": "your-db-name",
        "JWT_SECRET": "your-jwt-secret",
        "SESSION_SECRET": "your-session-secret"
      }
    }
  },
  "publicEndpoint": {
    "containerName": "backend",
    "containerPort": 3000,
    "healthCheck": {
      "healthyThreshold": 2,
      "unhealthyThreshold": 2,
      "timeoutSeconds": 5,
      "intervalSeconds": 30,
      "path": "/health",
      "successCodes": "200-399"
    }
  }
}
```

### 3.2 배포 명령어
```bash
aws lightsail create-container-service-deployment \
  --service-name easypicks-backend \
  --cli-input-json file://deployment.json
```

## 🌐 4단계: 도메인 및 SSL 설정 (1-2시간)

### 4.1 도메인 연결
```bash
# 커스텀 도메인 연결
aws lightsail create-certificate \
  --certificate-name easypicks-cert \
  --domain-name api-backup.yourdomain.com

# 도메인 연결
aws lightsail attach-certificate-to-distribution \
  --distribution-name easypicks-backend \
  --certificate-name easypicks-cert
```

### 4.2 DNS 설정
- **A 레코드**: `api-backup.yourdomain.com` → Lightsail IP
- **CNAME**: 필요시 설정

## 🧪 5단계: 테스트 및 검증 (1일)

### 5.1 기능 테스트 체크리스트
- [ ] Health check 엔드포인트 (`/health`)
- [ ] API 엔드포인트 전체 테스트
  - [ ] `/api/products` - 상품 관리
  - [ ] `/api/auth` - 인증
  - [ ] `/api/deliveries` - 배송 관리
  - [ ] `/api/drivers` - 기사 관리
  - [ ] `/api/users` - 사용자 관리
- [ ] Socket.IO 실시간 기능
- [ ] 파일 업로드 기능
- [ ] 데이터베이스 연결
- [ ] JWT 인증

### 5.2 성능 테스트
```bash
# 부하 테스트 (Apache Bench)
ab -n 1000 -c 10 https://api-backup.yourdomain.com/health

# 응답 시간 테스트
curl -w "@curl-format.txt" -o /dev/null -s https://api-backup.yourdomain.com/api/products
```

### 5.3 모니터링 설정
- [ ] CloudWatch 메트릭 확인
- [ ] 로그 스트림 설정
- [ ] 알람 설정 (CPU, 메모리, 응답시간)

## 🔄 6단계: 점진적 트래픽 이전 (1-2주)

### 6.1 A/B 테스트 설정
프론트엔드에서 환경변수로 API URL 분기:
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (Math.random() < 0.1 
      ? 'https://api-backup.yourdomain.com'  // 10% Lightsail
      : 'https://railway-api.yourdomain.com') // 90% Railway
  : 'http://localhost:3000';
```

### 6.2 단계별 트래픽 이전
- **1주차**: 10% 트래픽 → Lightsail
- **2주차**: 30% 트래픽 → Lightsail  
- **3주차**: 70% 트래픽 → Lightsail
- **4주차**: 100% 트래픽 → Lightsail

### 6.3 모니터링 지표
- **응답시간**: Railway vs Lightsail 비교
- **에러율**: 각 플랫폼별 모니터링
- **사용자 피드백**: 성능 체감 확인

## 📊 7단계: 완전 이전 (1일)

### 7.1 DNS 전환
```bash
# 기존 도메인을 Lightsail로 완전 이전
# api.yourdomain.com → Lightsail IP
```

### 7.2 Railway 백업 유지
- **2주간 Railway 서비스 유지** (롤백 대비)
- **완전 안정성 확인 후 Railway 종료**

### 7.3 최종 정리
- [ ] Railway 서비스 중단
- [ ] DNS 정리
- [ ] 비용 절약 확인 ($8.5/월)

## 💰 비용 분석

### 마이그레이션 기간 중 (병렬 운영)
- **Railway**: $30/월
- **AWS Lightsail**: $23.5/월
- **총 비용**: $53.5/월 (2주간)

### 마이그레이션 완료 후
- **AWS Lightsail만**: $23.5/월
- **절약 효과**: $6.5/월 (8,450원)

## 🚨 리스크 관리

### 롤백 계획
1. **즉시 롤백**: DNS를 Railway로 변경 (5분 내)
2. **부분 롤백**: 트래픽 비율 조정
3. **완전 롤백**: 모든 트래픽을 Railway로 복구

### 백업 계획
- **코드**: Git 백업 유지
- **데이터베이스**: PlanetScale 자동 백업
- **설정**: 환경변수 백업

## 📅 예상 일정

| 단계 | 기간 | 작업 내용 |
|------|------|-----------|
| 1단계 | 1-2일 | AWS Lightsail 환경 구축 |
| 2단계 | 2-3시간 | Docker 컨테이너 준비 |
| 3단계 | 2-3시간 | Lightsail 배포 |
| 4단계 | 1-2시간 | 도메인/SSL 설정 |
| 5단계 | 1일 | 테스트 및 검증 |
| 6단계 | 1-2주 | 점진적 트래픽 이전 |
| 7단계 | 1일 | 완전 이전 |

**총 예상 기간**: 3-4주

## ✅ 성공 지표
- [ ] 99.9% 이상 가용성 달성
- [ ] 응답시간 Railway 대비 동등 이상
- [ ] 모든 기능 정상 동작
- [ ] 월 비용 $23.5 이하 달성
- [ ] 사용자 불편 사항 Zero

---
**최종 업데이트**: 2025-09-22  
**상태**: 마이그레이션 계획 수립 완료  
**다음 단계**: AWS 계정 설정 및 Lightsail 환경 구축