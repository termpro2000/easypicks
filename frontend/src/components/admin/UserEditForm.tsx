import React, { useState, useEffect } from 'react';
import { User, X, Edit3, Save, Eye, EyeOff, Key, Shield, Calendar, Check, AlertCircle, Building, Phone, MapPin, Truck, Mail, Home, FileText, ArrowLeft } from 'lucide-react';
import { userAPI, authAPI, userDetailAPI } from '../../services/api';

interface User {
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
  // 이 필드들은 실제로는 user_detail JSON에 저장됨
  company?: string;
  default_sender_address?: string;
  default_sender_detail_address?: string;
  default_sender_zipcode?: string;
}

interface UserEditFormProps {
  user: User;
  onNavigateBack: () => void;
  onSuccess: () => void;
}

const UserEditForm: React.FC<UserEditFormProps> = ({
  user: initialUser,
  onNavigateBack,
  onSuccess
}) => {
  const [user, setUser] = useState<User>(initialUser);
  const [editedUser, setEditedUser] = useState<User>({ ...initialUser });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // User detail 상태
  const [userDetail, setUserDetail] = useState<any>(null);
  const [editedUserDetail, setEditedUserDetail] = useState<any>({});

  // Role별 색상 톤 시스템 (2025 트렌드)
  const getRoleColorScheme = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return {
          primary: '#dc2626',
          secondary: '#b91c1c',
          background: '#fef2f2',
          border: '#fca5a5',
          text: '#991b1b',
          icon: '#dc2626',
          badge: 'bg-red-100 text-red-800'
        };
      case 'manager':
        return {
          primary: '#7c3aed',
          secondary: '#6d28d9',
          background: '#f3e8ff',
          border: '#c4b5fd',
          text: '#5b21b6',
          icon: '#7c3aed',
          badge: 'bg-purple-100 text-purple-800'
        };
      case 'driver':
        return {
          primary: '#059669',
          secondary: '#047857',
          background: '#ecfdf5',
          border: '#86efac',
          text: '#065f46',
          icon: '#059669',
          badge: 'bg-green-100 text-green-800'
        };
      case 'user':
      default:
        return {
          primary: '#3b82f6',
          secondary: '#2563eb',
          background: '#eff6ff',
          border: '#93c5fd',
          text: '#1e40af',
          icon: '#2563eb',
          badge: 'bg-blue-100 text-blue-800'
        };
    }
  };

  const colorScheme = getRoleColorScheme(user?.role || 'user');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Password change states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  useEffect(() => {
    if (user?.id) {
      loadUserDetail();
    }
  }, [user?.id]);

  const loadUserDetail = async () => {
    try {
      setIsLoadingDetail(true);
      const response = await userDetailAPI.getUserDetail(user.id);
      
      // detail 필드가 없거나 JSON 파싱에 실패할 경우 빈 객체로 처리
      let parsedDetail = {};
      
      if (response.detail) {
        try {
          // 이미 객체인 경우
          if (typeof response.detail === 'object') {
            parsedDetail = response.detail;
          } 
          // 문자열인 경우 JSON 파싱 시도
          else if (typeof response.detail === 'string') {
            parsedDetail = JSON.parse(response.detail);
          }
        } catch (parseError) {
          console.log('JSON 파싱 실패, 빈 객체로 초기화:', parseError);
          parsedDetail = {};
        }
      }
      
      setUserDetail(parsedDetail);
      setEditedUserDetail({ ...parsedDetail });
      
      // user_detail에서 company와 주소 정보를 editedUser에 설정
      if (parsedDetail.company || parsedDetail.sender_address || parsedDetail.sender_detail_address || parsedDetail.sender_zipcode) {
        setEditedUser(prev => ({
          ...prev,
          company: parsedDetail.company || prev.company,
          default_sender_address: parsedDetail.sender_address || prev.default_sender_address,
          default_sender_detail_address: parsedDetail.sender_detail_address || prev.default_sender_detail_address,
          default_sender_zipcode: parsedDetail.sender_zipcode || prev.default_sender_zipcode
        }));
      }
    } catch (error) {
      console.log('User detail을 불러올 수 없습니다:', error);
      setUserDetail({});
      setEditedUserDetail({});
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    setEditedUser({ ...user });
    setEditedUserDetail({ ...userDetail });
    setIsEditing(false);
    setError(null);
    setSuccessMessage(null);
    setShowPasswordSection(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // users 테이블 필드만 분리 (undefined 값 제거)
      const usersTableData: any = {};
      if (editedUser.username !== undefined) usersTableData.username = editedUser.username;
      if (editedUser.name !== undefined) usersTableData.name = editedUser.name;
      if (editedUser.email !== undefined) usersTableData.email = editedUser.email;
      if (editedUser.phone !== undefined) usersTableData.phone = editedUser.phone;
      if (editedUser.role !== undefined) usersTableData.role = editedUser.role;
      if (editedUser.is_active !== undefined) usersTableData.is_active = editedUser.is_active;
      
      console.log('🔄 Sending users table data:', usersTableData);

      // user_detail JSON 필드 준비 (undefined 값 제거)
      const userDetailData: any = {};
      if (editedUserDetail?.business_number) userDetailData.business_number = editedUserDetail.business_number;
      if (editedUserDetail?.representative_name) userDetailData.representative_name = editedUserDetail.representative_name;
      if (editedUserDetail?.business_type) userDetailData.business_type = editedUserDetail.business_type;
      if (editedUserDetail?.service_area) userDetailData.service_area = editedUserDetail.service_area;
      if (editedUser.company) userDetailData.company = editedUser.company;
      if (editedUser.default_sender_address) userDetailData.sender_address = editedUser.default_sender_address;
      if (editedUser.default_sender_detail_address) userDetailData.sender_detail_address = editedUser.default_sender_detail_address;
      if (editedUser.default_sender_zipcode) userDetailData.sender_zipcode = editedUser.default_sender_zipcode;
      
      console.log('🔄 Sending user detail data:', userDetailData);

      // users 테이블 업데이트
      const response = await userAPI.updateUser(user.id, usersTableData);
      
      // user_detail 업데이트 (데이터가 있는 경우만)
      const hasUserDetailData = Object.values(userDetailData).some(value => value !== undefined && value !== null && value !== '');
      if (hasUserDetailData) {
        try {
          await userDetailAPI.updateUserDetail(user.id, { detail: userDetailData });
        } catch (detailError) {
          console.log('User detail 업데이트 실패:', detailError);
        }
      }

      // 비밀번호 변경 (요청된 경우)
      if (showPasswordSection && passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setError('새 비밀번호가 일치하지 않습니다.');
          return;
        }
        
        await authAPI.changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });
      }

      // 성공적으로 저장된 데이터로 로컬 상태 업데이트
      setUser({ ...user, ...usersTableData });
      setUserDetail(userDetailData);
      setIsEditing(false);
      setSuccessMessage('파트너사 정보가 성공적으로 업데이트되었습니다.');
      setShowPasswordSection(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // 상위 컴포넌트에 성공 알림
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (error: any) {
      console.error('파트너사 정보 업데이트 실패:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      setError(
        error.response?.data?.details || 
        error.response?.data?.message || 
        `서버 오류 (${error.response?.status}): 파트너사 정보 업데이트에 실패했습니다.`
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 p-8">
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 p-8 mb-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>이전화면</span>
          </button>
          
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-6">
              <div className="relative">
                <div 
                  className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
                  style={{ backgroundColor: colorScheme.primary }}
                >
                  <Building className="w-10 h-10 text-white" />
                </div>
                <div 
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: colorScheme.secondary }}
                >
                  <Edit3 className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  파트너사 정보 수정
                </h1>
                <p className="text-gray-600 text-lg">{user.name} 파트너사의 정보를 수정합니다</p>
              </div>
            </div>
          </div>
          
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="group relative px-8 py-4 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 overflow-hidden"
              style={{ backgroundColor: colorScheme.primary }}
            >
              <div className="relative flex items-center gap-3">
                <Edit3 className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                <span className="font-bold text-lg">정보 수정</span>
              </div>
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="group relative px-8 py-4 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 overflow-hidden"
                style={{ backgroundColor: colorScheme.primary }}
              >
                <div className="relative flex items-center gap-3">
                  {isSaving ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-6 h-6" />
                  )}
                  <span className="font-bold text-lg">{isSaving ? '저장 중...' : '저장'}</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800">오류 발생</h4>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-800">성공</h4>
            <p className="text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* 프로필 정보 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-2xl overflow-hidden">
        <div 
          className="px-8 py-6 border-b border-gray-200"
          style={{ backgroundColor: colorScheme.background }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: colorScheme.primary }}
              >
                <Building className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: colorScheme.text }}>
                  파트너사 프로필
                </h2>
                <p className="text-gray-600">기본 정보 및 계정 설정</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${colorScheme.badge}`}>
              파트너사
            </span>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4" style={{ color: colorScheme.icon }} />
                업체명
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.name || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                  style={{ 
                    focusRingColor: colorScheme.secondary,
                    '--tw-ring-color': colorScheme.secondary 
                  } as any}
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                  {user.name}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Shield className="w-4 h-4" style={{ color: colorScheme.icon }} />
                사용자명
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.username || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                  style={{ 
                    focusRingColor: colorScheme.secondary,
                    '--tw-ring-color': colorScheme.secondary 
                  } as any}
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                  {user.username}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4" style={{ color: colorScheme.icon }} />
                전화번호
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedUser.phone || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                  placeholder="010-0000-0000"
                  style={{ 
                    focusRingColor: colorScheme.secondary,
                    '--tw-ring-color': colorScheme.secondary 
                  } as any}
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                  {user.phone || '미등록'}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4" style={{ color: colorScheme.icon }} />
                이메일
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedUser.email || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                  placeholder="example@email.com"
                  style={{ 
                    focusRingColor: colorScheme.secondary,
                    '--tw-ring-color': colorScheme.secondary 
                  } as any}
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                  {user.email || '미등록'}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Building className="w-4 h-4" style={{ color: colorScheme.icon }} />
                담당자명
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.company || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, company: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                  placeholder="담당자명을 입력하세요"
                  style={{ 
                    focusRingColor: colorScheme.secondary,
                    '--tw-ring-color': colorScheme.secondary 
                  } as any}
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                  {user.company || '미등록'}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Shield className="w-4 h-4" style={{ color: colorScheme.icon }} />
                역할
              </label>
              {isEditing ? (
                <select
                  value={editedUser.role || 'user'}
                  onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all bg-white"
                  style={{ 
                    focusRingColor: colorScheme.secondary,
                    '--tw-ring-color': colorScheme.secondary 
                  } as any}
                >
                  <option value="user">파트너사</option>
                  <option value="manager">매니저</option>
                  <option value="admin">관리자</option>
                  <option value="driver">기사</option>
                </select>
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                  {user.role === 'user' ? '파트너사' : 
                   user.role === 'manager' ? '매니저' :
                   user.role === 'admin' ? '관리자' :
                   user.role === 'driver' ? '기사' : 
                   user.role || '미설정'}
                </div>
              )}
            </div>
          </div>

          {/* 주소 정보 */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5" style={{ color: colorScheme.icon }} />
              주소 정보
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" style={{ color: colorScheme.icon }} />
                  기본 발송지 주소
                </label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editedUser.default_sender_address || ''}
                      placeholder="주소를 검색해주세요"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                      style={{ 
                        focusRingColor: colorScheme.secondary,
                        '--tw-ring-color': colorScheme.secondary 
                      } as any}
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => {
                        // 주소 검색 로직 추가 필요
                        alert('주소 검색 기능을 구현해주세요');
                      }}
                      className="px-4 py-3 text-white rounded-xl hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: colorScheme.primary }}
                    >
                      주소검색
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                    {user.default_sender_address || '미등록'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Home className="w-4 h-4" style={{ color: colorScheme.icon }} />
                    상세주소
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedUser.default_sender_detail_address || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, default_sender_detail_address: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                      placeholder="상세주소를 입력하세요"
                      style={{ 
                        focusRingColor: colorScheme.secondary,
                        '--tw-ring-color': colorScheme.secondary 
                      } as any}
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                      {user.default_sender_detail_address || '미등록'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="w-4 h-4" style={{ color: colorScheme.icon }} />
                    우편번호
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedUser.default_sender_zipcode || ''}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                      placeholder="우편번호"
                      style={{ 
                        focusRingColor: colorScheme.secondary,
                        '--tw-ring-color': colorScheme.secondary 
                      } as any}
                      readOnly
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                      {user.default_sender_zipcode || '미등록'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 파트너사 상세 정보 (user_detail JSON 데이터) */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: colorScheme.icon }} />
              파트너사 상세 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Building className="w-4 h-4" style={{ color: colorScheme.icon }} />
                  사업자등록번호
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUserDetail?.business_number || ''}
                    onChange={(e) => setEditedUserDetail({ ...editedUserDetail, business_number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                    placeholder="예: 123-45-67890"
                    style={{ 
                      focusRingColor: colorScheme.secondary,
                      '--tw-ring-color': colorScheme.secondary 
                    } as any}
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                    {userDetail?.business_number || '미등록'}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4" style={{ color: colorScheme.icon }} />
                  대표자명
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUserDetail?.representative_name || ''}
                    onChange={(e) => setEditedUserDetail({ ...editedUserDetail, representative_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                    placeholder="대표자명을 입력하세요"
                    style={{ 
                      focusRingColor: colorScheme.secondary,
                      '--tw-ring-color': colorScheme.secondary 
                    } as any}
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                    {userDetail?.representative_name || '미등록'}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Building className="w-4 h-4" style={{ color: colorScheme.icon }} />
                  업종
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUserDetail?.business_type || ''}
                    onChange={(e) => setEditedUserDetail({ ...editedUserDetail, business_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                    placeholder="예: 물류, 유통, 제조업"
                    style={{ 
                      focusRingColor: colorScheme.secondary,
                      '--tw-ring-color': colorScheme.secondary 
                    } as any}
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                    {userDetail?.business_type || '미등록'}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" style={{ color: colorScheme.icon }} />
                  서비스 지역
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUserDetail?.service_area || ''}
                    onChange={(e) => setEditedUserDetail({ ...editedUserDetail, service_area: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                    placeholder="예: 서울, 경기, 인천"
                    style={{ 
                      focusRingColor: colorScheme.secondary,
                      '--tw-ring-color': colorScheme.secondary 
                    } as any}
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                    {userDetail?.service_area || '미등록'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 계정 상태 */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: colorScheme.icon }} />
              계정 상태
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">활성 상태</label>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    user.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.is_active !== false ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
              
              {user.last_login && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">최근 로그인</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                    {new Date(user.last_login).toLocaleString('ko-KR')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 비밀번호 변경 (편집 모드에서만) */}
          {isEditing && (
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4 hover:text-blue-600 transition-colors"
              >
                <Key className="w-5 h-5" style={{ color: colorScheme.icon }} />
                비밀번호 변경
                {showPasswordSection ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              
              {showPasswordSection && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">현재 비밀번호</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all pr-12"
                        style={{ 
                          focusRingColor: colorScheme.secondary,
                          '--tw-ring-color': colorScheme.secondary 
                        } as any}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">새 비밀번호</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all pr-12"
                        style={{ 
                          focusRingColor: colorScheme.secondary,
                          '--tw-ring-color': colorScheme.secondary 
                        } as any}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">비밀번호 확인</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all pr-12"
                        style={{ 
                          focusRingColor: colorScheme.secondary,
                          '--tw-ring-color': colorScheme.secondary 
                        } as any}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 파일명 표시 */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-gray-200 text-sm text-gray-600">
          <FileText className="w-4 h-4" />
          UserEditForm.tsx
        </div>
      </div>
    </div>
  );
};

export default UserEditForm;