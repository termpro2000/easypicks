import React, { useState, useEffect } from 'react';
import { Save, X, Building, Package2 } from 'lucide-react';
import { productsAPI } from '../../services/api';

interface Partner {
  id: number;
  name: string;
  code?: string;
}

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

interface EditProductFormProps {
  onNavigateBack: () => void;
  onSuccess?: () => void;
  selectedPartnerId?: number;
  product: Product;
}

interface ProductFormData {
  name: string;
  code: string;
  weight: string;
  size: string;
  category: string;
  description: string;
  cost1: string;
  cost2: string;
  memo: string;
  partner_id?: number;
}

const EditProductForm: React.FC<EditProductFormProps> = ({ onNavigateBack, onSuccess, selectedPartnerId, product }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: product.name || '',
    code: product.code || '',
    weight: product.weight?.toString() || '',
    size: product.size || '',
    category: product.category || '',
    description: product.description || '',
    cost1: product.cost1?.toString() || '',
    cost2: product.cost2?.toString() || '',
    memo: product.memo || '',
    partner_id: product.partner_id || selectedPartnerId
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 파트너사 목록 (실제 환경에서는 API에서 가져와야 함)
  const partners: Partner[] = [
    { id: 1, name: '삼성전자', code: 'SAMSUNG' },
    { id: 2, name: 'LG전자', code: 'LG' },
    { id: 3, name: '한샘', code: 'HANSSEM' },
    { id: 4, name: '이케아', code: 'IKEA' },
    { id: 5, name: '신세계', code: 'SHINSEGAE' },
    { id: 6, name: '롯데', code: 'LOTTE' }
  ];

  // 초기 파트너 설정
  useEffect(() => {
    if (selectedPartnerId) {
      const partner = partners.find(p => p.id === selectedPartnerId);
      if (partner) {
        setSelectedPartner(partner);
        setFormData(prev => ({ ...prev, partner_id: selectedPartnerId }));
      }
    }
  }, [selectedPartnerId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handlePartnerSelect = (partner: Partner) => {
    setSelectedPartner(partner);
    setFormData(prev => ({
      ...prev,
      partner_id: partner.id
    }));
    setShowPartnerModal(false);
  };

  const clearPartnerSelection = () => {
    setSelectedPartner(null);
    setFormData(prev => ({
      ...prev,
      partner_id: undefined
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '상품명은 필수입니다.';
    }

    if (!formData.code.trim()) {
      newErrors.code = '상품코드는 필수입니다.';
    }

    if (!formData.category) {
      newErrors.category = '카테고리를 선택해주세요.';
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
        code: formData.code.trim(),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        size: formData.size.trim() || undefined,
        category: formData.category,
        description: formData.description.trim() || undefined,
        cost1: formData.cost1 ? parseFloat(formData.cost1) : undefined,
        cost2: formData.cost2 ? parseFloat(formData.cost2) : undefined,
        memo: formData.memo.trim() || undefined,
        partner_id: formData.partner_id
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
                  상품코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="상품코드를 입력하세요"
                />
                {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">카테고리를 선택하세요</option>
                  <option value="가전">가전</option>
                  <option value="가구">가구</option>
                  <option value="생활용품">생활용품</option>
                  <option value="의류">의류</option>
                  <option value="식품">식품</option>
                  <option value="도서">도서</option>
                  <option value="스포츠">스포츠</option>
                  <option value="기타">기타</option>
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품 설명
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="상품에 대한 상세한 설명을 입력하세요"
                />
              </div>
            </div>
          </div>

          {/* 파트너사 정보 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">파트너사 정보</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  파트너사 선택
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    {selectedPartner ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Building className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-medium text-green-800">{selectedPartner.name}</div>
                            <div className="text-sm text-green-600">코드: {selectedPartner.code}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearPartnerSelection}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 border border-gray-300 rounded-lg text-gray-500">
                        파트너사가 선택되지 않았습니다
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPartnerModal(true)}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    파트너사 선택
                  </button>
                </div>
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

        {/* 파트너사 선택 모달 */}
        {showPartnerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
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
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{partner.name}</div>
                        <div className="text-sm text-gray-500">코드: {partner.code}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowPartnerModal(false)}
                  className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 파일명 표시 */}
        <div className="mt-8 text-xs text-gray-400 text-center">
          EditProductForm.tsx
        </div>
      </div>
    </div>
  );
};

export default EditProductForm;