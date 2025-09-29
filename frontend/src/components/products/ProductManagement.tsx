import React, { useState, useEffect } from 'react';
import { Package2, Plus, Search, Trash2, Edit } from 'lucide-react';
import { productsAPI } from '../../services/api';
import ProductForm from './ProductForm';
import EditProductForm from './EditProductForm';
import { useAuth } from '../../hooks/useAuth';

interface Product {
  id: number;
  user_id?: number;
  name: string;
  maincode?: string;
  subcode?: string;
  weight?: number;
  size?: string;
  cost1?: number;
  cost2?: number;
  memo?: string;
  created_at: string;
  updated_at: string;
}


interface ProductManagementProps {
  onNavigateBack: () => void;
  selectedPartnerId?: number | null;
  selectedPartnerName?: string;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ onNavigateBack, selectedPartnerId, selectedPartnerName }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'list' | 'add-form' | 'edit-form'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // user 역할일 때는 자신의 상품만, 다른 역할일 때는 selectedPartnerId 사용
  const effectivePartnerId = user?.role === 'user' ? user.id : selectedPartnerId;

  // 상품 목록 로드 (파트너 변경 시에도 재로드)
  useEffect(() => {
    loadProducts();
  }, [effectivePartnerId]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      let response;
      if (effectivePartnerId) {
        response = await productsAPI.getProductsByPartner(effectivePartnerId);
      } else {
        response = await productsAPI.getAllProducts();
      }
      setProducts(response.products || []);
    } catch (error) {
      console.error('상품 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const handleAddProduct = () => {
    setCurrentView('add-form');
  };


  const handleDeleteProduct = async (id: number, product: Product) => {
    // user 역할일 때는 자신의 상품만 삭제 가능
    if (user?.role === 'user' && product.user_id !== user.id) {
      alert('자신이 등록한 상품만 삭제할 수 있습니다.');
      return;
    }

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
    setEditingProduct(null);
    loadProducts(); // 상품 목록 새로고침
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    // user 역할일 때는 자신의 상품만 편집 가능
    if (user?.role === 'user' && product.user_id !== user.id) {
      alert('자신이 등록한 상품만 수정할 수 있습니다.');
      return;
    }

    setEditingProduct(product);
    setCurrentView('edit-form');
  };

  const filteredProducts = products.filter(product => {
    // 검색어 필터
    const matchesSearch = !searchTerm || (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.memo && product.memo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.maincode && product.maincode.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return matchesSearch;
  });

  // 새상품추가 폼 표시
  if (currentView === 'add-form') {
    return (
      <ProductForm 
        onNavigateBack={handleBackToList}
        onSuccess={handleFormSuccess}
        selectedPartnerId={effectivePartnerId}
      />
    );
  }

  if (currentView === 'edit-form' && editingProduct) {
    return (
      <EditProductForm 
        onNavigateBack={handleBackToList}
        onSuccess={handleFormSuccess}
        product={editingProduct}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center relative">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← 파트너 선택으로 돌아가기
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <Package2 className="w-7 h-7 text-blue-600" />
              상품 관리
              {selectedPartnerName && (
                <span className="text-lg font-normal text-blue-600">
                  - {selectedPartnerName}
                </span>
              )}
            </h1>
            <p className="text-gray-600 mt-1">
              {selectedPartnerName 
                ? `${selectedPartnerName}의 상품을 관리합니다` 
                : '배송 상품 정보를 관리합니다'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
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
              <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-700">
                <div>메인코드</div>
                <div>서브코드</div>
                <div className="col-span-2">상품명</div>
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
                  <div key={product.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleEditProduct(product)}>
                    <div className="grid grid-cols-7 gap-4 items-center text-sm">
                      <div className="font-mono text-blue-600">{product.maincode || '-'}</div>
                      <div className="font-mono text-gray-600">{product.subcode || '-'}</div>
                      <div className="col-span-2">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        {product.memo && (
                          <div className="text-gray-500 text-xs mt-1">{product.memo}</div>
                        )}
                      </div>
                      <div className="text-gray-600">
                        {product.weight ? `${product.weight}kg` : '-'}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {product.size || '-'}
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProduct(product);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product.id, product);
                          }}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-blue-600">{filteredProducts.length}</div>
          <div className="text-sm text-gray-600">전체 상품</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-green-600">
            {filteredProducts.filter(p => p.weight && p.weight > 0).length}
          </div>
          <div className="text-sm text-gray-600">무게 정보 있는 상품</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-orange-600">
            {filteredProducts.filter(p => p.cost1 && p.cost1 > 0).length}
          </div>
          <div className="text-sm text-gray-600">가격 정보 있는 상품</div>
        </div>
      </div>
      
      {/* 파일명 표시 */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-xs text-gray-500">
          <Package2 className="w-3 h-3" />
          ProductManagement.tsx
        </div>
      </div>
      </div>
    </div>
  );
};

export default ProductManagement;