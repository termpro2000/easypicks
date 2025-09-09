import React, { useState, useEffect } from 'react';
import { Package2, Plus, Search, Edit3, Trash2, Save, X } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  code: string;
  weight?: number;
  size?: string;
  category: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    weight: '',
    size: '',
    category: '',
    description: ''
  });

  // 상품 목록 로드 (현재는 목업 데이터)
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      // TODO: API 연결 시 실제 데이터로 교체
      const mockProducts: Product[] = [
        {
          id: 1,
          name: '삼성 냉장고 RT32K5035S8',
          code: 'RF001',
          weight: 65,
          size: '600x650x1750mm',
          category: '가전',
          description: '2도어 냉장고, 실버',
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        },
        {
          id: 2,
          name: 'LG 세탁기 F21VDD',
          code: 'WM001',
          weight: 78,
          size: '600x650x850mm',
          category: '가전',
          description: '드럼세탁기 21kg, 화이트',
          created_at: '2024-01-16',
          updated_at: '2024-01-16'
        },
        {
          id: 3,
          name: '한샘 식탁 세트',
          code: 'FU001',
          weight: 45,
          size: '1200x800x750mm',
          category: '가구',
          description: '4인용 원목 식탁세트',
          created_at: '2024-01-17',
          updated_at: '2024-01-17'
        }
      ];
      setProducts(mockProducts);
    } catch (error) {
      console.error('상품 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProduct = () => {
    setShowAddForm(true);
    setEditingProduct(null);
    setFormData({
      name: '',
      code: '',
      weight: '',
      size: '',
      category: '',
      description: ''
    });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowAddForm(true);
    setFormData({
      name: product.name,
      code: product.code,
      weight: product.weight?.toString() || '',
      size: product.size || '',
      category: product.category,
      description: product.description || ''
    });
  };

  const handleSaveProduct = async () => {
    try {
      if (editingProduct) {
        // 수정 로직
        const updatedProduct = {
          ...editingProduct,
          ...formData,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          updated_at: new Date().toISOString().split('T')[0]
        };
        setProducts(prev => 
          prev.map(p => p.id === editingProduct.id ? updatedProduct : p)
        );
      } else {
        // 추가 로직
        const newProduct: Product = {
          id: Date.now(),
          ...formData,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0]
        };
        setProducts(prev => [...prev, newProduct]);
      }
      
      setShowAddForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('상품 저장 실패:', error);
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package2 className="w-7 h-7 text-blue-600" />
            상품 관리
          </h1>
          <p className="text-gray-600 mt-1">배송 상품 정보를 관리합니다</p>
        </div>
        <button
          onClick={handleAddProduct}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 상품 추가
        </button>
      </div>

      {/* 검색 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="상품명, 상품코드, 카테고리로 검색..."
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
                <div>상품코드</div>
                <div className="col-span-2">상품명</div>
                <div>카테고리</div>
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
                    <div className="grid grid-cols-7 gap-4 items-center text-sm">
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
                        {product.weight ? `${product.weight}kg` : '-'}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {product.size || '-'}
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
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

      {/* 상품 추가/수정 모달 */}
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

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상품명 <span className="text-red-500">*</span>
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
                  상품코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">카테고리 선택</option>
                  <option value="가전">가전</option>
                  <option value="가구">가구</option>
                  <option value="생활용품">생활용품</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    무게 (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="0.1"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    크기 (WxDxH)
                  </label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    placeholder="600x650x850mm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveProduct}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingProduct ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 통계 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-blue-600">{products.length}</div>
          <div className="text-sm text-gray-600">총 상품 수</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-green-600">
            {products.filter(p => p.category === '가전').length}
          </div>
          <div className="text-sm text-gray-600">가전 상품</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-orange-600">
            {products.filter(p => p.category === '가구').length}
          </div>
          <div className="text-sm text-gray-600">가구 상품</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-purple-600">
            {products.filter(p => p.category === '기타').length}
          </div>
          <div className="text-sm text-gray-600">기타 상품</div>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;