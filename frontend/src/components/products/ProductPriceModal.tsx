import React, { useState, useEffect } from 'react';
import { X, Search, Package, Calculator } from 'lucide-react';
import { fPriceAPI } from '../../services/api';

interface ProductPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPriceSelect: (price: number) => void;
}

interface PriceData {
  id: number;
  category: string;
  size: string;
  narim_cost: number;
  stair_2f: number;
  stair_3f: number;
  stair_4f: number;
  driver_10_increase: number;
  future_cost: number;
  profit_39: number;
  jeju_jeonla: number;
  profit_62: number;
}

const ProductPriceModal: React.FC<ProductPriceModalProps> = ({ 
  isOpen, 
  onClose, 
  onPriceSelect 
}) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 카테고리 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // 선택된 카테고리에 따른 사이즈 목록 로드
  useEffect(() => {
    if (selectedCategory) {
      loadSizes(selectedCategory);
      setSelectedSize(''); // 카테고리 변경 시 사이즈 선택 초기화
      setPriceData(null); // 가격 데이터 초기화
    }
  }, [selectedCategory]);

  // 카테고리와 사이즈가 모두 선택되면 가격 조회
  useEffect(() => {
    if (selectedCategory && selectedSize) {
      loadPrice(selectedCategory, selectedSize);
    }
  }, [selectedCategory, selectedSize]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fPriceAPI.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setError('카테고리 목록을 불러올 수 없습니다.');
      }
    } catch (error: any) {
      console.error('카테고리 로드 실패:', error);
      setError('카테고리 목록 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSizes = async (category: string) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fPriceAPI.getSizes(category);
      if (response.success && response.data) {
        setSizes(response.data);
      } else {
        setError('사이즈 목록을 불러올 수 없습니다.');
        setSizes([]);
      }
    } catch (error: any) {
      console.error('사이즈 로드 실패:', error);
      setError('사이즈 목록 조회 중 오류가 발생했습니다.');
      setSizes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPrice = async (category: string, size: string) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fPriceAPI.getPrice(category, size);
      if (response.success && response.data) {
        setPriceData(response.data);
      } else {
        setError('해당 카테고리와 사이즈의 가격 정보를 찾을 수 없습니다.');
        setPriceData(null);
      }
    } catch (error: any) {
      console.error('가격 로드 실패:', error);
      setError('가격 정보 조회 중 오류가 발생했습니다.');
      setPriceData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceSelect = () => {
    if (priceData && priceData.future_cost) {
      onPriceSelect(priceData.future_cost);
      onClose();
    }
  };

  const handleReset = () => {
    setSelectedCategory('');
    setSelectedSize('');
    setPriceData(null);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">배송비용 검색</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {/* 카테고리 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리 선택 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="">카테고리를 선택하세요</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* 사이즈 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사이즈 선택 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading || !selectedCategory}
            >
              <option value="">사이즈를 선택하세요</option>
              {sizes.map((size, index) => (
                <option key={index} value={size}>
                  {size}
                </option>
              ))}
            </select>
            {!selectedCategory && (
              <p className="text-sm text-gray-500 mt-1">먼저 카테고리를 선택해주세요</p>
            )}
          </div>

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* 가격 정보 표시 */}
          {priceData && !isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                가격 정보
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-600">카테고리:</span>
                  <p className="font-medium">{priceData.category}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">사이즈:</span>
                  <p className="font-medium">{priceData.size}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                  <span className="text-gray-600">내림비:</span>
                  <p className="font-semibold text-gray-900">{priceData.narim_cost?.toLocaleString() || 0}원</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="text-gray-600">계단(2층):</span>
                  <p className="font-semibold text-gray-900">{priceData.stair_2f?.toLocaleString() || 0}원</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="text-gray-600">계단(3층):</span>
                  <p className="font-semibold text-gray-900">{priceData.stair_3f?.toLocaleString() || 0}원</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="text-gray-600">계단(4층):</span>
                  <p className="font-semibold text-gray-900">{priceData.stair_4f?.toLocaleString() || 0}원</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="text-gray-600">기사(10%인상):</span>
                  <p className="font-semibold text-gray-900">{priceData.driver_10_increase?.toLocaleString() || 0}원</p>
                </div>
                <div className="bg-green-100 p-3 rounded border border-green-300">
                  <span className="text-green-700">미래 운임가격:</span>
                  <p className="font-bold text-green-900 text-lg">{priceData.future_cost?.toLocaleString() || 0}원</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={isLoading}
          >
            초기화
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            onClick={handlePriceSelect}
            disabled={!priceData || isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            운임가격 적용
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPriceModal;