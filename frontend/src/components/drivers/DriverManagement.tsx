import React, { useState, useEffect } from 'react';
import { Search, Trash2, UserPlus, Phone, Mail, Truck, Hash, CheckCircle, XCircle } from 'lucide-react';
import { driversAPI } from '../../services/api';
import DriverForm from './DriverForm';

interface Driver {
  driver_id: number;
  username: string;
  name: string;
  phone?: string;
  email?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  license_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DriverManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'list' | 'add-form'>('list');

  // 기사 목록 조회
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await driversAPI.getAllDrivers();
      setDrivers(response.drivers || []);
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
      setDrivers(response.drivers || []);
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

  // 폼 성공 처리
  const handleFormSuccess = () => {
    setCurrentView('list');
    fetchDrivers(); // 기사 목록 새로고침
  };

  // 목록으로 돌아가기
  const handleBackToList = () => {
    setCurrentView('list');
  };

  // 기사 삭제
  const handleDeleteDriver = async (driver: Driver) => {
    if (!confirm(`정말로 ${driver.name} 기사를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await driversAPI.deleteDriver(driver.driver_id);
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
    driver.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone?.includes(searchTerm) ||
    driver.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">기사 관리</h1>
          <p className="text-gray-600">배송 기사의 정보를 관리합니다.</p>
        </div>
        
        <button
          onClick={handleCreateDriver}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          기사 등록
        </button>
      </div>

      {/* 검색 바 */}
      <div className="flex gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="기사명, 사용자명, 연락처, 차량번호로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          검색
        </button>
      </div>

      {/* 기사 목록 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            등록된 기사 목록 ({filteredDrivers.length}명)
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
            <p className="text-gray-500">기사 목록을 불러오는 중...</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 기사가 없습니다.'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateDriver}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                첫 번째 기사 등록하기
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기사 정보
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    연락처
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    차량 정보
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDrivers.map((driver) => (
                  <tr key={driver.driver_id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {driver.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{driver.username}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {driver.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            {driver.phone}
                          </div>
                        )}
                        {driver.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            {driver.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {driver.vehicle_type && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Truck className="w-3 h-3" />
                            {driver.vehicle_type}
                          </div>
                        )}
                        {driver.vehicle_number && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Hash className="w-3 h-3" />
                            {driver.vehicle_number}
                          </div>
                        )}
                        {driver.license_number && (
                          <div className="text-xs text-gray-500">
                            면허: {driver.license_number}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        driver.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {driver.is_active ? (
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
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleDeleteDriver(driver)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                        title="기사 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 통계 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-green-600">{drivers.length}</div>
          <div className="text-sm text-gray-600">전체 기사</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">
            {drivers.filter(d => d.is_active).length}
          </div>
          <div className="text-sm text-gray-600">활성 기사</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-orange-600">
            {drivers.filter(d => !d.is_active).length}
          </div>
          <div className="text-sm text-gray-600">비활성 기사</div>
        </div>
      </div>

      {/* 파일명 표시 */}
      <div className="text-xs text-gray-400 text-center">
        DriverManagement.tsx
      </div>
    </div>
  );
};

export default DriverManagement;