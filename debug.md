# Debug.md - Expo Mobile App Analysis

## Expo 앱 좌우 버튼이 있는 날짜 섹션 조사 결과

### 1. **컴포넌트 명칭**
- **파일**: `/Users/lyuhyeogsang/hy2/expo-mobile/src/screens/DeliveryListScreen.js`
- **컴포넌트명**: `dateNavigation` (CSS 스타일 클래스명)
- **JSX 구조**:
```jsx
<View style={styles.dateNavigation}>
  <TouchableOpacity style={styles.dateArrow} onPress={() => changeDateBy(-1)}>
    <Text style={styles.dateArrowText}>←</Text>
  </TouchableOpacity>
  <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
  <TouchableOpacity style={styles.dateArrow} onPress={() => changeDateBy(1)}>
    <Text style={styles.dateArrowText}>→</Text>
  </TouchableOpacity>
</View>
```

### 2. **날짜 표시 규칙**
코드의 `formatDate` 함수 (318-325줄)에서 정의:
```javascript
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
};
```

**표시 형식**: `YYYY년 MM월 DD일 (요일)`
**예시**: `2025년 09월 24일 (화)`

### 3. **구성 요소**

#### **좌우 화살표 버튼**:
- **왼쪽 버튼**: `←` (이전 날짜로)
- **오른쪽 버튼**: `→` (다음 날짜로) 
- **기능**: `changeDateBy(-1)` / `changeDateBy(1)` 함수 호출
- **스타일**: `dateArrow`, `dateArrowText` 클래스

#### **중앙 날짜 텍스트**:
- **클래스명**: `dateText`
- **상태 변수**: `selectedDate` (React useState)
- **초기값**: `new Date()` (현재 날짜)

### 4. **관련 기능**
- **날짜 변경**: 좌우 버튼 클릭 시 하루씩 이동
- **데이터 필터링**: 선택된 날짜에 해당하는 배송 목록만 표시
- **AsyncStorage 저장**: 선택된 날짜를 로컬 저장소에 보관 (`selectedDeliveryDate`)
- **자동 새로고침**: 날짜 변경 시 `fetchDeliveries()` 자동 호출

### 5. **스타일링 정보**
```javascript
dateNavigation: {
  backgroundColor: '#fff',
  flexDirection: 'row',
  alignItems: 'center', 
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
},
dateText: {
  fontSize: 14,
  fontWeight: 'bold', 
  color: '#333',
  flex: 1,
  textAlign: 'center',
}
```

이 날짜 네비게이션 부분은 DeliveryListScreen의 핵심 UI 구성요소로, 사용자가 날짜별 배송 목록을 쉽게 탐색할 수 있도록 해주는 기능입니다.

## DeliveryListScreen 배송목록 표시 규칙

### 1. **데이터 소스**
- **API 호출**: `api.get('/deliveries')` - 모든 배송 데이터 조회
- **응답 구조**: `response.data.deliveries` 배열

### 2. **핵심 필터링 규칙**

#### **날짜 기반 필터링 (기본 규칙)**
```javascript
.filter(delivery => {
  if (!delivery.visitDate) {
    return false; // visitDate가 없으면 제외
  }
  
  const deliveryDateOnly = extractDateOnly(delivery.visitDate);
  const selectedDateString = extractDateOnly(selectedDate);
  return deliveryDateOnly === selectedDateString; // 정확히 일치하는 날짜만
})
```

**필터링 조건**:
- **필수 조건**: `visitDate` 필드가 존재해야 함
- **날짜 매칭**: 선택된 날짜(`selectedDate`)와 `visitDate`가 정확히 일치
- **시간 무시**: 시간 부분은 완전히 제거하고 날짜(YYYY-MM-DD)만 비교
- **형식 지원**: ISO 문자열(`2025-09-24T15:00:00.000Z`) 또는 Date 객체 모두 처리

### 3. **정렬 규칙**

#### **자동 모드 (orderMode === 'auto')**
**우선순위 기반 다단계 정렬**:

