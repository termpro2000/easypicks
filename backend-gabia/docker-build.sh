#!/bin/bash

# AWS Lightsail Docker 빌드 및 배포 스크립트

set -e

echo "🐳 Building Docker image for AWS Lightsail..."

# 변수 설정
IMAGE_NAME="easypicks/backend"
TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

# Docker 이미지 빌드
echo "📦 Building Docker image: ${FULL_IMAGE_NAME}"
docker build -t "${FULL_IMAGE_NAME}" .

# 이미지 크기 확인
echo "📊 Image size:"
docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# 이미지 테스트 (환경변수 파일이 있는 경우)
if [ -f .env ]; then
    echo "🧪 Testing image locally..."
    docker run --rm -d \
        --name easypicks-test \
        --env-file .env \
        -p 3001:3000 \
        "${FULL_IMAGE_NAME}"
    
    echo "⏳ Waiting for container to start..."
    sleep 5
    
    # Health check 테스트
    if curl -f http://localhost:3001/health; then
        echo "✅ Health check passed!"
    else
        echo "❌ Health check failed!"
    fi
    
    # 컨테이너 정리
    docker stop easypicks-test
else
    echo "⚠️  .env file not found. Skipping local test."
fi

echo "🎉 Docker build completed: ${FULL_IMAGE_NAME}"
echo ""
echo "Next steps:"
echo "1. Push to Docker Hub: docker push ${FULL_IMAGE_NAME}"
echo "2. Update lightsail-deployment.json with correct environment variables"
echo "3. Deploy to AWS Lightsail using AWS CLI or console"