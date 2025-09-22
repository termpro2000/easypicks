#!/bin/bash

# 가비아 컨테이너 호스팅 배포 스크립트

set -e

echo "🚀 가비아 호스팅 배포 시작..."

# 환경변수 확인
if [ ! -f .env ]; then
    echo "❌ .env 파일이 없습니다. .env.example을 참고하여 생성해주세요."
    exit 1
fi

# Node.js 버전 확인
NODE_VERSION=$(node --version)
if [[ ! $NODE_VERSION =~ ^v22 ]]; then
    echo "⚠️  Node.js 22.x가 필요합니다. 현재 버전: $NODE_VERSION"
    echo "NVM을 사용하여 Node.js 22를 설치하세요:"
    echo "nvm install 22 && nvm use 22"
    exit 1
fi

echo "✅ Node.js 버전: $NODE_VERSION"

# 의존성 설치
echo "📦 의존성 설치 중..."
npm install --production

# 프로덕션 설정 확인
echo "🔍 프로덕션 설정 확인..."
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  NODE_ENV=production으로 설정하는 것을 권장합니다."
fi

# PM2로 프로세스 시작
echo "🔄 PM2로 서버 시작..."
if command -v pm2 &> /dev/null; then
    pm2 stop easypicks-gabia 2>/dev/null || true
    pm2 start server.js --name easypicks-gabia
    pm2 save
    echo "✅ PM2로 서버 시작 완료"
else
    echo "⚠️  PM2가 설치되지 않았습니다. npm install -g pm2로 설치하세요."
    echo "🔄 일반 모드로 서버 시작..."
    node server.js
fi

echo "🎉 가비아 호스팅 배포 완료!"
echo "🌐 서버가 포트 ${PORT:-3000}에서 실행 중입니다."