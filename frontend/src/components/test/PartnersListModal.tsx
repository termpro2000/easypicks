import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Building, 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Search,
  RefreshCw
} from 'lucide-react';
import { testAPI } from '../../services/api';

interface Partner {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  is_active: boolean;
  default_sender_name: string;
  default_sender_company: string;
  default_sender_phone: string;
  default_sender_address: string;
  created_at: string;
}

interface PartnersListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PartnersListModal: React.FC<PartnersListModalProps> = ({ isOpen, onClose }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadPartners = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await testAPI.getPartnersList();
      setPartners(result.partners || []);
    } catch (error: any) {
      setError(error.response?.data?.message || '파트너사 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPartners();
    }
  }, [isOpen]);

  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">파트너사 목록</h2>
            {!isLoading && (
              <span className="text-sm text-gray-500">({filteredPartners.length}개)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadPartners}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              title="새로고침"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="px-6 py-4 border-b bg-white">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="이름, 회사명, 사용자명, 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-600">파트너사 목록을 불러오는 중...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={loadPartners}
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? '검색 결과가 없습니다.' : '파트너사가 없습니다.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredPartners.map((partner) => (
                <div key={partner.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-500" />
                      <h3 className="font-semibold text-gray-900">{partner.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {partner.is_active ? (
                        <CheckCircle className="w-4 h-4 text-green-500" title="활성" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" title="비활성" />
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(partner.role)}`}>
                        {partner.role === 'user' ? '사용자' : partner.role === 'manager' ? '관리자' : '최고관리자'}
                      </span>
                    </div>
                  </div>

                  {/* 정보 */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <span className="font-medium">{partner.company}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>@{partner.username}</span>
                    </div>

                    {partner.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-xs">{partner.email}</span>
                      </div>
                    )}

                    {partner.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{partner.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">{formatDate(partner.created_at)}</span>
                    </div>
                  </div>

                  {/* 기본 발송 정보 */}
                  {(partner.default_sender_address) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">기본 발송 정보:</p>
                      <p className="text-xs text-gray-600 truncate" title={partner.default_sender_address}>
                        {partner.default_sender_address}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnersListModal;