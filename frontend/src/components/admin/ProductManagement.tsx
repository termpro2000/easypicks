import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X } from 'lucide-react';

interface Product {
  id?: number;
  product_code: string;
}

interface ProductManagementProps {
  deliveryId?: number;
  onChange?: (products: Product[]) => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ deliveryId, onChange }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProductCode, setNewProductCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingCode, setEditingCode] = useState('');

  // 제품 목록 조회
  useEffect(() => {
    if (deliveryId) {
      loadProducts();
    }
  }, [deliveryId]);

  const loadProducts = async () => {
    if (!deliveryId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/deliveries/${deliveryId}/products`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products || []);
        onChange?.(data.products || []);
      }
    } catch (error) {
      console.error('제품 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 제품 추가
  const addProduct = async () => {
    if (!newProductCode.trim()) {
      alert('제품코드를 입력해주세요.');
      return;
    }

    // 중복 확인
    if (products.some(p => p.product_code === newProductCode.trim())) {
      alert('이미 추가된 제품코드입니다.');
      return;
    }

    try {
      setLoading(true);
      
      if (deliveryId) {
        // 배송이 있는 경우 API 호출
        const response = await fetch(`/api/deliveries/${deliveryId}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_code: newProductCode.trim() })
        });
        
        const data = await response.json();
        if (!data.success) {
          alert(data.error || '제품 추가에 실패했습니다.');
          return;
        }
        
        await loadProducts(); // 목록 새로고침
      } else {
        // 배송이 없는 경우 로컬 상태만 업데이트
        const newProduct = { product_code: newProductCode.trim() };
        const updatedProducts = [...products, newProduct];
        setProducts(updatedProducts);
        onChange?.(updatedProducts);
      }
      
      setNewProductCode('');
    } catch (error) {
      console.error('제품 추가 오류:', error);
      alert('제품 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 제품 제거
  const removeProduct = async (index: number, productId?: number) => {
    try {
      setLoading(true);
      
      if (deliveryId && productId) {
        // 배송이 있는 경우 API 호출
        const response = await fetch(`/api/deliveries/${deliveryId}/products/${productId}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        if (!data.success) {
          alert(data.error || '제품 제거에 실패했습니다.');
          return;
        }
        
        await loadProducts(); // 목록 새로고침
      } else {
        // 배송이 없는 경우 로컬 상태만 업데이트
        const updatedProducts = products.filter((_, i) => i !== index);
        setProducts(updatedProducts);
        onChange?.(updatedProducts);
      }
    } catch (error) {
      console.error('제품 제거 오류:', error);
      alert('제품 제거 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 제품 수정 시작
  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingCode(products[index].product_code);
  };

  // 제품 수정 취소
  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingCode('');
  };

  // 제품 수정 저장
  const saveEdit = async (index: number) => {
    if (!editingCode.trim()) {
      alert('제품코드를 입력해주세요.');
      return;
    }

    // 중복 확인 (자기 자신 제외)
    if (products.some((p, i) => i !== index && p.product_code === editingCode.trim())) {
      alert('이미 존재하는 제품코드입니다.');
      return;
    }

    try {
      setLoading(true);
      
      if (deliveryId && products[index].id) {
        // API를 통한 수정 (실제로는 삭제 후 추가)
        await removeProduct(index, products[index].id);
        
        const response = await fetch(`/api/deliveries/${deliveryId}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_code: editingCode.trim() })
        });
        
        const data = await response.json();
        if (!data.success) {
          alert(data.error || '제품 수정에 실패했습니다.');
          return;
        }
        
        await loadProducts(); // 목록 새로고침
      } else {
        // 로컬 상태 업데이트
        const updatedProducts = [...products];
        updatedProducts[index] = { ...updatedProducts[index], product_code: editingCode.trim() };
        setProducts(updatedProducts);
        onChange?.(updatedProducts);
      }
      
      setEditingIndex(null);
      setEditingCode('');
    } catch (error) {
      console.error('제품 수정 오류:', error);
      alert('제품 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 제품 목록 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">연결된 제품 ({products.length}개)</h3>
        
        {products.length === 0 ? (
          <div className="text-sm text-gray-500 italic py-4 text-center border-2 border-dashed border-gray-300 rounded-lg">
            추가된 제품이 없습니다
          </div>
        ) : (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {products.map((product, index) => (
              <div key={product.id || index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                {editingIndex === index ? (
                  <>
                    <input
                      type="text"
                      value={editingCode}
                      onChange={(e) => setEditingCode(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="제품코드 입력"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(index);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(index)}
                      disabled={loading}
                      className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                      title="저장"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={loading}
                      className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                      title="취소"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-mono">{product.product_code}</span>
                    <button
                      onClick={() => startEdit(index)}
                      disabled={loading}
                      className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      title="수정"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeProduct(index, product.id)}
                      disabled={loading}
                      className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                      title="제거"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 제품 추가 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newProductCode}
          onChange={(e) => setNewProductCode(e.target.value)}
          placeholder="제품코드 입력"
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') addProduct();
          }}
        />
        <button
          onClick={addProduct}
          disabled={loading || !newProductCode.trim()}
          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
        >
          <Plus className="w-4 h-4" />
          추가
        </button>
      </div>

      {loading && (
        <div className="text-xs text-blue-600 animate-pulse">
          처리 중...
        </div>
      )}
    </div>
  );
};

export default ProductManagement;