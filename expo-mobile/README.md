# 이지픽스 가구배송 모바일 앱

React Native/Expo 기반의 가구배송 관리 모바일 애플리케이션입니다.

## 주요 기능

### 📱 배송 관리
- 배송 목록 조회 및 관리
- 배송 상세 정보 확인
- 배송 상태 업데이트 (배차완료, 배송중, 완료 등)
- **배송 연기 기능**: 달력 선택을 통한 연기 날짜 설정
- **배송 취소 기능**: 취소 사유 입력 및 상태 변경
- **배송완료 처리**: 고객/가구사 요청별 완료 처리
- **실시간 상태 업데이트**: AsyncStorage를 통한 실시간 상태 동기화
- **상태별 색상 구분**: 배송연기(노란색), 배송취소(빨간색), 배송완료(녹색)
- **동적 라인 색상**: 왼쪽 굵은 라인(6px)이 배송 상태에 따라 자동 색상 변경
- **배송완료 시 수정 제한**: 배송완료 상태에서는 사진 추가만 가능, 수정버튼 숨김
- QR 코드 스캔을 통한 빠른 배송 조회
- 고객 서명 기능 (Canvas 기반 서명 패드)

### 📸 사진 및 오디오 관리 (Firebase Storage)
- **Firebase Storage 통합**: 배송 사진과 오디오를 Firebase Storage에 안전하게 저장
- **환경별 활성화**: Expo Go에서는 비활성화, EAS Build에서만 활성화
- **실시간 업로드 진행률**: 파일 업로드 시 진행률 표시
- **다중 파일 업로드**: 한 번에 여러 장의 사진과 오디오 파일 업로드 지원
- **파일 미리보기**: 업로드된 사진 목록 조회 및 미리보기
- **오디오 파일 지원**: MP3, WAV, M4A, AAC, OGG, 3GP, AMR 형식 지원
- **파일 삭제**: 개별 파일 삭제 기능

### 🔐 인증 시스템
- JWT 토큰 기반 인증
- 자동 토큰 갱신
- 개발 환경 test-token 지원

### 🌐 네트워크 관리
- 동적 IP 감지 및 자동 연결
- Railway 배포 서버 지원
- 네트워크 오류 자동 재시도

### 🗺️ 지도 기능
- **구글지도 통합**: WebView 기반 구글지도 embed 표시
- **배송지 마커**: 모든 배송 주소를 지도에 마커로 표시
- **동적 주소 전환**: 배송 목록에서 선택시 해당 주소로 지도 이동
- **API 키 불필요**: `maps.google.com/maps?q=주소&output=embed` 방식 사용
- **안정적 동작**: WebView 환경에서 즉시 로딩, 네트워크 오류 없음
- **지도로 보기**: 배송목록에서 "지도로보기" 버튼으로 모든 배송지 한눈에 확인
- **상호작용**: 하단 슬라이더에서 배송지 선택시 지도 자동 이동

### ⚙️ 설정 관리
- **지도 설정**: 기본 지도 앱 선택 (네이버지도, 카카오지도, 티맵, 구글지도)
- **앱 정보**: 앱 이름, 버전, 개발사, 업데이트 ID 등 상세 정보 표시
- **버전 표시**: 헤더에 실시간 runtime version 표시
- **OTA 업데이트**: EAS Update를 통한 실시간 앱 업데이트 지원
- **스마트 업데이트**: 변경사항이 있을 때만 업데이트 메시지 표시

## 기술 스택

- **Frontend**: React Native, Expo SDK 54
- **State Management**: React Hooks
- **Storage**: Firebase Storage v9+
- **HTTP Client**: Axios
- **Navigation**: React Navigation
- **Authentication**: JWT Tokens
- **OTA Updates**: EAS Update
- **File Management**: Document Picker, Image Picker

## Firebase Storage 설정

### 현재 상태
- **Expo Go**: Firebase Storage 비활성화 (개발용)
- **EAS Build**: Firebase Storage 활성화 (프로덕션용)
- 환경 자동 감지: `Constants.appOwnership !== 'expo'`로 구분

