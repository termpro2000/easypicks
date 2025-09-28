# Design System Documentation

이 문서는 이지픽스 배송 관리 시스템의 디자인 스타일과 UI/UX 가이드라인을 정리합니다.

## 🎨 UserDashboardForm 디자인 스타일

### 디자인 컨셉
**Modern Glassmorphism + Gradient 디자인**을 적용한 프리미엄 웹 애플리케이션 스타일

### 1. **Glassmorphism (글래스모피즘)**
```tsx
// 반투명 유리 효과
bg-white/80 backdrop-blur-md
bg-white/60 backdrop-blur-sm
```

### 2. **Gradient 배경**
```tsx
// 메인 배경: 슬레이트 → 블루 → 인디고
bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100

// 헤더 아이콘: 블루 → 퍼플
bg-gradient-to-br from-blue-600 to-purple-600

// 텍스트 그라데이션
bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent
```

### 3. **카드별 색상 테마**
- **파트너사관리**: 블루 계열 (`from-blue-50 to-blue-100`)
- **기사관리**: 그린 계열 (`from-green-50 to-green-100`) 
- **매니저관리**: 퍼플 계열 (`from-purple-50 to-purple-100`)

### 4. **인터랙션 효과**
```tsx
// 호버 시 스케일 + 그림자 변화
hover:scale-105 transform hover:shadow-xl transition-all duration-300

// 배경색 변화
hover:from-blue-100 hover:to-blue-200
```

### 5. **시각적 깊이감**
- **그림자**: `shadow-lg`, `shadow-xl`
- **둥근 모서리**: `rounded-2xl`
- **투명도 레이어**: `opacity-10`, `bg-white opacity-0 group-hover:opacity-10`

### 6. **배경 패턴**
```tsx
// 장식용 원형 패턴
<div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white"></div>
<div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white"></div>
```

### 7. **아이콘 디자인**
```tsx
// 반투명 배경의 아이콘 컨테이너
<div className="p-4 rounded-2xl bg-white bg-opacity-50 backdrop-blur-sm">
  <IconComponent className={`w-12 h-12 ${card.iconColor}`} />
</div>
```

### 8. **레이아웃 구조**
- **헤더**: 글래스모피즘 효과의 고정 상단바
- **메인 콘텐츠**: 3열 그리드 카드 레이아웃
- **웰컴 섹션**: 그라데이션 텍스트와 기능 소개
- **푸터**: 심플한 브랜딩 정보

## 🎯 전체적인 디자인 특징

### 타겟 스타일
- **모던한 기업용 대시보드** 스타일
- **부드러운 색상 전환**과 **유리같은 투명도**
- **카드 기반 레이아웃**으로 각 기능을 명확히 구분
- **마이크로 인터랙션**으로 사용자 경험 향상

### 기술 스택
- **Tailwind CSS**: 유틸리티 클래스 기반 스타일링
- **Lucide React**: 일관성 있는 아이콘 시스템
- **React TypeScript**: 타입 안전성과 컴포넌트 기반 아키텍처

### 접근성 고려사항
- **색상 대비**: 텍스트 가독성을 위한 충분한 대비
- **호버 상태**: 명확한 인터랙션 피드백
- **포커스 상태**: 키보드 네비게이션 지원
- **의미론적 HTML**: 스크린 리더 호환성

## 📱 반응형 디자인

### 브레이크포인트
- **Mobile**: `grid-cols-1` (1열)
- **Tablet**: `md:grid-cols-2` (2열)
- **Desktop**: `lg:grid-cols-3` (3열)

### 모바일 최적화
- 터치 친화적인 버튼 크기 (44px+)
- 적절한 여백과 패딩
- 가독성 있는 폰트 크기

## 🔮 미래 확장 계획

### 다크 모드 지원
- CSS 변수 기반 테마 시스템
- 자동/수동 테마 전환
- 시스템 설정 연동

### 애니메이션 강화
- Framer Motion 통합
- 페이지 전환 효과
- 로딩 상태 애니메이션

### 컴포넌트 라이브러리화
- 재사용 가능한 카드 컴포넌트
- 공통 버튼 시스템
- 통일된 폼 스타일

## 🎨 DeliveryStatus 디자인 스타일

