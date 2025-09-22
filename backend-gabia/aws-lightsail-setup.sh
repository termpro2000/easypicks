#!/bin/bash

# AWS Lightsail 컨테이너 서비스 설정 스크립트

set -e

# 변수 설정
SERVICE_NAME="easypicks-backend"
POWER="medium"  # nano, micro, small, medium, large, xlarge
SCALE=1
REGION="ap-northeast-1"  # 도쿄 리전

echo "🚀 Setting up AWS Lightsail Container Service..."

# AWS CLI 설치 확인
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first."
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# AWS 설정 확인
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"

# Lightsail 컨테이너 서비스 생성
echo "📦 Creating Lightsail container service: ${SERVICE_NAME}"

aws lightsail create-container-service \
    --service-name "${SERVICE_NAME}" \
    --power "${POWER}" \
    --scale "${SCALE}" \
    --region "${REGION}"

echo "⏳ Waiting for service to be ready..."
aws lightsail wait container-service-ready --service-name "${SERVICE_NAME}"

# 서비스 상태 확인
echo "📊 Service status:"
aws lightsail get-container-services --service-name "${SERVICE_NAME}"

# 정적 IP 생성 (선택사항)
echo "🌐 Creating static IP..."
STATIC_IP_NAME="${SERVICE_NAME}-static-ip"

if aws lightsail allocate-static-ip --static-ip-name "${STATIC_IP_NAME}" --region "${REGION}"; then
    echo "✅ Static IP created: ${STATIC_IP_NAME}"
else
    echo "⚠️  Static IP creation failed or already exists"
fi

echo ""
echo "🎉 AWS Lightsail setup completed!"
echo ""
echo "Next steps:"
echo "1. Update lightsail-deployment.json with your environment variables"
echo "2. Build and push your Docker image"
echo "3. Deploy using: ./deploy-to-lightsail.sh"
echo ""
echo "Service details:"
echo "- Name: ${SERVICE_NAME}"
echo "- Power: ${POWER}"
echo "- Scale: ${SCALE}"
echo "- Region: ${REGION}"