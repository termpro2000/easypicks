import React, { useState } from 'react';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import { driversAPI } from '../../services/api';

interface Driver {
  id: number;
  driver_id?: number;
  username?: string;
  name: string;
  phone?: string;
  email?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  license_number?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

interface DriverEditFormProps {
  driver: Driver;
  onNavigateBack: () => void;
  onSuccess: () => void;
}

const DriverEditForm: React.FC<DriverEditFormProps> = ({ driver, onNavigateBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: driver.username || '',
    password: '',
    name: driver.name || '',
    phone: driver.phone || '',
    email: driver.email || '',
    vehicle_type: driver.vehicle_type || '',
    vehicle_number: driver.vehicle_number || '',
    license_number: driver.license_number || '',
    is_active: driver.is_active !== false
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 비밀번호가 비어있으면 제외
      const updateData: any = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      await driversAPI.updateDriver(driver.id, updateData);
      setSuccess('기사 정보가 성공적으로 수정되었습니다.');
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error('기사 수정 실패:', error);
      setError(error.response?.data?.message || '기사 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-6">
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          기사 목록으로 돌아가기
        </button>
      </div>

      <div className="px-6 pb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">기사 정보 수정</h1>
            <p className="text-gray-600">기사의 정보를 수정합니다.</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 섹션 */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    사용자명 *
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="사용자명을 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    기사명 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="기사명을 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 (변경 시에만 입력)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="새 비밀번호 (선택사항)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 mb-2">
                    활성 상태
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-900">
                      활성 기사
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 연락처 정보 섹션 */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">연락처 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="010-1234-5678"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="example@example.com"
                  />
                </div>
              </div>
            </div>

            {/* 차량 정보 섹션 */}
            <div className="pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">차량 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="vehicle_type" className="block text-sm font-medium text-gray-700 mb-2">
                    차량 유형
                  </label>
                  <select
                    id="vehicle_type"
                    name="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">차량 유형 선택</option>
                    <option value="승합차">승합차</option>
                    <option value="화물차">화물차</option>
                    <option value="트럭">트럭</option>
                    <option value="밴">밴</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="vehicle_number" className="block text-sm font-medium text-gray-700 mb-2">
                    차량번호
                  </label>
                  <input
                    type="text"
                    id="vehicle_number"
                    name="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="12가1234"
                  />
                </div>

                <div>
                  <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-2">
                    면허번호
                  </label>
                  <input
                    type="text"
                    id="license_number"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="면허번호를 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 버튼 섹션 */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onNavigateBack}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? '수정 중...' : '수정 완료'}
              </button>
            </div>
          </form>

          {/* 시스템 정보 표시 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">시스템 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">기사 ID:</span> {driver.id}
              </div>
              <div>
                <span className="font-medium">생성일:</span> {new Date(driver.created_at).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">수정일:</span> {new Date(driver.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* 파일명 표시 */}
        <div className="text-xs text-gray-400 text-center mt-4">
          DriverEditForm.tsx
        </div>
      </div>
    </div>
  );
};

export default DriverEditForm;