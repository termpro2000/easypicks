import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, LogOut, TrendingUp, AlertCircle, Clock, CheckCircle, XCircle, Truck,
  BarChart3, Activity, Settings, Database, Eye, MapPin, FileText
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { userAPI, authAPI } from '../../services/api';
import AdminShippingForm from '../admin/AdminShippingForm';
import UserProfileModal from '../admin/UserProfileModal';
import Dashboard from './Dashboard';

interface UserDashboardProps {
  onLogout: () => void;
}

type UserPageType = 'main' | 'new-shipping' | 'delivery-status' | 'analytics' | 'settings' | 'dashboard-view';

// 카드 데이터 인터페이스
interface DashboardCard {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  bgColor: string;
  hoverColor: string;
  textColor: string;
  action: string;
  stats?: {
    main: number | string;
    sub?: number | string;
    label: string;
    subLabel?: string;
  };
  status?: 'normal' | 'warning' | 'success' | 'error';
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onLogout }) => {
  const { user, setUser } = useAuth();
  const [currentPage, setCurrentPage] = useState<UserPageType>('main');
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  // 실시간 통계 데이터 상태
  const [dashboardStats, setDashboardStats] = useState({
    deliveries: { total: 0, pending: 0, completed: 0, cancelled: 0 },
    orders: { processing: 0, shipped: 0, delivered: 0, cancelled: 0 }
  });

  // 실시간 통계 데이터 로드
  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        // 실제 API 호출 대신 mock 데이터 사용 (향후 실제 API로 교체)
        setDashboardStats({
          deliveries: { total: 28, pending: 5, completed: 21, cancelled: 2 },
          orders: { processing: 3, shipped: 8, delivered: 15, cancelled: 2 }
        });
      } catch (error) {
        console.error('통계 데이터 로드 오류:', error);
      }
    };

    if (currentPage === 'main') {
      loadDashboardStats();
      // 5초마다 데이터 새로고침
      const interval = setInterval(loadDashboardStats, 5000);
      return () => clearInterval(interval);
    }
  }, [currentPage]);

  const handleLogout = async () => {
    try {
      onLogout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 카드 데이터 정의 (실시간 통계 포함)
  const getDashboardCards = (): DashboardCard[] => [
    {
      id: 'new-shipping',
      title: '새배송접수',
      icon: Plus,
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      hoverColor: 'hover:from-blue-100 hover:to-blue-200',
      textColor: 'text-blue-900',
      action: '새배송접수',
      stats: {
        main: dashboardStats.deliveries.total,
        sub: dashboardStats.deliveries.pending,
        label: '총 배송건',
        subLabel: '대기중'
      },
      status: dashboardStats.deliveries.pending > 10 ? 'warning' : 'normal'
    },
    {
      id: 'delivery-status',
      title: '배송현황',
      icon: MapPin,
      bgColor: 'bg-gradient-to-br from-slate-50 to-slate-100',
      hoverColor: 'hover:from-slate-100 hover:to-slate-200',
      textColor: 'text-slate-800',
      action: '배송현황',
      stats: {
        main: dashboardStats.deliveries.completed,
        sub: dashboardStats.deliveries.cancelled,
        label: '완료',
        subLabel: '취소'
      },
      status: 'success'
    },
    {
      id: 'dashboard-view',
      title: '주문관리',
      icon: Package,
      bgColor: 'bg-gradient-to-br from-rose-50 to-rose-100',
      hoverColor: 'hover:from-rose-100 hover:to-rose-200',
      textColor: 'text-rose-900',
      action: '주문관리',
      stats: {
        main: dashboardStats.orders.processing,
        sub: dashboardStats.orders.shipped,
        label: '처리중',
        subLabel: '배송중'
      },
      status: 'normal'
    },
    {
      id: 'analytics',
      title: '통계보기',
      icon: BarChart3,
      bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      hoverColor: 'hover:from-indigo-100 hover:to-indigo-200',
      textColor: 'text-indigo-900',
      action: '통계보기',
      stats: {
        main: '97.5%',
        sub: '+1.2%',
        label: '성공률',
        subLabel: '전월대비'
      },
      status: 'success'
    },
    {
      id: 'reports',
      title: '리포트',
      icon: FileText,
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      hoverColor: 'hover:from-orange-100 hover:to-orange-200',
      textColor: 'text-orange-900',
      action: '리포트',
      stats: {
        main: dashboardStats.orders.delivered,
        sub: '이번달',
        label: '완료건수',
        subLabel: ''
      },
      status: 'normal'
    },
    {
      id: 'settings',
      title: '설정',
      icon: Settings,
      bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100',
      hoverColor: 'hover:from-gray-100 hover:to-gray-200',
      textColor: 'text-gray-800',
      action: '설정',
      stats: {
        main: 'v3.0',
        sub: '최신',
        label: '버전',
        subLabel: '상태'
      },
      status: 'normal'
    }
  ];

  const handleCardClick = (action: string) => {
    switch (action) {
      case '새배송접수':
        setCurrentPage('new-shipping');
        break;
      case '배송현황':
        setCurrentPage('delivery-status');
        break;
      case '주문관리':
        setCurrentPage('dashboard-view');
        break;
      case '통계보기':
        setCurrentPage('analytics');
        break;
      case '리포트':
        // 향후 리포트 페이지 구현
        console.log('리포트 페이지는 향후 구현 예정입니다.');
        break;
      case '설정':
        setCurrentPage('settings');
        break;
      default:
        console.log(`${action} 버튼 클릭됨`);
    }
  };

  // 서브 페이지 렌더링
  if (currentPage === 'new-shipping') {
    return (
      <AdminShippingForm 
        onNavigateBack={() => setCurrentPage('main')}
        onSuccess={() => setCurrentPage('main')}
      />
    );
  }

  if (currentPage === 'dashboard-view') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 mb-6">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentPage('main')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ← 대시보드로 돌아가기
                </button>
                <h1 className="text-2xl font-bold text-gray-900">주문 관리</h1>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-6">
          <Dashboard />
        </div>
      </div>
    );
  }

  if (currentPage === 'analytics') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <BarChart3 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">통계 분석</h2>
            <p className="text-gray-600 mb-6">상세한 통계 분석 기능은 향후 업데이트에서 제공됩니다.</p>
            <button
              onClick={() => setCurrentPage('main')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'settings') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">설정</h2>
            <p className="text-gray-600 mb-6">사용자 설정 기능은 향후 업데이트에서 제공됩니다.</p>
            <button
              onClick={() => setCurrentPage('main')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 카드 컴포넌트
  const DashboardCard: React.FC<{ card: DashboardCard }> = ({ card }) => {
    const IconComponent = card.icon;
    
    const getStatusIcon = () => {
      switch (card.status) {
        case 'warning':
          return <AlertCircle className="w-4 h-4 text-yellow-400 absolute top-3 right-3" />;
        case 'success':
          return <CheckCircle className="w-4 h-4 text-green-400 absolute top-3 right-3" />;
        case 'error':
          return <XCircle className="w-4 h-4 text-red-400 absolute top-3 right-3" />;
        default:
          return null;
      }
    };

    return (
      <div
        onClick={() => handleCardClick(card.action)}
        className={`relative group cursor-pointer rounded-2xl ${card.bgColor} ${card.hoverColor} p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden`}
      >
        {/* 상태 표시 아이콘 */}
        {getStatusIcon()}
        
        {/* 백그라운드 패턴 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white"></div>
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white"></div>
        </div>
        
        {/* 컨텐츠 */}
        <div className="relative z-10">
          {/* 상단: 아이콘과 제목 */}
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-white bg-opacity-50 backdrop-blur-sm`}>
              <IconComponent className={`w-8 h-8 ${card.textColor.replace('-900', '-700').replace('-800', '-600')}`} />
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${card.textColor}`}>
                {card.stats?.main}
              </div>
              {card.stats?.sub && (
                <div className={`text-sm ${card.textColor} opacity-80`}>
                  {card.stats.subLabel}: {card.stats.sub}
                </div>
              )}
            </div>
          </div>
          
          {/* 하단: 제목과 설명 */}
          <div>
            <h3 className={`text-xl font-bold ${card.textColor} mb-2`}>
              {card.title}
            </h3>
            <p className={`text-sm ${card.textColor} opacity-90`}>
              {card.stats?.label || '관리 및 설정'}
            </p>
            
            {/* 실시간 업데이트 표시 */}
            <div className="flex items-center gap-1 mt-3">
              <Activity className={`w-3 h-3 ${card.textColor} opacity-60`} />
              <span className={`text-xs ${card.textColor} opacity-60`}>실시간</span>
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
      {/* 현대적인 헤더 */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  이지픽스 v3.0
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-600 font-medium">사용자 대시보드</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">실시간</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* 사용자 정보 */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{user?.name}님</p>
                  <p className="text-sm text-gray-500">@{user?.username}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    console.log('UserDashboard - Role badge clicked');
                    console.log('UserDashboard - Current user:', user);
                    setShowUserProfile(true);
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer hover:shadow-md transform hover:scale-105 ${
                    user?.role === 'admin'
                      ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                      : user?.role === 'manager'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                      : user?.role === 'driver'
                      ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                  title="프로필 보기/편집"
                >
                  {user?.role === 'admin' ? '관리자' : user?.role === 'manager' ? '매니저' : user?.role === 'driver' ? '기사' : user?.role === 'user' ? '파트너사' : '사용자'}
                </button>
              </div>
              
              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all duration-200 backdrop-blur-sm"
                title="로그아웃"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 웰컴 섹션 */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
            안녕하세요, {user?.name}님! 👋
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            편리한 배송 관리를 위한 스마트 대시보드
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>5초마다 자동 업데이트</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>실시간 통계</span>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {getDashboardCards().map((card) => (
            <DashboardCard key={card.id} card={card} />
          ))}
        </div>

        {/* 하단 안내 메시지 */}
        <div className="mt-12 text-center">
          <p className="text-gray-500">
            배송 서비스가 준비되었습니다.
            <br className="sm:hidden" />
            필요한 모든 기능을 이용하실 수 있습니다.
          </p>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 이지픽스 사용자 서비스. All rights reserved.</p>
            <p className="mt-1">안전하고 신뢰할 수 있는 배송 서비스를 제공합니다.</p>
            <div className="mt-4 text-xs text-gray-400">
              UserDashboard.tsx
            </div>
          </div>
        </div>
      </footer>

      {/* User Profile Modal */}
      {showUserProfile && user && (
        <UserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          currentUser={user}
          onUserUpdated={async () => {
            console.log('UserDashboard: 사용자 정보 업데이트 콜백 호출됨');
            
            // authAPI.me()를 사용해서 현재 사용자 정보를 다시 가져오기
            try {
              console.log('UserDashboard: authAPI.me()로 최신 사용자 정보 가져오는 중...');
              const updatedUserResponse = await authAPI.me();
              if (updatedUserResponse && updatedUserResponse.user) {
                console.log('UserDashboard: 최신 사용자 데이터로 전역 상태 업데이트:', updatedUserResponse.user);
                setUser(updatedUserResponse.user);
              } else {
                console.warn('UserDashboard: authAPI.me() 응답이 없음');
              }
            } catch (error) {
              console.error('UserDashboard: authAPI.me() 호출 실패:', error);
              // 백업으로 현재 user 상태 유지
              console.log('UserDashboard: 현재 사용자 상태를 유지합니다.');
            }
          }}
        />
      )}
    </div>
  );
};

export default UserDashboard;