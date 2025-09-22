# AWS CLI 설정 가이드

## 방법 1: 대화형 설정
```bash
aws configure
```
입력 정보:
- AWS Access Key ID: [위에서 생성한 키]
- AWS Secret Access Key: [위에서 생성한 시크릿]
- Default region name: ap-northeast-1
- Default output format: json

## 방법 2: 환경변수 설정
```bash
export AWS_ACCESS_KEY_ID=your_access_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_key_here
export AWS_DEFAULT_REGION=ap-northeast-1
```

## 설정 확인
```bash
aws sts get-caller-identity
```

성공하면 다음과 같은 출력이 나타납니다:
```json
{
    "UserId": "AIDACKCEVSQ6C2EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/lightsail-user"
}
```