import React, { useState, useEffect } from 'react';
import { Search, Building, Phone, MapPin, X } from 'lucide-react';
import { testAPI } from '../../services/api';

interface Partner {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role: string;
  is_active: boolean;
  default_sender_address?: string;
  default_sender_detail_address?: string;
  default_sender_zipcode?: string;
  default_sender_name?: string;
  default_sender_company?: string;
  default_sender_phone?: string;
  created_at: string;
  updated_at: string;
}

interface PartnerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPartner: (partner: Partner) => void;
}

const PartnerSelectionModal: React.FC<PartnerSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectPartner
}) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 파트너사 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadPartners();
    }
  }, [isOpen]);

  // 검색 필터링
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPartners(partners);
    } else {
      const filtered = partners.filter(partner =>
        partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (partner.company && partner.company.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredPartners(filtered);
    }
  }, [searchQuery, partners]);

  const loadPartners = async () => {
    setIsLoading(true);
    try {
      const response = await testAPI.getPartnersList();
      if (response.success && response.partners) {
        // role이 'user'인 파트너사만 필터링 (admin, manager 제외)
        const userPartners = response.partners.filter(partner => 
          partner.role === 'user'
        );
        setPartners(userPartners);
        setFilteredPartners(userPartners);
        console.log('필터링된 파트너사:', userPartners.map(p => `${p.name}(${p.role})`));
      }
    } catch (error) {
      console.error('파트너사 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartnerSelect = (partner: Partner) => {
    onSelectPartner(partner);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-600" />
            파트너사 선택
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 검색 영역 */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="파트너사명, 업체명, 사용자명으로 검색..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            총 {filteredPartners.length}개의 파트너사가 검색되었습니다.
          </p>
        </div>

        {/* 파트너사 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">파트너사 목록을 불러오는 중...</span>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? '검색 결과가 없습니다.' : '등록된 파트너사가 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPartners.map((partner) => (
                <div
                  key={partner.id}
                  onClick={() => handlePartnerSelect(partner)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  {/* 파트너사 기본 정보 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Building className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {partner.name}
                        </h3>
                        <p className="text-sm text-gray-500">@{partner.username}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      partner.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {partner.is_active ? '활성' : '비활성'}
                    </span>
                  </div>

                  {/* 상세 정보 */}
                  <div className="space-y-2 text-sm">
                    {partner.company && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building className="w-4 h-4" />
                        <span>{partner.company}</span>
                      </div>
                    )}
                    {(partner.phone || partner.default_sender_phone) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{partner.default_sender_phone || partner.phone}</span>
                      </div>
                    )}
                    {(partner.default_sender_address || '주소 정보 없음') && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">
                          {partner.default_sender_address || '주소 정보 없음'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 선택 힌트 */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                      클릭하여 발송인 정보로 설정
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            파트너사를 선택하면 해당 정보가 발송인 필드에 자동으로 입력됩니다.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerSelectionModal;