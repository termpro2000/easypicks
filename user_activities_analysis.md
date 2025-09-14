# user_activities 테이블 역할 분석 보고서

## 개요
`user_activities` 테이블은 EASYPICKS 시스템에서 사용자 활동을 추적하고 감사 로그를 제공하는 중요한 시스템 테이블입니다.

## 테이블 구조

| 컬럼명 | 데이터 타입 | NULL 허용 | 설명 |
|--------|------------|-----------|------|
| id | int | NOT NULL | 고유 ID (Primary Key) |
| user_id | int | NOT NULL | 활동한 사용자 ID |
| action | varchar(100) | NOT NULL | 수행한 액션 |
| target_type | varchar(50) | YES | 대상 타입 (user, export 등) |
| target_id | int | YES | 대상 ID |
| details | json | YES | 상세 정보 (JSON 형태) |
| ip_address | varchar(45) | YES | IP 주소 |
| user_agent | text | YES | 브라우저 정보 |
| created_at | timestamp | YES | 생성 시간 |

## 현재 데이터 현황

### 총 데이터 수
- **21개 레코드**

### 액션 유형별 통계
- `update_profile`: 11회 (52.4%)
- `update_user`: 6회 (28.6%)
- `create_user`: 2회 (9.5%)
- `delete_user`: 2회 (9.5%)

### 최근 활동 현황
- 마지막 활동: 2025-09-08 11:46:41 (사용자 21의 프로필 업데이트)
- 활발한 사용자: 주로 사용자 ID 1 (관리자)

## 기능 및 역할

### 1. 사용자 활동 추적
시스템에서 수행되는 모든 중요한 사용자 활동을 자동으로 기록합니다.

### 2. 감사 로그 (Audit Log)
- 누가 (user_id)
- 언제 (created_at)
- 무엇을 (action)
- 어떻게 (details - JSON 형태로 변경사항 기록)
- 어디서 (ip_address, user_agent)

### 3. 보안 모니터링
IP 주소와 User-Agent 정보를 통해 보안 모니터링이 가능합니다.

## 기록되는 활동 유형

### 사용자 관리 활동
- **create_user**: 새 사용자 생성
- **update_user**: 사용자 정보 수정 (관리자가 다른 사용자 정보 변경)
- **delete_user**: 사용자 삭제
- **update_profile**: 사용자 자신의 프로필 업데이트

### 데이터 관리 활동
- **export_orders**: 주문 데이터 내보내기
- **export_statistics**: 통계 데이터 내보내기
- **assign_tracking**: 운송장 번호 할당

## 코드에서의 사용

### Backend 구현

#### 1. userController.js
```javascript
// 활동 로그 기록 함수
async function logUserActivity(userId, action, targetType = null, targetId = null, details = null, req = null) {
    // IP 주소, User-Agent 수집
    // user_activities 테이블에 INSERT
}

// 활동 로그 조회 API
async function getUserActivities(req, res) {
    // 페이지네이션과 필터링으로 활동 로그 조회
}
```

#### 2. exportController.js
```javascript
await logUserActivity(req.session.user.id, 'export_orders', 'export', null, {
    // 내보내기 활동 기록
});
```

#### 3. shippingController.js
```javascript
await logUserActivity(user.id, 'assign_tracking', 'shipping_order', id, {
    // 운송장 할당 활동 기록
});
```

### Frontend API

#### api.ts
```typescript
// 사용자 활동 로그 조회
getUserActivities: async (page = 1, limit = 20, userId?: number, action?: string) => {
    // GET /users/activities/logs
}
```

## 활동 로그 예시

### 사용자 생성 로그
```json
{
    "id": 1,
    "user_id": 1,
    "action": "create_user",
    "target_type": "user",
    "target_id": 2,
    "details": {
        "target_name": "ssss",
        "target_role": "user",
        "target_username": "test3"
    },
    "created_at": "2025-08-26 21:14:07"
}
```

### 프로필 업데이트 로그
```json
{
    "id": 4,
    "user_id": 1,
    "action": "update_profile",
    "target_type": "user", 
    "target_id": 1,
    "details": {
        "changes": {
            "name": "Test User Update",
            "phone": "01063029571",
            "company": ""
        }
    },
    "created_at": "2025-08-28 14:29:23"
}
```

## 시스템에서의 중요성

### 1. 보안 감사
- 시스템 내 모든 중요한 변경사항 추적
- 무단 접근이나 변경 사항 탐지 가능
- 문제 발생 시 원인 추적 가능

### 2. 규정 준수
- 데이터 보호법이나 내부 감사 요구사항 충족
- 변경 이력의 투명성 확보

### 3. 문제 해결
- 시스템 오류나 데이터 문제 발생 시 변경 이력 추적
- 롤백이나 복구 작업 시 참고 자료

### 4. 사용자 행동 분석
- 시스템 사용 패턴 분석
- 기능 개선을 위한 데이터 제공

## 권장사항

### 1. 데이터 보존
현재 활발히 사용되고 있는 중요한 감사 로그이므로 **삭제하지 않고 유지** 권장

### 2. 확장 가능성
향후 다음과 같은 활동들도 로깅 고려:
- 배송 접수 생성/수정/삭제
- 로그인/로그아웃 활동
- 중요한 설정 변경

### 3. 성능 고려
로그 데이터가 계속 누적되므로 주기적인 아카이빙이나 파티셔닝 고려

## 결론

`user_activities` 테이블은 EASYPICKS 시스템의 **핵심 감사 로그 시스템**으로 다음과 같은 중요한 역할을 수행합니다:

- ✅ **보안 감사**: 모든 사용자 활동 추적
- ✅ **변경 이력 관리**: 상세한 변경 사항 기록  
- ✅ **문제 해결 지원**: 시스템 문제 발생 시 원인 파악
- ✅ **규정 준수**: 감사 요구사항 충족

따라서 이 테이블은 **시스템 운영상 필수적이며 삭제하거나 수정하지 않고 현재 상태로 유지**하는 것을 강력히 권장합니다.

---
*분석 일시: 2025-09-08*  
*분석자: Claude Code Assistant*