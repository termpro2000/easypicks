import React, { useState, useEffect } from 'react';
import { Package2, Plus, Search, Trash2, X, Building } from 'lucide-react';
import { productsAPI } from '../../services/api';
import ProductForm from './ProductForm';

interface Product {
  id: number;
  partner_id?: number;
  name: string;
  code?: string;
  weight?: number;
  size?: string;
  category?: string;
  partner_company?: string;
  description?: string;
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

interface ProductManagementProps {
  onNavigateBack: () => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ onNavigateBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'add-form'>('list');

  // 상품 목록 로드 (현재는 목업 데이터)
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await productsAPI.getAllProducts();
      setProducts(response.products || []);
    } catch (error) {
      console.error('상품 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
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

  // partner_id로 파트너사 이름 찾기
  const getPartnerName = (partnerId?: number) => {
    if (!partnerId) return '-';
    const partner = partners.find(p => p.id === partnerId);
    return partner ? partner.name : `파트너 #${partnerId}`;
  };

  const handleAddProduct = () => {
    setCurrentView('add-form');
  };


  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('이 상품을 삭제하시겠습니까?')) {
      try {
        await productsAPI.deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error('상품 삭제 실패:', error);
      }
    }
  };

  const handleFormSuccess = () => {
    setCurrentView('list');
    loadProducts(); // 상품 목록 새로고침
  };

  const handleBackToList = () => {
    setCurrentView('list');
  };

  const filteredProducts = products.filter(product => {
    // 검색어 필터
    const matchesSearch = !searchTerm || (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.memo && product.memo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // 파트너사 필터
    const matchesPartner = !selectedPartner || product.partner_id === selectedPartner.id;

    return matchesSearch && matchesPartner;
  });

  // 새상품추가 폼 표시
  if (currentView === 'add-form') {
    return (
      <ProductForm 
        onNavigateBack={handleBackToList}
        onSuccess={handleFormSuccess}
        selectedPartnerId={selectedPartner?.id}
      />
    );
  }

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
              <Package2 className="w-7 h-7 text-blue-600" />
              상품 관리
            </h1>
            <p className="text-gray-600 mt-1">배송 상품 정보를 관리합니다</p>
          </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPartnerModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Building className="w-4 h-4" />
            파트너사 조회
          </button>
          <button
            onClick={handleAddProduct}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 상품 추가
          </button>
        </div>
      </div>

      {/* 검색 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
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

      {/* 선택된 파트너사 정보 */}
      {selectedPartner && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-green-600" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-800">파트너사 코드:</span>
                  <span className="text-sm text-green-700 font-mono">{selectedPartner.code}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-green-800">파트너사 이름:</span>
                  <span className="text-sm text-green-700">{selectedPartner.name}</span>
                </div>
              </div>
            </div>
            <button
              onClick={clearPartnerFilter}
              className="flex items-center gap-1 px-3 py-1 text-green-600 hover:text-green-800 text-sm"
            >
              <X className="w-4 h-4" />
              필터 해제
            </button>
          </div>
        </div>
      )}

      {/* 상품 목록 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">상품 목록을 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 테이블 헤더 */}
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-8 gap-4 text-sm font-medium text-gray-700">
                <div>상품코드</div>
                <div className="col-span-2">상품명</div>
                <div>카테고리</div>
                <div>파트너사</div>
                <div>무게</div>
                <div>크기</div>
                <div className="text-center">관리</div>
              </div>
            </div>

            {/* 테이블 본문 */}
            <div className="divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'}
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div key={product.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="grid grid-cols-8 gap-4 items-center text-sm">
                      <div className="font-mono text-blue-600">{product.code}</div>
                      <div className="col-span-2">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        {product.description && (
                          <div className="text-gray-500 text-xs mt-1">{product.description}</div>
                        )}
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {product.category}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getPartnerName(product.partner_id)}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        {product.weight ? `${product.weight}kg` : '-'}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {product.size || '-'}
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-blue-600">{filteredProducts.length}</div>
          <div className="text-sm text-gray-600">
            {selectedPartner ? `${selectedPartner.name} 상품` : '전체 상품'}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-green-600">
            {filteredProducts.filter(p => p.partner_id === 1).length}
          </div>
          <div className="text-sm text-gray-600">삼성전자</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-orange-600">
            {filteredProducts.filter(p => p.partner_id === 2).length}
          </div>
          <div className="text-sm text-gray-600">LG전자</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-purple-600">
            {filteredProducts.filter(p => p.partner_id === 3).length}
          </div>
          <div className="text-sm text-gray-600">한샘</div>
        </div>
      </div>

      {/* 파트너사 선택 모달 */}
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

            <div className="space-y-2 max-h-96 overflow-y-auto">
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
                    <div className="text-sm text-green-600">
                      {products.filter(p => p.partner_id === partner.id).length}개 상품
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
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
      </div>
    </div>
  );
};

export default ProductManagement;