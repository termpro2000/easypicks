import React, { useState, useEffect } from 'react';
import { Building, Search, Users, ArrowRight } from 'lucide-react';
import { userAPI } from '../../services/api';

interface Partner {
  id: number;
  username: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  address?: string;
  role: string;
}

interface SelectPartnerFormProps {
  onNavigateBack: () => void;
  onPartnerSelect: (partnerId: number, partnerName: string) => void;
}

const SelectPartnerForm: React.FC<SelectPartnerFormProps> = ({ onNavigateBack, onPartnerSelect }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all');

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    filterPartners();
  }, [partners, searchTerm, filterOption]);

  const loadPartners = async () => {
    setIsLoading(true);
    try {
      const response = await userAPI.getAllUsers();
      const partnerUsers = response.users?.filter((user: Partner) => user.role === 'partner') || [];
      setPartners(partnerUsers);
    } catch (error) {
      console.error('파트너 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPartners = () => {
    let filtered = [...partners];

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(partner => 
        partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (partner.company && partner.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (partner.email && partner.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 추가 필터 옵션 (향후 확장 가능)
    if (filterOption === 'active') {
      // 활성 파트너만 (추후 구현)
      filtered = filtered;
    }

    setFilteredPartners(filtered);
  };

  const handlePartnerClick = (partner: Partner) => {
    onPartnerSelect(partner.id, partner.name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-6">
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mb-4"
        >
          ← 관리자화면으로 돌아가기
        </button>
      </div>
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building className="w-7 h-7 text-blue-600" />
              파트너사 선택
            </h1>
            <p className="text-gray-600 mt-1">상품을 관리할 파트너사를 선택하세요</p>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="파트너명, 사용자명, 회사명, 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <select
                value={filterOption}
                onChange={(e) => setFilterOption(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체</option>
                <option value="active">활성 파트너</option>
              </select>
            </div>
          </div>
        </div>

        {/* 파트너 목록 */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">파트너 목록을 불러오는 중...</p>
            </div>
          ) : (
            <>
              {/* 테이블 헤더 */}
              <div className="bg-gray-50 px-6 py-3 border-b">
                <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                  <div>사용자명</div>
                  <div>파트너명</div>
                  <div>회사명</div>
                  <div>이메일</div>
                  <div>전화번호</div>
                  <div className="text-center">선택</div>
                </div>
              </div>

              {/* 테이블 본문 */}
              <div className="divide-y divide-gray-200">
                {filteredPartners.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {searchTerm ? '검색 조건에 맞는 파트너가 없습니다.' : '등록된 파트너가 없습니다.'}
                  </div>
                ) : (
                  filteredPartners.map((partner) => (
                    <div 
                      key={partner.id} 
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handlePartnerClick(partner)}
                    >
                      <div className="grid grid-cols-6 gap-4 items-center text-sm">
                        <div className="font-mono text-blue-600">{partner.username}</div>
                        <div className="font-medium text-gray-900">{partner.name}</div>
                        <div className="text-gray-600">{partner.company || '-'}</div>
                        <div className="text-gray-600">{partner.email || '-'}</div>
                        <div className="text-gray-600">{partner.phone || '-'}</div>
                        <div className="flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePartnerClick(partner);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="파트너 선택"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* 통계 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-blue-600">{filteredPartners.length}</div>
            <div className="text-sm text-gray-600">
              {searchTerm ? '검색된 파트너' : '전체 파트너'}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-green-600">
              {filteredPartners.filter(p => p.email).length}
            </div>
            <div className="text-sm text-gray-600">이메일 등록된 파트너</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-orange-600">
              {filteredPartners.filter(p => p.company).length}
            </div>
            <div className="text-sm text-gray-600">회사명 등록된 파트너</div>
          </div>
        </div>
      
        {/* 파일명 표시 */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-xs text-gray-500">
            <Users className="w-3 h-3" />
            SelectPartnerForm.tsx
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectPartnerForm;