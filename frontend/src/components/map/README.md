# SimpleNaverMap 컴포넌트

간단하고 최소한의 설정으로 네이버 지도를 표시하는 React 컴포넌트입니다.

## 설치 및 설정

1. **네이버 클라우드 플랫폼에서 Maps API 키 발급**
   - [네이버 클라우드 플랫폼](https://www.ncloud.com/) 접속
   - Maps API 신청 및 Client ID 발급

2. **환경 변수 설정**
   ```bash
   # .env 파일에 추가
   VITE_NAVER_MAP_CLIENT_ID=your_actual_client_id_here
   ```

## 사용법

```tsx
import SimpleNaverMap from '../map/SimpleNaverMap';

// 기본 사용
<SimpleNaverMap />

// 주소로 위치 표시
<SimpleNaverMap 
  address="서울특별시 중구 세종대로 110"
  height="300px"
  zoom={15}
/>

// 사용자 정의 스타일
<SimpleNaverMap 
  address={customerAddress}
  width="100%"
  height="200px"
  zoom={16}
  className="rounded-lg shadow-md"
/>
```

## Props

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `address` | `string` | - | 표시할 주소 (선택사항) |
| `width` | `string` | `'100%'` | 지도 너비 |
| `height` | `string` | `'300px'` | 지도 높이 |
| `zoom` | `number` | `15` | 지도 줌 레벨 (1-21) |
| `className` | `string` | `''` | 추가 CSS 클래스 |

## 특징

- **간단한 설정**: 최소한의 props로 쉽게 사용
- **주소 검색**: 주소를 입력하면 자동으로 해당 위치 표시
- **마커 표시**: 검색된 주소에 마커 자동 생성
- **반응형**: 다양한 크기로 조정 가능
- **깔끔한 UI**: 불필요한 컨트롤 제거로 깔끔한 인터페이스

## 주의사항

- 네이버 클라우드 플랫폼에서 발급받은 실제 Client ID를 환경 변수에 설정해야 합니다
- HTTPS 환경에서 사용하는 것을 권장합니다
- API 사용량에 따라 요금이 발생할 수 있습니다