### 디자인 적용
**Modern Glassmorphism + Gradient 디자인**을 DeliveryStatus 컴포넌트에 적용하여 UserDashboardForm과 일관성 있는 디자인 시스템 구축

### 1. **배경 및 레이아웃**
```tsx
// 메인 배경: 슬레이트 → 블루 → 인디고 그라데이션
bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100

// 헤더: 글래스모피즘 효과
<header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">

// 메인 콘텐츠 컨테이너
<main className="max-w-7xl mx-auto px-6 py-8">
```

### 2. **제목 중앙 정렬**
```tsx
// 헤더 제목 구조 - 3등분 레이아웃으로 중앙 정렬
<div className="flex items-center justify-between">
  <button>돌아가기</button>
  
  <div className="flex items-center gap-3">
    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
      <Package className="w-7 h-7 text-white" />
    </div>
    <div className="text-center">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
        배송현황
      </h1>
      <p className="text-sm text-blue-600 font-medium">전체 배송 현황을 확인하고 관리합니다</p>
    </div>
  </div>
  
  <div className="w-48"></div>
</div>
```

### 3. **글래스모피즘 적용 요소**
- **검색/필터 섹션**: `bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20`
- **배송 목록 테이블**: `bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20`
- **입력 필드**: `bg-white/50 backdrop-blur-sm rounded-xl border border-white/30`
- **버튼**: `bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all`

### 4. **테이블 스타일링**
```tsx
// 테이블 헤더
<thead className="bg-white/30 backdrop-blur-sm">

// 테이블 바디
<tbody className="bg-white/20 backdrop-blur-sm divide-y divide-white/20">

// 테이블 행 호버 효과
className="hover:bg-white/40 cursor-pointer transition-all duration-200 backdrop-blur-sm"
```

### 5. **통계 카드 그라데이션**
```tsx
// 각 상태별 그라데이션 카드
<div className="group bg-gradient-to-br from-blue-50 to-blue-100 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/30 hover:shadow-xl transform hover:scale-105 transition-all duration-300">
  <div className="text-center">
    <div className="text-3xl font-bold text-blue-700 mb-2">{count}</div>
    <div className="text-sm text-blue-600 font-medium">{label}</div>
  </div>
</div>

// 색상 변형:
// - 전체 배송: blue-50 to blue-100 (파란색)
// - 대기 중: yellow-50 to yellow-100 (노란색)
// - 배송 중: orange-50 to orange-100 (주황색)
// - 배송 완료: green-50 to green-100 (초록색)
```

### 6. **인터랙션 효과**
- **카드 호버**: `hover:shadow-xl transform hover:scale-105 transition-all duration-300`
- **버튼 호버**: `hover:bg-white/80 transition-all`
- **테이블 행 호버**: `hover:bg-white/40 transition-all duration-200`

### 7. **푸터 및 파일명 표시**
```tsx
// 글래스모피즘 푸터
<footer className="bg-white/60 backdrop-blur-sm border-t border-white/20 mt-16">

// 고정 파일명 표시
<div className="fixed bottom-4 right-4 text-xs text-gray-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
```

### 8. **반응형 그리드**
```tsx
// 통계 카드 반응형 그리드
<div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
```

## 🎯 디자인 시스템 일관성

### 공통 스타일 패턴
1. **배경**: `bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100`
2. **글래스모피즘**: `bg-white/60 backdrop-blur-sm`
3. **테두리**: `border border-white/20`
4. **그림자**: `shadow-lg`
5. **둥근 모서리**: `rounded-2xl`
6. **그라데이션 텍스트**: `bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent`

### UserDashboardForm vs DeliveryStatus 차이점
- **UserDashboardForm**: 카드 기반 관리 패널
- **DeliveryStatus**: 테이블 기반 데이터 표시
- **공통점**: 동일한 글래스모피즘 스타일, 그라데이션 배경, 중앙 정렬 제목

---

*최종 업데이트: 2025-09-28*  
*파일 위치: `/Users/lyuhyeogsang/hy2/frontend/src/components/admin/UserDashboardForm.tsx`, `/Users/lyuhyeogsang/hy2/frontend/src/components/delivery/DeliveryStatus.tsx`*