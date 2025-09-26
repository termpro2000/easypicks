import React, { useState, useEffect } from 'react';
import { User, X, Edit3, Save, Eye, EyeOff, Key, Shield, Calendar, Check, AlertCircle, Building, Phone, MapPin, Truck, Mail, Home, FileText } from 'lucide-react';
import { userAPI, authAPI, userDetailAPI } from '../../services/api';
import type { User as UserType } from '../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  currentUser: UserType;
  onUserUpdated?: (user: UserType) => void;
  onLogout?: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user: initialUser,
  currentUser,
  onUserUpdated,
  onLogout
}) => {
  const [user, setUser] = useState<UserType>(initialUser);
  const [editedUser, setEditedUser] = useState<UserType>({ ...initialUser });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // User detail 상태
  const [userDetail, setUserDetail] = useState<any>(null);
  const [editedUserDetail, setEditedUserDetail] = useState<any>({});
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Password change states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialUser) {
      setUser(initialUser);
      setEditedUser({ ...initialUser });
      setError(null);
      setSuccessMessage(null);
      setIsEditing(false);
      setShowPasswordSection(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError(null);
      
      // User detail 로드
      loadUserDetail();
    }
  }, [isOpen, initialUser]);

  // User detail 로드 함수
  const loadUserDetail = async () => {
    if (!initialUser?.id) return;
    
    setIsLoadingDetail(true);
    try {
      console.log('User detail 로드 시작:', initialUser.id);
      const response = await userDetailAPI.getUserDetail(initialUser.id.toString());
      
      if (response.success && response.data) {
        setUserDetail(response.data);
        setEditedUserDetail({ ...response.data.detail });
        console.log('User detail 로드 성공:', response.data);
      } else {
        console.log('User detail 없음, 기본값으로 초기화');
        setUserDetail(null);
        setEditedUserDetail(getDefaultUserDetail(initialUser.role));
      }
    } catch (error) {
      console.error('User detail 로드 오류:', error);
      setUserDetail(null);
      setEditedUserDetail(getDefaultUserDetail(initialUser.role));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Role별 기본 user detail 반환
  const getDefaultUserDetail = (role: string) => {
    switch (role) {
      case 'admin':
      case 'manager':
        return {
          address: '',
          detail_address: '',
          zipcode: '',
          memo: ''
        };
      case 'user':
        return {
          sender_name: '',
          sender_company: '',
          sender_address: '',
          sender_detail_address: '',
          emergency_contact_name: '',
          emergency_contact_phone: ''
        };
      case 'driver':
        return {
          name: '',
          phone: '',
          email: '',
          vehicle_type: '',
          vehicle_number: '',
          cargo_capacity: '',
          delivery_area: ''
        };
      default:
        return {};
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUserDetailChange = (field: string, value: any) => {
    setEditedUserDetail(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('ko-KR');
    } catch {
      return '-';
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('UserProfileModal: 저장 시작, editedUser:', editedUser);
      
      // 안전한 사용자 ID 처리
      const userId = user.id?.toString() || currentUser.id?.toString();
      if (!userId) {
        throw new Error('사용자 ID를 찾을 수 없습니다.');
      }

      // 기본 필드만 추출
      const basicUserData = {
        name: editedUser.name,
        email: editedUser.email,
        phone: editedUser.phone,
        role: editedUser.role,
        is_active: editedUser.is_active
      };

      console.log('UserProfileModal: API 호출 데이터:', basicUserData);
      
      let response;
      if (user.role === 'admin') {
        // 관리자는 userAPI.updateUser 사용 (다른 사용자도 수정 가능)
        response = await userAPI.updateUser(userId, basicUserData);
      } else {
        // 일반 사용자는 authAPI.updateProfile 사용 (자신의 프로필만 수정 가능)
        console.log('UserProfileModal: 일반 사용자 프로필 업데이트 API 사용');
        response = await authAPI.updateProfile(basicUserData);
      }
      
      if (response && response.success) {
        // 1. 로컬 상태 업데이트
        setUser({ ...user, ...basicUserData });
        setSuccessMessage('사용자 정보가 성공적으로 업데이트되었습니다.');
        setIsEditing(false);
        
        // 2. 서버에서 최신 데이터를 다시 가져오기
        let refreshedUser = null;
        try {
          let updatedUserResponse;
          if (user.role === 'admin') {
            // 관리자는 userAPI.getUser 사용
            updatedUserResponse = await userAPI.getUser(userId);
          } else {
            // 일반 사용자는 authAPI.me 사용
            updatedUserResponse = await authAPI.me();
          }
          
          if (updatedUserResponse && updatedUserResponse.user) {
            refreshedUser = updatedUserResponse.user;
            setUser(refreshedUser);
            setEditedUser({ ...refreshedUser });
            console.log('UserProfileModal: 최신 사용자 데이터를 성공적으로 불러왔습니다:', refreshedUser);
          }
        } catch (refreshError) {
          console.warn('UserProfileModal: 최신 데이터 로드 실패, 로컬 데이터 사용:', refreshError);
        }
        
        // 3. User detail 저장 (있는 경우)
        try {
          if (editedUserDetail && Object.keys(editedUserDetail).length > 0) {
            console.log('User detail 저장 시작:', editedUserDetail);
            const detailResponse = await userDetailAPI.createOrUpdateUserDetail(userId, {
              role: user.role,
              detail: editedUserDetail
            });
            
            if (detailResponse.success) {
              setUserDetail(detailResponse.data);
              console.log('User detail 저장 성공');
            } else {
              console.warn('User detail 저장 실패:', detailResponse.message);
            }
          }
        } catch (detailError) {
          console.error('User detail 저장 오류:', detailError);
          // User detail 저장 실패는 전체 저장을 실패로 처리하지 않음
        }

        // 4. 부모 컴포넌트에 업데이트된 사용자 정보 전달
        if (onUserUpdated) {
          onUserUpdated(refreshedUser || { ...user, ...basicUserData });
        }
      } else {
        setError(response?.message || '업데이트에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('사용자 업데이트 오류:', err);
      const errorMessage = err.response?.data?.message || err.message || '사용자 정보 업데이트 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;

    // Validate password fields
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('모든 비밀번호 필드를 입력해주세요.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsSaving(true);
    setPasswordError(null);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('UserProfileModal: 비밀번호 변경 시작');
      
      // 안전한 사용자 ID 처리
      const userId = user.id?.toString() || currentUser.id?.toString();
      if (!userId) {
        throw new Error('사용자 ID를 찾을 수 없습니다.');
      }

      const response = await userAPI.changePassword({
        userId: userId,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      console.log('UserProfileModal: API 응답:', response);
      
      if (response && response.success) {
        setSuccessMessage('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.');
        
        // 비밀번호 변경 성공 후 로그아웃 처리
        if (onLogout) {
          onLogout();
        }
        
        // 폼 초기화
        setShowPasswordSection(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswords({ current: false, new: false, confirm: false });
        
        // 2초 후 모달 닫기 (로그인 화면으로 이동)
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setPasswordError(response?.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('비밀번호 변경 오류:', err);
      const errorMessage = err.response?.data?.message || err.message || '비밀번호 변경 중 오류가 발생했습니다.';
      setPasswordError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">사용자 프로필</h2>
              <p className="text-sm text-gray-500">{user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                편집
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-green-700">{successMessage}</span>
          </div>
        )}

        {passwordError && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{passwordError}</span>
          </div>
        )}

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedUser({ ...user });
                  setError(null);
                }}
                disabled={isSaving}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
              >
                취소
              </button>
            </div>
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <Key className="w-4 h-4" />
              비밀번호 변경
            </button>
          </div>
        )}

        {/* Password Change Section */}
        {isEditing && showPasswordSection && (
          <div className="mx-6 mt-4 p-6 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                <Key className="w-5 h-5" />
                비밀번호 변경
              </h4>

              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  현재 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="새 비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="새 비밀번호를 다시 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Change Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handlePasswordChange}
                  disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <Key className="w-4 h-4" />
                  {isSaving ? '변경 중...' : '비밀번호 변경'}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordSection(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setShowPasswords({ current: false, new: false, confirm: false });
                    setPasswordError(null);
                  }}
                  className="px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : user && editedUser ? (
            <div className="space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  기본 정보
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  {/* Username - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사용자 ID
                    </label>
                    <p className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700 cursor-not-allowed">
                      {user.username || '-'}
                    </p>
                    {isEditing && (
                      <p className="text-xs text-gray-500 mt-1">사용자 ID는 변경할 수 없습니다.</p>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedUser.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="이름을 입력하세요"
                        required
                      />
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {user.name || '-'}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      전화번호
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedUser.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="전화번호를 입력하세요"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {user.phone || '-'}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이메일
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedUser.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="이메일을 입력하세요"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {user.email || '-'}
                      </p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      권한
                    </label>
                    {isEditing && currentUser.role === 'admin' ? (
                      <select
                        value={editedUser.role || 'user'}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="user">사용자 (파트너사)</option>
                        <option value="driver">기사</option>
                        <option value="admin">관리자</option>
                      </select>
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {user.role === 'admin' ? '관리자' : 
                         user.role === 'driver' ? '기사' : '사용자 (파트너사)'}
                      </p>
                    )}
                  </div>

                  {/* Active Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      활성 상태
                    </label>
                    {isEditing && currentUser.role === 'admin' ? (
                      <select
                        value={editedUser.is_active ? 'true' : 'false'}
                        onChange={(e) => handleInputChange('is_active', e.target.value === 'true')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="true">활성</option>
                        <option value="false">비활성</option>
                      </select>
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? '활성' : '비활성'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  시스템 정보
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">사용자 ID:</span>
                      <span className="text-gray-900">{user.id || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">생성일:</span>
                      <span className="text-gray-900">{formatDate(user.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">수정일:</span>
                      <span className="text-gray-900">{formatDate(user.updated_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">마지막 로그인:</span>
                      <span className="text-gray-900">{formatDate(user.last_login)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role별 추가 정보 섹션 */}
              {user.role === 'user' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    파트너사 추가정보
                  </h3>
                  
                  {isLoadingDetail ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {/* 발송인명(발송업체명) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          발송인명 (발송업체명)
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUserDetail.sender_name || ''}
                            onChange={(e) => handleUserDetailChange('sender_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="발송인명을 입력하세요"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                            {userDetail?.detail?.sender_name || '-'}
                          </p>
                        )}
                      </div>

                      {/* 발송업체명 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          발송업체명
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUserDetail.sender_company || ''}
                            onChange={(e) => handleUserDetailChange('sender_company', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="발송업체명을 입력하세요"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                            {userDetail?.detail?.sender_company || '-'}
                          </p>
                        )}
                      </div>

                      {/* 발송인주소 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          발송인주소
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUserDetail.sender_address || ''}
                            onChange={(e) => handleUserDetailChange('sender_address', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="발송인주소를 입력하세요"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                            {userDetail?.detail?.sender_address || '-'}
                          </p>
                        )}
                      </div>

                      {/* 상세주소 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          상세주소
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUserDetail.sender_detail_address || ''}
                            onChange={(e) => handleUserDetailChange('sender_detail_address', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="상세주소를 입력하세요"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                            {userDetail?.detail?.sender_detail_address || '-'}
                          </p>
                        )}
                      </div>

                      {/* 긴급연락담당자 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          긴급연락담당자
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUserDetail.emergency_contact_name || ''}
                            onChange={(e) => handleUserDetailChange('emergency_contact_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="긴급연락담당자를 입력하세요"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                            {userDetail?.detail?.emergency_contact_name || '-'}
                          </p>
                        )}
                      </div>

                      {/* 긴급연락전화번호 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          긴급연락전화번호
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editedUserDetail.emergency_contact_phone || ''}
                            onChange={(e) => handleUserDetailChange('emergency_contact_phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="긴급연락전화번호를 입력하세요"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                            {userDetail?.detail?.emergency_contact_phone || '-'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Driver role 추가 정보 섹션 */}
              {user.role === 'driver' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    기사 추가정보
                  </h3>
                  
                  {isLoadingDetail ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {/* 이름 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          기사명
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUserDetail.name || ''}
                            onChange={(e) => handleUserDetailChange('name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="기사명을 입력하세요"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                            {userDetail?.detail?.name || '-'}
                          </p>
                        )}
                      </div>

                      {/* 전화번호 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          연락처
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editedUserDetail.phone || ''}
                            onChange={(e) => handleUserDetailChange('phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="연락처를 입력하세요"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            {userDetail?.detail?.phone || '-'}
                          </p>
                        )}
                      </div>

                      {/* 이메일 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          이메일
                        </label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editedUserDetail.email || ''}
                            onChange={(e) => handleUserDetailChange('email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="이메일을 입력하세요"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            {userDetail?.detail?.email || '-'}
                          </p>
                        )}
                      </div>

                      {/* 차량 타입 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          차량 타입
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUserDetail.vehicle_type || ''}
                            onChange={(e) => handleUserDetailChange('vehicle_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="차량 타입을 입력하세요 (예: 1톤 트럭, 2.5톤 트럭)"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 flex items-center gap-2">
                            <Truck className="w-4 h-4 text-gray-500" />
                            {userDetail?.detail?.vehicle_type || '-'}
                          </p>
                        )}
                      </div>

                      {/* 차량 번호 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          차량 번호
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUserDetail.vehicle_number || ''}
                            onChange={(e) => handleUserDetailChange('vehicle_number', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="차량 번호를 입력하세요 (예: 12가3456)"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                            {userDetail?.detail?.vehicle_number || '-'}
                          </p>
                        )}
                      </div>

                      {/* 적재 용량 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          적재 용량
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUserDetail.cargo_capacity || ''}
                            onChange={(e) => handleUserDetailChange('cargo_capacity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="적재 용량을 입력하세요 (예: 1000kg, 2500kg)"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                            {userDetail?.detail?.cargo_capacity || '-'}
                          </p>
                        )}
                      </div>

                      {/* 배송 지역 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          배송 지역
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUserDetail.delivery_area || ''}
                            onChange={(e) => handleUserDetailChange('delivery_area', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="배송 지역을 입력하세요 (예: 서울, 경기 남부)"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            {userDetail?.detail?.delivery_area || '-'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin/Manager role 추가 정보 섹션 */}
              {(user.role === 'admin' || user.role === 'manager') && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    {user.role === 'admin' ? '관리자' : '매니저'} 추가정보
                  </h3>
                  
                  {isLoadingDetail ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {/* 주소 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          주소
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUserDetail.address || ''}
                            onChange={(e) => handleUserDetailChange('address', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="주소를 입력하세요"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 flex items-center gap-2">
                            <Home className="w-4 h-4 text-gray-500" />
                            {userDetail?.detail?.address || '-'}
                          </p>
                        )}
                      </div>

                      {/* 상세주소 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          상세주소
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUserDetail.detail_address || ''}
                            onChange={(e) => handleUserDetailChange('detail_address', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="상세주소를 입력하세요 (예: 456호, 12층 1201호)"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            {userDetail?.detail?.detail_address || '-'}
                          </p>
                        )}
                      </div>

                      {/* 우편번호 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          우편번호
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUserDetail.zipcode || ''}
                            onChange={(e) => handleUserDetailChange('zipcode', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="우편번호를 입력하세요 (예: 06234)"
                            maxLength={6}
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                            {userDetail?.detail?.zipcode || '-'}
                          </p>
                        )}
                      </div>

                      {/* 메모 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          메모
                        </label>
                        {isEditing ? (
                          <textarea
                            value={editedUserDetail.memo || ''}
                            onChange={(e) => handleUserDetailChange('memo', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                            placeholder="메모를 입력하세요 (예: 시스템 관리자 계정, 배송 관리 매니저)"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                            {userDetail?.detail?.memo ? (
                              <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <p className="whitespace-pre-wrap">{userDetail.detail.memo}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">-</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">사용자 정보를 불러올 수 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;