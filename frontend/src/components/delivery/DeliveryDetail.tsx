import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, User, MapPin, Calendar, Truck, Phone, Mail, Clock, FileText, Edit, Save, X } from 'lucide-react';
import { deliveriesAPI } from '../../services/api';

interface Delivery {
  id: number;
  tracking_number: string;
  product_name?: string;
  product_code?: string;
  request_type?: string;
  request_category?: string;
  status: string;
  visit_date?: string;
  sender_name?: string;
  sender_phone?: string;
  sender_address?: string;
  receiver_name?: string;
  receiver_phone?: string;
  receiver_address?: string;
  driver_id?: number;
  driver_name?: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

interface DeliveryDetailProps {
  delivery: Delivery;
  onNavigateBack: () => void;
}

const DeliveryDetail: React.FC<DeliveryDetailProps> = ({ delivery: initialDelivery, onNavigateBack }) => {
  const [delivery, setDelivery] = useState<Delivery>(initialDelivery);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: delivery.status,
    visit_date: delivery.visit_date || '',
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

  // 편집 모드 시작
  const handleEditStart = () => {
    setEditData({
      status: delivery.status,
      visit_date: delivery.visit_date || '',
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        </div>

        {/* 상품 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            상품 정보
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상품명</label>
              <div className="text-gray-900">{delivery.product_name || '-'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상품코드</label>
              <div className="text-gray-900 font-mono">{delivery.product_code || '-'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">의뢰종류</label>
              <div className="text-gray-900">{delivery.request_type || '-'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">의뢰타입</label>
              <div className="text-gray-900">{delivery.request_category || '-'}</div>
            </div>
          </div>
        </div>

        {/* 발송인 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            발송인 정보
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
              <div className="flex items-start gap-2 text-gray-900">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                {delivery.sender_address || '-'}
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
              <div className="text-gray-900">{delivery.receiver_name || '-'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
              <div className="flex items-center gap-2 text-gray-900">
                <Phone className="w-4 h-4 text-gray-400" />
                {delivery.receiver_phone || '-'}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
              <div className="flex items-start gap-2 text-gray-900">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                {delivery.receiver_address || '-'}
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

        {/* 특별 지시사항 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            특별 지시사항
          </h2>
          
          {isEditing ? (
            <textarea
              value={editData.special_instructions}
              onChange={(e) => handleInputChange('special_instructions', e.target.value)}
              placeholder="특별 지시사항을 입력하세요..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <div className="text-gray-900 whitespace-pre-wrap">
              {delivery.special_instructions || '특별 지시사항이 없습니다.'}
            </div>
          )}
        </div>

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