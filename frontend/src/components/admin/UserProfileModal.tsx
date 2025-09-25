import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Building, MapPin, Calendar, Shield, Edit3, Key, Eye, EyeOff } from 'lucide-react';
import { userAPI, authAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { User as AuthUser } from '../../types';

interface UserProfile extends AuthUser {
  email?: string;
  department?: string;
  position?: string;
  address?: string;
  default_sender_address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onUserUpdated?: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  onUserUpdated 
}) => {
  const { setUser: setAuthUser, setToken } = useAuth(); // 인증 상태 관리를 위한 hook
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editedUser, setEditedUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
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

  // Load user profile data from currentUser prop
  useEffect(() => {
    if (isOpen) {
      console.log('UserProfileModal - isOpen:', isOpen);
      console.log('UserProfileModal - currentUser:', currentUser);
      
      // Reset states when opening
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      setPasswordError(null);
      setShowPasswordSection(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswords({ current: false, new: false, confirm: false });
      
      if (currentUser) {
        // Use the currentUser directly and extend it with additional UserProfile fields
        console.log('UserProfileModal - Setting user data:', currentUser);
        const extendedUser: UserProfile = {
          ...currentUser,
          email: (currentUser as any).email || '',
          department: (currentUser as any).department || '',
          position: (currentUser as any).position || '',
          address: (currentUser as any).address || '',
          default_sender_address: (currentUser as any).default_sender_address || '',
          emergency_contact: (currentUser as any).emergency_contact || '',
          emergency_phone: (currentUser as any).emergency_phone || '',
          notes: (currentUser as any).notes || '',
          is_active: (currentUser as any).is_active !== false,
          created_at: (currentUser as any).created_at || '',
          updated_at: (currentUser as any).updated_at || '',
          last_login: (currentUser as any).last_login || ''
        };
        setUser(extendedUser);
        setEditedUser({ ...extendedUser });
        setIsLoading(false);
        console.log('UserProfileModal - User data loaded successfully');
      } else {
        setError('사용자 정보를 불러올 수 없습니다. 로그인 상태를 확인해주세요.');
        setIsLoading(false);
        console.error('UserProfileModal - No currentUser provided');
      }
    } else {
      // Reset states when closing
      setUser(null);
      setEditedUser(null);
      setIsEditing(false);
    }
  }, [isOpen, currentUser]);

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    if (!editedUser) return;
    
    setEditedUser(prev => ({
      ...prev!,
      [field]: value
    }));
    
    // Clear success message when editing
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    if (!editedUser || !user) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await userAPI.updateUser(user.id!.toString(), editedUser);
      
      if (response.success) {
        setUser({ ...editedUser });
        setSuccessMessage('사용자 정보가 성공적으로 업데이트되었습니다.');
        setIsEditing(false);
        onUserUpdated?.();
      } else {
        setError(response.message || '업데이트에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('사용자 업데이트 오류:', err);
      setError(err.response?.data?.message || '사용자 정보 업데이트 중 오류가 발생했습니다.');
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
      const response = await userAPI.changePassword({
        userId: user.id!.toString(),
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.success) {
        setSuccessMessage('비밀번호가 성공적으로 변경되었습니다. 자동으로 재로그인 중...');
        
        try {
          // 새 비밀번호로 자동 재로그인
          const loginResponse = await authAPI.login({
            username: user!.username!,
            password: passwordData.newPassword
          });
          
          if (loginResponse.success && loginResponse.token) {
            // 새 JWT 토큰으로 인증 상태 업데이트
            setToken(loginResponse.token);
            setAuthUser(loginResponse.user);
            
            setSuccessMessage('비밀번호가 변경되고 자동으로 재로그인되었습니다! 🎉');
            setShowPasswordSection(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswords({ current: false, new: false, confirm: false });
            
            // 성공 메시지 표시 후 모달 자동 닫기
            setTimeout(() => {
              onClose();
            }, 2000);
          } else {
            setPasswordError('비밀번호는 변경되었지만 자동 로그인에 실패했습니다. 수동으로 다시 로그인해주세요.');
          }
        } catch (loginError) {
          console.error('자동 재로그인 실패:', loginError);
          setPasswordError('비밀번호는 변경되었지만 자동 로그인에 실패했습니다. 수동으로 다시 로그인해주세요.');
        }
      } else {
        setPasswordError(response.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('비밀번호 변경 오류:', err);
      setPasswordError(err.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditedUser({ ...user });
    }
    setIsEditing(false);
    setShowPasswordSection(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswords({ current: false, new: false, confirm: false });
    setError(null);
    setSuccessMessage(null);
    setPasswordError(null);
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: { [key: string]: { label: string; color: string } } = {
      admin: { label: '관리자', color: 'bg-red-100 text-red-700 border-red-200' },
      manager: { label: '매니저', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      driver: { label: '기사', color: 'bg-green-100 text-green-700 border-green-200' },
      user: { label: '파트너사', color: 'bg-gray-100 text-gray-700 border-gray-200' }
    };
    return roleMap[role] || { label: role, color: 'bg-gray-100 text-gray-700 border-gray-200' };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('ko-KR');
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">사용자 프로필</h2>
                <p className="text-sm text-gray-500">
                  {user?.name ? `${user.name} (${user.username})` : '사용자 정보'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {!isEditing && user && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    편집
                  </button>
                  <button
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    비밀번호 변경
                  </button>
                </>
              )}
              
              {isEditing && (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                </>
              )}
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Status Messages */}
          {error && (
            <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-lg text-green-700">
              {successMessage}
            </div>
          )}

          {passwordError && (
            <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700">
              {passwordError}
            </div>
          )}

          {/* Password Change Section */}
          {showPasswordSection && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5" />
                비밀번호 변경
              </h4>
              
              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    현재 비밀번호
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
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
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="새 비밀번호를 입력하세요 (최소 6자)"
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
                      type={showPasswords.confirm ? "text" : "password"}
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
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : user && editedUser ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    기본 정보
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        사용자 ID
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedUser.username || ''}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                          {user.username || '-'}
                        </p>
                      )}
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        이름
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedUser.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                          {user.name || '-'}
                        </p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        권한
                      </label>
                      {isEditing ? (
                        <select
                          value={editedUser.role || 'user'}
                          onChange={(e) => handleInputChange('role', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="user">파트너사</option>
                          <option value="driver">기사</option>
                          <option value="manager">매니저</option>
                          <option value="admin">관리자</option>
                        </select>
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-lg">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleDisplay(user.role).color}`}>
                            {getRoleDisplay(user.role).label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Active Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        활성 상태
                      </label>
                      {isEditing ? (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editedUser.is_active !== false}
                            onChange={(e) => handleInputChange('is_active', e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label className="ml-2 text-sm text-gray-700">활성</label>
                        </div>
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-lg">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            user.is_active !== false 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {user.is_active !== false ? '활성' : '비활성'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    연락처 정보
                  </h3>
                  
                  <div className="space-y-4">
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
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                          {user.email || '-'}
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
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                          {user.phone || '-'}
                        </p>
                      )}
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        비상연락처
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedUser.emergency_contact || ''}
                          onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                          {user.emergency_contact || '-'}
                        </p>
                      )}
                    </div>

                    {/* Emergency Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        비상연락처 전화번호
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editedUser.emergency_phone || ''}
                          onChange={(e) => handleInputChange('emergency_phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                          {user.emergency_phone || '-'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Company & Address Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    회사 정보
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Company */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        회사명
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedUser.company || ''}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                          {user.company || '-'}
                        </p>
                      )}
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        부서
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedUser.department || ''}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                          {user.department || '-'}
                        </p>
                      )}
                    </div>

                    {/* Position */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        직급
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedUser.position || ''}
                          onChange={(e) => handleInputChange('position', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                          {user.position || '-'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    주소 정보
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        주소
                      </label>
                      {isEditing ? (
                        <textarea
                          value={editedUser.address || ''}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 whitespace-pre-wrap">
                          {user.address || '-'}
                        </p>
                      )}
                    </div>

                    {/* Default Sender Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        기본 발송지 주소
                      </label>
                      {isEditing ? (
                        <textarea
                          value={editedUser.default_sender_address || ''}
                          onChange={(e) => handleInputChange('default_sender_address', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 whitespace-pre-wrap">
                          {user.default_sender_address || '-'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    추가 정보
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        메모
                      </label>
                      {isEditing ? (
                        <textarea
                          value={editedUser.notes || ''}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="사용자 관련 메모를 입력하세요..."
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 whitespace-pre-wrap">
                          {user.notes || '-'}
                        </p>
                      )}
                    </div>

                    {/* System Information (Read-only) */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        시스템 정보
                      </h4>
                      
                      <div className="grid grid-cols-1 gap-3 text-sm">
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
                </div>
              </div>
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