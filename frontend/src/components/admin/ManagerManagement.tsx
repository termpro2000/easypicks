import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, Eye, EyeOff, ArrowLeft, Shield, UserCog, Settings } from 'lucide-react';
import { userAPI, testAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import ManagerForm from './ManagerForm';

interface Manager {
  id: number;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role: 'admin' | 'manager' | 'user' | 'driver';
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  default_sender_address?: string;
  default_sender_detail_address?: string;
  default_sender_zipcode?: string;
}

interface ManagerManagementProps {
  onNavigateBack: () => void;
}

const ManagerManagement: React.FC<ManagerManagementProps> = ({ onNavigateBack }) => {
  const { user: currentUser } = useAuth();
  
  // 화면 상태 관리
  const [currentView, setCurrentView] = useState<'list' | 'manager-form'>('list');
  
  // 매니저 관련 상태
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  
  // 공통 상태
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 편집용 폼 상태
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    role: 'manager',
    is_active: true,
    default_sender_address: '',
    default_sender_detail_address: '',
    default_sender_zipcode: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // 매니저 전용 폼 상태
  const [managerFormData, setManagerFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    role: 'manager', // 매니저로 고정
    is_active: true,
    default_sender_address: '',
    default_sender_detail_address: '',
    default_sender_zipcode: ''
  });
  const [showManagerPassword, setShowManagerPassword] = useState(false);

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      // 파트너 관리 폼과 같은 API 사용
      const response = await testAPI.getPartnersList();
      
      console.log('🔍 매니저 목록 응답:', response);
      
      // testAPI 응답 구조에 맞게 조정
      let managersList = response.partners || [];
      
      // role이 'manager'인 사용자만 필터링
      managersList = managersList.filter((user: any) => user.role === 'manager');
      
      // 검색 필터링 (클라이언트 사이드)
      if (searchTerm) {
        managersList = managersList.filter((manager: any) =>
          manager.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          manager.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          manager.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          manager.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setManagers(managersList);
      console.log('✅ 매니저 목록 설정 완료:', managersList.length + '개');
      
    } catch (error: any) {
      console.error('❌ 매니저 목록 조회 실패:', error);
      showNotification('error', '매니저 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [searchTerm]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateManager = () => {
    setCurrentView('manager-form');
  };

  const handleManagerFormSuccess = () => {
    setCurrentView('list');
    fetchManagers(); // 목록 새로고침
  };

  const handleBackToList = () => {
    setCurrentView('list');
  };

  const handleManagerSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleManagerSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManagerSearch();
    }
  };

  const resetManagerForm = () => {
    setManagerFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      company: '',
      role: 'manager',
      is_active: true,
      default_sender_address: '',
      default_sender_detail_address: '',
      default_sender_zipcode: ''
    });
    setShowManagerPassword(false);
  };

  const handleCreateManagerModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('ManagerManagement: 매니저 등록 시작');
      
      // 매니저 데이터 생성
      const response = await userAPI.createUser({
        username: managerFormData.username,
        password: managerFormData.password,
        name: managerFormData.name,
        email: managerFormData.email || undefined,
        phone: managerFormData.phone || undefined,
        company: managerFormData.company || undefined,
        role: 'manager', // 매니저로 설정
        default_sender_address: managerFormData.default_sender_address || undefined,
        default_sender_detail_address: managerFormData.default_sender_detail_address || undefined,
        default_sender_zipcode: managerFormData.default_sender_zipcode || undefined
      });
      
      console.log('ManagerManagement: API 응답:', response);
      
      if (response && response.success) {
        showNotification('success', '매니저가 성공적으로 등록되었습니다.');
        setShowManagerModal(false);
        resetManagerForm();
        fetchManagers();
      } else {
        showNotification('error', response?.message || '매니저 등록에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('매니저 등록 실패:', error);
      showNotification('error', '매니저 등록 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManager) return;

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        is_active: formData.is_active,
        default_sender_address: formData.default_sender_address || undefined,
        default_sender_detail_address: formData.default_sender_detail_address || undefined,
        default_sender_zipcode: formData.default_sender_zipcode || undefined
      };

      if (currentUser?.role === 'admin') {
        updateData.role = formData.role;
      }

      if (formData.password) {
        updateData.password = formData.password;
      }

      await userAPI.updateUser(selectedManager.id, updateData);
      
      showNotification('success', '매니저 정보가 성공적으로 업데이트되었습니다.');
      setShowEditModal(false);
      setSelectedManager(null);
      fetchManagers();
    } catch (error: any) {
      console.error('매니저 업데이트 실패:', error);
      showNotification('error', error.response?.data?.message || '매니저 업데이트에 실패했습니다.');
    }
  };

  const handleDeleteManager = async (manager: Manager) => {
    if (!window.confirm(`정말로 "${manager.name}" 매니저를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await userAPI.deleteUser(manager.id);
      showNotification('success', '매니저가 성공적으로 삭제되었습니다.');
      fetchManagers();
    } catch (error: any) {
      console.error('매니저 삭제 실패:', error);
      showNotification('error', error.response?.data?.message || '매니저 삭제에 실패했습니다.');
    }
  };

  const openEditModal = (manager: Manager) => {
    setSelectedManager(manager);
    setFormData({
      username: manager.username,
      password: '',
      name: manager.name,
      email: manager.email || '',
      phone: manager.phone || '',
      company: manager.company || '',
      role: manager.role,
      is_active: manager.is_active,
      default_sender_address: manager.default_sender_address || '',
      default_sender_detail_address: manager.default_sender_detail_address || '',
      default_sender_zipcode: manager.default_sender_zipcode || ''
    });
    setShowEditModal(true);
  };

  const getRoleBadge = (role: string) => {
    const config = {
      admin: { color: 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg', text: '관리자' },
      manager: { color: 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg', text: '매니저' },
      user: { color: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-lg', text: '파트너사' },
      driver: { color: 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg', text: '기사' }
    };
    
    const { color, text } = config[role as keyof typeof config] || config.manager;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-2xl text-xs font-semibold ${color}`}>
        {text}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-2xl text-xs font-semibold shadow-md ${
        isActive 
          ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white' 
          : 'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
      }`}>
        {isActive ? '활성' : '비활성'}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // ManagerForm 화면 렌더링
  if (currentView === 'manager-form') {
    return (
      <ManagerForm 
        onNavigateBack={handleBackToList}
        onSuccess={handleManagerFormSuccess}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Settings className="w-8 h-8 text-white animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">매니저 목록을 로딩 중...</h3>
          <p className="text-slate-500">잠시만 기다려주세요</p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      {/* 알림 메시지 - Neumorphic 스타일 */}
      {notification && (
        <div className={`fixed top-8 right-8 z-50 p-6 rounded-2xl shadow-lg backdrop-blur-sm border ${
          notification.type === 'success' 
            ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200 shadow-emerald-100/50' 
            : 'bg-rose-50/90 text-rose-800 border-rose-200 shadow-rose-100/50'
        } animate-in slide-in-from-top-5`}>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* 헤더 - Neumorphic 카드 */}
      <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
        <div className="flex items-center justify-between mb-8">
          {/* 뒤로가기 버튼 - Neumorphic 스타일 */}
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-3 px-6 py-3 bg-white/60 backdrop-blur-sm text-slate-700 hover:text-slate-900 rounded-2xl shadow-lg hover:shadow-xl border border-white/30 transition-all duration-300 hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">돌아가기</span>
          </button>
          
          {/* 중앙 제목 */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                매니저 관리
              </h2>
              <p className="text-slate-600 font-medium mt-1">시스템 매니저를 관리합니다</p>
            </div>
          </div>
          
          {/* 매니저 등록 버튼 - Neumorphic 스타일 */}
          <button
            onClick={handleCreateManager}
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-semibold">매니저 등록</span>
          </button>
        </div>

        {/* 검색 - Neumorphic 스타일 */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative flex bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="매니저명, 이름, 부서명으로 검색..."
                  className="w-full pl-12 pr-4 py-4 bg-transparent focus:outline-none text-slate-700 placeholder-slate-400 font-medium"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleManagerSearchKeyPress}
                />
              </div>
              <button
                onClick={handleManagerSearch}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
              >
                검색
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 매니저 목록 - Neumorphic 카드 그리드 */}
      <div className="space-y-6">
        {managers.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">등록된 매니저가 없습니다</h3>
            <p className="text-slate-500">새 매니저를 등록하여 시작하세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managers.map((manager) => (
              <div
                key={manager.id}
                className="group bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105"
              >
                {/* 매니저 아바타와 정보 */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <span className="text-white font-bold text-xl">
                        {manager.name?.charAt(0) || 'M'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{manager.name}</h3>
                      <p className="text-slate-500 font-medium">@{manager.username}</p>
                      {manager.company && (
                        <p className="text-sm text-slate-400 mt-1">{manager.company}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* 상태 배지 */}
                  <div className="flex flex-col items-end gap-2">
                    {getRoleBadge(manager.role)}
                    {getStatusBadge(manager.is_active)}
                  </div>
                </div>

                {/* 세부 정보 */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-slate-600">
                      최근 로그인: {manager.last_login ? formatDate(manager.last_login) : '기록 없음'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-slate-600">
                      가입일: {formatDate(manager.created_at)}
                    </span>
                  </div>
                  {manager.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-slate-600">{manager.email}</span>
                    </div>
                  )}
                  {manager.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="text-slate-600">{manager.phone}</span>
                    </div>
                  )}
                </div>

                {/* 액션 버튼들 */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEditModal(manager)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-500/20 transition-all duration-200 font-medium"
                      title="편집"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm">편집</span>
                    </button>
                    
                    {currentUser?.role === 'admin' && currentUser.id !== manager.id && (
                      <button
                        onClick={() => handleDeleteManager(manager)}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-600 rounded-xl hover:bg-rose-500/20 transition-all duration-200 font-medium"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">삭제</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <UserCog className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 매니저 편집 모달 */}
      {showEditModal && selectedManager && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowEditModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleUpdateManager}>
                <div className="bg-white px-6 py-4 max-h-[80vh] overflow-y-auto">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">매니저 편집: {selectedManager.name}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID(영문)</label>
                      <input
                        type="text"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        value={formData.username}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 (비워두면 변경하지 않음)</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">매니저명 *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">부서/직책</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  {currentUser?.role === 'admin' && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                          <option value="manager">매니저</option>
                          <option value="admin">관리자</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          />
                          <span className="ml-2 text-sm text-gray-700">계정 활성화</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 매니저 등록 모달 */}
      {showManagerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowManagerModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleCreateManagerModal}>
                <div className="bg-white px-6 py-4 max-h-[80vh] overflow-y-auto">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">매니저 등록</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID(영문) *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={managerFormData.username}
                        onChange={(e) => setManagerFormData({ ...managerFormData, username: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 *</label>
                      <div className="relative">
                        <input
                          type={showManagerPassword ? 'text' : 'password'}
                          required
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={managerFormData.password}
                          onChange={(e) => setManagerFormData({ ...managerFormData, password: e.target.value })}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowManagerPassword(!showManagerPassword)}
                        >
                          {showManagerPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">매니저명 *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={managerFormData.name}
                        onChange={(e) => setManagerFormData({ ...managerFormData, name: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={managerFormData.email}
                        onChange={(e) => setManagerFormData({ ...managerFormData, email: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={managerFormData.phone}
                        onChange={(e) => setManagerFormData({ ...managerFormData, phone: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">부서/직책</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={managerFormData.company}
                        onChange={(e) => setManagerFormData({ ...managerFormData, company: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={managerFormData.is_active}
                        onChange={(e) => setManagerFormData({ ...managerFormData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">계정 활성화</span>
                    </label>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowManagerModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    확인
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 파일명 표시 */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20 text-xs text-slate-400">
          <Settings className="w-3 h-3" />
          <span>ManagerManagement.tsx</span>
        </div>
      </div>
    </div>
  );
};

export default ManagerManagement;