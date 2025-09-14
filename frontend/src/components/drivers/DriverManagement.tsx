import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, UserPlus, Phone, Mail, Truck, Hash, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { driversAPI } from '../../services/api';

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

interface DriverFormData {
  username: string;
  password: string;
  name: string;
  phone: string;
  email: string;
  vehicle_type: string;
  vehicle_number: string;
  license_number: string;
}

const DriverManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<DriverFormData>({
    username: '',
    password: '',
    name: '',
    phone: '',
    email: '',
    vehicle_type: '',
    vehicle_number: '',
    license_number: ''
  });

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

  // 기사 등록 모달 열기
  const handleCreateDriver = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      phone: '',
      email: '',
      vehicle_type: '',
      vehicle_number: '',
      license_number: ''
    });
    setShowCreateModal(true);
  };

  // 기사 수정 모달 열기
  const handleEditDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setFormData({
      username: driver.username,
      password: '',
      name: driver.name,
      phone: driver.phone || '',
      email: driver.email || '',
      vehicle_type: driver.vehicle_type || '',
      vehicle_number: driver.vehicle_number || '',
      license_number: driver.license_number || ''
    });
    setShowEditModal(true);
  };

  // 폼 데이터 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 기사 생성 제출
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password || !formData.name) {
      alert('사용자명, 비밀번호, 이름은 필수입니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      await driversAPI.createDriver({
        username: formData.username,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        vehicle_type: formData.vehicle_type || undefined,
        vehicle_number: formData.vehicle_number || undefined,
        license_number: formData.license_number || undefined
      });
      
      setShowCreateModal(false);
      fetchDrivers();
      alert('기사가 성공적으로 등록되었습니다.');
    } catch (error: any) {
      console.error('기사 생성 실패:', error);
      alert(error.response?.data?.message || '기사 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 기사 수정 제출
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDriver || !formData.username || !formData.name) {
      alert('사용자명과 이름은 필수입니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updateData: any = {
        username: formData.username,
        name: formData.name,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        vehicle_type: formData.vehicle_type || undefined,
        vehicle_number: formData.vehicle_number || undefined,
        license_number: formData.license_number || undefined
      };

      // 비밀번호가 입력된 경우에만 포함
      if (formData.password) {
        updateData.password = formData.password;
      }

      await driversAPI.updateDriver(selectedDriver.driver_id, updateData);
      
      setShowEditModal(false);
      setSelectedDriver(null);
      fetchDrivers();
      alert('기사 정보가 성공적으로 수정되었습니다.');
    } catch (error: any) {
      console.error('기사 수정 실패:', error);
      alert(error.response?.data?.message || '기사 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="space-y-6">

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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              기사 목록 ({filteredDrivers.length}명)
            </h2>
            <button
              onClick={handleCreateDriver}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              기사 등록
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? '검색 결과가 없습니다.' : '등록된 기사가 없습니다.'}
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrivers.map((driver) => (
                <div key={driver.driver_id} className="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:border-blue-300 transition-colors">
                  <div className="space-y-4">
                    {/* 기사 정보 */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserPlus className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{driver.name}</h3>
                        <p className="text-sm text-gray-500">@{driver.username}</p>
                      </div>
                    </div>

                    {/* 연락처 정보 */}
                    <div className="space-y-2">
                      {driver.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{driver.phone}</span>
                        </div>
                        )}
                      {driver.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span>{driver.email}</span>
                        </div>
                      )}
                    </div>

                    {/* 차량 정보 */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">차량 정보</h4>
                      {driver.vehicle_type && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Truck className="w-4 h-4 flex-shrink-0" />
                          <span>{driver.vehicle_type}</span>
                        </div>
                      )}
                      {driver.vehicle_number && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Hash className="w-4 h-4 flex-shrink-0" />
                          <span>{driver.vehicle_number}</span>
                        </div>
                      )}
                      {driver.license_number && (
                        <div className="text-sm text-gray-600">
                          면허: {driver.license_number}
                        </div>
                      )}
                    </div>

                    {/* 상태 및 등록일 */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
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
                      <span className="text-xs text-gray-500">
                        {new Date(driver.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleEditDriver(driver)}
                        className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors text-sm"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteDriver(driver)}
                        className="flex items-center gap-1 px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors text-sm"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 기사 등록 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateSubmit}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">새 기사 등록</h3>
                
                <div className="space-y-4">
                  {/* 기본 정보 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사용자명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      비밀번호 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      연락처
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이메일
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* 차량 정보 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      차량 유형
                    </label>
                    <select
                      name="vehicle_type"
                      value={formData.vehicle_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">선택하세요</option>
                      <option value="1톤 트럭">1톤 트럭</option>
                      <option value="2.5톤 트럭">2.5톤 트럭</option>
                      <option value="5톤 트럭">5톤 트럭</option>
                      <option value="오토바이">오토바이</option>
                      <option value="승용차">승용차</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      차량 번호
                    </label>
                    <input
                      type="text"
                      name="vehicle_number"
                      value={formData.vehicle_number}
                      onChange={handleInputChange}
                      placeholder="예: 123가4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      면허 번호
                    </label>
                    <input
                      type="text"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    disabled={isSubmitting}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '등록 중...' : '등록'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 기사 수정 모달 */}
      {showEditModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleEditSubmit}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  기사 정보 수정 - {selectedDriver.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사용자명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      새 비밀번호 (변경 시에만 입력)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="변경하지 않으려면 비워두세요"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      연락처
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이메일
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      차량 유형
                    </label>
                    <select
                      name="vehicle_type"
                      value={formData.vehicle_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">선택하세요</option>
                      <option value="1톤 트럭">1톤 트럭</option>
                      <option value="2.5톤 트럭">2.5톤 트럭</option>
                      <option value="5톤 트럭">5톤 트럭</option>
                      <option value="오토바이">오토바이</option>
                      <option value="승용차">승용차</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      차량 번호
                    </label>
                    <input
                      type="text"
                      name="vehicle_number"
                      value={formData.vehicle_number}
                      onChange={handleInputChange}
                      placeholder="예: 123가4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      면허 번호
                    </label>
                    <input
                      type="text"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedDriver(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    disabled={isSubmitting}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '수정 중...' : '수정'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;