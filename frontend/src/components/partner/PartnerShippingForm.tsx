import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  User, Phone, Mail, Building, MapPin, Package, Truck, 
  Calendar, Clock, AlertTriangle, FileText, Shield, 
  Home, Wrench, Weight, Box, Settings, ArrowLeft, Check, X
} from 'lucide-react';
import { deliveriesAPI, requestTypesAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface DeliveryData {
  sender_name: string;
  sender_address: string;
  sender_detail_address?: string;
  weight?: number;
  status: string;
  request_type?: string;
  construction_type?: string;
  visit_date?: string;
  visit_time?: string;
  assigned_driver?: string;
  furniture_company?: string;
  main_memo?: string;
  emergency_contact?: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_detail_address?: string;
  building_type?: string;
  floor_count?: number;
  elevator_available?: boolean;
  ladder_truck?: boolean;
  disposal?: boolean;
  room_movement?: boolean;
  wall_construction?: boolean;
  product_name: string;
  furniture_product_code?: string;
  product_weight?: number;
  product_size?: string;
  box_size?: string;
  furniture_requests?: string;
  driver_notes?: string;
  delivery_fee?: number;
  special_instructions?: string;
  fragile?: boolean;
  insurance_value?: number;
  cod_amount?: number;
  estimated_delivery?: string;
  detail_notes?: string;
  delivery_time_preference?: string;
}

interface PartnerShippingFormProps {
  onNavigateBack: () => void;
}

interface InfoCellProps {
  label: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}

const InfoCell: React.FC<InfoCellProps> = ({ label, icon: Icon, children, required = false, error }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h3>
      </div>
      <div className="space-y-2">
        {children}
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  );
};

const PartnerShippingForm: React.FC<PartnerShippingFormProps> = ({ onNavigateBack }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; trackingNumber?: string } | null>(null);
  const [requestTypes, setRequestTypes] = useState<string[]>([]);

  // Daum 우편번호 서비스 초기화
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src*="postcode.v2.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  // 의뢰종류 목록 로드
  useEffect(() => {
    const loadRequestTypes = async () => {
      try {
        const response = await requestTypesAPI.getRequestTypes();
        if (response.success && response.data) {
          setRequestTypes(response.data.map((item: any) => item.name));
        } else {
          throw new Error('의뢰종류 데이터를 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('의뢰종류 목록 로드 실패:', error);
        setRequestTypes(['일반', '회수', '조치', '쿠팡', '네이버']);
      }
    };

    loadRequestTypes();
  }, []);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<DeliveryData>({
    defaultValues: {
      status: 'pending',
      elevator_available: false,
      ladder_truck: false,
      disposal: false,
      room_movement: false,
      wall_construction: false,
      fragile: false,
      floor_count: 1
    }
  });

  // 사용자 정보에서 발송인 기본값 설정
  useEffect(() => {
    if (user) {
      if (user.default_sender_name) {
        setValue('sender_name', user.default_sender_name);
      } else if (user.name) {
        setValue('sender_name', user.name);
      }

      if (user.default_sender_address) {
        setValue('sender_address', user.default_sender_address);
      }

      if (user.default_sender_detail_address) {
        setValue('sender_detail_address', user.default_sender_detail_address);
      }

      if (user.default_sender_company || user.company) {
        setValue('furniture_company', user.default_sender_company || user.company);
      }

      if (user.default_sender_phone || user.phone) {
        setValue('emergency_contact', user.default_sender_phone || user.phone);
      }
    }
  }, [user, setValue]);

  // 주소 검색 함수
  const openAddressSearch = (type: 'sender' | 'customer') => {
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data: any) {
        const addr = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
        
        if (type === 'sender') {
          setValue('sender_address', addr);
        } else if (type === 'customer') {
          setValue('customer_address', addr);
        }
      }
    }).open();
  };

  // 폼 제출
  const onSubmit = async (data: DeliveryData) => {
    setIsSubmitting(true);
    try {
      console.log('배송접수 폼 제출 데이터:', data);
      
      const response = await deliveriesAPI.createDelivery(data);
      
      console.log('배송 생성 응답:', response);
      
      setSubmitResult({
        success: true,
        message: response.message || '배송이 성공적으로 접수되었습니다.',
        trackingNumber: response.trackingNumber
      });
    } catch (error: any) {
      setSubmitResult({
        success: false,
        message: error.response?.data?.message || error.message || '배송 접수 중 오류가 발생했습니다.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 새로운 접수하기
  const handleNewOrder = () => {
    setSubmitResult(null);
    window.location.reload();
  };

  if (submitResult) {
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
                <span>돌아가기</span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900">배송접수_업체용</h1>
                  <p className="text-sm text-blue-600 font-medium">배송 접수 결과</p>
                </div>
              </div>
              
              <div className="w-24"></div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="max-w-md mx-auto">
            <div className={`p-6 rounded-lg ${submitResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-3">
                {submitResult.success ? (
                  <Check className="w-8 h-8 text-green-500" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                )}
                <div>
                  <h3 className={`text-lg font-semibold ${submitResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {submitResult.success ? '배송접수 완료' : '배송접수 실패'}
                  </h3>
                  <p className={submitResult.success ? 'text-green-700' : 'text-red-700'}>
                    {submitResult.message}
                  </p>
                  {submitResult.trackingNumber && (
                    <p className="text-green-700 mt-2">
                      <strong>추적번호: {submitResult.trackingNumber}</strong>
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex gap-3">
                {submitResult.success ? (
                  <button
                    onClick={handleNewOrder}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    새 접수하기
                  </button>
                ) : (
                  <button
                    onClick={() => setSubmitResult(null)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    다시 시도
                  </button>
                )}
                <button
                  onClick={onNavigateBack}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  메인으로
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
              <span>돌아가기</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">배송접수_업체용</h1>
                <p className="text-sm text-blue-600 font-medium">새로운 배송을 접수하세요</p>
              </div>
            </div>
            
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 발송인 정보 섹션 */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              발송인 정보
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCell label="발송인 이름" icon={User} required error={errors.sender_name?.message}>
                <input
                  type="text"
                  {...register('sender_name', { required: '발송인 이름은 필수입니다' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="발송인 이름을 입력하세요"
                />
              </InfoCell>

              <InfoCell label="발송인 주소" icon={MapPin} required error={errors.sender_address?.message}>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      {...register('sender_address', { required: '발송인 주소는 필수입니다' })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="주소를 입력하세요"
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => openAddressSearch('sender')}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      검색
                    </button>
                  </div>
                  <input
                    type="text"
                    {...register('sender_detail_address')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="상세주소"
                  />
                </div>
              </InfoCell>

              <InfoCell label="가구회사" icon={Building}>
                <input
                  type="text"
                  {...register('furniture_company')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="가구회사명"
                />
              </InfoCell>

              <InfoCell label="긴급연락처" icon={Phone}>
                <input
                  type="tel"
                  {...register('emergency_contact')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="010-0000-0000"
                />
              </InfoCell>
            </div>
          </div>

          {/* 고객 정보 섹션 */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-green-600" />
              고객 정보 (방문지)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCell label="고객 이름" icon={User} required error={errors.customer_name?.message}>
                <input
                  type="text"
                  {...register('customer_name', { required: '고객 이름은 필수입니다' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="방문할 고객 이름"
                />
              </InfoCell>

              <InfoCell label="고객 전화번호" icon={Phone} required error={errors.customer_phone?.message}>
                <input
                  type="tel"
                  {...register('customer_phone', { required: '고객 전화번호는 필수입니다' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="010-1234-5678"
                />
              </InfoCell>

              <InfoCell label="고객 주소" icon={MapPin} required error={errors.customer_address?.message}>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      {...register('customer_address', { required: '고객 주소는 필수입니다' })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="방문할 주소"
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => openAddressSearch('customer')}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      검색
                    </button>
                  </div>
                  <input
                    type="text"
                    {...register('customer_detail_address')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="상세주소"
                  />
                </div>
              </InfoCell>
            </div>
          </div>

          {/* 배송 유형 섹션 */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-purple-600" />
              배송 유형 및 일정
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCell label="의뢰종류" icon={FileText}>
                <select
                  {...register('request_type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">선택하세요</option>
                  {requestTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </InfoCell>

              <InfoCell label="시공 유형" icon={Wrench}>
                <select
                  {...register('construction_type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">선택하세요</option>
                  <option value="1인시공">1인시공</option>
                  <option value="2인시공">2인시공</option>
                </select>
              </InfoCell>

              <InfoCell label="방문 날짜" icon={Calendar}>
                <input
                  type="date"
                  {...register('visit_date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </InfoCell>

              <InfoCell label="방문 시간" icon={Clock}>
                <input
                  type="time"
                  {...register('visit_time')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </InfoCell>

              <InfoCell label="배정된 기사" icon={Truck}>
                <input
                  type="text"
                  {...register('assigned_driver')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="배정된 기사명"
                />
              </InfoCell>
            </div>
          </div>

          {/* 건물 및 접근성 정보 */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Home className="w-6 h-6 text-orange-600" />
              건물 및 접근성 정보
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCell label="건물 유형" icon={Home} required error={errors.building_type?.message}>
                <select
                  {...register('building_type', { required: '건물 유형은 필수입니다' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">선택하세요</option>
                  <option value="apartment">아파트</option>
                  <option value="villa">빌라</option>
                  <option value="house">단독주택</option>
                  <option value="officetel">오피스텔</option>
                  <option value="commercial">상가</option>
                </select>
              </InfoCell>

              <InfoCell label="층수" icon={Building} required error={errors.floor_count?.message}>
                <input
                  type="number"
                  min="1"
                  {...register('floor_count', { required: '층수는 필수입니다', min: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="층수"
                />
              </InfoCell>

              <InfoCell label="접근성 옵션" icon={Settings}>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('elevator_available')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">엘리베이터 이용 가능</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('ladder_truck')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">사다리차 이용 가능</span>
                  </label>
                </div>
              </InfoCell>

              <InfoCell label="작업 유형" icon={Wrench}>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('disposal')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">폐기물 처리</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('room_movement')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">방 간 이동</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('wall_construction')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">벽체 시공</span>
                  </label>
                </div>
              </InfoCell>
            </div>
          </div>

          {/* 제품 정보 */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-red-600" />
              제품 정보
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCell label="제품명" icon={Package} required error={errors.product_name?.message}>
                <input
                  type="text"
                  {...register('product_name', { required: '제품명은 필수입니다' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="제품명을 입력하세요"
                />
              </InfoCell>

              <InfoCell label="제품 코드" icon={FileText}>
                <input
                  type="text"
                  {...register('furniture_product_code')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="제품 코드"
                />
              </InfoCell>

              <InfoCell label="제품 무게 (kg)" icon={Weight}>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  {...register('product_weight')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.0"
                />
              </InfoCell>

              <InfoCell label="전체 무게 (kg)" icon={Weight}>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  {...register('weight')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.0"
                />
              </InfoCell>

              <InfoCell label="제품 크기" icon={Box}>
                <input
                  type="text"
                  {...register('product_size')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="가로x세로x높이 (cm)"
                />
              </InfoCell>

              <InfoCell label="박스 크기" icon={Box}>
                <input
                  type="text"
                  {...register('box_size')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="박스 크기"
                />
              </InfoCell>
            </div>
          </div>

          {/* 배송 비용 및 옵션 */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-600" />
              배송 비용 및 특별 옵션
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCell label="배송비 (원)" icon={Shield}>
                <input
                  type="number"
                  min="0"
                  {...register('delivery_fee')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="배송비"
                />
              </InfoCell>

              <InfoCell label="보험가치 (원)" icon={Shield}>
                <input
                  type="number"
                  min="0"
                  {...register('insurance_value')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="보험가치"
                />
              </InfoCell>

              <InfoCell label="착불금액 (원)" icon={Shield}>
                <input
                  type="number"
                  min="0"
                  {...register('cod_amount')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="착불금액"
                />
              </InfoCell>

              <InfoCell label="배송 시간 선호도" icon={Clock}>
                <select
                  {...register('delivery_time_preference')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">선택하세요</option>
                  <option value="오전(09:00~12:00)">오전(09:00~12:00)</option>
                  <option value="오후(12:00~18:00)">오후(12:00~18:00)</option>
                  <option value="저녁(18:00~21:00)">저녁(18:00~21:00)</option>
                  <option value="주말">주말</option>
                  <option value="평일">평일</option>
                </select>
              </InfoCell>

              <InfoCell label="예상 배송일" icon={Calendar}>
                <input
                  type="datetime-local"
                  {...register('estimated_delivery')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </InfoCell>

              <InfoCell label="특별 옵션" icon={AlertTriangle}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('fragile')}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-red-600">깨지기 쉬운 물품</span>
                </label>
              </InfoCell>
            </div>
          </div>

          {/* 메모 및 특별 지시사항 */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-yellow-600" />
              메모 및 특별 지시사항
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCell label="가구사 요청사항" icon={FileText}>
                <textarea
                  {...register('furniture_requests')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="가구회사 요청사항"
                />
              </InfoCell>

              <InfoCell label="메인 메모" icon={FileText}>
                <textarea
                  {...register('main_memo')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="중요한 배송 정보"
                />
              </InfoCell>

              <InfoCell label="기사님 메모" icon={Truck}>
                <textarea
                  {...register('driver_notes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="기사님을 위한 메모"
                />
              </InfoCell>

              <InfoCell label="특별 지시사항" icon={AlertTriangle}>
                <textarea
                  {...register('special_instructions')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="특별 지시사항"
                />
              </InfoCell>

              <InfoCell label="상세 메모" icon={FileText}>
                <textarea
                  {...register('detail_notes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="추가적인 상세 메모"
                />
              </InfoCell>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium text-lg rounded-lg transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    처리 중...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    배송 접수 완료
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default PartnerShippingForm;