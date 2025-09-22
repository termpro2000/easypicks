#!/bin/bash

# AWS Lightsail 배포 스크립트

set -e

# 변수 설정
SERVICE_NAME="easypicks-backend"
IMAGE_NAME="easypicks/backend:latest"
DEPLOYMENT_FILE="lightsail-deployment.json"

echo "🚀 Deploying to AWS Lightsail..."

# 필수 파일 확인
if [ ! -f "$DEPLOYMENT_FILE" ]; then
    echo "❌ Deployment file not found: $DEPLOYMENT_FILE"
    exit 1
fi

# AWS CLI 설정 확인
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# 배포 전 환경변수 확인
echo "⚠️  Please ensure the following environment variables are set in $DEPLOYMENT_FILE:"
echo "   - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME"
echo "   - JWT_SECRET, SESSION_SECRET"
echo "   - CORS_ORIGIN"
echo ""

read -p "Are environment variables configured? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please update $DEPLOYMENT_FILE with correct environment variables first."
    exit 1
fi

# 컨테이너 서비스 존재 확인
echo "📋 Checking container service..."
if ! aws lightsail get-container-service --service-name "$SERVICE_NAME" &> /dev/null; then
    echo "❌ Container service '$SERVICE_NAME' not found."
    echo "Please run ./aws-lightsail-setup.sh first."
    exit 1
fi

# 배포 실행
echo "📦 Creating deployment..."
aws lightsail create-container-service-deployment \
    --service-name "$SERVICE_NAME" \
    --cli-input-json file://"$DEPLOYMENT_FILE"

# 배포 상태 확인
echo "⏳ Waiting for deployment to complete..."
echo "This may take a few minutes..."

# 배포 완료까지 대기 (최대 10분)
for i in {1..60}; do
    STATUS=$(aws lightsail get-container-service --service-name "$SERVICE_NAME" --query 'containerService.state' --output text)
    
    if [ "$STATUS" = "RUNNING" ]; then
        echo "✅ Deployment completed successfully!"
        break
    elif [ "$STATUS" = "FAILED" ]; then
        echo "❌ Deployment failed!"
        exit 1
    else
        echo "⏳ Status: $STATUS (attempt $i/60)"
        sleep 10
    fi
done

# 서비스 정보 출력
echo ""
echo "📊 Service Information:"
aws lightsail get-container-service --service-name "$SERVICE_NAME" \
    --query 'containerService.{Name:containerServiceName,State:state,Url:url,PowerId:powerId,Scale:scale}' \
    --output table

# URL 추출
SERVICE_URL=$(aws lightsail get-container-service --service-name "$SERVICE_NAME" --query 'containerService.url' --output text)

if [ "$SERVICE_URL" != "None" ]; then
    echo ""
    echo "🌐 Service URL: $SERVICE_URL"
    echo ""
    echo "🧪 Testing health endpoint..."
    if curl -f "$SERVICE_URL/health"; then
        echo ""
        echo "✅ Health check passed!"
    else
        echo ""
        echo "⚠️  Health check failed. Please check logs."
    fi
else
    echo "⚠️  Service URL not available yet. Please wait a few more minutes."
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Test all API endpoints"
echo "2. Configure custom domain (optional)"
echo "3. Set up monitoring and alerts"
echo "4. Update frontend to use new backend URL"