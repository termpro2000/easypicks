import React from 'react';
import { ArrowLeft, Users, Truck, Shield, UserCheck } from 'lucide-react';

interface UserDashboardFormProps {
  onNavigateBack: () => void;
  onNavigateToPartners: () => void;
  onNavigateToDrivers: () => void;
  onNavigateToManagers: () => void;
}

interface ManagementCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  bgColor: string;
  hoverColor: string;
  textColor: string;
  iconColor: string;
  onClick: () => void;
}

const UserDashboardForm: React.FC<UserDashboardFormProps> = ({
  onNavigateBack,
  onNavigateToPartners,
  onNavigateToDrivers,
  onNavigateToManagers
}) => {
  
  const managementCards: ManagementCard[] = [
    {
      id: 'partners',
      title: '파트너사관리',
      description: '파트너사 등록, 수정, 삭제 및 배송 접수 권한 관리',
      icon: Users,
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      hoverColor: 'hover:from-blue-100 hover:to-blue-200',
      textColor: 'text-blue-900',
      iconColor: 'text-blue-700',
      onClick: onNavigateToPartners
    },
    {
      id: 'drivers',
      title: '기사관리',
      description: '기사 등록, 차량 정보 관리 및 배송 배정 관리',
      icon: Truck,
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      hoverColor: 'hover:from-green-100 hover:to-green-200',
      textColor: 'text-green-900',
      iconColor: 'text-green-700',
      onClick: onNavigateToDrivers
    },
    {
      id: 'managers',
      title: '매니저관리',
      description: '매니저 계정 관리 및 시스템 권한 설정',
      icon: Shield,
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      hoverColor: 'hover:from-purple-100 hover:to-purple-200',
      textColor: 'text-purple-900',
      iconColor: 'text-purple-700',
      onClick: onNavigateToManagers
    }
  ];

  const ManagementCard: React.FC<{ card: ManagementCard }> = ({ card }) => {
    const IconComponent = card.icon;
    
    return (
      <div
        onClick={card.onClick}
        className={`group cursor-pointer rounded-2xl ${card.bgColor} ${card.hoverColor} p-8 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden`}
      >
        {/* 백그라운드 패턴 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white"></div>
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white"></div>
        </div>
        
        {/* 컨텐츠 */}
        <div className="relative z-10">
          {/* 상단: 아이콘 */}
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 rounded-2xl bg-white bg-opacity-50 backdrop-blur-sm">
              <IconComponent className={`w-12 h-12 ${card.iconColor}`} />
            </div>
          </div>
          
          {/* 중단: 제목 */}
          <div className="text-center mb-4">
            <h3 className={`text-2xl font-bold ${card.textColor} mb-2`}>
              {card.title}
            </h3>
            <p className={`text-sm ${card.textColor} opacity-80 leading-relaxed`}>
              {card.description}
            </p>
          </div>
          
          {/* 하단: 화살표 */}
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 ${card.textColor} opacity-70 group-hover:opacity-100 transition-opacity`}>
              <span className="text-sm font-medium">관리하기</span>
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
        </div>
        
        {/* 호버 효과 */}
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl"></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>관리자 대시보드로 돌아가기</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  사용자 관리 대시보드
                </h1>
                <p className="text-sm text-blue-600 font-medium">파트너사, 기사, 매니저 통합 관리</p>
              </div>
            </div>
            
            <div className="w-48"></div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 웰컴 섹션 */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
            사용자 관리 시스템 🏢
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            파트너사, 기사, 매니저를 통합적으로 관리하세요
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>통합 사용자 관리</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>권한 기반 접근</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>실시간 상태 관리</span>
            </div>
          </div>
        </div>

        {/* 관리 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {managementCards.map((card) => (
            <ManagementCard key={card.id} card={card} />
          ))}
        </div>

        {/* 하단 안내 메시지 */}
        <div className="mt-12 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              사용자 관리 가이드
            </h3>
            <p className="text-gray-600 leading-relaxed">
              각 역할별로 적절한 권한을 부여하고, 시스템의 보안과 효율성을 유지하세요. 
              파트너사는 배송 접수, 기사는 배송 수행, 매니저는 시스템 관리 권한을 가집니다.
            </p>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>사용자 관리 대시보드 - 이지픽스 관리자 서비스</p>
          </div>
        </div>
      </footer>

      {/* 파일명 표시 */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
        UserDashboardForm.tsx
      </div>
    </div>
  );
};

export default UserDashboardForm;