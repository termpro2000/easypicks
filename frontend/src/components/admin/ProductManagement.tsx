import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X } from 'lucide-react';

interface Product {
  id?: number;
  product_code: string;
  product_weight?: string;  // 제품무게
  total_weight?: string;    // 전체무게
  product_size?: string;    // 제품크기
  box_size?: string;        // 박스크기
}

interface ProductManagementProps {
  deliveryId?: number;
  onChange?: (products: Product[]) => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ deliveryId, onChange }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProductCode, setNewProductCode] = useState('');
  const [newProductWeight, setNewProductWeight] = useState('');
  const [newTotalWeight, setNewTotalWeight] = useState('');
  const [newProductSize, setNewProductSize] = useState('');
  const [newBoxSize, setNewBoxSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingCode, setEditingCode] = useState('');
  const [editingWeight, setEditingWeight] = useState('');
  const [editingTotalWeight, setEditingTotalWeight] = useState('');
  const [editingSize, setEditingSize] = useState('');
  const [editingBoxSize, setEditingBoxSize] = useState('');

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
          body: JSON.stringify({ 
            product_code: newProductCode.trim(),
            product_weight: newProductWeight.trim() || null,
            total_weight: newTotalWeight.trim() || null,
            product_size: newProductSize.trim() || null,
            box_size: newBoxSize.trim() || null
          })
        });
        
        const data = await response.json();
        if (!data.success) {
          alert(data.error || '제품 추가에 실패했습니다.');
          return;
        }
        
        await loadProducts(); // 목록 새로고침
      } else {
        // 배송이 없는 경우 로컬 상태만 업데이트
        const newProduct = { 
          product_code: newProductCode.trim(),
          product_weight: newProductWeight.trim() || undefined,
          total_weight: newTotalWeight.trim() || undefined,
          product_size: newProductSize.trim() || undefined,
          box_size: newBoxSize.trim() || undefined
        };
        const updatedProducts = [...products, newProduct];
        setProducts(updatedProducts);
        onChange?.(updatedProducts);
      }
      
      // 모든 입력 필드 초기화
      setNewProductCode('');
      setNewProductWeight('');
      setNewTotalWeight('');
      setNewProductSize('');
      setNewBoxSize('');
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
    setEditingWeight(products[index].product_weight || '');
    setEditingTotalWeight(products[index].total_weight || '');
    setEditingSize(products[index].product_size || '');
    setEditingBoxSize(products[index].box_size || '');
  };

  // 제품 수정 취소
  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingCode('');
    setEditingWeight('');
    setEditingTotalWeight('');
    setEditingSize('');
    setEditingBoxSize('');
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
          body: JSON.stringify({ 
            product_code: editingCode.trim(),
            product_weight: editingWeight.trim() || null,
            total_weight: editingTotalWeight.trim() || null,
            product_size: editingSize.trim() || null,
            box_size: editingBoxSize.trim() || null
          })
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
        updatedProducts[index] = { 
          ...updatedProducts[index], 
          product_code: editingCode.trim(),
          product_weight: editingWeight.trim() || undefined,
          total_weight: editingTotalWeight.trim() || undefined,
          product_size: editingSize.trim() || undefined,
          box_size: editingBoxSize.trim() || undefined
        };
        setProducts(updatedProducts);
        onChange?.(updatedProducts);
      }
      
      // 편집 상태 초기화
      setEditingIndex(null);
      setEditingCode('');
      setEditingWeight('');
      setEditingTotalWeight('');
      setEditingSize('');
      setEditingBoxSize('');
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
                  <div className="w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                      <input
                        type="text"
                        value={editingCode}
                        onChange={(e) => setEditingCode(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="제품코드 (필수)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(index);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editingWeight}
                        onChange={(e) => setEditingWeight(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="제품무게"
                      />
                      <input
                        type="text"
                        value={editingTotalWeight}
                        onChange={(e) => setEditingTotalWeight(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="전체무게"
                      />
                      <input
                        type="text"
                        value={editingSize}
                        onChange={(e) => setEditingSize(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="제품크기"
                      />
                      <input
                        type="text"
                        value={editingBoxSize}
                        onChange={(e) => setEditingBoxSize(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="박스크기"
                      />
                    </div>
                    <div className="flex justify-end gap-1">
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
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm mb-2">
                      <div>
                        <span className="font-medium text-gray-700">코드:</span>
                        <span className="ml-1 font-mono">{product.product_code}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">제품무게:</span>
                        <span className="ml-1">{product.product_weight || '-'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">전체무게:</span>
                        <span className="ml-1">{product.total_weight || '-'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">제품크기:</span>
                        <span className="ml-1">{product.product_size || '-'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">박스크기:</span>
                        <span className="ml-1">{product.box_size || '-'}</span>
                      </div>
                    </div>
                    <div className="flex justify-end gap-1">
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
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 제품 추가 */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <input
            type="text"
            value={newProductCode}
            onChange={(e) => setNewProductCode(e.target.value)}
            placeholder="제품코드 (필수)"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') addProduct();
            }}
          />
          <input
            type="text"
            value={newProductWeight}
            onChange={(e) => setNewProductWeight(e.target.value)}
            placeholder="제품무게 (예: 50kg)"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            value={newTotalWeight}
            onChange={(e) => setNewTotalWeight(e.target.value)}
            placeholder="전체무게 (예: 100kg)"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            value={newProductSize}
            onChange={(e) => setNewProductSize(e.target.value)}
            placeholder="제품크기 (예: 1200x800x600mm)"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            value={newBoxSize}
            onChange={(e) => setNewBoxSize(e.target.value)}
            placeholder="박스크기 (예: 1300x900x700mm)"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={addProduct}
            disabled={loading || !newProductCode.trim()}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            추가
          </button>
        </div>
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