import React, { useState } from 'react';
import { Package, Plus, LogOut, User, UserCheck, Users, Truck, TestTube, MapPin } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import AdminShippingForm from './AdminShippingForm';
import UserManagement from './UserManagement';
import ProductManagement from '../products/ProductManagement';
import DriverManagement from '../drivers/DriverManagement';
import DriverAssignment from '../assignment/DriverAssignment';
import DeliveryStatusPage from '../delivery/DeliveryStatusPage';
import TestPage from '../test/TestPage';

interface AdminDashboardProps {
  onShowProfile: () => void;
}

type AdminPageType = 'main' | 'new-order' | 'assignment' | 'products' | 'users' | 'drivers' | 'test' | 'delivery-status';


const AdminDashboard: React.FC<AdminDashboardProps> = ({ onShowProfile }) => {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<AdminPageType>('main');
  

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };


  const handleButtonClick = (action: string) => {
    switch (action) {
      case '새배송접수':
        setCurrentPage('new-order');
        break;
      case '배송현황':
        setCurrentPage('delivery-status');
        break;
      case '기사배정':
        setCurrentPage('assignment');
        break;
      case '상품관리':
        setCurrentPage('products');
        break;
      case '사용자관리':
        setCurrentPage('users');
        break;
      case '기사관리':
        setCurrentPage('drivers');
        break;
      case '테스트':
        setCurrentPage('test');
        break;
      default:
        console.log(`${action} 버튼 클릭됨`);
    }
  };

  // 새배송접수 페이지 표시
  if (currentPage === 'new-order') {
    return (
      <AdminShippingForm 
        onNavigateBack={() => setCurrentPage('main')}
      />
    );
  }

  // 배송현황 페이지 표시
  if (currentPage === 'delivery-status') {
    return <DeliveryStatusPage onNavigateBack={() => setCurrentPage('main')} />;
  }

  // 기사배정 페이지 표시
  if (currentPage === 'assignment') {
    return <DriverAssignment onNavigateBack={() => setCurrentPage('main')} />;
  }

  // 상품관리 페이지 표시
  if (currentPage === 'products') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <ProductManagement onNavigateBack={() => setCurrentPage('main')} />
      </div>
    );
  }

  // 사용자관리 페이지 표시
  if (currentPage === 'users') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* 헤더 */}
        <div className="bg-white shadow-sm">
          <div className="relative flex items-center justify-center py-4 px-6">
            {/* 왼쪽: 돌아가기 버튼 */}
            <button
              onClick={() => setCurrentPage('main')}
              className="absolute left-6 flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← 관리자화면으로 돌아가기
            </button>
            
            {/* 중앙: 제목 */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 justify-center">
                <Users className="w-7 h-7 text-blue-600" />
                사용자 관리
              </h1>
              <p className="text-gray-600 mt-1">시스템 사용자를 관리합니다</p>
            </div>
          </div>
        </div>
        <UserManagement />
      </div>
    );
  }

  // 기사관리 페이지 표시
  if (currentPage === 'drivers') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* 헤더 */}
        <div className="bg-white shadow-sm">
          <div className="relative flex items-center justify-between py-4 px-6">
            {/* 왼쪽: 돌아가기 버튼 */}
            <button
              onClick={() => setCurrentPage('main')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← 관리자화면으로 돌아가기
            </button>
            
            {/* 중앙: 제목 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 justify-center">
                <Truck className="w-7 h-7 text-orange-600" />
                기사 관리
              </h1>
              <p className="text-gray-600 mt-1">배송기사를 관리합니다</p>
            </div>
            
            {/* 오른쪽: 폼 이름 */}
            <div className="text-right">
              <span className="text-gray-500 text-sm">(DriverManagement)</span>
            </div>
          </div>
        </div>
        <DriverManagement />
      </div>
    );
  }

  // 테스트 페이지 표시
  if (currentPage === 'test') {
    return <TestPage onNavigateBack={() => setCurrentPage('main')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">이지픽스</h1>
                <p className="text-sm text-red-600 font-medium">관리자화면</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}님</p>
                <p className="text-xs text-gray-500">@{user?.username}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  user?.role === 'admin' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user?.role === 'admin' ? '관리자' : '매니저'}
                </span>
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

        {/* 6개의 주요 버튼을 2열 구성으로 배치 */}
        <div className="max-w-2xl mx-auto">
          {/* 첫 번째 줄: 새배송접수, 배송현황 */}
          <div className="flex justify-center gap-8 mb-8">
            {/* 새배송접수 버튼 */}
            <button
              onClick={() => handleButtonClick('새배송접수')}
              className="w-48 h-48 bg-white rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 bg-green-500 group-hover:bg-green-600 rounded-2xl flex items-center justify-center transition-colors">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1">새배송접수</h3>
                <p className="text-sm text-gray-500">새로운 배송을 접수합니다</p>
              </div>
            </button>

            {/* 배송현황 버튼 */}
            <button
              onClick={() => handleButtonClick('배송현황')}
              className="w-48 h-48 bg-white rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 bg-teal-500 group-hover:bg-teal-600 rounded-2xl flex items-center justify-center transition-colors">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1">배송현황</h3>
                <p className="text-sm text-gray-500">배송 상태를 확인합니다</p>
              </div>
            </button>
          </div>

          {/* 두 번째 줄: 기사배정, 상품관리 */}
          <div className="flex justify-center gap-8 mb-8">
            {/* 기사배정 버튼 */}
            <button
              onClick={() => handleButtonClick('기사배정')}
              className="w-48 h-48 bg-white rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 bg-blue-500 group-hover:bg-blue-600 rounded-2xl flex items-center justify-center transition-colors">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1">기사배정</h3>
                <p className="text-sm text-gray-500">배송기사를 배정합니다</p>
              </div>
            </button>

            {/* 상품관리 버튼 */}
            <button
              onClick={() => handleButtonClick('상품관리')}
              className="w-48 h-48 bg-white rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 bg-purple-500 group-hover:bg-purple-600 rounded-2xl flex items-center justify-center transition-colors">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1">상품관리</h3>
                <p className="text-sm text-gray-500">상품 정보를 관리합니다</p>
              </div>
            </button>
          </div>

          {/* 세 번째 줄: 사용자관리, 기사관리 */}
          <div className="flex justify-center gap-8 mb-12">
            {/* 사용자관리 버튼 */}
            <button
              onClick={() => handleButtonClick('사용자관리')}
              className="w-48 h-48 bg-white rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 bg-indigo-500 group-hover:bg-indigo-600 rounded-2xl flex items-center justify-center transition-colors">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1">사용자관리</h3>
                <p className="text-sm text-gray-500">사용자 계정을 관리합니다</p>
              </div>
            </button>

            {/* 기사관리 버튼 */}
            <button
              onClick={() => handleButtonClick('기사관리')}
              className="w-48 h-48 bg-white rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 bg-orange-500 group-hover:bg-orange-600 rounded-2xl flex items-center justify-center transition-colors">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1">기사관리</h3>
                <p className="text-sm text-gray-500">배송기사를 관리합니다</p>
              </div>
            </button>
          </div>

          {/* 테스트 버튼 - 별도로 하단에 배치 */}
          <div className="flex justify-center">
            <button
              onClick={() => handleButtonClick('테스트')}
              className="w-48 h-48 bg-white rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 bg-gray-500 group-hover:bg-gray-600 rounded-2xl flex items-center justify-center transition-colors">
                <TestTube className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1">테스트</h3>
                <p className="text-sm text-gray-500">시스템 테스트를 진행합니다</p>
              </div>
            </button>
          </div>
        </div>

        {/* 하단 안내 메시지 */}
        <div className="mt-12 text-center">
          <p className="text-gray-500">
            관리자 서비스가 준비되었습니다. 
            <br className="sm:hidden" />
            시스템 운영에 필요한 모든 기능을 이용하실 수 있습니다.
          </p>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 이지픽스 관리자 서비스. All rights reserved.</p>
            <p className="mt-1">안전하고 신뢰할 수 있는 배송 서비스를 제공합니다.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default AdminDashboard;