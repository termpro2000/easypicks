import React, { useState, useEffect } from 'react';
import { Search, X, Building, User, Phone, MapPin } from 'lucide-react';
import { userAPI } from '../../services/api';

interface Company {
  id: string;
  username: string;
  name: string;
  company?: string;
  phone?: string;
  default_sender_name?: string;
  default_sender_company?: string;
  default_sender_phone?: string;
  default_sender_address?: string;
  default_sender_detail_address?: string;
  default_sender_zipcode?: string;
}

interface CompanySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCompany: (company: Company) => void;
}

const CompanySelectionModal: React.FC<CompanySelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectCompany
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 회사 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  // 검색 필터링
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company =>
        company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.default_sender_company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [searchQuery, companies]);

  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      // 모든 사용자 조회 (페이지네이션 없이 대량 조회)
      const response = await userAPI.getAllUsers(1, 100);
      console.log('API Response:', response); // 디버깅용
      
      if (response.users) {
        // 회사 정보가 있는 사용자만 필터링
        const companiesWithInfo = response.users.filter((user: Company) => 
          user.company || user.default_sender_company
        );
        console.log('Filtered companies:', companiesWithInfo); // 디버깅용
        setCompanies(companiesWithInfo);
        setFilteredCompanies(companiesWithInfo);
      }
    } catch (error) {
      console.error('회사 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCompany = (company: Company) => {
    onSelectCompany(company);
    onClose();
    setSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-600" />
            발송업체 선택
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* 검색 섹션 */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="회사명, 담당자명, 아이디로 검색..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 회사 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">업체 목록을 불러오는 중...</span>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">검색된 업체가 없습니다</p>
              <p className="text-sm mt-2">다른 검색어로 시도해보세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  onClick={() => handleSelectCompany(company)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {company.default_sender_company || company.company || '업체명 없음'}
                        </h3>
                        <p className="text-sm text-gray-500">@{company.username}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {company.default_sender_name || company.name || '담당자명 없음'}
                      </span>
                    </div>

                    {(company.default_sender_phone || company.phone) && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">
                          {company.default_sender_phone || company.phone}
                        </span>
                      </div>
                    )}

                    {company.default_sender_address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 text-xs">
                          {company.default_sender_address}
                          {company.default_sender_detail_address && 
                            `, ${company.default_sender_detail_address}`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button className="w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                      선택하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {filteredCompanies.length}개의 업체가 검색되었습니다
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanySelectionModal;