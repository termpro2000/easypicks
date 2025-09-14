import React, { useState } from 'react';
import { Package, Search, Plus, LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import PartnerDeliveryList from './PartnerDeliveryList';
import PartnerShippingForm from './PartnerShippingForm';
import PartnerProductForm from './PartnerProductForm';
import PartnerProductList from './PartnerProductList';

interface PartnerDashboardProps {
  onShowProfile: () => void;
}

type PartnerPageType = 'main' | 'tracking' | 'shipping' | 'products';

const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ onShowProfile }) => {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<PartnerPageType>('main');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  const handleButtonClick = (action: string) => {
    switch (action) {
      case '배송조회':
        setCurrentPage('tracking');
        break;
      case '배송등록':
        setCurrentPage('shipping');
        break;
      case '상품조회':
        setCurrentPage('product-list');
        break;
      case '상품등록':
        setCurrentPage('products');
        break;
      default:
        console.log(`${action} 버튼 클릭됨`);
    }
  };

  // 배송조회 페이지 표시
  if (currentPage === 'tracking') {
    return <PartnerDeliveryList onNavigateBack={() => setCurrentPage('main')} />;
  }

  // 배송접수 페이지 표시
  if (currentPage === 'shipping') {
    return <PartnerShippingForm onNavigateBack={() => setCurrentPage('main')} />;
  }

  // 상품조회 페이지 표시
  if (currentPage === 'product-list') {
    return <PartnerProductList onNavigateBack={() => setCurrentPage('main')} />;
  }

  // 상품등록 페이지 표시
  if (currentPage === 'products') {
    return <PartnerProductForm onNavigateBack={() => setCurrentPage('main')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">이지픽스</h1>
                <p className="text-sm text-blue-600 font-medium">업체용</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}님</p>
                <p className="text-xs text-gray-500">@{user?.username}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={onShowProfile}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="내정보"
                >
                  <User className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            안녕하세요, {user?.name}님!
          </h2>
          <p className="text-lg text-gray-600">
            이지픽스 업체용 서비스를 이용해보세요
          </p>
        </div>

        {/* 4개의 정사각형 버튼을 2x2 그리드로 배치 */}
        <div className="max-w-2xl mx-auto">
          {/* 첫 번째 줄: 배송조회, 배송등록 */}
          <div className="flex justify-center gap-8 mb-8">
            {/* 배송조회 버튼 */}
            <button
              onClick={() => handleButtonClick('배송조회')}
              className="w-48 h-48 bg-white rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 bg-blue-500 group-hover:bg-blue-600 rounded-2xl flex items-center justify-center transition-colors">
                <Search className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1">배송조회</h3>
                <p className="text-sm text-gray-500">배송 현황을 확인하세요</p>
              </div>
            </button>

            {/* 배송등록 버튼 */}
            <button
              onClick={() => handleButtonClick('배송등록')}
              className="w-48 h-48 bg-white rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 bg-green-500 group-hover:bg-green-600 rounded-2xl flex items-center justify-center transition-colors">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1">배송등록</h3>
                <p className="text-sm text-gray-500">새 배송을 등록하세요</p>
              </div>
            </button>
          </div>

          {/* 두 번째 줄: 상품조회, 상품등록 */}
          <div className="flex justify-center gap-8">
            {/* 상품조회 버튼 */}
            <button
              onClick={() => handleButtonClick('상품조회')}
              className="w-48 h-48 bg-white rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 bg-orange-500 group-hover:bg-orange-600 rounded-2xl flex items-center justify-center transition-colors">
                <Search className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1">상품조회</h3>
                <p className="text-sm text-gray-500">등록된 상품을 확인하세요</p>
              </div>
            </button>

            {/* 상품등록 버튼 */}
            <button
              onClick={() => handleButtonClick('상품등록')}
              className="w-48 h-48 bg-white rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 bg-purple-500 group-hover:bg-purple-600 rounded-2xl flex items-center justify-center transition-colors">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1">상품등록</h3>
                <p className="text-sm text-gray-500">상품을 등록하세요</p>
              </div>
            </button>
          </div>
        </div>

        {/* 하단 안내 메시지 */}
        <div className="mt-12 text-center">
          <p className="text-gray-500">
            업체용 서비스가 준비되었습니다. 
            <br className="sm:hidden" />
            문의사항이 있으시면 고객센터로 연락주세요.
          </p>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 이지픽스 업체용 서비스. All rights reserved.</p>
            <p className="mt-1">안전하고 신뢰할 수 있는 배송 서비스를 제공합니다.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PartnerDashboard;