1. **1차: 상태 우선순위**
   ```javascript
   const statusPriority = {
     '미상차': 1,        // 최상위
     '상차완료': 2,  
     '배송중': 3,
     '완료': 4,
     'completed': 4,
     'delivered': 4,
     // 맨 아래 (우선순위 100)
     '배송취소': 100,
     '배송연기': 100,
     '배송완료': 100,
     'cancelled': 100,
     'delivery_cancelled': 100,
     'delivery_completed': 100,
     'collection_completed': 100
   };
   ```

2. **2차: actual_delivery 시간순**
   - 같은 상태 우선순위 내에서 `actual_delivery` 최신순 (내림차순)
   - 최신 처리 시간이 위로 배치

3. **3차: 고객 주소 가나다순**
   - `actual_delivery`가 같을 경우 `customerAddress` 기준 한글 사전순
   - `localeCompare(addressB, 'ko')` 사용

#### **수동 모드 (orderMode === 'manual')**
- **드래그 앤 드롭**: 사용자가 직접 순서 변경 가능
- **원래 순서 유지**: API에서 받은 순서 그대로 표시
- **실시간 변경**: `handleDragEnd`로 순서 변경 즉시 반영

### 4. **상태 통계 계산**
```javascript
const totalCount = sortedDeliveries.length; // 전체 건수
const completedCount = deliveriesData.filter(item => 
  item.status === 'delivery_completed' || 
  item.status === 'collection_completed' || 
  item.status === 'processing_completed' || 
  item.status === 'completed' || 
  item.status === 'delivered' ||
  item.status === '배송완료' || 
  item.status === '수거완료' || 
  item.status === '조처완료'
).length; // 완료 건수
```

### 5. **데이터 매핑 규칙**
**API 필드 → 앱 내부 필드**:
```javascript
{
  id: delivery.id,
  trackingNumber: delivery.tracking_number,
  customerName: delivery.customer_name || delivery.receiver_name,
  customerPhone: delivery.customer_phone || delivery.receiver_phone,
  customerAddress: delivery.customer_address || delivery.receiver_address,
  visitDate: delivery.visit_date,  // 핵심 필터링 기준
  visitTime: delivery.visit_time,
  status: delivery.status,         // 정렬 우선순위 기준
  actual_delivery: delivery.actual_delivery, // 2차 정렬 기준
  // ... 기타 필드들
}
```

### 6. **실시간 업데이트 규칙**
- **AsyncStorage 모니터링**: `updatedDeliveryStatus` 키 감지
- **화면 포커스 시**: 상태 변경 사항 자동 반영
- **1분 이내 업데이트만**: 중복 처리 방지
- **로컬 상태 우선**: API 재호출 없이 즉시 UI 업데이트

### 7. **빈 목록 처리**
- **조건**: 필터링 후 배송 건수가 0개
- **표시 메시지**: "배송할 목록이 없습니다."
- **추가 메시지 (수동 모드)**: "길게 눌러서 순서를 변경할 수 있습니다."

### 8. **새로고침 규칙**
- **pull-to-refresh**: 수동 새로고침 지원 (자동 모드에서만)
- **날짜 변경 시**: `fetchDeliveries()` 자동 호출
- **화면 포커스 시**: AsyncStorage 업데이트 확인

### 9. **날짜 추출 헬퍼 함수**
```javascript
// 날짜만 추출하는 헬퍼 함수 (시간 부분 완전 제거)
const extractDateOnly = (dateInput) => {
  if (!dateInput) return null;
  
  // 문자열인 경우 (ISO 형식): "2025-09-16T15:00:00.000Z" -> "2025-09-16"
  if (typeof dateInput === 'string') {
    return dateInput.split('T')[0];
  }
  
  // Date 객체인 경우: UTC 날짜만 추출
  if (dateInput instanceof Date) {
    return dateInput.toISOString().split('T')[0];
  }
  
  return null;
};
```

**요약**: DeliveryListScreen은 선택된 날짜의 `visitDate`와 정확히 일치하는 배송만 표시하며, 상태 우선순위 → 처리 시간 → 주소순으로 자동 정렬하거나 사용자가 수동으로 순서를 조정할 수 있는 시스템입니다.