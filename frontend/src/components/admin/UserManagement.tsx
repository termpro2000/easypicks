import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { userAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role: 'admin' | 'manager' | 'user';
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
  
  // 사용자 관련 상태
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  
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
    role: 'user',
    is_active: true,
    default_sender_address: '',
    default_sender_detail_address: '',
    default_sender_zipcode: ''
  });
  const [showPassword, setShowPassword] = useState(false);

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
      const response = await userAPI.getAllUsers(1, 50, searchTerm, roleFilter);
      setUsers(response.users || []);
    } catch (error: any) {
      console.error('사용자 목록 조회 실패:', error);
      showNotification('error', '사용자 목록을 불러오는데 실패했습니다.');
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
      // 파트너사 데이터 생성 (삭제된 필드 제외)
      await userAPI.createUser({
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
      
      showNotification('success', '파트너사가 성공적으로 등록되었습니다.');
      setShowPartnerModal(false);
      resetPartnerForm();
      fetchUsers();
    } catch (error: any) {
      console.error('파트너사 등록 실패:', error);
      showNotification('error', error.response?.data?.message || '파트너사 등록에 실패했습니다.');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

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

      await userAPI.updateUser(selectedUser.id, updateData);
      
      showNotification('success', '파트너사 정보가 성공적으로 업데이트되었습니다.');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('파트너사 업데이트 실패:', error);
      showNotification('error', error.response?.data?.message || '파트너사 업데이트에 실패했습니다.');
    }
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

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      company: user.company || '',
      role: user.role,
      is_active: user.is_active,
      default_sender_address: user.default_sender_address || '',
      default_sender_detail_address: user.default_sender_detail_address || '',
      default_sender_zipcode: user.default_sender_zipcode || ''
    });
    setShowEditModal(true);
  };

  const getRoleBadge = (role: string) => {
    const config = {
      admin: { color: 'bg-red-100 text-red-800', text: '관리자' },
      manager: { color: 'bg-blue-100 text-blue-800', text: '매니저' },
      user: { color: 'bg-gray-100 text-gray-800', text: '파트너사' }
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


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">사용자 목록을 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 알림 메시지 */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
          notification.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          {/* 뒤로가기 버튼 */}
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>돌아가기</span>
          </button>
          
          {/* 중앙 제목 */}
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">사용자 관리</h2>
              <p className="text-gray-600">시스템 사용자를 관리합니다</p>
            </div>
          </div>
          
          {/* 파트너사 등록 버튼 */}
          <button
            onClick={() => {
              resetPartnerForm();
              setShowPartnerModal(true);
            }}
            className="flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">파트너사 등록</span>
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative flex">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="사용자명, 이름, 회사명으로 검색..."
                  className="w-full pl-10 pr-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleUserSearchKeyPress}
                />
              </div>
              <button
                onClick={handleUserSearch}
                className="px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                검색
              </button>
            </div>
          </div>
          
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">모든 역할</option>
            <option value="admin">관리자</option>
            <option value="manager">매니저</option>
            <option value="user">파트너사</option>
          </select>
        </div>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  마지막 로그인
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    등록된 사용자가 없습니다.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                        {user.company && <p className="text-xs text-gray-400">{user.company}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.is_active)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.last_login ? formatDate(user.last_login) : '로그인 기록 없음'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="편집"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        {currentUser?.role === 'admin' && currentUser.id !== user.id && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 파트너사 편집 모달 */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowEditModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleUpdateUser}>
                <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">파트너사 편집: {selectedUser.name}</h3>
                  
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">파트너사(업체명) *</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">담당자이름</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
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
                          value={formData.default_sender_address}
                          readOnly
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (window.daum && window.daum.Postcode) {
                              new window.daum.Postcode({
                                oncomplete: function(data: any) {
                                  setFormData({
                                    ...formData,
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
                          value={formData.default_sender_detail_address}
                          onChange={(e) => setFormData({ ...formData, default_sender_detail_address: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">우편번호</label>
                        <input
                          type="text"
                          placeholder="우편번호"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.default_sender_zipcode}
                          readOnly
                        />
                      </div>
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
                          <option value="user">파트너사</option>
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

      {/* 파트너사 등록 모달 */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowPartnerModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleCreatePartner}>
                <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
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
      <div className="mt-4 text-xs text-gray-400 text-center">
        UserManagement.tsx
      </div>
    </div>
  );
};

export default UserManagement;