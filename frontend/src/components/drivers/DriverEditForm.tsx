import React, { useState, useEffect } from 'react';
import { User, X, Edit3, Save, Eye, EyeOff, Key, Shield, Calendar, Check, AlertCircle, Building, Phone, MapPin, Truck, Mail, Home, FileText, ArrowLeft } from 'lucide-react';
import { userAPI, authAPI, userDetailAPI } from '../../services/api';

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

interface DriverEditFormProps {
  driver: Driver;
  onNavigateBack: () => void;
  onSuccess: () => void;
}

const DriverEditForm: React.FC<DriverEditFormProps> = ({
  driver: initialDriver,
  onNavigateBack,
  onSuccess
}) => {
  const [driver, setDriver] = useState<Driver>(initialDriver);
  const [editedDriver, setEditedDriver] = useState<Driver>({ ...initialDriver });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // User detail 상태
  const [userDetail, setUserDetail] = useState<any>(null);
  const [editedUserDetail, setEditedUserDetail] = useState<any>({});

  // Role별 색상 톤 시스템 (2025 트렌드) - driver만 표시
  const getRoleColorScheme = (role: string) => {
    if (role !== 'DRIVER' && role !== 'driver') {
      return null; // driver가 아니면 null 반환
    }
    
    return {
      primary: '#f97316',
      secondary: '#ea580c',
      background: '#fff7ed',
      border: '#fdba74',
      text: '#9a3412',
      icon: '#ea580c',
      badge: 'bg-orange-100 text-orange-800'
    };
  };

  const colorScheme = getRoleColorScheme(driver?.role || 'driver');
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

  // role이 driver가 아니면 컴포넌트를 렌더링하지 않음
  if (!colorScheme) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">접근 권한 없음</h2>
          <p className="text-gray-600 mb-4">이 기능은 기사 역할의 사용자만 사용할 수 있습니다.</p>
          <button 
            onClick={onNavigateBack}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (driver?.id) {
      loadUserDetail();
    }
  }, [driver?.id]);

  const loadUserDetail = async () => {
    try {
      setIsLoadingDetail(true);
      const response = await userDetailAPI.getUserDetail(driver.id);
      setUserDetail(response.detail);
      setEditedUserDetail({ ...response.detail });
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
    setEditedDriver({ ...driver });
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

      // 기본 사용자 정보 업데이트
      const response = await userAPI.updateUser(driver.id, editedDriver);
      
      // User detail 업데이트 (있는 경우만)
      if (editedUserDetail && Object.keys(editedUserDetail).length > 0) {
        try {
          await userDetailAPI.updateUserDetail(driver.id, editedUserDetail);
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

      setDriver(editedDriver);
      setUserDetail(editedUserDetail);
      setIsEditing(false);
      setSuccessMessage('기사 정보가 성공적으로 업데이트되었습니다.');
      setShowPasswordSection(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // 상위 컴포넌트에 성공 알림
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (error: any) {
      console.error('기사 정보 업데이트 실패:', error);
      setError(error.response?.data?.message || '기사 정보 업데이트에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 p-8">
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 p-8 mb-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={onNavigateBack}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="relative">
              <div 
                className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
                style={{ backgroundColor: colorScheme.primary }}
              >
                <Truck className="w-10 h-10 text-white" />
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
                기사 정보 수정
              </h1>
              <p className="text-gray-600 text-lg">{driver.name} 기사의 정보를 수정합니다</p>
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
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: colorScheme.text }}>
                  기사 프로필
                </h2>
                <p className="text-gray-600">기본 정보 및 계정 설정</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${colorScheme.badge}`}>
              {driver.role || 'DRIVER'}
            </span>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4" style={{ color: colorScheme.icon }} />
                이름
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedDriver.name || ''}
                  onChange={(e) => setEditedDriver({ ...editedDriver, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                  style={{ 
                    focusRingColor: colorScheme.secondary,
                    '--tw-ring-color': colorScheme.secondary 
                  } as any}
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                  {driver.name}
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
                  value={editedDriver.username || ''}
                  onChange={(e) => setEditedDriver({ ...editedDriver, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                  style={{ 
                    focusRingColor: colorScheme.secondary,
                    '--tw-ring-color': colorScheme.secondary 
                  } as any}
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                  {driver.username}
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
                  value={editedDriver.phone || ''}
                  onChange={(e) => setEditedDriver({ ...editedDriver, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                  placeholder="010-0000-0000"
                  style={{ 
                    focusRingColor: colorScheme.secondary,
                    '--tw-ring-color': colorScheme.secondary 
                  } as any}
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                  {driver.phone || '미등록'}
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
                  value={editedDriver.email || ''}
                  onChange={(e) => setEditedDriver({ ...editedDriver, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-blue-400 transition-all"
                  placeholder="example@email.com"
                  style={{ 
                    focusRingColor: colorScheme.secondary,
                    '--tw-ring-color': colorScheme.secondary 
                  } as any}
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                  {driver.email || '미등록'}
                </div>
              )}
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
                    driver.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {driver.is_active !== false ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
              
              {driver.last_login && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">최근 로그인</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 font-medium">
                    {new Date(driver.last_login).toLocaleString('ko-KR')}
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
                className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4 hover:text-orange-600 transition-colors"
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
          DriverEditForm.tsx
        </div>
      </div>
    </div>
  );
};

export default DriverEditForm;