import React, { useState } from 'react';
import { Building, Phone, User, Eye, EyeOff, CheckCircle, XCircle, MapPin } from 'lucide-react';
import { userAPI } from '../../services/api';

interface PartnerFormProps {
  onNavigateBack: () => void;
  onSuccess?: () => void;
}

interface PartnerFormData {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  business_number: string;
  representative_name: string;
  business_type: string;
  business_address: string;
  service_area: string;
}

const PartnerForm: React.FC<PartnerFormProps> = ({ onNavigateBack, onSuccess }) => {
  const [formData, setFormData] = useState<PartnerFormData>({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    email: '',
    company: '',
    business_number: '',
    representative_name: '',
    business_type: '택배/물류',
    business_address: '',
    service_area: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 사업 유형 옵션
  const businessTypes = [
    '택배/물류',
    '이사/운송', 
    '화물운송',
    '배송대행',
    '퀵서비스',
    '창고/보관',
    '기타'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 클리어
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // 비밀번호 확인 실시간 검증
    if (name === 'confirmPassword' && formData.password && value !== formData.password) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: '비밀번호가 일치하지 않습니다.'
      }));
    } else if (name === 'confirmPassword' && value === formData.password) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 필수 필드 검증
    if (!formData.username.trim()) {
      newErrors.username = '사용자 아이디는 필수입니다.';
    } else if (formData.username.length < 4) {
      newErrors.username = '사용자 아이디는 4자 이상이어야 합니다.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호는 필수입니다.';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인은 필수입니다.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.name.trim()) {
      newErrors.name = '담당자명은 필수입니다.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '연락처는 필수입니다.';
    } else if (!/^[0-9-+\s()]+$/.test(formData.phone)) {
      newErrors.phone = '올바른 연락처 형식이 아닙니다.';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!formData.company.trim()) {
      newErrors.company = '회사명은 필수입니다.';
    }

    if (!formData.business_number.trim()) {
      newErrors.business_number = '사업자등록번호는 필수입니다.';
    }

    if (!formData.representative_name.trim()) {
      newErrors.representative_name = '대표자명은 필수입니다.';
    }

    if (!formData.business_type) {
      newErrors.business_type = '사업 유형을 선택해주세요.';
    }

    if (!formData.business_address.trim()) {
      newErrors.business_address = '사업장 주소는 필수입니다.';
    }

    if (!formData.service_area.trim()) {
      newErrors.service_area = '서비스 지역은 필수입니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const { confirmPassword, ...submitData } = formData;
      // Add role: 'partner' to the submit data
      const partnerData = {
        ...submitData,
        role: 'partner'
      };
      
      await userAPI.createUser(partnerData);
      
      if (onSuccess) {
        onSuccess();
      } else {
        onNavigateBack();
      }
    } catch (error: any) {
      console.error('파트너사 등록 실패:', error);
      const message = error.response?.data?.message || '파트너사 등록에 실패했습니다.';
      setErrors({ submit: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-6">
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mb-4"
        >
          ← 파트너사관리로 돌아가기
        </button>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building className="w-8 h-8 text-blue-600" />
            새 파트너사 등록
          </h1>
          <p className="text-gray-600 mt-2">새로운 파트너사 정보를 입력하여 등록하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 계정 정보 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              계정 정보
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사용자 아이디 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="로그인에 사용할 아이디를 입력하세요"
                />
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  담당자명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="담당자 이름을 입력하세요"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="6자 이상 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="비밀번호를 다시 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          {/* 연락처 정보 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              연락처 정보
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="010-1234-5678"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="partner@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* 사업자 정보 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              사업자 정보
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  회사명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.company ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="(주)파트너사"
                />
                {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사업자등록번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="business_number"
                  value={formData.business_number}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.business_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123-45-67890"
                />
                {errors.business_number && <p className="text-red-500 text-sm mt-1">{errors.business_number}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  대표자명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="representative_name"
                  value={formData.representative_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.representative_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="홍길동"
                />
                {errors.representative_name && <p className="text-red-500 text-sm mt-1">{errors.representative_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사업 유형 <span className="text-red-500">*</span>
                </label>
                <select
                  name="business_type"
                  value={formData.business_type}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.business_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {businessTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.business_type && <p className="text-red-500 text-sm mt-1">{errors.business_type}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사업장 주소 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    name="business_address"
                    value={formData.business_address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pl-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.business_address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="서울특별시 강남구 테헤란로 123"
                  />
                </div>
                {errors.business_address && <p className="text-red-500 text-sm mt-1">{errors.business_address}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  서비스 지역 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="service_area"
                  value={formData.service_area}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.service_area ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="서울, 경기, 인천"
                />
                {errors.service_area && <p className="text-red-500 text-sm mt-1">{errors.service_area}</p>}
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-600">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onNavigateBack}
              className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  등록 중...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  파트너사 등록
                </>
              )}
            </button>
          </div>
        </form>

        {/* 파일명 표시 */}
        <div className="mt-8 text-xs text-gray-400 text-center">
          PartnerForm.tsx
        </div>
      </div>
    </div>
  );
};

export default PartnerForm;