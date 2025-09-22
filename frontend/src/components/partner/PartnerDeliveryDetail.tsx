import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Clock, CheckCircle, Truck, AlertCircle, Camera, FileText, User, Phone, MapPin, Calendar, Weight } from 'lucide-react';
import { deliveriesAPI } from '../../services/api';

interface DeliveryDetail {
  id: number;
  tracking_number: string;
  sender_name: string;
  sender_address: string;
  weight: number;
  status: string;
  driver_id: number;
  created_at: string;
  updated_at: string;
  request_type: string;
  construction_type: string;
  visit_date: string;
  visit_time: string;
  furniture_company: string;
  main_memo: string;
  emergency_contact: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  building_type: string;
  floor_count: string;
  elevator_available: string;
  ladder_truck: string;
  disposal: string;
  room_movement: string;
  wall_construction: string;
  product_name: string;
  furniture_product_code: string;
  product_weight: string;
  product_size: string;
  box_size: string;
  furniture_requests: string;
  driver_notes: string;
  installation_photos: any[];
  customer_signature: string;
  delivery_fee: number;
  special_instructions: string;
  fragile: boolean;
  insurance_value: number;
  cod_amount: number;
  estimated_delivery: string;
  actual_delivery: string;
  delivery_attempts: number;
  last_location: string;
  detail_notes: string;
}

interface PartnerDeliveryDetailProps {
  deliveryId: number;
  onNavigateBack: () => void;
}

const PartnerDeliveryDetail: React.FC<PartnerDeliveryDetailProps> = ({ deliveryId, onNavigateBack }) => {
  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDeliveryDetail();
  }, [deliveryId]);

  const fetchDeliveryDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await deliveriesAPI.getDelivery(deliveryId);
      setDelivery(response.delivery);
    } catch (err: any) {
      setError('배송 상세정보를 불러오는데 실패했습니다.');
      console.error('배송 상세조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 상태 뱃지
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: '접수대기', icon: Clock },
      'confirmed': { color: 'bg-blue-100 text-blue-800', text: '접수완료', icon: Package },
      'in_progress': { color: 'bg-orange-100 text-orange-800', text: '배송중', icon: Truck },
      'delivered': { color: 'bg-green-100 text-green-800', text: '배송완료', icon: CheckCircle },
      'cancelled': { color: 'bg-red-100 text-red-800', text: '취소', icon: AlertCircle },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status || '알 수 없음', icon: Package };
    const IconComponent = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold ${config.color}`}>
        <IconComponent className="w-4 h-4" />
        {config.text}
      </div>
    );
  };

  // 필드 정보 셀 컴포넌트
  const InfoCell: React.FC<{ label: string; value: any; icon?: React.ComponentType<any>; type?: string }> = ({ 
    label, 
    value, 
    icon: Icon = FileText,
    type = 'text'
  }) => {
    const formatValue = (val: any, fieldType: string) => {
      if (val === null || val === undefined || val === '') return '-';
      
      switch (fieldType) {
        case 'date':
          return new Date(val).toLocaleDateString('ko-KR');
        case 'datetime':
          return new Date(val).toLocaleString('ko-KR');
        case 'currency':
          return `${Number(val).toLocaleString()}원`;
        case 'weight':
          return `${val}kg`;
        case 'boolean':
          return val ? '예' : '아니오';
        case 'json':
          return Array.isArray(val) ? `${val.length}개 항목` : '-';
        default:
          return String(val);
      }
    };

    return (
      <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-lg font-semibold text-gray-900">
          {formatValue(value, type)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={onNavigateBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                목록으로
              </button>
              <h1 className="text-2xl font-bold text-gray-900">배송 상세정보</h1>
              <div className="w-20"></div>
            </div>
          </div>
        </header>
        
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">배송 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={onNavigateBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                목록으로
              </button>
              <h1 className="text-2xl font-bold text-gray-900">배송 상세정보</h1>
              <div className="w-20"></div>
            </div>
          </div>
        </header>
        
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchDeliveryDetail}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              목록으로
            </button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">배송 상세정보</h1>
              <p className="text-blue-600 font-mono">{delivery.tracking_number}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusBadge(delivery.status)}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-500" />
            기본 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <InfoCell label="배송 ID" value={delivery.id} icon={Package} />
            <InfoCell label="운송장 번호" value={delivery.tracking_number} icon={Package} />
            <InfoCell label="상태" value={delivery.status} icon={CheckCircle} />
            <InfoCell label="접수일" value={delivery.created_at} icon={Calendar} type="datetime" />
            <InfoCell label="수정일" value={delivery.updated_at} icon={Calendar} type="datetime" />
            <InfoCell label="요청 유형" value={delivery.request_type} icon={FileText} />
            <InfoCell label="시공 유형" value={delivery.construction_type} icon={FileText} />
            <InfoCell label="기사 ID" value={delivery.driver_id} icon={User} />
          </div>
        </div>

        {/* 발송인 정보 */}
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <User className="w-6 h-6 text-green-500" />
            발송인 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoCell label="발송인 이름" value={delivery.sender_name} icon={User} />
            <InfoCell label="발송인 주소" value={delivery.sender_address} icon={MapPin} />
            <InfoCell label="가구업체" value={delivery.furniture_company} icon={FileText} />
            <InfoCell label="긴급 연락처" value={delivery.emergency_contact} icon={Phone} />
          </div>
        </div>

        {/* 수취인 정보 */}
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <User className="w-6 h-6 text-purple-500" />
            수취인 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoCell label="고객 이름" value={delivery.customer_name} icon={User} />
            <InfoCell label="고객 전화번호" value={delivery.customer_phone} icon={Phone} />
            <InfoCell label="고객 주소" value={delivery.customer_address} icon={MapPin} />
            <InfoCell label="방문 일자" value={delivery.visit_date} icon={Calendar} type="date" />
            <InfoCell label="방문 시간" value={delivery.visit_time} icon={Clock} />
          </div>
        </div>

        {/* 건물 정보 */}
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-orange-500" />
            건물 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <InfoCell label="건물 유형" value={delivery.building_type} icon={MapPin} />
            <InfoCell label="층수" value={delivery.floor_count} icon={FileText} />
            <InfoCell label="엘리베이터" value={delivery.elevator_available} icon={CheckCircle} />
            <InfoCell label="사다리차" value={delivery.ladder_truck} icon={Truck} />
            <InfoCell label="폐기물 처리" value={delivery.disposal} icon={FileText} />
            <InfoCell label="방간 이동" value={delivery.room_movement} icon={FileText} />
            <InfoCell label="벽면 시공" value={delivery.wall_construction} icon={FileText} />
          </div>
        </div>

        {/* 상품 정보 */}
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-500" />
            상품 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoCell label="상품명" value={delivery.product_name} icon={Package} />
            <InfoCell label="가구 제품코드" value={delivery.furniture_product_code} icon={FileText} />
            <InfoCell label="상품 중량" value={delivery.product_weight} icon={Weight} />
            <InfoCell label="상품 크기" value={delivery.product_size} icon={FileText} />
            <InfoCell label="박스 크기" value={delivery.box_size} icon={FileText} />
            <InfoCell label="전체 중량" value={delivery.weight} icon={Weight} type="weight" />
            <InfoCell label="파손 주의" value={delivery.fragile} icon={AlertCircle} type="boolean" />
          </div>
        </div>

        {/* 배송 정보 */}
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Truck className="w-6 h-6 text-red-500" />
            배송 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoCell label="배송비" value={delivery.delivery_fee} icon={FileText} type="currency" />
            <InfoCell label="보험가액" value={delivery.insurance_value} icon={FileText} type="currency" />
            <InfoCell label="착불금액" value={delivery.cod_amount} icon={FileText} type="currency" />
            <InfoCell label="예상배송일" value={delivery.estimated_delivery} icon={Calendar} type="datetime" />
            <InfoCell label="실제배송일" value={delivery.actual_delivery} icon={Calendar} type="datetime" />
            <InfoCell label="배송시도횟수" value={delivery.delivery_attempts} icon={FileText} />
            <InfoCell label="최종위치" value={delivery.last_location} icon={MapPin} />
          </div>
        </div>

        {/* 메모 및 특이사항 */}
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-gray-500" />
            메모 및 특이사항
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <InfoCell label="주요 메모" value={delivery.main_memo} icon={FileText} />
              <InfoCell label="특별 지시사항" value={delivery.special_instructions} icon={FileText} />
              <InfoCell label="가구 요청사항" value={delivery.furniture_requests} icon={FileText} />
            </div>
            <div className="space-y-6">
              <InfoCell label="기사 메모" value={delivery.driver_notes} icon={FileText} />
              <InfoCell label="상세 메모" value={delivery.detail_notes} icon={FileText} />
            </div>
          </div>
        </div>

        {/* 첨부파일 및 서명 */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Camera className="w-6 h-6 text-pink-500" />
            첨부파일 및 서명
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InfoCell label="설치 사진" value={delivery.installation_photos} icon={Camera} type="json" />
            <div className="bg-gray-50 rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">고객 서명</span>
              </div>
              <div className="text-sm text-gray-900">
                {delivery.customer_signature ? '서명 완료' : '서명 없음'}
              </div>
              {delivery.customer_signature && (
                <div className="mt-3 p-2 bg-white rounded border max-w-xs max-h-32 overflow-hidden">
                  <img 
                    src={delivery.customer_signature} 
                    alt="고객 서명" 
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 이지픽스 업체용 서비스. All rights reserved.</p>
            <p className="mt-1">안전하고 신뢰할 수 있는 배송 서비스를 제공합니다.</p>
          </div>
        </div>
      </footer>
      
      <div className="mt-4 text-xs text-gray-400 text-center">PartnerDeliveryDetail.tsx</div>
    </div>
  );
};

export default PartnerDeliveryDetail;