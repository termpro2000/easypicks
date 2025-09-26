import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, Eye, EyeOff, ArrowLeft, Building, UserPlus, CheckCircle, XCircle, Sparkles, Zap, Navigation, Mail, Phone } from 'lucide-react';
import { userAPI, testAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import UserEditForm from './UserEditForm';
import PartnerForm from './PartnerForm';

interface User {
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


interface UserManagementProps {
  onNavigateBack: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onNavigateBack }) => {
  const { user: currentUser } = useAuth();
  
  // 화면 상태 관리
  const [currentView, setCurrentView] = useState<'list' | 'edit' | 'partner-form'>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // 사용자 관련 상태
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  
  
  // 공통 상태
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 편집 함수들
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setCurrentView('edit');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedUser(null);
    fetchUsers(); // 목록 새로고침
  };

  const handleCreatePartner = () => {
    setCurrentView('partner-form');
  };

  const handlePartnerFormSuccess = () => {
    setCurrentView('list');
    fetchUsers(); // 목록 새로고침
  };

  // 파트너사 전용 폼 상태 (user 테이블의 필요한 필드만)
  const [partnerFormData, setPartnerFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    role: 'user', // 파트너사로 고정
    is_active: true,
    default_sender_address: '',
    default_sender_detail_address: '',
    default_sender_zipcode: ''
  });
  const [showPartnerPassword, setShowPartnerPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // 테스트페이지와 같은 API 사용 (잘 작동하는 것으로 확인됨)
      const response = await testAPI.getPartnersList();
      
      console.log('🔍 파트너사 목록 응답:', response);
      
      // testAPI 응답 구조에 맞게 조정
      let usersList = response.partners || [];
      
      // role이 'user'인 사용자만 필터링 (기본값)
      usersList = usersList.filter((user: any) => user.role === 'user');
      
      // 검색 필터링 (클라이언트 사이드)
      if (searchTerm) {
        usersList = usersList.filter((user: any) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // 추가 역할 필터링 (클라이언트 사이드) - user로 이미 제한되어 있지만 추가 필터링 가능
      if (roleFilter) {
        usersList = usersList.filter((user: any) => user.role === roleFilter);
      }
      
      setUsers(usersList);
      console.log('✅ 파트너사 목록 설정 완료:', usersList.length + '개');
      
    } catch (error: any) {
      console.error('❌ 파트너사 목록 조회 실패:', error);
      showNotification('error', '파트너사 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUserSearch = () => {
    setSearchTerm(searchInput);
  };


  const handleUserSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUserSearch();
    }
  };


  const resetPartnerForm = () => {
    setPartnerFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      company: '',
      role: 'user',
      is_active: true,
      default_sender_address: '',
      default_sender_detail_address: '',
      default_sender_zipcode: ''
    });
    setShowPartnerPassword(false);
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('UserManagement: 파트너사 등록 시작');
      
      // 파트너사 데이터 생성 (삭제된 필드 제외)
      const response = await userAPI.createUser({
        username: partnerFormData.username,
        password: partnerFormData.password,
        name: partnerFormData.name,
        email: partnerFormData.email || undefined,
        phone: partnerFormData.phone || undefined,
        company: partnerFormData.company || undefined,
        role: 'user', // 파트너사로 설정
        default_sender_address: partnerFormData.default_sender_address || undefined,
        default_sender_detail_address: partnerFormData.default_sender_detail_address || undefined,
        default_sender_zipcode: partnerFormData.default_sender_zipcode || undefined
      });
      
      console.log('UserManagement: API 응답:', response);
      
      if (response && response.success) {
        showNotification('success', '파트너사가 성공적으로 등록되었습니다.');
        setShowPartnerModal(false);
        resetPartnerForm();
        fetchUsers();
      } else {
        showNotification('error', response?.message || '파트너사 등록에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('파트너사 등록 실패:', error);
      showNotification('error', '파트너사 등록 중 오류가 발생했습니다.');
    }
  };

  // UserEditForm에서 성공 시 호출될 함수
  const handleEditSuccess = () => {
    showNotification('success', '파트너사 정보가 성공적으로 업데이트되었습니다.');
    handleBackToList();
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`정말로 "${user.name}" 사용자를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await userAPI.deleteUser(user.id);
      showNotification('success', '사용자가 성공적으로 삭제되었습니다.');
      fetchUsers();
    } catch (error: any) {
      console.error('사용자 삭제 실패:', error);
      showNotification('error', error.response?.data?.message || '사용자 삭제에 실패했습니다.');
    }
  };


  const getRoleBadge = (role: string) => {
    const config = {
      admin: { color: 'bg-red-100 text-red-800', text: '관리자' },
      manager: { color: 'bg-blue-100 text-blue-800', text: '매니저' },
      user: { color: 'bg-gray-100 text-gray-800', text: '파트너사' },
      driver: { color: 'bg-green-100 text-green-800', text: '기사' }
    };
    
    const { color, text } = config[role as keyof typeof config] || config.user;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {text}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? '활성' : '비활성'}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // PartnerForm 화면 렌더링
  if (currentView === 'partner-form') {
    return (
      <PartnerForm 
        onNavigateBack={handleBackToList}
        onSuccess={handlePartnerFormSuccess}
      />
    );
  }

  // UserEditForm 화면 렌더링
  if (currentView === 'edit' && selectedUser) {
    return (
      <UserEditForm 
        user={selectedUser} 
        onNavigateBack={handleBackToList}
        onSuccess={handleEditSuccess}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">파트너사 목록을 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      {/* 알림 메시지 */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* 뒤로가기 버튼 */}
      <div className="mb-6">
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-white/60 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">돌아가기</span>
        </button>
      </div>

      {/* 미니멀 헤더 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 mb-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">파트너사 관리</h1>
            <p className="text-blue-100 opacity-90">파트너사 사용자를 관리합니다</p>
          </div>
          <button
            onClick={handleCreatePartner}
            className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition-colors backdrop-blur-sm border border-white/20"
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              <span className="font-semibold">파트너사 등록</span>
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
              placeholder="파트너사명, 사용자명, 담당자명으로 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleUserSearchKeyPress}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-colors"
            />
          </div>
          <button
            onClick={handleUserSearch}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors font-medium"
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
              <div className="text-2xl font-bold text-slate-800">{users.length}</div>
              <div className="text-slate-600 text-sm">전체 파트너사</div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {users.filter(u => u.is_active !== false).length}
              </div>
              <div className="text-slate-600 text-sm">활성 파트너사</div>
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
                {users.filter(u => u.is_active === false).length}
              </div>
              <div className="text-slate-600 text-sm">비활성 파트너사</div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* 미니멀 파트너사 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">파트너사 목록</h2>
            <span className="text-sm text-slate-500">{users.length}개</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">파트너사 목록을 불러오는 중...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-4">
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 파트너사가 없습니다.'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreatePartner}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  <span>첫 번째 파트너사 등록하기</span>
                </div>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700">파트너사 정보</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700">로그인 ID</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700">연락처</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700">상태</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-slate-700">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{user.name}</div>
                          {user.company && (
                            <div className="text-slate-600 text-sm">{user.company}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-700 font-mono text-sm">@{user.username}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {user.phone && (
                          <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <Phone className="w-4 h-4" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {user.email && (
                          <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                        )}
                        {!user.phone && !user.email && (
                          <span className="text-slate-400 text-sm">연락처 미등록</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_active !== false 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.is_active !== false ? '활성' : '비활성'}
                        </span>
                        <div className="text-xs text-slate-500">
                          {user.last_login ? formatDate(user.last_login) : '미로그인'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="편집"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {currentUser?.role === 'admin' && currentUser.id !== user.id && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* 파트너사 등록 모달 */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowPartnerModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleCreatePartner}>
                <div className="bg-white px-6 py-4 max-h-[80vh] overflow-y-auto">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">파트너사 등록</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID(영문) *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={partnerFormData.username}
                        onChange={(e) => setPartnerFormData({ ...partnerFormData, username: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 *</label>
                      <div className="relative">
                        <input
                          type={showPartnerPassword ? 'text' : 'password'}
                          required
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={partnerFormData.password}
                          onChange={(e) => setPartnerFormData({ ...partnerFormData, password: e.target.value })}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPartnerPassword(!showPartnerPassword)}
                        >
                          {showPartnerPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">파트너사(업체명) *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={partnerFormData.name}
                        onChange={(e) => setPartnerFormData({ ...partnerFormData, name: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={partnerFormData.email}
                        onChange={(e) => setPartnerFormData({ ...partnerFormData, email: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={partnerFormData.phone}
                        onChange={(e) => setPartnerFormData({ ...partnerFormData, phone: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">담당자이름</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={partnerFormData.company}
                        onChange={(e) => setPartnerFormData({ ...partnerFormData, company: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="주소를 검색해주세요"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={partnerFormData.default_sender_address}
                          readOnly
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (window.daum && window.daum.Postcode) {
                              new window.daum.Postcode({
                                oncomplete: function(data: any) {
                                  setPartnerFormData({
                                    ...partnerFormData,
                                    default_sender_address: data.address,
                                    default_sender_zipcode: data.zonecode
                                  });
                                }
                              }).open();
                            } else {
                              alert('주소 검색 서비스를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
                            }
                          }}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 whitespace-nowrap"
                        >
                          주소검색
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">상세주소</label>
                        <input
                          type="text"
                          placeholder="상세주소를 입력해주세요"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={partnerFormData.default_sender_detail_address}
                          onChange={(e) => setPartnerFormData({ ...partnerFormData, default_sender_detail_address: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">우편번호</label>
                        <input
                          type="text"
                          placeholder="우편번호"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={partnerFormData.default_sender_zipcode}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={partnerFormData.is_active}
                        onChange={(e) => setPartnerFormData({ ...partnerFormData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">계정 활성화</span>
                    </label>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPartnerModal(false)}
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
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-xs text-slate-500">
          <Building className="w-3 h-3" />
          UserManagement.tsx
        </div>
      </div>
    </div>
  );
};

export default UserManagement;