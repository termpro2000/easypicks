import React, { useState, useEffect } from 'react';
import { Search, Trash2, UserPlus, Phone, Mail, Truck, Hash, CheckCircle, XCircle, Edit, Sparkles, Zap, Navigation } from 'lucide-react';
import { driversAPI } from '../../services/api';
import DriverForm from './DriverForm';
import DriverEditForm from './DriverEditForm';

interface Driver {
  id: number;
  username: string;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 p-4 md:p-8">
      {/* 미니멀 헤더 */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-8 mb-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">기사 관리</h1>
            <p className="text-orange-100 opacity-90">배송 기사의 정보를 관리합니다</p>
          </div>
          <button
            onClick={handleCreateDriver}
            className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition-colors backdrop-blur-sm border border-white/20"
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              <span className="font-semibold">기사 등록</span>
            </div>
          </button>
        </div>
      </div>

      {/* 미니멀 검색 바 */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-slate-200">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="기사명, 사용자명, 연락처, 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-colors font-medium"
          >
            검색
          </button>
        </div>
      </div>

      {/* 미니멀 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-800">{drivers.length}</div>
              <div className="text-slate-600 text-sm">전체 기사</div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {drivers.filter(d => d.is_active !== false).length}
              </div>
              <div className="text-slate-600 text-sm">활성 기사</div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {drivers.filter(d => d.is_active === false).length}
              </div>
              <div className="text-slate-600 text-sm">비활성 기사</div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* 미니멀 기사 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">기사 목록</h2>
            <span className="text-sm text-slate-500">{filteredDrivers.length}명</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">기사 목록을 불러오는 중...</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-4">
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 기사가 없습니다.'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateDriver}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  <span>첫 번째 기사 등록하기</span>
                </div>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700">기사 정보</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700">로그인 ID</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700">연락처</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700">상태</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-slate-700">관리</th>
                </tr>
              </thead>
                
              <tbody className="divide-y divide-slate-200">
                {filteredDrivers.map((driver) => (
                  <tr key={driver.driver_id || driver.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {driver.name?.charAt(0) || 'D'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{driver.name}</div>
                          <div className="text-slate-600 text-sm">배송 기사</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-700 font-mono text-sm">@{driver.username || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {driver.phone && (
                          <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <Phone className="w-4 h-4" />
                            <span>{driver.phone}</span>
                          </div>
                        )}
                        {driver.email && (
                          <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <Mail className="w-4 h-4" />
                            <span>{driver.email}</span>
                          </div>
                        )}
                        {!driver.phone && !driver.email && (
                          <span className="text-slate-400 text-sm">연락처 미등록</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          driver.is_active !== false 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {driver.is_active !== false ? '활성' : '비활성'}
                        </span>
                        <div className="text-xs text-slate-500">
                          ID: {driver.id}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditDriver(driver)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="편집"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDriver(driver)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        )}
      </div>

      {/* 파일명 표시 */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-xs text-slate-500">
          <Truck className="w-3 h-3" />
          DriverManagement.tsx
        </div>
      </div>
    </div>
  );
};

export default DriverManagement;