### 실제 Firebase 프로젝트 설정 방법

1. **Firebase 프로젝트 생성**
   ```bash
   # Firebase Console에서 새 프로젝트 생성
   # https://console.firebase.google.com/
   ```

2. **Firebase Storage 활성화**
   - Firebase Console > Storage > 시작하기
   - 보안 규칙 설정

3. **Firebase 설정 업데이트**
   ```javascript
   // src/config/firebase.js
   const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

4. **보안 규칙 설정**
   ```javascript
   // Firebase Storage 규칙
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /delivery-photos/{trackingNumber}/{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## API 엔드포인트

### 배송 관리
- `GET /api/deliveries` - 배송 목록 조회
- `GET /api/deliveries/:id` - 배송 상세 조회
- `PUT /api/deliveries/:id` - 배송 정보 업데이트
- `PATCH /api/deliveries/:id/status` - 배송 상태 업데이트
- `POST /api/deliveries/complete/:id` - 배송 완료 처리 (고객/가구사 요청별)
- `POST /api/deliveries/delay/:trackingNumber` - 배송 연기 처리 (연기 날짜, 연기 사유)
- `POST /api/deliveries/cancel/:id` - 배송 취소 (취소 사유)
- `GET /api/deliveries/track/:trackingNumber` - 공개 배송 추적

### 배송 사진 관리
- `POST /api/deliveries/:trackingNumber/photos` - 사진 업로드
- `GET /api/deliveries/:trackingNumber/photos` - 사진 목록 조회
- `PUT /api/deliveries/:trackingNumber/photos` - 사진 목록 업데이트
- `DELETE /api/deliveries/photos/:photoId` - 사진 삭제
- `POST /api/audio/firebase-url/:trackingNumber` - 오디오 파일 Firebase URL 저장

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입
- `GET /api/auth/map-preference` - 지도 설정 조회
- `PUT /api/auth/map-preference` - 지도 설정 변경

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (Expo Go)
npx expo start

# EAS Build (프로덕션 APK)
eas build --platform android --profile production-apk

# OTA 업데이트 배포
eas update --auto
```

## 환경 변수

```bash
# .env (선택사항)
API_URL=https://your-backend-url.com/api
```

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   └── map/            # 지도 관련 컴포넌트
│       └── SimpleNaverMap.js  # 개별 배송 지도 표시
├── config/             # 설정 파일
│   ├── api.js         # API 설정 및 Axios 인스턴스
│   ├── firebase.js    # Firebase 설정
│   └── naver.js       # 네이버 API 설정 (레거시)
├── screens/           # 화면 컴포넌트
│   ├── DeliveryListScreen.js      # 배송 목록 화면
│   ├── DeliveryDetailScreen.js    # 배송 상세 화면
│   ├── DeliveryMapViewScreen.js   # 구글지도 통합 화면
│   └── MapSettingScreen.js        # 지도 설정 화면
├── utils/             # 유틸리티 함수
│   └── firebaseStorage.js  # Firebase Storage 헬퍼
└── App.js            # 메인 앱 컴포넌트
```

## 개발 참고사항

### Firebase Storage 함수
- `uploadDeliveryPhoto()` - 단일 사진 업로드
- `uploadMultipleDeliveryPhotos()` - 다중 사진 업로드
- `uploadDeliveryAudio()` - 오디오 파일 업로드
- `getDeliveryPhotos()` - 사진 목록 조회
- `deleteDeliveryPhoto()` - 사진 삭제

### 에러 처리
- 네트워크 연결 오류 자동 재시도
- Firebase Storage 오류 graceful handling
- 사용자 친화적 오류 메시지 표시

### 개발 모드 특징
- **Expo Go**: test-token 자동 사용, Firebase Storage 비활성화
- **EAS Build**: 프로덕션 환경, Firebase Storage 활성화
- 상세한 로깅
- EAS Update 자동 업데이트 체크

### 배송 연기 기능
- **달력 UI**: React Native Calendar 컴포넌트 사용
- **날짜 선택**: 터치 친화적인 달력 인터페이스
- **연기 사유**: 텍스트 입력 필드로 연기 이유 기록
- **API 통합**: `/api/deliveries/delay/:trackingNumber` 엔드포인트 사용
- **데이터 저장**: 배송 메모(`driver_notes`) 필드에 연기 정보 추가
- **Timezone 처리**: 로컬 시간 기준으로 정확한 날짜 처리

## 배포

### 백엔드 (Railway 배포)
- **Production URL**: `https://efficient-abundance-production-d603.up.railway.app/api`
- **Health Check**: `https://efficient-abundance-production-d603.up.railway.app/health`
- **배포 방식**: GitHub 연동 자동 배포
- **환경**: Node.js, Express.js, MySQL

### 프론트엔드 (EAS Update OTA)
- **Runtime Version**: 1.2.1
- **Update Group**: 55be3cdf-18ef-49ef-8c39-bd3f57438c2e
- **배포 방식**: EAS Update를 통한 Over-The-Air 업데이트
- **지원 플랫폼**: Android, iOS

## 라이센스

MIT License

## 배포 정보

### APK 파일 (EAS Build)
- **최신 버전**: v1.2.2 (versionCode: 26)
- **최신 APK**: https://expo.dev/artifacts/eas/o3baRndqgJ7sZH5bvqHVNJ.apk
- **이전 APK**: https://expo.dev/artifacts/eas/4XbMk1VwyPijg9xewoneSB.apk
- **빌드 플랫폼**: EAS Build (Expo Application Services)
- **포함 기능**: Firebase Storage, EAS Update, 모든 네이티브 기능

### OTA 업데이트 (EAS Update)
- **EAS 프로젝트**: easypicks-delivery
- **업데이트 URL**: https://u.expo.dev/9bef9076-ac2a-40c3-83c3-c73a0f50be11
- **Runtime Version**: 1.2.2
- **브랜치**: master
- **자동 업데이트**: 앱 시작 후 3초 후 체크 (`checkAutomatically: "ON_ERROR_RECOVERY"`)

#### 자동 업데이트 작동 조건
- **Production Build 필요**: Development build에서는 자동 업데이트가 제한됨
- **동일한 Runtime Version**: 앱과 업데이트의 runtime version이 일치해야 함
- **네트워크 연결**: 인터넷 연결 상태에서만 업데이트 다운로드 가능

#### 수동 업데이트 방법
- Expo Dashboard에서 QR 코드 스캔으로 즉시 업데이트 가능
- Development build 환경에서 권장되는 방법

## 업데이트 히스토리

### v1.2.1 (2025-09-24)
- 🗺️ **구글지도 통합**: 네이버지도에서 구글지도로 전환하여 안정성 향상
- 🎯 **API 키 불필요**: `maps.google.com/maps?q=주소&output=embed` 방식으로 즉시 사용 가능
- ✅ **지도로 보기 기능**: 배송목록에서 모든 배송지를 구글지도에서 한눈에 확인
- 🔄 **동적 주소 변경**: 하단 슬라이더에서 배송지 선택시 지도가 해당 주소로 자동 이동
- 🛠️ **WebView 최적화**: iframe embed 방식으로 React Native WebView에서 안정적 동작
- 📍 **배송지 마커 시각화**: 모든 배송 주소를 마커로 표시하여 직관적인 위치 파악 가능
- 💬 **배송 정보 팝업**: 배송지 선택시 고객명, 운송장번호, 주소 정보 표시
- 🔧 **네이버 API 의존성 제거**: API 로드 실패 문제 해결 및 즉시 지도 표시 보장

### v1.2.2 (2025-09-20)
- ✨ **배송완료 상태 녹색 라인 표시**: 왼쪽 굵은 라인이 status 배경색과 동일하게 표시
- ✨ **배송완료 시 사진 수정버튼 숨기기**: 배송완료 상태에서는 사진 추가만 가능, 수정 불가
- ✨ **앱 버전 표시**: DeliveryListScreen 헤더에 '이지픽스' 옆에 버전 정보 표시
- ✨ **앱정보 화면 추가**: 설정 메뉴에서 접근 가능한 상세 앱 정보 화면
- 🔧 **EAS Update 이벤트 리스너 개선**: 업데이트 완료 시에만 메시지 표시, 변경사항 없으면 조용히 실행
- 🔧 **왼쪽 라인 두께 증가**: 4px → 6px로 더 굵게 변경
- 🔧 **동적 라인 색상**: 모든 배송 상태에 따라 왼쪽 라인 색상이 status 배지와 동일하게 표시
- 🔧 **Runtime Version 고정**: 안정적인 EAS Update를 위해 1.2.1로 고정 유지
- 📱 **앱정보 화면 내용**: 앱 이름, 버전, 개발사, 업데이트 ID, 빌드 환경 등 상세 정보 제공

### v1.2.1 (2025-09-19)
- 🔥 **Firebase Storage EAS Build 통합**: Expo Go에서는 비활성화, EAS Build에서만 활성화
- 🎯 **EAS Update 자동 업데이트 완료**: 앱 시작 시 자동으로 업데이트 확인 및 설치
- ✅ **Signature Canvas 복구**: react-native-signature-canvas v5.0.1로 고객 서명 기능 복구
- ✅ **DraggableFlatList 복구**: 수동 배송 순서 변경 기능 복구
- 🔧 **의존성 최적화**: package-lock.json 재생성으로 빌드 안정성 향상
- 🔧 **CNG/Prebuild 설정**: .gitignore에 /android, /ios 추가로 Expo 워크플로우 최적화
- 📱 **EAS Build 성공**: Firebase 포함 완전한 프로덕션 APK 빌드 (versionCode: 22)
- 🐛 **빌드 오류 해결**: Firebase 패키지, reanimated 플러그인, 의존성 충돌 문제 해결

### v1.2.1 (2025-09-18)
- ✨ **배송 연기 시스템 구현**: 달력 선택을 통한 배송 연기 기능 추가
- ✨ **EAS Update OTA 업데이트 시스템 구현**: 실시간 앱 업데이트 지원
- ✨ **자동 업데이트 체크 로직**: 앱 시작 시 자동 업데이트 확인 및 알림
- ✨ **지도 설정 API 및 UI 추가**: 네이버, 카카오, 티맵, 구글지도 선택 기능
- ✨ **오디오 파일 Firebase Storage 업로드 지원**: 음성 메모 저장 기능
- ✨ **배송 상태 실시간 업데이트**: AsyncStorage를 통한 실시간 상태 동기화
- ✨ **배송취소 기능 구현**: 취소 사유 입력 및 상태 업데이트
- ✨ **배송완료 처리 시스템**: 고객/가구사 요청별 완료 처리
- 🔧 **로그인 화면 브랜딩 변경**: "이지픽스 가구배송" + 버전 표시 (v1.2.1)
- 🔧 **APK 빌드 환경 최적화**: TLS 문제 해결 및 빌드 안정성 향상
- 🔧 **상태별 배경색 개선**: 배송연기→노란색, 배송취소→빨간색, 배송완료→녹색
- 🔧 **백엔드 Railway 배포**: 프로덕션 환경 배포 완료
- 🐛 **배송 연기 API 오류 수정**: tracking number undefined 문제 해결
- 🐛 **달력 날짜 선택 오류 수정**: timezone 변환으로 인한 "하루 적게 표시" 문제 해결
- 🐛 **배송완료 처리 오류 수정**: 영문 상태명을 한글로 변경하여 DB 오류 해결
- 📱 **설정 화면에서 지도 앱 선택 기능 추가**: 사용자 편의성 향상
- 📱 **배송목록 새로고침 없이 상태 업데이트**: 리로드 없는 실시간 UI 업데이트

### v1.2.0 (2024-09-17)
- ✨ Firebase Storage 통합 구현
- ✨ 실시간 업로드 진행률 표시
- ✨ 다중 사진 업로드 지원
- 🐛 데이터베이스 쿼리 오류 수정
- 🐛 중복 함수 선언 오류 해결
- 🔧 Firebase Storage 데모 모드 추가
- 📱 배송 상세 화면 UI/UX 개선