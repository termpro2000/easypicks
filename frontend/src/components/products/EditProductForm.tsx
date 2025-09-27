import React, { useState } from 'react';
import { Save, X, Package2 } from 'lucide-react';
import { productsAPI } from '../../services/api';

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

interface EditProductFormProps {
  onNavigateBack: () => void;
  onSuccess?: () => void;
  selectedPartnerId?: number;
  product: Product;
}

interface ProductFormData {
  name: string;
  maincode: string;
  subcode: string;
  weight: string;
  size: string;
  cost1: string;
  cost2: string;
  memo: string;
}

const EditProductForm: React.FC<EditProductFormProps> = ({ onNavigateBack, onSuccess, product }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: product.name || '',
    maincode: product.maincode || '',
    subcode: product.subcode || '',
    weight: product.weight?.toString() || '',
    size: product.size || '',
    cost1: product.cost1?.toString() || '',
    cost2: product.cost2?.toString() || '',
    memo: product.memo || ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 클리어
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '상품명은 필수입니다.';
    }

    if (!formData.maincode.trim()) {
      newErrors.maincode = '메인코드는 필수입니다.';
    }

    if (formData.weight && isNaN(parseFloat(formData.weight))) {
      newErrors.weight = '올바른 숫자를 입력해주세요.';
    }

    if (formData.cost1 && isNaN(parseFloat(formData.cost1))) {
      newErrors.cost1 = '올바른 숫자를 입력해주세요.';
    }

    if (formData.cost2 && isNaN(parseFloat(formData.cost2))) {
      newErrors.cost2 = '올바른 숫자를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const productData = {
        name: formData.name.trim(),
        maincode: formData.maincode.trim(),
        subcode: formData.subcode.trim(),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        size: formData.size.trim() || undefined,
        cost1: formData.cost1 ? parseFloat(formData.cost1) : undefined,
        cost2: formData.cost2 ? parseFloat(formData.cost2) : undefined,
        memo: formData.memo.trim() || undefined
      };

      await productsAPI.updateProduct(product.id, productData);
      
      if (onSuccess) {
        onSuccess();
      } else {
        onNavigateBack();
      }
    } catch (error: any) {
      console.error('상품 저장 실패:', error);
      const message = error.response?.data?.message || '상품 저장에 실패했습니다.';
      setErrors({ submit: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-6">
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mb-4"
        >
          ← 상품관리로 돌아가기
        </button>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package2 className="w-8 h-8 text-blue-600" />
            상품 수정
          </h1>
          <p className="text-gray-600 mt-2">상품 정보를 수정하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">기본 정보</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="상품명을 입력하세요"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메인코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="maincode"
                  value={formData.maincode}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.maincode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="메인코드를 입력하세요"
                />
                {errors.maincode && <p className="text-red-500 text-sm mt-1">{errors.maincode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  서브코드
                </label>
                <input
                  type="text"
                  name="subcode"
                  value={formData.subcode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="서브코드를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  무게 (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.weight ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="무게를 입력하세요"
                  step="0.1"
                  min="0"
                />
                {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  크기 (가로 x 세로 x 높이)
                </label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 600x650x850mm"
                />
              </div>
            </div>
          </div>

          {/* 가격 정보 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">가격 정보</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비용 1 (원)
                </label>
                <input
                  type="number"
                  name="cost1"
                  value={formData.cost1}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.cost1 ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="첫 번째 비용을 입력하세요"
                  min="0"
                />
                {errors.cost1 && <p className="text-red-500 text-sm mt-1">{errors.cost1}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비용 2 (원)
                </label>
                <input
                  type="number"
                  name="cost2"
                  value={formData.cost2}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.cost2 ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="두 번째 비용을 입력하세요"
                  min="0"
                />
                {errors.cost2 && <p className="text-red-500 text-sm mt-1">{errors.cost2}</p>}
              </div>
            </div>
          </div>

          {/* 추가 정보 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">추가 정보</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메모
              </label>
              <textarea
                name="memo"
                value={formData.memo}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="추가적인 메모나 주의사항을 입력하세요"
              />
            </div>
          </div>

          {/* 에러 메시지 */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onNavigateBack}
              className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  상품 수정
                </>
              )}
            </button>
          </div>
        </form>

        {/* 파일명 표시 */}
        <div className="mt-8 text-xs text-gray-400 text-center">
          EditProductForm.tsx
        </div>
      </div>
    </div>
  );
};

export default EditProductForm;