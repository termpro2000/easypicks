import React, { useState, useEffect } from 'react';
import { Search, Trash2, UserPlus, Phone, Mail, Truck, Hash, CheckCircle, XCircle, Edit, Sparkles, Zap, Navigation } from 'lucide-react';
import { driversAPI } from '../../services/api';
import DriverForm from './DriverForm';
import DriverEditForm from './DriverEditForm';

interface Driver {
  id: number;
  driver_id?: number;
  username?: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

const DriverManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'list' | 'add-form' | 'edit-form'>('list');
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // 기사 목록 조회
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await driversAPI.getAllDrivers();
      console.log('기사 목록 응답:', response); // 디버깅용
      setDrivers(response.drivers || response.data || []);
    } catch (error) {
      console.error('기사 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 기사 목록 조회
  useEffect(() => {
    fetchDrivers();
  }, []);

  // 검색 기능
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchDrivers();
      return;
    }

    try {
      setLoading(true);
      const response = await driversAPI.searchDrivers(searchTerm);
      console.log('기사 검색 응답:', response); // 디버깅용
      setDrivers(response.drivers || response.data || []);
    } catch (error) {
      console.error('기사 검색 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 기사 등록 폼으로 이동
  const handleCreateDriver = () => {
    setCurrentView('add-form');
  };

  // 기사 편집 폼으로 이동
  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setCurrentView('edit-form');
  };

  // 폼 성공 처리
  const handleFormSuccess = () => {
    setCurrentView('list');
    setEditingDriver(null);
    fetchDrivers(); // 기사 목록 새로고침
  };

  // 목록으로 돌아가기
  const handleBackToList = () => {
    setCurrentView('list');
    setEditingDriver(null);
  };

  // 기사 삭제
  const handleDeleteDriver = async (driver: Driver) => {
    if (!confirm(`정말로 ${driver.name} 기사를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await driversAPI.deleteDriver(driver.id);
      fetchDrivers();
      alert('기사가 성공적으로 삭제되었습니다.');
    } catch (error: any) {
      console.error('기사 삭제 실패:', error);
      alert(error.response?.data?.message || '기사 삭제에 실패했습니다.');
    }
  };

  // 필터링된 기사 목록
  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone?.includes(searchTerm) ||
    driver.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 기사등록 폼 표시
  if (currentView === 'add-form') {
    return (
      <DriverForm 
        onNavigateBack={handleBackToList}
        onSuccess={handleFormSuccess}
      />
    );
  }

  // 기사편집 폼 표시
  if (currentView === 'edit-form' && editingDriver) {
    return (
      <DriverEditForm 
        driver={editingDriver}
        onNavigateBack={handleBackToList}
        onSuccess={handleFormSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 p-8">
      {/* Glassmorphism 헤더 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 p-8 mb-8 shadow-2xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Truck className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                기사 관리
              </h1>
              <p className="text-gray-600 text-lg">배송 기사의 정보를 관리합니다</p>
            </div>
          </div>
          
          <button
            onClick={handleCreateDriver}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-3">
              <UserPlus className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-bold text-lg">기사 등록</span>
            </div>
          </button>
        </div>
      </div>

      {/* Glassmorphism 검색 바 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 p-6 mb-8 shadow-2xl">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="기사명, 사용자명, 연락처, 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-4 bg-white/70 backdrop-blur-sm border border-gray-300 rounded-2xl text-gray-800 placeholder-gray-500 focus:bg-white focus:border-blue-400 transition-all duration-300 text-lg"
            />
          </div>
          <button
            onClick={handleSearch}
            className="group px-8 py-4 bg-white/70 backdrop-blur-sm border border-gray-300 text-gray-700 rounded-2xl hover:bg-blue-500 hover:text-white hover:border-blue-400 transition-all duration-300 hover:scale-105"
          >
            <span className="font-semibold text-lg">검색</span>
          </button>
        </div>
      </div>

      {/* Glassmorphism 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-800 mb-1">{drivers.length}</div>
              <div className="text-gray-600">전체 기사</div>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {drivers.filter(d => d.is_active !== false).length}
              </div>
              <div className="text-gray-600">활성 기사</div>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {drivers.filter(d => d.is_active === false).length}
              </div>
              <div className="text-gray-600">비활성 기사</div>
            </div>
          </div>
        </div>
      </div>

      {/* Glassmorphism 기사 목록 - 카드 그리드 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-2xl">
        <div className="p-8 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              등록된 기사 목록 ({filteredDrivers.length}명)
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-white animate-pulse" />
              </div>
            </div>
            <p className="text-gray-600 text-lg">기사 목록을 불러오는 중...</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-300 to-gray-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Truck className="w-12 h-12 text-white" />
            </div>
            <p className="text-gray-600 text-xl mb-6">
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 기사가 없습니다.'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateDriver}
                className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <UserPlus className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-bold">첫 번째 기사 등록하기</span>
                </div>
              </button>
            )}
          </div>
        ) : (
          <div className="p-8">
            {/* 고급스러운 테이블 형식 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* 테이블 헤더 */}
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                      기사 정보
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                      로그인 ID
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                      전화번호
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                      상태
                    </th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                
                {/* 테이블 바디 */}
                <tbody className="divide-y divide-gray-100">
                  {filteredDrivers.map((driver, index) => (
                    <tr 
                      key={driver.driver_id || driver.id}
                      className="group hover:bg-blue-50/50 transition-colors duration-200"
                    >
                      {/* 기사 정보 (아바타 + 이름) */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-sm">
                              {driver.name?.charAt(0) || 'D'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{driver.name}</h3>
                            <p className="text-gray-500 text-sm">기사 #{index + 1}</p>
                          </div>
                        </div>
                      </td>
                      
                      {/* 로그인 ID */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-800">
                            {driver.username || '-'}
                          </span>
                        </div>
                      </td>
                      
                      {/* 전화번호 */}
                      <td className="py-4 px-6">
                        {driver.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-green-500" />
                            <span className="font-medium text-gray-800">{driver.phone}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm italic">미등록</span>
                        )}
                      </td>
                      
                      {/* 상태 */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          driver.is_active !== false
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {driver.is_active !== false ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              활성
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              비활성
                            </>
                          )}
                        </span>
                      </td>
                      
                      {/* 관리 버튼 */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditDriver(driver)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                            title="편집"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDriver(driver)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 파일명 표시 */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 text-xs text-white/60">
          <Sparkles className="w-3 h-3" />
          <span>DriverManagement.tsx</span>
        </div>
      </div>
    </div>
  );
};

export default DriverManagement;