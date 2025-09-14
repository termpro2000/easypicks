import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Package, User, MapPin, Settings, FileText, Truck, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { deliveriesAPI } from '../../services/api';

interface DeliveryData {
  // 기본 필드 (실제 DB 스키마 기준)
  id: number;
  tracking_number: string;
  sender_name: string;
  sender_address: string;
  weight: number;
  status: string;
  assigned_driver_id: number;
  created_at: string;
  updated_at: string;
  
  // 확장 필드 (실제 DB 스키마 기준)
  request_type: string;
  construction_type: string;
  visit_date: string;
  visit_time: string;
  assigned_driver: string;
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
  installation_photos: any;
  customer_signature: string;
  delivery_fee: number;
  special_instructions: string;
  fragile: boolean;
  insurance_value: number;
  cod_amount: number;
  driver_id: string;
  driver_name: string;
  estimated_delivery: string;
  actual_delivery: string;
  delivery_attempts: number;
  last_location: string;
  detail_notes: string;
}

const DeliveryDetailView: React.FC = () => {
  // URL에서 직접 ID 추출
  const getDeliveryIdFromUrl = () => {
    const path = window.location.pathname;
    const match = path.match(/\/delivery\/(\d+)/);
    return match ? match[1] : null;
  };
  
  const id = getDeliveryIdFromUrl();
  const { user } = useAuth();
  
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    console.log('DeliveryDetailView mounted');
    console.log('Current URL:', window.location.pathname);
    console.log('useParams id:', id);
    console.log('ID type:', typeof id);
    
    if (id) {
      console.log('Fetching delivery data for ID:', id);
      fetchDeliveryData(parseInt(id));
    } else {
      console.log('No ID found - setting error');
      setLoading(false);
      alert('잘못된 접근입니다.');
    }
  }, [id]);

  const fetchDeliveryData = async (deliveryId: number) => {
    try {
      setLoading(true);
      const response = await deliveriesAPI.getDelivery(deliveryId);
      console.log('Delivery API 응답:', response);
      // API 응답이 { delivery: {...} } 구조일 경우
      setDeliveryData(response.delivery || response.data || response);
    } catch (error) {
      console.error('배송 정보 조회 실패:', error);
      alert('배송 정보를 불러오는데 실패했습니다.');
      window.history.back();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof DeliveryData, value: any) => {
    if (!deliveryData) return;
    
    setDeliveryData({
      ...deliveryData,
      [field]: value
    });
    setIsEdited(true);
  };

  const handleSave = async () => {
    if (!deliveryData || !id) return;

    try {
      setSaving(true);
      await deliveriesAPI.updateDelivery(parseInt(id), deliveryData);
      setIsEdited(false);
      alert('저장되었습니다.');
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic', name: '기본 정보', icon: Package },
    { id: 'sender', name: '발송인', icon: User },
    { id: 'customer', name: '고객 정보', icon: MapPin },
    { id: 'building', name: '건물 정보', icon: Settings },
    { id: 'product', name: '상품 정보', icon: Package },
    { id: 'work', name: '작업 옵션', icon: Settings },
    { id: 'notes', name: '메모/기타', icon: FileText }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!deliveryData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">배송 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                대시보드로 돌아가기
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">배송상세정보</h1>
                <p className="text-sm text-gray-500">운송장: {deliveryData.tracking_number}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isEdited && (
                <div className="flex items-center gap-1 text-orange-600 text-sm">
                  <Clock className="w-4 h-4" />
                  저장되지 않은 변경사항이 있습니다
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !isEdited}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${
                  saving || !isEdited 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Save className="w-5 h-5" />
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'basic' && (
            <BasicInfoTab 
              data={deliveryData} 
              onChange={handleInputChange}
            />
          )}
          {activeTab === 'sender' && (
            <SenderInfoTab 
              data={deliveryData} 
              onChange={handleInputChange}
            />
          )}
          {activeTab === 'customer' && (
            <CustomerInfoTab 
              data={deliveryData} 
              onChange={handleInputChange}
            />
          )}
          {activeTab === 'building' && (
            <BuildingInfoTab 
              data={deliveryData} 
              onChange={handleInputChange}
            />
          )}
          {activeTab === 'product' && (
            <ProductInfoTab 
              data={deliveryData} 
              onChange={handleInputChange}
            />
          )}
          {activeTab === 'work' && (
            <WorkOptionsTab 
              data={deliveryData} 
              onChange={handleInputChange}
            />
          )}
          {activeTab === 'notes' && (
            <NotesTab 
              data={deliveryData} 
              onChange={handleInputChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// 기본 정보 탭
const BasicInfoTab: React.FC<{ data: DeliveryData; onChange: (field: keyof DeliveryData, value: any) => void }> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 배송 정보</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">운송장 번호</label>
          <input
            type="text"
            value={data.tracking_number}
            onChange={(e) => onChange('tracking_number', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">배송 상태</label>
          <select
            value={data.status}
            onChange={(e) => onChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pending">접수완료</option>
            <option value="in_transit">배송중</option>
            <option value="delivered">배송완료</option>
            <option value="cancelled">취소</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">의뢰 종류</label>
          <input
            type="text"
            value={data.request_type || ''}
            onChange={(e) => onChange('request_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>


        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">중량 (kg)</label>
          <input
            type="number"
            step="0.1"
            value={data.weight || ''}
            onChange={(e) => onChange('weight', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">배정 기사</label>
          <input
            type="text"
            value={data.assigned_driver || ''}
            onChange={(e) => onChange('assigned_driver', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">방문 날짜</label>
          <input
            type="date"
            value={data.visit_date || ''}
            onChange={(e) => onChange('visit_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">방문 시간</label>
          <input
            type="time"
            value={data.visit_time || ''}
            onChange={(e) => onChange('visit_time', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

// 발송인 정보 탭
const SenderInfoTab: React.FC<{ data: DeliveryData; onChange: (field: keyof DeliveryData, value: any) => void }> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">발송인 정보</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">발송인 이름</label>
          <input
            type="text"
            value={data.sender_name || ''}
            onChange={(e) => onChange('sender_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">발송인 주소</label>
          <input
            type="text"
            value={data.sender_address || ''}
            onChange={(e) => onChange('sender_address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

// 고객 정보 탭
const CustomerInfoTab: React.FC<{ data: DeliveryData; onChange: (field: keyof DeliveryData, value: any) => void }> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">고객 정보</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">고객 이름</label>
          <input
            type="text"
            value={data.customer_name || ''}
            onChange={(e) => onChange('customer_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">고객 전화번호</label>
          <input
            type="text"
            value={data.customer_phone || ''}
            onChange={(e) => onChange('customer_phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">고객 주소</label>
          <input
            type="text"
            value={data.customer_address || ''}
            onChange={(e) => onChange('customer_address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">비상 연락처</label>
          <input
            type="text"
            value={data.emergency_contact || ''}
            onChange={(e) => onChange('emergency_contact', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

// 건물 정보 탭
const BuildingInfoTab: React.FC<{ data: DeliveryData; onChange: (field: keyof DeliveryData, value: any) => void }> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">건물 정보</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">건물 유형</label>
          <input
            type="text"
            value={data.building_type || ''}
            onChange={(e) => onChange('building_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">층수</label>
          <input
            type="text"
            value={data.floor_count || ''}
            onChange={(e) => onChange('floor_count', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">엘리베이터 사용 가능</label>
          <select
            value={data.elevator_available || ''}
            onChange={(e) => onChange('elevator_available', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">선택하세요</option>
            <option value="있음">있음</option>
            <option value="없음">없음</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">사다리차</label>
          <select
            value={data.ladder_truck || ''}
            onChange={(e) => onChange('ladder_truck', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">선택하세요</option>
            <option value="필요">필요</option>
            <option value="불필요">불필요</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// 상품 정보 탭
const ProductInfoTab: React.FC<{ data: DeliveryData; onChange: (field: keyof DeliveryData, value: any) => void }> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">상품 정보</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">상품명</label>
          <input
            type="text"
            value={data.product_name || ''}
            onChange={(e) => onChange('product_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">가구 상품 코드</label>
          <input
            type="text"
            value={data.furniture_product_code || ''}
            onChange={(e) => onChange('furniture_product_code', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">상품 무게</label>
          <input
            type="text"
            value={data.product_weight || ''}
            onChange={(e) => onChange('product_weight', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">상품 크기</label>
          <input
            type="text"
            value={data.product_size || ''}
            onChange={(e) => onChange('product_size', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">박스 크기</label>
          <input
            type="text"
            value={data.box_size || ''}
            onChange={(e) => onChange('box_size', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">가구 회사</label>
          <input
            type="text"
            value={data.furniture_company || ''}
            onChange={(e) => onChange('furniture_company', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

// 작업 옵션 탭
const WorkOptionsTab: React.FC<{ data: DeliveryData; onChange: (field: keyof DeliveryData, value: any) => void }> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">작업 옵션</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">폐기물 처리</label>
          <select
            value={data.disposal || ''}
            onChange={(e) => onChange('disposal', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">선택하세요</option>
            <option value="필요">필요</option>
            <option value="불필요">불필요</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">방간 이동</label>
          <select
            value={data.room_movement || ''}
            onChange={(e) => onChange('room_movement', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">선택하세요</option>
            <option value="있음">있음</option>
            <option value="없음">없음</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">벽면 시공</label>
          <select
            value={data.wall_construction || ''}
            onChange={(e) => onChange('wall_construction', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">선택하세요</option>
            <option value="필요">필요</option>
            <option value="불필요">불필요</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">시공 유형</label>
          <input
            type="text"
            value={data.construction_type || ''}
            onChange={(e) => onChange('construction_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">배송 유형</label>
          <input
            type="text"
            value={data.shipment_type || ''}
            onChange={(e) => onChange('shipment_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

// 메모/기타 탭
const NotesTab: React.FC<{ data: DeliveryData; onChange: (field: keyof DeliveryData, value: any) => void }> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">메모 및 기타 정보</h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">주요 메모</label>
          <textarea
            rows={4}
            value={data.main_memo || ''}
            onChange={(e) => onChange('main_memo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="주요 메모를 입력하세요..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">가구 요청사항</label>
          <textarea
            rows={4}
            value={data.furniture_requests || ''}
            onChange={(e) => onChange('furniture_requests', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="가구 관련 요청사항을 입력하세요..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">기사 메모</label>
          <textarea
            rows={4}
            value={data.driver_notes || ''}
            onChange={(e) => onChange('driver_notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="기사님께 전달할 메모를 입력하세요..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">생성일시</label>
            <input
              type="text"
              value={data.created_at ? new Date(data.created_at).toLocaleString('ko-KR') : ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">수정일시</label>
            <input
              type="text"
              value={data.updated_at ? new Date(data.updated_at).toLocaleString('ko-KR') : ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetailView;