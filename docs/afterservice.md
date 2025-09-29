# 📋 배송완료처리 귀책사항 시스템

이지픽스 배송 관리 시스템의 배송완료처리 귀책사항 분류 및 증빙자료 관리 시스템에 대한 상세 문서입니다.

## 🔧 **배송완료처리 귀책사항 로직**

### 📱 **1. UI 구성요소**

**상태 관리 변수:**
```javascript
// 체크박스 상태 관리
const [customerRequestedCompletion, setCustomerRequestedCompletion] = useState(false);
const [furnitureCompanyRequestedCompletion, setFurnitureCompanyRequestedCompletion] = useState(false);
const [completionAudioFile, setCompletionAudioFile] = useState(null);
```

**UI 컴포넌트:**
- ☑️ **체크박스 1**: "고객요청에 의한 배송완료처리 (소비자 귀책사항)"
- ☑️ **체크박스 2**: "가구사요청에 의한 배송완료처리 (가구사 귀책사항)"
- 🎤 **녹음파일 업로드**: "해당 요청에 대한 증빙파일첨부 (녹음파일)"

### 📋 **2. 사용자 인터랙션 플로우**

```javascript
// 배송완료처리 버튼 클릭 시 확인 로직
const handleResultRegister = () => {
  const hasCompletionProcessing = customerRequestedCompletion || furnitureCompanyRequestedCompletion;
  
  let confirmMessage = '배송 결과를 등록하시겠습니까?';
  
  if (hasCompletionProcessing) {
    const completionTypes = [];
    if (customerRequestedCompletion) completionTypes.push('소비자 귀책사항');
    if (furnitureCompanyRequestedCompletion) completionTypes.push('가구사 귀책사항');
    
    confirmMessage = `배송완료처리 유형: ${completionTypes.join(', ')}\n`;
    
    if (completionAudioFile) {
      confirmMessage += `증빙 녹음파일: ${completionAudioFile.name}\n\n`;
    } else {
      confirmMessage += '증빙 녹음파일: 없음\n\n';
    }
    
    confirmMessage += '배송 결과를 등록하시겠습니까?';
  }
};
```

**시나리오별 확인 메시지:**

| 상황 | 확인 메시지 |
|------|-------------|
| **일반 완료** | "배송 결과를 등록하시겠습니까?" |
| **귀책사항 + 파일** | "배송완료처리 유형: 소비자 귀책사항<br/>증빙 녹음파일: recording.mp3<br/><br/>배송 결과를 등록하시겠습니까?" |
| **귀책사항 + 파일없음** | "배송완료처리 유형: 가구사 귀책사항<br/>증빙 녹음파일: 없음<br/><br/>배송 결과를 등록하시겠습니까?" |

### 🔄 **3. 데이터 처리 워크플로우**

```javascript
const handleDeliveryCompletionSubmit = async () => {
  try {
    setLoading(true);
    
    const trackingNumber = delivery.trackingNumber || delivery.tracking_number || delivery.id;
    
    // 1단계: 오디오 파일 업로드 (있는 경우)
    let audioFileName = null;
    if (completionAudioFile) {
      console.log('오디오 파일 업로드 시작:', completionAudioFile.name);
      audioFileName = await uploadAudioFile(trackingNumber, completionAudioFile);
    }
    
    // 2단계: 배송완료 데이터 준비
    const completionData = {
      deliveryId: delivery.id,
      driverNotes: driverNotes,
      customerRequestedCompletion: customerRequestedCompletion,      // boolean → DB int
      furnitureCompanyRequestedCompletion: furnitureCompanyRequestedCompletion, // boolean → DB int  
      completionAudioFile: audioFileName,  // 업로드된 파일명
      completedAt: new Date().toISOString()
    };
    
    // 3단계: 배송완료 처리 API 호출
    const response = await fetch(`${getBaseURL()}/delivery/complete/${delivery.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${submitToken}`,
      },
      body: JSON.stringify(completionData),
    });
    
    const result = await response.json();
    
    if (result.success) {
      Alert.alert('완료', '배송 결과가 성공적으로 등록되었습니다.');
      navigation.goBack();
    } else {
      Alert.alert('오류', result.error || '배송완료 처리에 실패했습니다.');
    }
    
  } catch (error) {
    console.error('배송완료 처리 오류:', error);
    Alert.alert('오류', '배송완료 처리 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
};
```

### 🎵 **4. 오디오 파일 업로드 로직**

```javascript
const uploadAudioFile = async (trackingNumber, audioFile) => {
  try {
    const formData = new FormData();
    
    formData.append('audio', {
      uri: audioFile.uri,
      type: audioFile.type,
      name: audioFile.name,
    });
    
    const response = await fetch(`${getBaseURL()}/audio/upload/${trackingNumber}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${uploadToken}`,
        // Content-Type을 설정하지 않음 - FormData가 자동으로 설정
      },
      body: formData,
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('오디오 파일 업로드 성공:', result.file.fileName);
      return result.file.fileName;
    } else {
      throw new Error(result.error || '오디오 파일 업로드 실패');
    }
  } catch (error) {
    console.error('오디오 파일 업로드 오류:', error);
    throw error;
  }
};
```

## 💾 **데이터베이스 저장 구조**

### 🗃️ **1. 데이터베이스 스키마**

**필드 추가 스크립트:**
```sql
-- deliveries 테이블에 배송완료처리 관련 필드 추가

-- 고객요청에 의한 배송완료처리 (소비자 귀책사항)
ALTER TABLE deliveries 
ADD COLUMN customer_requested_completion TINYINT(1) DEFAULT 0 
COMMENT '고객요청에 의한 배송완료처리(소비자 귀책사항)';

-- 가구사요청에 의한 배송완료처리 (가구사 귀책사항)  
ALTER TABLE deliveries 
ADD COLUMN furniture_company_requested_completion TINYINT(1) DEFAULT 0 
COMMENT '가구사요청에 의한 배송완료처리(가구사 귀책사항)';

-- 배송완료 증빙 녹음파일 경로
ALTER TABLE deliveries 
ADD COLUMN completion_audio_file TEXT 
COMMENT '배송완료 증빙 녹음파일 경로';
```

**필드 상세:**
| 필드명 | 타입 | 기본값 | 설명 |
|--------|------|--------|------|
| `customer_requested_completion` | `TINYINT(1)` | `0` | 고객요청 완료처리 (0=미선택, 1=선택) |
| `furniture_company_requested_completion` | `TINYINT(1)` | `0` | 가구사요청 완료처리 (0=미선택, 1=선택) |
| `completion_audio_file` | `TEXT` | `NULL` | 증빙 녹음파일 경로/파일명 |

### 🔄 **2. 백엔드 데이터 변환 로직**

```javascript
// POST /api/delivery/complete/:id 엔드포인트
router.post('/complete/:id', authenticateToken, async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const { 
      driverNotes, 
      customerRequestedCompletion, 
      furnitureCompanyRequestedCompletion, 
      completionAudioFile,
      completedAt 
    } = req.body;
    
    // 현재 시간 (MySQL datetime 형식으로 변환)
    const now = completedAt ? 
      new Date(completedAt).toISOString().slice(0, 19).replace('T', ' ') :
      new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // 배송완료 처리 (모든 필드 업데이트)
    const [updateResult] = await pool.execute(
      `UPDATE deliveries SET 
         status = 'completed',
         driver_notes = ?,
         customer_requested_completion = ?,        -- boolean → int 변환
         furniture_company_requested_completion = ?, -- boolean → int 변환
         completion_audio_file = ?,                -- 파일명 저장
         actual_delivery = ?,                      -- 완료 시간 저장
         updated_at = NOW()
       WHERE id = ?`,
      [
        driverNotes || '',
        customerRequestedCompletion ? 1 : 0,        // boolean → int 변환
        furnitureCompanyRequestedCompletion ? 1 : 0, // boolean → int 변환
        completionAudioFile || null,                // 파일명 또는 NULL
        now,                                        // MySQL datetime 형식
        deliveryId
      ]
    );
    
    // 성공 응답
    res.json({
      success: true,
      message: '배송이 성공적으로 완료되었습니다.',
      data: {
        deliveryId,
        trackingNumber: delivery.tracking_number,
        customerName: delivery.customer_name,
        completedAt: now,
        customerRequestedCompletion: customerRequestedCompletion,
        furnitureCompanyRequestedCompletion: furnitureCompanyRequestedCompletion,
        completionAudioFile: completionAudioFile
      }
    });
    
  } catch (error) {
    console.error('배송완료 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});
```

### 📊 **3. 실제 저장 예시**

**API 요청 데이터:**
```json
{
  "deliveryId": "64",
  "driverNotes": "고객 부재로 인한 배송완료 처리",
  "customerRequestedCompletion": true,
  "furnitureCompanyRequestedCompletion": false,
  "completionAudioFile": "TK03858036886_1757835422520_customer_call.mp3",
  "completedAt": "2025-09-14T07:40:00.000Z"
}
```

**데이터베이스 저장 결과:**
```json
{
  "id": 64,
  "tracking_number": "TK03858036886", 
  "status": "completed",
  "driver_notes": "고객 부재로 인한 배송완료 처리",
  "customer_requested_completion": 1,           // ✅ 소비자 귀책사항 선택됨
  "furniture_company_requested_completion": 0,  // ❌ 가구사 귀책사항 미선택
  "completion_audio_file": "TK03858036886_1757835422520_customer_call.mp3",
  "actual_delivery": "2025-09-14 07:40:00",    // MySQL datetime 형식
  "updated_at": "2025-09-14 07:40:01"
}
```

## 📂 **파일 저장 시스템**

### 🎵 **1. 오디오 파일 저장 구조**

```
프로젝트 루트/
└── uploads/
    └── delivery_audio/
        ├── TK03858036886_1757835422520_customer_call.mp3
        ├── MD2025091371925_1757836789012_voice_memo.wav
        ├── TEST123_1757835422520_test_audio.mp3
        └── TK78335450565_1757837123456_furniture_company_request.aac
```

**파일명 규칙:** `{배송번호}_{타임스탬프}_{원본파일명}`

- **배송번호**: 해당 배송의 추적번호
- **타임스탬프**: 업로드 시점의 Unix 타임스탬프 (밀리초)
- **원본파일명**: 사용자가 선택한 파일의 원본 이름

### 🔗 **2. 데이터베이스-파일 연결 구조**

```javascript
// 데이터베이스에는 파일명만 저장
completion_audio_file: "TK03858036886_1757835422520_customer_call.mp3"

// 실제 파일 경로
실제경로: /Users/lyuhyeogsang/hy2/uploads/delivery_audio/TK03858036886_1757835422520_customer_call.mp3

// 웹 접근 URL
웹URL: http://localhost:8080/delivery_audio/TK03858036886_1757835422520_customer_call.mp3
```

### 📋 **3. 지원 파일 형식**

```javascript
const allowedTypes = [
  'audio/mpeg',     // MP3
  'audio/mp3',      // MP3
  'audio/wav',      // WAV
  'audio/wave',     // WAV
  'audio/x-wav',    // WAV
  'audio/aac',      // AAC
  'audio/mp4',      // M4A
  'audio/x-m4a',    // M4A
  'audio/ogg',      // OGG
  'audio/webm',     // WEBM
  'audio/3gpp',     // 3GP (모바일 녹음)
  'audio/amr'       // AMR (모바일 녹음)
];
```

**파일 크기 제한:** 50MB

## ⚡ **비즈니스 로직 및 활용 방안**

### 📋 **1. 귀책사항 분류 목적**

| 구분 | 설명 | 사용 사례 |
|------|------|-----------|
| **소비자 귀책사항** | 고객 요청으로 인한 배송완료 | • 고객 부재<br/>• 배송 거부<br/>• 주소 오류<br/>• 연락 두절 |
| **가구사 귀책사항** | 가구회사 요청으로 인한 배송완료 | • 상품 불량<br/>• 주문 취소<br/>• 재고 부족<br/>• 업체 사정 |
| **증빙자료** | 해당 상황을 증명하는 녹음파일 | • 통화 녹음<br/>• 현장 상황 녹음<br/>• 확인 통화 |

### 🔄 **2. 처리 흐름도**

```
기사 현장 도착
       ↓
배송 시도 (정상 완료 OR 문제 발생)
       ↓
[문제 발생 시]
       ↓
문제 유형 확인 (고객 사유 OR 가구사 사유)
       ↓
해당 체크박스 선택
       ↓
관련자와 통화 (고객 OR 가구사)
       ↓
통화 내용 녹음 후 파일 첨부
       ↓
배송완료처리 버튼 클릭
       ↓
확인 대화상자에서 정보 검토
       ↓
최종 확인 후 서버 전송
       ↓
DB 저장 완료 + 파일 서버 저장
```

### 📊 **3. 활용 방안 및 분석**

**관리자 대시보드에서 활용 가능한 분석:**

1. **귀책사항별 통계**
   ```sql
   -- 소비자 귀책사항 통계
   SELECT COUNT(*) as count 
   FROM deliveries 
   WHERE customer_requested_completion = 1;
   
   -- 가구사 귀책사항 통계  
   SELECT COUNT(*) as count
   FROM deliveries 
   WHERE furniture_company_requested_completion = 1;
   ```

2. **증빙자료 보유 현황**
   ```sql
   -- 증빙파일이 있는 완료 배송
   SELECT COUNT(*) as count
   FROM deliveries 
   WHERE status = 'completed' 
   AND completion_audio_file IS NOT NULL;
   ```

3. **월별/기간별 귀책사항 추이**
   ```sql
   SELECT 
     DATE_FORMAT(actual_delivery, '%Y-%m') as month,
     SUM(customer_requested_completion) as customer_issues,
     SUM(furniture_company_requested_completion) as company_issues
   FROM deliveries 
   WHERE status = 'completed'
   GROUP BY DATE_FORMAT(actual_delivery, '%Y-%m')
   ORDER BY month;
   ```

### 🛡️ **4. 데이터 보안 및 관리**

**보안 측면:**
- 녹음파일은 서버 로컬 디렉토리에 저장
- 파일명에 추적번호 포함으로 소유권 명확화
- API 접근 시 인증 토큰 필수
- 파일 타입 및 크기 제한으로 보안 위험 최소화

**관리 측면:**
- 체계적인 파일명 규칙으로 관리 용이
- 데이터베이스와 파일 시스템 간 명확한 연결
- 배송 완료 시점과 파일 업로드 시점 추적 가능
- 증빙자료와 배송 데이터 간 무결성 보장

## 📝 **API 문서**

### 🔊 **오디오 파일 업로드**

```http
POST /api/audio/upload/:trackingNumber
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- audio: (file) 오디오 파일

Response:
{
  "success": true,
  "message": "오디오 파일이 성공적으로 업로드되었습니다.",
  "file": {
    "fileName": "TK03858036886_1757835422520_recording.mp3",
    "originalName": "recording.mp3", 
    "size": 2048576,
    "mimetype": "audio/mpeg",
    "uploadedAt": "2025-09-14T07:37:02.523Z"
  }
}
```

### ✅ **배송완료 처리**

```http
POST /api/delivery/complete/:id
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "driverNotes": "고객 부재로 인한 배송완료 처리",
  "customerRequestedCompletion": true,
  "furnitureCompanyRequestedCompletion": false, 
  "completionAudioFile": "TK03858036886_1757835422520_customer_call.mp3",
  "completedAt": "2025-09-14T07:40:00.000Z"
}

Response:
{
  "success": true,
  "message": "배송이 성공적으로 완료되었습니다.",
  "data": {
    "deliveryId": "64",
    "trackingNumber": "TK03858036886",
    "customerName": "고객403",
    "completedAt": "2025-09-14 07:40:00",
    "customerRequestedCompletion": true,
    "furnitureCompanyRequestedCompletion": false,
    "completionAudioFile": "TK03858036886_1757835422520_customer_call.mp3"
  }
}
```

---

**문서 작성일:** 2025-09-14  
**시스템 버전:** v1.0  
**작성자:** Claude Code Assistant  

이 문서는 이지픽스 배송 관리 시스템의 배송완료처리 귀책사항 분류 및 증빙자료 관리 시스템에 대한 완전한 기술 문서입니다. 시스템 운영, 유지보수, 및 개선 작업 시 참고하시기 바랍니다.