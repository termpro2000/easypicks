import React from 'react';

interface DeliveriesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveries: any[];
  onDeliveryClick?: (delivery: any) => void;
}

const DeliveriesListModal: React.FC<DeliveriesListModalProps> = ({
  isOpen,
  onClose,
  deliveries,
  onDeliveryClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">배송 목록</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          {deliveries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              배송 데이터가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">ID</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">운송장번호</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">발송자명</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">발송자주소</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">포장타입</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">무게</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">상태</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">기사ID</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">의뢰종류</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">시공유형</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">방문일</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">방문시간</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">담당기사</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">가구사</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">주요메모</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">비상연락망</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">고객명</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">고객전화</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">고객주소</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">건물형태</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">층수</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">엘리베이터</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">사다리차</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">내림</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">방간이동</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">벽시공</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">상품명</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">상품코드</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">상품무게</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">상품크기</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">박스크기</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">가구요청사항</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">기사메모</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">배송비</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">특별지시사항</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">깨지기쉬움</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">보험가치</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">착불금액</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">기사명</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">예상배송</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">실제배송</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">배송시도</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">마지막위치</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">상세메모</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((delivery) => (
                    <tr 
                      key={delivery.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onDeliveryClick?.(delivery)}
                    >
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.id}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.tracking_number}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.sender_name}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.sender_address}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.package_type}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.weight}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          delivery.status === '배송완료' ? 'bg-green-100 text-green-800' :
                          delivery.status === '배송중' ? 'bg-blue-100 text-blue-800' :
                          delivery.status === '집화완료' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {delivery.status}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.assigned_driver_id}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.request_type}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.construction_type}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.visit_date}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.visit_time}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.assigned_driver}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.furniture_company}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.main_memo}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.emergency_contact}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.customer_name}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.customer_phone}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.customer_address}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.building_type}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.floor_count}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          delivery.elevator_available === '있음' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {delivery.elevator_available}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          delivery.ladder_truck === '필요' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {delivery.ladder_truck}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          delivery.disposal === '필요' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {delivery.disposal}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          delivery.room_movement === '있음' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {delivery.room_movement}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          delivery.wall_construction === '필요' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {delivery.wall_construction}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.product_name}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.furniture_product_code}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.product_weight}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.product_size}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.box_size}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.furniture_requests}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.driver_notes}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.delivery_fee?.toLocaleString()}원</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.special_instructions}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          delivery.fragile ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {delivery.fragile ? '주의' : '일반'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.insurance_value?.toLocaleString()}원</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.cod_amount?.toLocaleString()}원</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.driver_name}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.estimated_delivery ? new Date(delivery.estimated_delivery).toLocaleDateString() : ''}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.actual_delivery ? new Date(delivery.actual_delivery).toLocaleDateString() : ''}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.delivery_attempts}회</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.last_location}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{delivery.detail_notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-600">
            총 {deliveries.length}개의 배송 데이터
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveriesListModal;