import React, { useState, useEffect } from 'react';
import { 
  Search, Package, X, Check, Filter, 
  Tag, Weight, Ruler, DollarSign
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

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors shadow-sm hover:shadow-md cursor-pointer"
         onClick={() => onSelect(product)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
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
        
        <button className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          <Check className="w-4 h-4" />
          선택
        </button>
      </div>
      
      {/* 상품 정보 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
          <span className="font-medium">{formatPrice(product.cost1)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">단가2:</span>
          <span className="font-medium">{formatPrice(product.cost2)}</span>
        </div>
      </div>
      
      {/* 메모 */}
      {product.memo && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">{product.memo}</p>
        </div>
      )}
    </div>
  );
};

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectProduct 
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  // 검색 필터링
  const filteredProducts = products.filter(product => 
    !searchTerm || 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toString().includes(searchTerm) ||
    product.maincode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.subcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 상품 선택 핸들러
  const handleSelectProduct = (product: Product) => {
    onSelectProduct(product);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">상품 선택</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 검색 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="상품명, 상품코드, 내부코드로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="text-sm text-gray-500">
              총 {filteredProducts.length}개 상품
            </div>
          </div>
        </div>

        {/* 상품 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
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
              <p className="text-gray-500">
                {searchTerm ? '다른 검색어로 시도해보세요' : '먼저 상품을 등록해주세요'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={handleSelectProduct}
                />
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSelectionModal;