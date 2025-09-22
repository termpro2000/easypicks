import React from 'react';
import { X } from 'lucide-react';

interface DeliveryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: any;
}

const DeliveryDetailModal: React.FC<DeliveryDetailModalProps> = ({
  isOpen,
  onClose,
  delivery,
}) => {
  if (!isOpen || !delivery) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '-';
    return `${amount.toLocaleString()}원`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">배송 상세정보</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">기본 정보</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">배송 ID:</span>
                  <span className="font-medium">{delivery.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">운송장번호:</span>
                  <span className="font-medium">{delivery.tracking_number || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">상태:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    delivery.status === '배송완료' ? 'bg-green-100 text-green-800' :
                    delivery.status === '배송중' ? 'bg-blue-100 text-blue-800' :
                    delivery.status === '집화완료' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {delivery.status || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">의뢰종류:</span>
                  <span className="font-medium">{delivery.request_type || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">방문일:</span>
                  <span className="font-medium">{delivery.visit_date || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">방문시간:</span>
                  <span className="font-medium">{delivery.visit_time || '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">발송자 정보</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">발송자명:</span>
                  <span className="font-medium">{delivery.sender_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">발송자주소:</span>
                  <span className="font-medium text-right flex-1 ml-2 text-sm">{delivery.sender_address || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 고객 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">고객 정보</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">고객명:</span>
                  <span className="font-medium">{delivery.customer_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">고객전화:</span>
                  <span className="font-medium">{delivery.customer_phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">고객주소:</span>
                  <span className="font-medium text-right flex-1 ml-2 text-sm">{delivery.customer_address || '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">상품 정보</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">상품명:</span>
                  <span className="font-medium">{delivery.product_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">상품코드:</span>
                  <span className="font-medium">{delivery.furniture_product_code || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">무게:</span>
                  <span className="font-medium">{delivery.weight || delivery.product_weight || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">크기:</span>
                  <span className="font-medium">{delivery.product_size || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">깨지기쉬움:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    delivery.fragile ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {delivery.fragile ? '주의' : '일반'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 배송 상세 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">배송 정보</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">담당기사:</span>
                  <span className="font-medium">{delivery.assigned_driver || delivery.driver_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">기사ID:</span>
                  <span className="font-medium">{delivery.assigned_driver_id || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">예상배송:</span>
                  <span className="font-medium">{formatDate(delivery.estimated_delivery)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">실제배송:</span>
                  <span className="font-medium">{formatDate(delivery.actual_delivery)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">배송시도:</span>
                  <span className="font-medium">{delivery.delivery_attempts || 0}회</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">마지막위치:</span>
                  <span className="font-medium">{delivery.last_location || '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">비용 정보</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">배송비:</span>
                  <span className="font-medium">{formatCurrency(delivery.delivery_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">착불금액:</span>
                  <span className="font-medium">{formatCurrency(delivery.cod_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">보험가치:</span>
                  <span className="font-medium">{formatCurrency(delivery.insurance_value)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 시공 정보 */}
          <div className="bg-orange-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">시공 정보</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <span className="text-gray-600 block text-sm">건물형태</span>
                <span className="font-medium">{delivery.building_type || '-'}</span>
              </div>
              <div className="text-center">
                <span className="text-gray-600 block text-sm">층수</span>
                <span className="font-medium">{delivery.floor_count || '-'}</span>
              </div>
              <div className="text-center">
                <span className="text-gray-600 block text-sm">엘리베이터</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  delivery.elevator_available === '있음' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {delivery.elevator_available || '-'}
                </span>
              </div>
              <div className="text-center">
                <span className="text-gray-600 block text-sm">사다리차</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  delivery.ladder_truck === '필요' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {delivery.ladder_truck || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-4">
            {delivery.main_memo && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">주요메모</h4>
                <p className="text-gray-700">{delivery.main_memo}</p>
              </div>
            )}
            
            {delivery.special_instructions && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">특별지시사항</h4>
                <p className="text-gray-700">{delivery.special_instructions}</p>
              </div>
            )}
            
            {delivery.driver_notes && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">기사메모</h4>
                <p className="text-gray-700">{delivery.driver_notes}</p>
              </div>
            )}
            
            {delivery.detail_notes && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">상세메모</h4>
                <p className="text-gray-700">{delivery.detail_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetailModal;