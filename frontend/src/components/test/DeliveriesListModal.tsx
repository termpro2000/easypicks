import React from 'react';
import { Eye, Trash2 } from 'lucide-react';

interface DeliveriesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveries: any[];
  onDeliveryClick?: (delivery: any) => void;
  onDeleteDelivery?: (deliveryId: number, deliveryInfo: any) => void;
}

const DeliveriesListModal: React.FC<DeliveriesListModalProps> = ({
  isOpen,
  onClose,
  deliveries,
  onDeliveryClick,
  onDeleteDelivery,
}) => {
  if (!isOpen) return null;

  // null 값을 명시적으로 표시하는 헬퍼 함수
  const displayValue = (value: any, defaultValue: string = 'null') => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">{defaultValue}</span>;
    }
    return value;
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return displayValue(null);
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // 통화 포맷팅 함수
  const formatCurrency = (amount: number | null) => {
    if (!amount) return displayValue(null);
    return `${amount.toLocaleString()}원`;
  };

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
                    {/* 기본 정보 (1-10) */}
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">ID</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">운송장번호</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">발송자명</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">발송자주소</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">무게</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">상태</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">기사ID</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">생성일</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">수정일</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">의뢰종류</th>
                    
                    {/* 시공 및 배송 정보 (11-20) */}
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">시공유형</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">방문일</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">방문시간</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">가구회사</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">주요메모</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">비상연락처</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">고객명</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">고객전화</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">고객주소</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">건물형태</th>
                    
                    {/* 건물 및 시설 정보 (21-30) */}
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">층수</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">엘리베이터</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">사다리차</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">폐기</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">방간이동</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">벽시공</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">상품명</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">상품코드</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">상품무게</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">상품크기</th>
                    
                    {/* 상품 및 서비스 정보 (31-40) */}
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">박스크기</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">가구요청사항</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">기사메모</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">설치사진</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">고객서명</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">배송비</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">특별지시사항</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">깨지기쉬움</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">보험가치</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">착불금액</th>
                    
                    {/* 배송 진행 정보 (41-52) */}
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">예상배송일</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">실제배송일</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">배송시도</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">마지막위치</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">상세메모</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">거리</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">취소상태</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">취소사유</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">취소일시</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">고객완료요청</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">업체완료요청</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">완료오디오</th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((delivery) => (
                    <tr 
                      key={delivery.id} 
                      className="hover:bg-gray-50"
                    >
                      {/* 기본 정보 (1-10) */}
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.id)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.tracking_number)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.sender_name)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.sender_address)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.weight)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {delivery.status ? (
                          <span className={`px-1 py-0.5 rounded text-xs ${
                            delivery.status === '배송완료' ? 'bg-green-100 text-green-800' :
                            delivery.status === '배송중' ? 'bg-blue-100 text-blue-800' :
                            delivery.status === '집화완료' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {delivery.status}
                          </span>
                        ) : displayValue(null)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.driver_id)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{formatDate(delivery.created_at)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{formatDate(delivery.updated_at)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.request_type)}</td>
                      
                      {/* 시공 및 배송 정보 (11-20) */}
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.construction_type)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{formatDate(delivery.visit_date)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.visit_time)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.furniture_company)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.main_memo)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.emergency_contact)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.customer_name)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.customer_phone)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.customer_address)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.building_type)}</td>
                      
                      {/* 건물 및 시설 정보 (21-30) */}
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.floor_count)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                        {delivery.elevator_available ? (
                          <span className={`px-1 py-0.5 rounded text-xs ${
                            delivery.elevator_available === '있음' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {delivery.elevator_available}
                          </span>
                        ) : displayValue(null)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                        {delivery.ladder_truck ? (
                          <span className={`px-1 py-0.5 rounded text-xs ${
                            delivery.ladder_truck === '필요' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {delivery.ladder_truck}
                          </span>
                        ) : displayValue(null)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.disposal)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.room_movement)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.wall_construction)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.product_name)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.furniture_product_code)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.product_weight)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.product_size)}</td>
                      
                      {/* 상품 및 서비스 정보 (31-40) */}
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.box_size)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.furniture_requests)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.driver_notes)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {delivery.installation_photos && Array.isArray(delivery.installation_photos) && delivery.installation_photos.length > 0 
                          ? `${delivery.installation_photos.length}개` 
                          : displayValue(null)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {delivery.customer_signature ? '있음' : displayValue(null)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{formatCurrency(delivery.delivery_fee)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.special_instructions)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                        {delivery.fragile !== null && delivery.fragile !== undefined ? (
                          <span className={`px-1 py-0.5 rounded text-xs ${
                            delivery.fragile ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {delivery.fragile ? '주의' : '일반'}
                          </span>
                        ) : displayValue(null)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{formatCurrency(delivery.insurance_value)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{formatCurrency(delivery.cod_amount)}</td>
                      
                      {/* 배송 진행 정보 (41-52) */}
                      <td className="border border-gray-300 px-2 py-1 text-xs">{formatDate(delivery.estimated_delivery)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{formatDate(delivery.actual_delivery)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.delivery_attempts, '0')}회</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.last_location)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.detail_notes)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.distance)}km</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {delivery.cancel_status ? (
                          <span className="px-1 py-0.5 rounded text-xs bg-red-100 text-red-800">취소됨</span>
                        ) : (
                          <span className="px-1 py-0.5 rounded text-xs bg-green-100 text-green-800">정상</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{displayValue(delivery.cancel_reason)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{formatDate(delivery.canceled_at)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {delivery.customer_requested_completion ? (
                          <span className="px-1 py-0.5 rounded text-xs bg-green-100 text-green-800">요청</span>
                        ) : displayValue(null, '미요청')}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {delivery.furniture_company_requested_completion ? (
                          <span className="px-1 py-0.5 rounded text-xs bg-green-100 text-green-800">요청</span>
                        ) : displayValue(null, '미요청')}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {delivery.completion_audio_file ? '있음' : displayValue(null)}
                      </td>
                      
                      {/* 작업 버튼들 */}
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        <div className="flex gap-2 justify-center">
                          {/* 상세정보 버튼 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeliveryClick?.(delivery);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="상세정보 보기"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {/* 삭제 버튼 */}
                          {onDeleteDelivery && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteDelivery(delivery.id, delivery);
                              }}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="배송 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <div>총 {deliveries.length}개의 배송 데이터</div>
            <div className="text-xs text-gray-500">
              • 52개 전체 필드 표시 (null 값은 <span className="text-gray-400 italic">null</span>로 표시)
            </div>
            <div className="text-xs text-gray-500">
              • <Eye className="inline w-3 h-3 text-blue-600" /> 상세정보 보기, <Trash2 className="inline w-3 h-3 text-red-600" /> 개별 배송 삭제
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveriesListModal;