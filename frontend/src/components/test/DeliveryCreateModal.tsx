import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
// import { testAPI } from '../../services/api';

interface DeliveryData {
  tracking_number: string;
  sender_name: string;
  sender_address: string;
  package_type: string;
  weight: number;
  status: string;
  assigned_driver_id: number | null;
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
  installation_photos: string;
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

interface DeliveryCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DeliveryData) => void;
  isLoading: boolean;
}

const DeliveryCreateModal: React.FC<DeliveryCreateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading
}) => {
  const [requestTypes, setRequestTypes] = useState<Array<{id: number, name: string}>>([]);
  // 기본값으로 초기 데이터 설정
  const [formData, setFormData] = useState<DeliveryData>({
    tracking_number: 'TK' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000),
    sender_name: '테스트 발송인',
    sender_address: '서울시 강남구 테헤란로 123',
    package_type: '일반포장',
    weight: 5,
    status: '접수완료',
    assigned_driver_id: null,
    request_type: '일반',
    construction_type: '신축',
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: '14:00',
    assigned_driver: '김기사',
    furniture_company: '테스트가구',
    main_memo: '배송 전 연락 필수',
    emergency_contact: '010-1234-5678',
    customer_name: '고객' + Math.floor(1 + Math.random() * 999),
    customer_phone: '010-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000),
    customer_address: '경기도 광주시 초월읍 경수길 58',
    building_type: '아파트',
    floor_count: '15층',
    elevator_available: '있음',
    ladder_truck: '불필요',
    disposal: '불필요',
    room_movement: '없음',
    wall_construction: '불필요',
    product_name: '소파',
    furniture_product_code: 'SOFA001',
    product_weight: '25kg',
    product_size: '200×100×80',
    box_size: '210×110×90',
    furniture_requests: '조립 서비스 요청',
    driver_notes: '배송 완료',
    installation_photos: '[]',
    customer_signature: '',
    delivery_fee: 30000,
    special_instructions: '문 앞 배송',
    fragile: false,
    insurance_value: 500000,
    cod_amount: 0,
    driver_id: 'driver' + Math.floor(1000 + Math.random() * 9000),
    driver_name: '김기사',
    estimated_delivery: new Date().toISOString(),
    actual_delivery: '',
    delivery_attempts: 1,
    last_location: '배송센터',
    detail_notes: '정상 배송 완료'
  });

  const handleChange = (field: keyof DeliveryData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const resetForm = () => {
    setFormData({
      tracking_number: 'TK' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000),
      sender_name: '테스트 발송인',
      sender_address: '서울시 강남구 테헤란로 123',
      package_type: '일반포장',
      weight: 5,
      status: '접수완료',
      assigned_driver_id: null,
      request_type: '일반',
      construction_type: '신축',
      visit_date: new Date().toISOString().split('T')[0],
      visit_time: '14:00',
      assigned_driver: '김기사',
      furniture_company: '테스트가구',
      main_memo: '배송 전 연락 필수',
      emergency_contact: '010-1234-5678',
      customer_name: '고객' + Math.floor(1 + Math.random() * 999),
      customer_phone: '010-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000),
      customer_address: '경기도 광주시 초월읍 경수길 58',
      building_type: '아파트',
      floor_count: '15층',
      elevator_available: '있음',
      ladder_truck: '불필요',
      disposal: '불필요',
      room_movement: '없음',
      wall_construction: '불필요',
      product_name: '소파',
      furniture_product_code: 'SOFA001',
      product_weight: '25kg',
      product_size: '200×100×80',
      box_size: '210×110×90',
      furniture_requests: '조립 서비스 요청',
      driver_notes: '배송 완료',
      installation_photos: '[]',
      customer_signature: '',
      delivery_fee: 30000,
      special_instructions: '문 앞 배송',
      fragile: false,
      insurance_value: 500000,
      cod_amount: 0,
      driver_id: 'driver' + Math.floor(1000 + Math.random() * 9000),
      driver_name: '김기사',
      estimated_delivery: new Date().toISOString(),
      actual_delivery: '',
      delivery_attempts: 1,
      last_location: '배송센터',
      detail_notes: '정상 배송 완료'
    });
  };

  // 의뢰종류 목록 로드
  const loadRequestTypes = async () => {
    // 더미 데이터 사용
    setRequestTypes([
      { id: 1, name: '일반' },
      { id: 2, name: '회수' },
      { id: 3, name: '조치' },
      { id: 4, name: '쿠팡' },
      { id: 5, name: '네이버' }
    ]);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
      loadRequestTypes();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">새 배송 생성</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* 기본 정보 섹션 */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">운송장 번호 / tracking_number</label>
                  <input
                    type="text"
                    value={formData.tracking_number}
                    onChange={(e) => handleChange('tracking_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">의뢰상태 / status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="접수완료">접수완료</option>
                    <option value="창고입고">창고입고</option>
                    <option value="기사상차">기사상차</option>
                    <option value="배송완료">배송완료</option>
                    <option value="반품접수">반품접수</option>
                    <option value="수거완료">수거완료</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">의뢰종류 / request_type</label>
                  <select
                    value={formData.request_type}
                    onChange={(e) => handleChange('request_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {requestTypes.map(type => (
                      <option key={type.id} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 발송인 정보 섹션 */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">발송인 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">발송자명 / sender_name</label>
                  <input
                    type="text"
                    value={formData.sender_name}
                    onChange={(e) => handleChange('sender_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">발송자주소 / sender_address</label>
                  <input
                    type="text"
                    value={formData.sender_address}
                    onChange={(e) => handleChange('sender_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">포장타입 / package_type</label>
                  <select
                    value={formData.package_type}
                    onChange={(e) => handleChange('package_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="일반포장">일반포장</option>
                    <option value="안전포장">안전포장</option>
                    <option value="특수포장">특수포장</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">무게 / weight (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 배송 정보 섹션 */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">배송 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시공유형 / construction_type</label>
                  <select
                    value={formData.construction_type}
                    onChange={(e) => handleChange('construction_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="신축">신축</option>
                    <option value="재시공">재시공</option>
                    <option value="수리">수리</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">방문일 / visit_date</label>
                  <input
                    type="date"
                    value={formData.visit_date}
                    onChange={(e) => handleChange('visit_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">방문시간 / visit_time</label>
                  <input
                    type="time"
                    value={formData.visit_time}
                    onChange={(e) => handleChange('visit_time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당기사 / assigned_driver</label>
                  <input
                    type="text"
                    value={formData.assigned_driver}
                    onChange={(e) => handleChange('assigned_driver', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">가구사 / furniture_company</label>
                  <input
                    type="text"
                    value={formData.furniture_company}
                    onChange={(e) => handleChange('furniture_company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">주요메모 / main_memo</label>
                  <input
                    type="text"
                    value={formData.main_memo}
                    onChange={(e) => handleChange('main_memo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비상연락망 / emergency_contact</label>
                  <input
                    type="tel"
                    value={formData.emergency_contact}
                    onChange={(e) => handleChange('emergency_contact', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 고객 정보 섹션 */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">고객 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">고객명 / customer_name</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => handleChange('customer_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">고객전화 / customer_phone</label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => handleChange('customer_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-1 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">고객주소 / customer_address</label>
                  <input
                    type="text"
                    value={formData.customer_address}
                    onChange={(e) => handleChange('customer_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 건물 정보 섹션 */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">건물 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">건물형태 / building_type</label>
                  <select
                    value={formData.building_type}
                    onChange={(e) => handleChange('building_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="아파트">아파트</option>
                    <option value="빌라">빌라</option>
                    <option value="단독주택">단독주택</option>
                    <option value="상가">상가</option>
                    <option value="오피스텔">오피스텔</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">층수 / floor_count</label>
                  <input
                    type="text"
                    value={formData.floor_count}
                    onChange={(e) => handleChange('floor_count', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">엘리베이터 / elevator_available</label>
                  <select
                    value={formData.elevator_available}
                    onChange={(e) => handleChange('elevator_available', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="있음">있음</option>
                    <option value="없음">없음</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사다리차 / ladder_truck</label>
                  <select
                    value={formData.ladder_truck}
                    onChange={(e) => handleChange('ladder_truck', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="필요">필요</option>
                    <option value="불필요">불필요</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">내림 / disposal</label>
                  <select
                    value={formData.disposal}
                    onChange={(e) => handleChange('disposal', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="필요">필요</option>
                    <option value="불필요">불필요</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">방간이동 / room_movement</label>
                  <select
                    value={formData.room_movement}
                    onChange={(e) => handleChange('room_movement', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="있음">있음</option>
                    <option value="없음">없음</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">벽시공 / wall_construction</label>
                  <select
                    value={formData.wall_construction}
                    onChange={(e) => handleChange('wall_construction', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="필요">필요</option>
                    <option value="불필요">불필요</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 상품 정보 섹션 */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">상품 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상품명 / product_name</label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => handleChange('product_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상품코드 / furniture_product_code</label>
                  <input
                    type="text"
                    value={formData.furniture_product_code}
                    onChange={(e) => handleChange('furniture_product_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상품무게 / product_weight</label>
                  <input
                    type="text"
                    value={formData.product_weight}
                    onChange={(e) => handleChange('product_weight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상품크기 / product_size</label>
                  <input
                    type="text"
                    value={formData.product_size}
                    onChange={(e) => handleChange('product_size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">박스크기 / box_size</label>
                  <input
                    type="text"
                    value={formData.box_size}
                    onChange={(e) => handleChange('box_size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="col-span-1 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">가구요청사항 / furniture_requests</label>
                  <textarea
                    value={formData.furniture_requests}
                    onChange={(e) => handleChange('furniture_requests', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 배송비/보험 정보 섹션 */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">배송비/보험 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">배송비 / delivery_fee (원)</label>
                  <input
                    type="number"
                    value={formData.delivery_fee}
                    onChange={(e) => handleChange('delivery_fee', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">보험가치 / insurance_value (원)</label>
                  <input
                    type="number"
                    value={formData.insurance_value}
                    onChange={(e) => handleChange('insurance_value', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">착불금액 / cod_amount (원)</label>
                  <input
                    type="number"
                    value={formData.cod_amount}
                    onChange={(e) => handleChange('cod_amount', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">깨지기쉬움 / fragile</label>
                  <select
                    value={formData.fragile ? 'true' : 'false'}
                    onChange={(e) => handleChange('fragile', e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="false">일반</option>
                    <option value="true">주의</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 기사 정보 섹션 */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">기사 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">기사ID / driver_id</label>
                  <input
                    type="text"
                    value={formData.driver_id}
                    onChange={(e) => handleChange('driver_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">기사명 / driver_name</label>
                  <input
                    type="text"
                    value={formData.driver_name}
                    onChange={(e) => handleChange('driver_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">배송시도 / delivery_attempts</label>
                  <input
                    type="number"
                    value={formData.delivery_attempts}
                    onChange={(e) => handleChange('delivery_attempts', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">마지막위치 / last_location</label>
                  <input
                    type="text"
                    value={formData.last_location}
                    onChange={(e) => handleChange('last_location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="col-span-1 lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">기사메모 / driver_notes</label>
                  <textarea
                    value={formData.driver_notes}
                    onChange={(e) => handleChange('driver_notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 특별지시사항 및 상세메모 섹션 */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">추가 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">특별지시사항 / special_instructions</label>
                  <textarea
                    value={formData.special_instructions}
                    onChange={(e) => handleChange('special_instructions', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상세메모 / detail_notes</label>
                  <textarea
                    value={formData.detail_notes}
                    onChange={(e) => handleChange('detail_notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? '저장 중...' : '저장'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryCreateModal;