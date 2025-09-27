import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, User, MapPin, Calendar, Truck, Phone, Clock, FileText, Edit, Save, X } from 'lucide-react';
import { deliveriesAPI, deliveryDetailsAPI } from '../../services/api';

interface Delivery {
  id: number;
  tracking_number: string;
  // 상품 정보
  product_name?: string;
  product_code?: string;
  product_quantity?: number;
  product_size?: string;
  product_weight?: string;
  product_sku?: string;
  request_type?: string;
  request_category?: string;
  // 배송 상태 및 일정
  status: string;
  visit_date?: string;
  visit_time?: string;
  action_date?: string;
  action_time?: string;
  // 발송인 정보
  sender_name?: string;
  sender_phone?: string;
  sender_address?: string;
  sender_detail_address?: string;
  sender_zipcode?: string;
  sender_company?: string;
  sender_email?: string;
  // 수취인 정보 (고객)
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  // 기사 정보
  driver_id?: number;
  driver_name?: string;
  // 배송 관련 정보
  delivery_fee?: number;
  cod_amount?: number;
  insurance_amount?: number;
  requires_signature?: boolean;
  is_fragile?: boolean;
  is_frozen?: boolean;
  // 메모 및 지시사항
  special_instructions?: string;
  delivery_memo?: string;
  main_memo?: string;
  driver_notes?: string;
  detail_notes?: string;
  // 설치 및 사진
  installation_photos?: string | string[];
  // 타임스탬프
  created_at: string;
  updated_at: string;
}

interface DeliveryDetailProps {
  delivery: Delivery;
  onNavigateBack: () => void;
}

interface Product {
  id?: string;
  product_code?: string;
  product_name?: string;
  product_size?: string;
  box_size?: string;
  product_weight?: string;
}

const DeliveryDetail: React.FC<DeliveryDetailProps> = ({ delivery: initialDelivery, onNavigateBack }) => {
  const [delivery, setDelivery] = useState<Delivery>(initialDelivery);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [editData, setEditData] = useState({
    status: delivery.status,
    visit_date: delivery.visit_date || '',
    visit_time: delivery.visit_time || '',
    action_date: delivery.action_date || '',
    action_time: delivery.action_time || '',
    special_instructions: delivery.special_instructions || ''
  });

  // 배송 상태 옵션
  const statusOptions = [
    { value: 'pending', label: '대기 중', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'assigned', label: '배정됨', color: 'bg-blue-100 text-blue-800' },
    { value: 'picked_up', label: '픽업 완료', color: 'bg-purple-100 text-purple-800' },
    { value: 'in_transit', label: '배송 중', color: 'bg-orange-100 text-orange-800' },
    { value: 'delivered', label: '배송 완료', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: '취소됨', color: 'bg-red-100 text-red-800' },
    { value: 'delayed', label: '지연됨', color: 'bg-gray-100 text-gray-800' }
  ];

  // 상태별 색상 반환
  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  // 상태 한글 변환
  const getStatusText = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption?.label || status;
  };

  // 날짜 포맷팅
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 최신 배송 정보 조회
  const fetchDeliveryDetail = async () => {
    try {
      setLoading(true);
      const response = await deliveriesAPI.getDelivery(delivery.id);
      if (response.delivery) {
        setDelivery(response.delivery);
      }
    } catch (error) {
      console.error('배송 상세정보 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 제품 정보 조회
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await deliveryDetailsAPI.getDeliveryProducts(delivery.id);
      if (response.success && response.products) {
        setProducts(response.products);
      }
    } catch (error) {
      console.error('제품 정보 조회 실패:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  // 컴포넌트 마운트시 제품 정보 로드
  useEffect(() => {
    fetchProducts();
  }, [delivery.id]);

  // 편집 모드 시작
  const handleEditStart = () => {
    setEditData({
      status: delivery.status,
      visit_date: delivery.visit_date || '',
      visit_time: delivery.visit_time || '',
      action_date: delivery.action_date || '',
      action_time: delivery.action_time || '',
      special_instructions: delivery.special_instructions || ''
    });
    setIsEditing(true);
  };

  // 편집 취소
  const handleEditCancel = () => {
    setIsEditing(false);
  };

  // 배송 정보 업데이트
  const handleSave = async () => {
    try {
      setLoading(true);
      await deliveriesAPI.updateDelivery(delivery.id, editData);
      await fetchDeliveryDetail(); // 최신 정보 다시 조회
      setIsEditing(false);
    } catch (error) {
      console.error('배송 정보 업데이트 실패:', error);
      alert('배송 정보 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 입력값 변경 핸들러
  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onNavigateBack}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                배송목록으로
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-7 h-7 text-blue-600" />
                  배송 상세정보
                </h1>
                <p className="text-gray-600 mt-1">트래킹번호: {delivery.tracking_number}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={handleEditStart}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  편집
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleEditCancel}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    저장
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 배송 상태 카드 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">배송 상태</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
              {getStatusText(delivery.status)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                현재 상태
              </label>
              {isEditing ? (
                <select
                  value={editData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-lg font-medium text-gray-900">{getStatusText(delivery.status)}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                방문 예정일
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.visit_date}
                  onChange={(e) => handleInputChange('visit_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(delivery.visit_date)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                방문 예정시간
              </label>
              {isEditing ? (
                <input
                  type="time"
                  value={editData.visit_time}
                  onChange={(e) => handleInputChange('visit_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {delivery.visit_time || '-'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                실행 예정일
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.action_date}
                  onChange={(e) => handleInputChange('action_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(delivery.action_date)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                실행 예정시간
              </label>
              {isEditing ? (
                <input
                  type="time"
                  value={editData.action_time}
                  onChange={(e) => handleInputChange('action_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {delivery.action_time || '-'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 상품 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            상품 정보 {products.length > 0 && `(${products.length}개)`}
          </h2>
          
          {productsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">상품 정보를 불러오는 중...</div>
            </div>
          ) : products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상품코드
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상품명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상품크기
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      박스크기
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      무게
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product, index) => (
                    <tr key={product.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {product.product_code || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.product_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.product_size || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.box_size || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.product_weight || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2 text-sm text-gray-500">
                이 배송에 등록된 상품 정보가 없습니다.
              </div>
            </div>
          )}
          
          {/* 기존 배송 정보의 특성 표시 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">의뢰종류</label>
                <div className="text-gray-900">{delivery.request_type || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">의뢰타입</label>
                <div className="text-gray-900">{delivery.request_category || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">특성</label>
                <div className="flex gap-2 flex-wrap">
                  {delivery.is_fragile && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      취급주의
                    </span>
                  )}
                  {delivery.is_frozen && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      냉동
                    </span>
                  )}
                  {delivery.requires_signature && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      서명필요
                    </span>
                  )}
                  {!delivery.is_fragile && !delivery.is_frozen && !delivery.requires_signature && (
                    <span className="text-gray-500">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 발송인 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            발송인 정보
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <div className="text-gray-900">{delivery.sender_name || '-'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
              <div className="flex items-center gap-2 text-gray-900">
                <Phone className="w-4 h-4 text-gray-400" />
                {delivery.sender_phone || '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <div className="text-gray-900">{delivery.sender_email || '-'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
              <div className="text-gray-900">{delivery.sender_company || '-'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">우편번호</label>
              <div className="text-gray-900 font-mono">{delivery.sender_zipcode || '-'}</div>
            </div>
            <div></div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
              <div className="flex items-start gap-2 text-gray-900">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <div>{delivery.sender_address || '-'}</div>
                  {delivery.sender_detail_address && (
                    <div className="text-gray-600 text-sm mt-1">{delivery.sender_detail_address}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 수취인 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-600" />
            수취인 정보
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <div className="text-gray-900">{delivery.customer_name || '-'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
              <div className="flex items-center gap-2 text-gray-900">
                <Phone className="w-4 h-4 text-gray-400" />
                {delivery.customer_phone || '-'}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
              <div className="flex items-start gap-2 text-gray-900">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                {delivery.customer_address || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* 배송 담당자 정보 */}
        {delivery.driver_name && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-purple-600" />
              배송 담당자
            </h2>
            
            <div className="text-gray-900">{delivery.driver_name}</div>
          </div>
        )}

        {/* 배송 비용 정보 */}
        {(delivery.delivery_fee || delivery.cod_amount || delivery.insurance_amount) && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              배송 비용 정보
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배송비</label>
                <div className="text-gray-900">
                  {delivery.delivery_fee ? `${delivery.delivery_fee.toLocaleString()}원` : '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">착불요금</label>
                <div className="text-gray-900">
                  {delivery.cod_amount ? `${delivery.cod_amount.toLocaleString()}원` : '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">보험료</label>
                <div className="text-gray-900">
                  {delivery.insurance_amount ? `${delivery.insurance_amount.toLocaleString()}원` : '-'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 메모 및 지시사항 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            메모 및 지시사항
          </h2>
          
          <div className="space-y-6">
            {/* 특별 지시사항 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">특별 지시사항</label>
              {isEditing ? (
                <textarea
                  value={editData.special_instructions}
                  onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                  placeholder="특별 지시사항을 입력하세요..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                  {delivery.special_instructions || '특별 지시사항이 없습니다.'}
                </div>
              )}
            </div>

            {/* 기타 메모들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배송 메모</label>
                <div className="text-gray-900 bg-gray-50 p-3 rounded-lg min-h-[60px]">
                  {delivery.delivery_memo || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주요 메모</label>
                <div className="text-gray-900 bg-gray-50 p-3 rounded-lg min-h-[60px]">
                  {delivery.main_memo || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기사 메모</label>
                <div className="text-gray-900 bg-gray-50 p-3 rounded-lg min-h-[60px]">
                  {delivery.driver_notes || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상세 메모</label>
                <div className="text-gray-900 bg-gray-50 p-3 rounded-lg min-h-[60px]">
                  {delivery.detail_notes || '-'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 설치 사진 */}
        {delivery.installation_photos && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              설치 사진
            </h2>
            
            <div className="space-y-2">
              {Array.isArray(delivery.installation_photos) ? (
                delivery.installation_photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {delivery.installation_photos.map((photo, index) => (
                      <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={photo} 
                          alt={`설치 사진 ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(photo, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">설치 사진이 없습니다.</div>
                )
              ) : (
                typeof delivery.installation_photos === 'string' && delivery.installation_photos ? (
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden max-w-xs">
                    <img 
                      src={delivery.installation_photos} 
                      alt="설치 사진"
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(delivery.installation_photos as string, '_blank')}
                    />
                  </div>
                ) : (
                  <div className="text-gray-500">설치 사진이 없습니다.</div>
                )
              )}
            </div>
          </div>
        )}

        {/* 시간 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            시간 정보
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">등록일시</label>
              <div className="text-gray-900">{formatDateTime(delivery.created_at)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최종 수정일시</label>
              <div className="text-gray-900">{formatDateTime(delivery.updated_at)}</div>
            </div>
          </div>
        </div>

        {/* 파일명 표시 */}
        <div className="text-xs text-gray-400 text-center">
          DeliveryDetail.tsx
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetail;