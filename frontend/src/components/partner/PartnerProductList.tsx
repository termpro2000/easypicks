import React, { useState, useEffect } from 'react';
import { 
  Search, Package, ArrowLeft, RefreshCw, Filter, 
  Tag, Weight, Ruler, DollarSign, FileText, Edit, Trash2
} from 'lucide-react';
import { productsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

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

interface SearchCellProps {
  children: React.ReactNode;
}

const SearchCell: React.FC<SearchCellProps> = ({ children }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {children}
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 transition-colors shadow-sm hover:shadow-md">
      {/* 상품 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>상품 ID: #{product.id}</span>
              {product.maincode && <span>상품코드: {product.maincode}</span>}
              {product.subcode && <span>내부코드: {product.subcode}</span>}
            </div>
          </div>
        </div>
        
        {/* 액션 버튼들 */}
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(product)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="상품 수정"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(product.id)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="상품 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 상품 상세 정보 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 무게 */}
        <div className="flex items-center gap-2">
          <Weight className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">무게</p>
            <p className="text-sm font-medium text-gray-900">
              {product.weight ? `${product.weight}kg` : '-'}
            </p>
          </div>
        </div>

        {/* 크기 */}
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">크기</p>
            <p className="text-sm font-medium text-gray-900">
              {product.size || '-'}
            </p>
          </div>
        </div>

        {/* 기본 배송비 */}
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-500" />
          <div>
            <p className="text-xs text-gray-500">기본 배송비</p>
            <p className="text-sm font-medium text-gray-900">
              {formatPrice(product.cost1)}
            </p>
          </div>
        </div>

        {/* 특수 배송비 */}
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-orange-500" />
          <div>
            <p className="text-xs text-gray-500">특수 배송비</p>
            <p className="text-sm font-medium text-gray-900">
              {formatPrice(product.cost2)}
            </p>
          </div>
        </div>
      </div>

      {/* 상품 메모 */}
      {product.memo && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">상품 메모</p>
              <p className="text-sm text-gray-700 line-clamp-2">
                {product.memo}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 등록일 */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          등록일: {new Date(product.created_at).toLocaleDateString('ko-KR')}
        </p>
      </div>
    </div>
  );
};

const PartnerProductList: React.FC<PartnerProductListProps> = ({ onNavigateBack }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 상품 목록 조회
  const fetchProducts = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setLoading(true);

      const response = await productsAPI.getAllProducts();
      
      setProducts(response.products || []);
    } catch (error) {
      console.error('상품 목록 조회 오류:', error);
      setProducts([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 검색 필터링
  const filteredProducts = products.filter(product => 
    !searchTerm || 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toString().includes(searchTerm)
  );

  // 상품 삭제 핸들러
  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('이 상품을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await productsAPI.deleteProduct(productId);
      await fetchProducts(true); // 목록 새로고침
      alert('상품이 삭제되었습니다.');
    } catch (error) {
      console.error('상품 삭제 오류:', error);
      alert('상품 삭제 중 오류가 발생했습니다.');
    }
  };

  // 상품 수정 핸들러 (추후 구현)
  const handleEditProduct = (product: Product) => {
    console.log('상품 수정:', product);
    // TODO: 상품 수정 모달 또는 페이지로 이동
    alert('상품 수정 기능은 곧 추가될 예정입니다.');
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
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">상품조회_업체용</h1>
                <p className="text-sm text-orange-600 font-medium">등록된 상품을 확인하세요</p>
              </div>
            </div>
            
            {/* 새로고침 버튼 */}
            <button
              onClick={() => fetchProducts(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">새로고침</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 조회 필드 섹션 */}
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Search className="w-6 h-6 text-orange-600" />
            상품 검색
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 검색어 입력 */}
            <SearchCell>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  상품명 또는 상품 ID
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="상품명 또는 ID 입력..."
                  />
                </div>
              </div>
            </SearchCell>

            {/* 정렬 옵션 */}
            <SearchCell>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  정렬 기준
                </label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                    <option value="newest">최신 등록순</option>
                    <option value="oldest">오래된 등록순</option>
                    <option value="name">상품명순</option>
                    <option value="price">가격순</option>
                  </select>
                </div>
              </div>
            </SearchCell>

            {/* 검색 버튼 */}
            <SearchCell>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  검색 실행
                </label>
                <button
                  onClick={() => fetchProducts(true)}
                  disabled={isRefreshing}
                  className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  {isRefreshing ? '검색 중...' : '검색하기'}
                </button>
              </div>
            </SearchCell>
          </div>
        </div>

        {/* 상품 목록 섹션 */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              내 상품 목록 ({filteredProducts.length}개)
            </h2>
            
            {filteredProducts.length > 0 && (
              <div className="text-sm text-gray-500">
                총 {products.length}개 상품 중 {filteredProducts.length}개 표시
              </div>
            )}
          </div>

          {/* 로딩 상태 */}
          {loading && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center gap-2 text-gray-500">
                <RefreshCw className="w-5 h-5 animate-spin" />
                상품 목록을 불러오는 중...
              </div>
            </div>
          )}

          {/* 상품이 없는 경우 */}
          {!loading && filteredProducts.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">
                {searchTerm ? '검색 조건에 맞는 상품이 없습니다.' : '등록된 상품이 없습니다.'}
              </p>
              <p className="text-sm">
                {!searchTerm && '상품등록 버튼을 눌러 첫 상품을 등록해보세요.'}
              </p>
            </div>
          )}

          {/* 상품 카드 목록 */}
          {!loading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          )}
        </div>

        {/* 통계 정보 */}
        {!loading && products.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">상품 통계</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{products.length}</p>
                <p className="text-sm text-blue-800">총 상품 수</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {products.filter(p => p.cost1 && p.cost1 > 0).length}
                </p>
                <p className="text-sm text-green-800">배송비 설정됨</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {products.filter(p => p.weight && p.weight > 0).length}
                </p>
                <p className="text-sm text-yellow-800">무게 정보 있음</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {products.filter(p => p.memo && p.memo.trim().length > 0).length}
                </p>
                <p className="text-sm text-purple-800">메모 작성됨</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PartnerProductList;