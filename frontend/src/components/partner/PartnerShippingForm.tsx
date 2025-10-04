import React, { useState, useEffect } from 'react';
import {
  Package, User, MapPin, QrCode, 
  Search, ArrowLeft, Save, RefreshCw, 
  AlertCircle, CheckCircle
} from 'lucide-react';
import { shippingAPI, productsAPI } from '../../services/api';
import ProductSelectionModal from './ProductSelectionModal';
import QRCodeScannerModal from './QRCodeScannerModal';

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
}

interface ShippingFormData {
  // 상품 정보
  productId?: number;
  productCode: string;
  productName: string;
  productWeight: number;
  productValue: number;
  quantity: number;
  
  // 보내는 분 정보
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  senderAddress: string;
  senderDetailAddress: string;
  senderZipCode: string;
  
  // 받는 분 정보
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  recipientAddress: string;
  recipientDetailAddress: string;
  recipientZipCode: string;
  
  // 배송 옵션
  deliveryType: 'standard' | 'express' | 'overnight';
  deliveryDate?: string;
  deliveryMessage: string;
  paymentMethod: 'prepaid' | 'cod' | 'monthly';
  
  // 기타
  memo: string;
  insuranceValue?: number;
}

interface PartnerShippingFormProps {
  onNavigateBack: () => void;
}

const PartnerShippingForm: React.FC<PartnerShippingFormProps> = ({ onNavigateBack }) => {
  const [formData, setFormData] = useState<ShippingFormData>({
    productCode: '',
    productName: '',
    productWeight: 1,
    productValue: 0,
    quantity: 1,
    senderName: '',
    senderPhone: '',
    senderEmail: '',
    senderAddress: '',
    senderDetailAddress: '',
    senderZipCode: '',
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    recipientAddress: '',
    recipientDetailAddress: '',
    recipientZipCode: '',
    deliveryType: 'standard',
    deliveryMessage: '',
    paymentMethod: 'prepaid',
    memo: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showProductModal, setShowProductModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [trackingNumber, setTrackingNumber] = useState<string>('');

  // 폼 데이터 업데이트
  const updateFormData = (field: keyof ShippingFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 해당 필드 에러 제거
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 상품 선택
  const handleProductSelect = (product: Product) => {
    updateFormData('productId', product.id);
    updateFormData('productCode', product.maincode || product.subcode || '');
    updateFormData('productName', product.name);
    updateFormData('productWeight', product.weight || 1);
    updateFormData('productValue', product.cost1 || 0);
  };

  // QR 코드 스캔
  const handleQRCodeScanned = (code: string) => {
    updateFormData('productCode', code);
    // QR 코드로 상품 정보 자동 조회
    searchProductByCode(code);
  };

  // 상품 코드로 상품 검색
  const searchProductByCode = async (code: string) => {
    try {
      setLoading(true);
      const response = await productsAPI.searchByCode(code);
      if (response.product) {
        handleProductSelect(response.product);
      }
    } catch (error) {
      console.error('상품 검색 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 배송비 예상 계산
  const calculateEstimatedCost = async () => {
    if (!formData.senderZipCode || !formData.recipientZipCode || !formData.productWeight) {
      return;
    }

    try {
      const response = await shippingAPI.calculateShippingCost({
        productWeight: formData.productWeight,
        serviceType: formData.deliveryType
      });
      setEstimatedCost(response.estimatedCost);
    } catch (error) {
      console.error('배송비 계산 오류:', error);
    }
  };

  useEffect(() => {
    calculateEstimatedCost();
  }, [formData.senderZipCode, formData.recipientZipCode, formData.productWeight, formData.deliveryType]);

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 필수 필드 검사
    if (!formData.productName) newErrors.productName = '상품명을 입력해주세요.';
    if (!formData.senderName) newErrors.senderName = '보내는 분 이름을 입력해주세요.';
    if (!formData.senderPhone) newErrors.senderPhone = '보내는 분 연락처를 입력해주세요.';
    if (!formData.senderAddress) newErrors.senderAddress = '보내는 분 주소를 입력해주세요.';
    if (!formData.recipientName) newErrors.recipientName = '받는 분 이름을 입력해주세요.';
    if (!formData.recipientPhone) newErrors.recipientPhone = '받는 분 연락처를 입력해주세요.';
    if (!formData.recipientAddress) newErrors.recipientAddress = '받는 분 주소를 입력해주세요.';

    // 연락처 형식 검사
    const phoneRegex = /^[0-9-]+$/;
    if (formData.senderPhone && !phoneRegex.test(formData.senderPhone)) {
      newErrors.senderPhone = '올바른 연락처 형식이 아닙니다.';
    }
    if (formData.recipientPhone && !phoneRegex.test(formData.recipientPhone)) {
      newErrors.recipientPhone = '올바른 연락처 형식이 아닙니다.';
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.senderEmail && !emailRegex.test(formData.senderEmail)) {
      newErrors.senderEmail = '올바른 이메일 형식이 아닙니다.';
    }
    if (formData.recipientEmail && !emailRegex.test(formData.recipientEmail)) {
      newErrors.recipientEmail = '올바른 이메일 형식이 아닙니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 배송 신청 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await shippingAPI.createOrder(formData as any);
      setTrackingNumber(response.tracking_number || response.trackingNumber);
      
      // 성공 처리 - 초기화 또는 리다이렉션
      alert(`배송 신청이 완료되었습니다. 운송장 번호: ${response.trackingNumber}`);
      
    } catch (error: any) {
      console.error('배송 신청 오류:', error);
      alert('배송 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>이전화면</span>
            </button>
            
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">배송신청_업체용</h1>
                  <p className="text-sm text-blue-600 font-medium">간편하게 배송을 신청하세요</p>
                </div>
              </div>
            </div>
            
            <div className="w-[100px]"></div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 상품 정보 */}
          <div className="bg-white rounded-xl shadow-lg border p-8">
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">상품 정보</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품 코드
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.productCode}
                    onChange={(e) => updateFormData('productCode', e.target.value)}
                    placeholder="상품 코드 입력 또는 스캔"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowQRScanner(true)}
                    className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProductModal(true)}
                    className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품명 *
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => updateFormData('productName', e.target.value)}
                  placeholder="상품명을 입력하세요"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.productName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.productName && (
                  <p className="mt-1 text-sm text-red-600">{errors.productName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  무게 (kg)
                </label>
                <input
                  type="number"
                  value={formData.productWeight}
                  onChange={(e) => updateFormData('productWeight', parseFloat(e.target.value) || 0)}
                  min="0.1"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품 가액 (원)
                </label>
                <input
                  type="number"
                  value={formData.productValue}
                  onChange={(e) => updateFormData('productValue', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  수량
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => updateFormData('quantity', parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 보내는 분 정보 */}
          <div className="bg-white rounded-xl shadow-lg border p-8">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">보내는 분 정보</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  value={formData.senderName}
                  onChange={(e) => updateFormData('senderName', e.target.value)}
                  placeholder="보내는 분 이름"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.senderName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.senderName && (
                  <p className="mt-1 text-sm text-red-600">{errors.senderName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락처 *
                </label>
                <input
                  type="tel"
                  value={formData.senderPhone}
                  onChange={(e) => updateFormData('senderPhone', e.target.value)}
                  placeholder="010-0000-0000"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.senderPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.senderPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.senderPhone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={formData.senderEmail}
                  onChange={(e) => updateFormData('senderEmail', e.target.value)}
                  placeholder="sender@example.com"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.senderEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.senderEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.senderEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  우편번호
                </label>
                <input
                  type="text"
                  value={formData.senderZipCode}
                  onChange={(e) => updateFormData('senderZipCode', e.target.value)}
                  placeholder="12345"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  주소 *
                </label>
                <input
                  type="text"
                  value={formData.senderAddress}
                  onChange={(e) => updateFormData('senderAddress', e.target.value)}
                  placeholder="기본 주소"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.senderAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.senderAddress && (
                  <p className="mt-1 text-sm text-red-600">{errors.senderAddress}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상세 주소
                </label>
                <input
                  type="text"
                  value={formData.senderDetailAddress}
                  onChange={(e) => updateFormData('senderDetailAddress', e.target.value)}
                  placeholder="상세 주소"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 받는 분 정보 */}
          <div className="bg-white rounded-xl shadow-lg border p-8">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900">받는 분 정보</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  value={formData.recipientName}
                  onChange={(e) => updateFormData('recipientName', e.target.value)}
                  placeholder="받는 분 이름"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.recipientName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.recipientName && (
                  <p className="mt-1 text-sm text-red-600">{errors.recipientName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락처 *
                </label>
                <input
                  type="tel"
                  value={formData.recipientPhone}
                  onChange={(e) => updateFormData('recipientPhone', e.target.value)}
                  placeholder="010-0000-0000"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.recipientPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.recipientPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.recipientPhone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => updateFormData('recipientEmail', e.target.value)}
                  placeholder="recipient@example.com"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.recipientEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.recipientEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.recipientEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  우편번호
                </label>
                <input
                  type="text"
                  value={formData.recipientZipCode}
                  onChange={(e) => updateFormData('recipientZipCode', e.target.value)}
                  placeholder="12345"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  주소 *
                </label>
                <input
                  type="text"
                  value={formData.recipientAddress}
                  onChange={(e) => updateFormData('recipientAddress', e.target.value)}
                  placeholder="기본 주소"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.recipientAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.recipientAddress && (
                  <p className="mt-1 text-sm text-red-600">{errors.recipientAddress}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상세 주소
                </label>
                <input
                  type="text"
                  value={formData.recipientDetailAddress}
                  onChange={(e) => updateFormData('recipientDetailAddress', e.target.value)}
                  placeholder="상세 주소"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 배송 옵션 */}
          <div className="bg-white rounded-xl shadow-lg border p-8">
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">배송 옵션</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  배송 방법
                </label>
                <select
                  value={formData.deliveryType}
                  onChange={(e) => updateFormData('deliveryType', e.target.value as 'standard' | 'express' | 'overnight')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="standard">일반배송 (2-3일)</option>
                  <option value="express">특급배송 (1일)</option>
                  <option value="overnight">당일배송</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  결제 방법
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => updateFormData('paymentMethod', e.target.value as 'prepaid' | 'cod' | 'monthly')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="prepaid">선불</option>
                  <option value="cod">착불</option>
                  <option value="monthly">월 정산</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  희망 배송일
                </label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => updateFormData('deliveryDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예상 배송비
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-lg font-semibold text-green-600">
                  {estimatedCost > 0 ? `${estimatedCost.toLocaleString()}원` : '계산 중...'}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  배송 메시지
                </label>
                <input
                  type="text"
                  value={formData.deliveryMessage}
                  onChange={(e) => updateFormData('deliveryMessage', e.target.value)}
                  placeholder="배송 시 전달할 메시지"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 기타 옵션 */}
          <div className="bg-white rounded-xl shadow-lg border p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <h2 className="text-xl font-bold text-gray-900">기타 옵션</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  보험 가액 (원)
                </label>
                <input
                  type="number"
                  value={formData.insuranceValue || ''}
                  onChange={(e) => updateFormData('insuranceValue', parseInt(e.target.value) || undefined)}
                  placeholder="보험을 적용할 경우 상품 가액"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메모
                </label>
                <textarea
                  value={formData.memo}
                  onChange={(e) => updateFormData('memo', e.target.value)}
                  placeholder="추가적인 배송 요청사항이나 메모"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="bg-white rounded-xl shadow-lg border p-8">
            <div className="flex items-center justify-between">
              <div className="text-lg">
                <span className="text-gray-600">예상 배송비: </span>
                <span className="font-bold text-green-600 text-xl">
                  {estimatedCost > 0 ? `${estimatedCost.toLocaleString()}원` : '계산 중...'}
                </span>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  초기화
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {loading ? '처리 중...' : '배송 신청'}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* 운송장 번호 표시 */}
        {trackingNumber && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 mt-8">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-green-900">배송 신청 완료</h3>
            </div>
            <p className="text-green-800">
              운송장 번호: <span className="font-mono font-bold text-lg">{trackingNumber}</span>
            </p>
          </div>
        )}

        {/* 업체용 안내사항 */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-8 mt-8">
          <h3 className="text-xl font-bold text-blue-900 mb-4">배송신청 안내</h3>
          <ul className="text-blue-800 space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>모든 필수 항목(*)을 입력해야 배송 신청이 가능합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>상품 코드는 QR 스캔이나 상품 검색으로 자동 입력할 수 있습니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>배송비는 무게, 거리, 배송 방법에 따라 자동 계산됩니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>배송 신청 후 운송장 번호로 배송 상태를 추적할 수 있습니다.</span>
            </li>
          </ul>
        </div>
      </main>

      {/* 모달들 */}
      <ProductSelectionModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectProduct={handleProductSelect}
      />

      <QRCodeScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onQRCodeScanned={handleQRCodeScanned}
      />

      {/* 푸터 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2025 (주) 미래파트너. All rights reserved.</p>
            <p className="mt-1">간편하고 안전한 배송 서비스를 제공합니다.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PartnerShippingForm;

<div className="mt-4 text-xs text-gray-400 text-center">PartnerShippingForm.tsx</div>