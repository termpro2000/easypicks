import React, { useState, useEffect } from 'react';
import { 
  Search, Package, Plus, Edit, Trash2, Filter, 
  Weight, Ruler, DollarSign, ArrowLeft,
  MoreVertical
} from 'lucide-react';
import { productsAPI } from '../../services/api';

interface Product {
  id: number;
  maincode?: string;
  subcode?: string;
  name: string;
  weight?: number;
  size?: string;
  cost1?: number;
  cost2?: number;
  memo?: string;
  created_at: string;
  updated_at: string;
}

interface PartnerProductListProps {
  onNavigateBack: () => void;
}

const PartnerProductList: React.FC<PartnerProductListProps> = ({ onNavigateBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  // 상품 목록 조회
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAllProducts();
      setProducts(response.products || []);
    } catch (error) {
      console.error('상품 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 검색 필터링
  const filteredProducts = products.filter(product => 
    !searchTerm || 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toString().includes(searchTerm) ||
    product.maincode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.subcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 가격 포맷팅
  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(product => product.id));
    }
  };

  // 개별 선택/해제
  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 뒤로가기 버튼 */}
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">메인으로 돌아가기</span>
              <span className="sm:hidden">돌아가기</span>
            </button>
            
            {/* 중앙 제목 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">상품관리_업체용</h1>
                <p className="text-sm text-blue-600 font-medium">등록된 상품을 관리하세요</p>
              </div>
            </div>
            
            {/* 새 상품 추가 버튼 */}
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">새 상품 추가</span>
              <span className="sm:hidden">추가</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="상품명, 상품코드, 내부코드로 검색..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                필터
              </button>
              <div className="text-sm text-gray-500 flex items-center px-3">
                총 {filteredProducts.length}개 상품
              </div>
            </div>
          </div>
        </div>

        {/* 상품 목록 */}
        <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
          {/* 테이블 헤더 */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <h3 className="text-lg font-semibold text-gray-900">상품 목록</h3>
              {selectedProducts.length > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {selectedProducts.length}개 선택됨
                </span>
              )}
            </div>
          </div>

          {/* 테이블 내용 */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">상품 목록을 불러오는 중...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? '검색된 상품이 없습니다' : '등록된 상품이 없습니다'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? '다른 검색어로 시도해보세요' : '첫 번째 상품을 등록해보세요'}
                </p>
                {!searchTerm && (
                  <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mx-auto">
                    <Plus className="w-5 h-5" />
                    새 상품 추가
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* 체크박스 */}
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-1"
                      />

                      {/* 상품 아이콘 */}
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>

                      {/* 상품 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span>상품 ID: #{product.id}</span>
                              {product.maincode && <span>상품코드: {product.maincode}</span>}
                              {product.subcode && <span>내부코드: {product.subcode}</span>}
                            </div>
                          </div>
                          
                          {/* 액션 메뉴 */}
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* 상세 정보 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Weight className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">무게:</span>
                            <span className="font-medium">{product.weight ? `${product.weight}kg` : '-'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Ruler className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">크기:</span>
                            <span className="font-medium">{product.size || '-'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">단가1:</span>
                            <span className="font-medium text-green-600">{formatPrice(product.cost1)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">단가2:</span>
                            <span className="font-medium text-green-600">{formatPrice(product.cost2)}</span>
                          </div>
                        </div>

                        {/* 메모 */}
                        {product.memo && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">{product.memo}</p>
                          </div>
                        )}

                        {/* 생성/수정 날짜 */}
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-3">
                          <span>생성일: {new Date(product.created_at).toLocaleDateString('ko-KR')}</span>
                          <span>수정일: {new Date(product.updated_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 선택된 상품 액션 */}
        {selectedProducts.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{selectedProducts.length}개 상품 선택됨</span>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm">
                  일괄 삭제
                </button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                  일괄 수정
                </button>
                <button 
                  onClick={() => setSelectedProducts([])}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  선택 해제
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 업체용 안내사항 */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-8 mt-8">
          <h3 className="text-xl font-bold text-blue-900 mb-4">상품관리 안내</h3>
          <ul className="text-blue-800 space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>상품 정보는 배송 라벨 생성 시 자동으로 적용됩니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>상품코드와 내부코드를 활용하여 효율적으로 재고를 관리하세요.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>무게와 크기 정보는 배송비 계산에 중요한 요소입니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>대량 상품 등록이 필요한 경우 CSV 파일 업로드를 이용하세요.</span>
            </li>
          </ul>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 이지픽스 업체용 서비스. All rights reserved.</p>
            <p className="mt-1">효율적인 상품 관리로 더 나은 배송 서비스를 제공하세요.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PartnerProductList;

<div className="mt-4 text-xs text-gray-400 text-center">PartnerProductList.tsx</div>