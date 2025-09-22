# AWS Lightsail 최적화 Dockerfile
FROM node:22-alpine

# 메타데이터
LABEL maintainer="easypicks-team"
LABEL version="2.0.0"
LABEL description="EASYPICKS Backend for AWS Lightsail"

WORKDIR /app

# 보안을 위한 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 시스템 패키지 업데이트 및 필요 패키지 설치
RUN apk update && \
    apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 의존성 파일 복사 및 설치
COPY package*.json ./
RUN npm ci --omit=dev && \
    npm cache clean --force

# 소스 코드 복사
COPY . .

# 업로드 디렉토리 생성
RUN mkdir -p uploads && \
    chown -R nodejs:nodejs /app

# 보안: non-root 사용자로 전환
USER nodejs

# 포트 노출
EXPOSE 3000

# Health check 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# dumb-init으로 PID 1 문제 해결
ENTRYPOINT ["dumb-init", "--"]

# 애플리케이션 시작
CMD ["npm", "start"]