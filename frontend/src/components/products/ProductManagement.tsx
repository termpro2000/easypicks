import React, { useState, useEffect } from 'react';
import { Package2, Plus, Search, Edit3, Trash2, Save, X, Building, User, ArrowLeft } from 'lucide-react';
import { productsAPI, userAPI } from '../../services/api';
import CompanySelectionModal from '../admin/CompanySelectionModal';

interface Product {
  id: number;
  partner_id?: number;
  user_id?: number;
  name: string;
  weight?: number;
  size?: string;
  cost1?: number;
  cost2?: number;
  memo?: string;
  created_at: string;
  updated_at: string;
}

interface Partner {
  id: number;
  name: string;
  code?: string;
}

interface UserOption {
  id: string;
  name: string;
  username: string;
  company?: string;
  phone?: string;
  default_sender_name?: string;
  default_sender_address?: string;
  default_sender_detail_address?: string;
  default_sender_company?: string;
  default_sender_phone?: string;
}

interface ProductManagementProps {
  onNavigateBack?: () => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ onNavigateBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  
  // 파트너사 선택 상태 (AdminDashboard에서 옮긴 기능)
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    partner_id: '',
    weight: '',
    size: '',
    cost1: '',
    cost2: '',
    memo: ''
  });

  // 상품 목록 로드 (현재는 목업 데이터)
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    console.log('[loadProducts] 상품 목록 로드 시작');
    try {
      const response = await productsAPI.getAllProducts();
      console.log('[loadProducts] API 응답:', response);
      const productsData = response.products || [];
      console.log('[loadProducts] 추출된 상품 데이터:', productsData);
      console.log('[loadProducts] 상품 개수:', productsData.length);
      
      setProducts(productsData);
    } catch (error) {
      console.error('[loadProducts] 상품 목록 로드 실패:', error);
      // 에러 발생시 테스트 데이터 추가
      const testProducts = [
        { id: 1, name: '테스트 상품 1', weight: 1.5, size: '10x10x10', partner_id: 1, user_id: 1, memo: '테스트용 상품입니다' },
        { id: 2, name: '테스트 상품 2', weight: 2.0, size: '20x20x20', partner_id: 2, user_id: 1, memo: '또 다른 테스트 상품' },
        { id: 3, name: '다른 사용자 상품', weight: 3.0, size: '30x30x30', partner_id: 1, user_id: 2, memo: '사용자2의 상품' }
      ];
      console.log('[loadProducts] 테스트 상품 데이터 사용:', testProducts);
      setProducts(testProducts);
    } finally {
      setIsLoading(false);
      console.log('[loadProducts] 로딩 완료');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 파트너사 목록 (임시 데이터)
  const partners: Partner[] = [
    { id: 1, name: '삼성전자', code: 'SAMSUNG' },
    { id: 2, name: 'LG전자', code: 'LG' },
    { id: 3, name: '한샘', code: 'HANSSEM' },
    { id: 4, name: '이케아', code: 'IKEA' },
    { id: 5, name: '신세계', code: 'SHINSEGAE' },
    { id: 6, name: '롯데', code: 'LOTTE' }
  ];

  // 파트너사 선택 핸들러
  const handlePartnerSelect = (partner: Partner) => {
    setSelectedPartner(partner);
    setShowPartnerModal(false);
  };

  // 파트너사 필터 초기화
  const clearPartnerFilter = () => {
    setSelectedPartner(null);
  };

  // 파트너사 선택 함수 (AdminDashboard에서 옮긴 기능)
  const handleCompanySelect = (company: UserOption) => {
    setSelectedUser(company);
    setIsCompanyModalOpen(false);
  };

  // partner_id로 파트너사 이름 찾기
  const getPartnerName = (partnerId?: number) => {
    if (!partnerId) return '-';
    const partner = partners.find(p => p.id === partnerId);
    return partner ? partner.name : `파트너 #${partnerId}`;
  };

  const handleAddProduct = () => {
    setShowAddForm(true);
    setEditingProduct(null);
    setFormData({
      name: '',
      partner_id: '',
      weight: '',
      size: '',
      cost1: '',
      cost2: '',
      memo: ''
    });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowAddForm(true);
    setFormData({
      name: product.name,
      partner_id: product.partner_id?.toString() || '',
      weight: product.weight?.toString() || '',
      size: product.size || '',
      cost1: product.cost1?.toString() || '',
      cost2: product.cost2?.toString() || '',
      memo: product.memo || ''
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // 수정 로직 - API 호출
        const updateData = {
          name: formData.name,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          size: formData.size,
          cost1: formData.cost1 ? parseFloat(formData.cost1) : undefined,
          cost2: formData.cost2 ? parseFloat(formData.cost2) : undefined,
          memo: formData.memo,
          user_id: selectedUser ? parseInt(selectedUser.id) : undefined
        };
        
        const updatedProduct = await productsAPI.updateProduct(editingProduct.id, updateData);
        setProducts(prev => 
          prev.map(p => p.id === editingProduct.id ? updatedProduct.product : p)
        );
      } else {
        // 추가 로직 - API 호출
        const productData = {
          name: formData.name,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          size: formData.size,
          cost1: formData.cost1 ? parseFloat(formData.cost1) : undefined,
          cost2: formData.cost2 ? parseFloat(formData.cost2) : undefined,
          memo: formData.memo,
          user_id: selectedUser ? parseInt(selectedUser.id) : undefined
        };
        
        console.log('선택된 파트너사:', selectedUser);
        console.log('상품 생성 데이터:', productData);
        const response = await productsAPI.createProduct(productData);
        console.log('상품 생성 응답:', response);
        
        // 성공 시 상품 목록 다시 로드
        await loadProducts();
      }
      
      setShowAddForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('상품 저장 실패:', error);
      alert('상품 저장에 실패했습니다: ' + error.message);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('이 상품을 삭제하시겠습니까?')) {
      try {
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error('상품 삭제 실패:', error);
      }
    }
  };

  console.log('[filteredProducts] 전체 상품 목록:', products);
  console.log('[filteredProducts] 선택된 사용자:', selectedUser);
  console.log('[filteredProducts] 검색어:', searchTerm);

  const filteredProducts = products.filter(product => {
    // 선택된 사용자가 있으면 해당 사용자 ID로만 필터링
    if (selectedUser) {
      // product에 user_id 필드가 있다면 그것으로 필터링
      // 없다면 products 테이블에 user_id 컬럼을 추가해야 함
      // user_id로 매칭 (파트너사 식별번호) - 타입 변환 포함
      const productUserId = product.user_id ? String(product.user_id) : '';
      const selectedUserId = selectedUser.id ? String(selectedUser.id) : '';
      const matchesUser = productUserId === selectedUserId;
      
      // 검색어 필터 (선택된 사용자 내에서)
      const matchesSearch = !searchTerm || (
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.memo && product.memo.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      console.log('사용자 필터링:', {
        productId: product.id,
        productName: product.name,
        productUserId: product.user_id,
        selectedUserId: selectedUser.id,
        selectedUserIdType: typeof selectedUser.id,
        productUserIdType: typeof product.user_id,
        matchesUser,
        matchesSearch,
        finalResult: matchesUser && matchesSearch
      });

      return matchesUser && matchesSearch;
    }

    // 선택된 사용자가 없으면 빈 배열 반환 (아무것도 표시하지 않음)
    console.log('[filteredProducts] 선택된 사용자가 없음 - 빈 결과 반환');
    return false;
  });

  console.log('[filteredProducts] 필터링된 상품 목록:', filteredProducts);
  console.log('[filteredProducts] 필터링된 상품 개수:', filteredProducts.length);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="relative flex items-center justify-center py-4 bg-white shadow-sm rounded-lg mb-6">
        {/* 왼쪽: 돌아가기 버튼 */}
        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="absolute left-4 flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            관리자화면으로 돌아가기
          </button>
        )}
        
        {/* 중앙: 제목 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package2 className="w-7 h-7 text-blue-600" />
            상품 관리 (ProductManagement)
          </h1>
          <p className="text-gray-600 mt-1">배송 상품 정보를 관리합니다</p>
        </div>
      </div>

      {/* 파트너사 선택 섹션 */}
      <div className="bg-red-50 rounded-xl shadow-lg border-2 border-red-200 p-4">
        <h2 className="text-xl font-bold text-red-800 mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-red-600" />
          파트너사 선택 (관리자 전용)
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">
                발송 업체 선택
                <span className="text-red-500 ml-1">*</span>
              </h3>
            </div>
            <div className="space-y-2">
              <div className="space-y-3">
                {/* 회사 선택 버튼 */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCompanyModalOpen(true)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-between"
                  >
                    <span className="text-gray-700">
                      {selectedUser ? 
                        `${selectedUser.default_sender_company || selectedUser.company || '업체명 없음'} (${selectedUser.name})` 
                        : '발송업체를 선택하세요'}
                    </span>
                    <Search className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCompanyModalOpen(true)}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    조회
                  </button>
                </div>
                
                {/* 선택된 파트너사 정보 표시 */}
                {selectedUser && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      선택된 발송업체
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-blue-700 font-medium">업체명:</span>
                        <span className="ml-2 text-blue-800">
                          {selectedUser.default_sender_company || selectedUser.company || '업체명 없음'}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">담당자:</span>
                        <span className="ml-2 text-blue-800">{selectedUser.name}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">전화번호:</span>
                        <span className="ml-2 text-blue-800">{selectedUser.phone || '없음'}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">전체 주소:</span>
                        <span className="ml-2 text-blue-800">
                          {selectedUser.default_sender_address || '주소 없음'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 선택된 사용자의 상품 목록 */}
                {selectedUser && (
                  <div className="mt-6 space-y-4">
                    {/* 검색 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="relative">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="상품명, 메모로 검색..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* 상품 목록 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-blue-900">선택된 업체의 상품 목록</h4>
                        <button
                          onClick={handleAddProduct}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          새 상품 추가
                        </button>
                      </div>
                      
                      {isLoading ? (
                        <div className="text-center py-8 text-gray-500">로딩 중...</div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          {searchTerm ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredProducts.map((product) => (
                            <div key={product.id} className="bg-white rounded-lg border p-4">
                              <div className="space-y-2">
                                <h5 className="font-medium text-gray-900">{product.name}</h5>
                                <div className="text-sm text-gray-600">
                                  <div>무게: {product.weight}kg</div>
                                  <div>크기: {product.size}</div>
                                  <div>비용1: {product.cost1}원</div>
                                  <div>비용2: {product.cost2}원</div>
                                  {product.memo && <div>메모: {product.memo}</div>}
                                </div>
                                <div className="flex justify-end gap-2 mt-3">
                                  <button
                                    onClick={() => handleEditProduct(product)}
                                    className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    삭제
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 상품 추가/수정 폼 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingProduct ? '상품 수정' : '새 상품 추가'}
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상품명 (name) *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  무게 (weight) - kg
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 1.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  크기 (size)
                </label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 100x50x30cm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비용1 (cost1) - 원
                </label>
                <input
                  type="number"
                  name="cost1"
                  value={formData.cost1}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 150000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비용2 (cost2) - 원
                </label>
                <input
                  type="number"
                  name="cost2"
                  value={formData.cost2}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 180000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모 (memo)
                </label>
                <textarea
                  name="memo"
                  value={formData.memo}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="상품에 대한 추가 정보나 메모를 입력하세요"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProduct ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 파트너사 선택 모달 (기존) */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="w-5 h-5 text-green-600" />
                파트너사 선택
              </h3>
              <button
                onClick={() => setShowPartnerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {partners.map((partner) => (
                <button
                  key={partner.id}
                  onClick={() => handlePartnerSelect(partner)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{partner.name}</div>
                      <div className="text-sm text-gray-500">코드: {partner.code}</div>
                    </div>
                    <Building className="w-5 h-5 text-green-600" />
                  </div>
                </button>
              ))}
              <button
                onClick={() => {
                  clearPartnerFilter();
                  setShowPartnerModal(false);
                }}
                className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                전체 상품 보기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 파트너사 선택 모달 (AdminDashboard에서 옮긴 기능) */}
      {isCompanyModalOpen && (
        <CompanySelectionModal
          isOpen={isCompanyModalOpen}
          onClose={() => setIsCompanyModalOpen(false)}
          onSelectCompany={handleCompanySelect}
        />
      )}
    </div>
  );
};

export default ProductManagement;
