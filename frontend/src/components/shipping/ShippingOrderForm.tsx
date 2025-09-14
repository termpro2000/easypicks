import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { 
  User, Phone, Mail, Building, MapPin, Package, Truck, 
  Calendar, Clock, AlertTriangle, Snowflake, FileText, 
  Shield, Check, Home, Wrench, Weight, Box, Ruler, Settings, 
  Image, PenTool, Tag, DollarSign
} from 'lucide-react';
import { shippingAPI, deliveriesAPI, configAPI, requestTypesAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import SimpleNaverMap from '../map/SimpleNaverMap';

// Deliveries 테이블에 맞는 데이터 타입
interface DeliveryData {
  tracking_number?: string;
  sender_name: string;
  sender_address: string;
  sender_detail_address?: string;
  weight?: number;
  status: string;
  
  // 확장 필드들 (업데이트된 필드들 포함)
  request_type?: string;
  construction_type?: string;
  shipment_type?: string;
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
  installation_photos?: string; // JSON string
  customer_signature?: string; // Base64 string
  delivery_fee?: number;
  special_instructions?: string;
  fragile?: boolean;
  insurance_value?: number;
  cod_amount?: number;
  estimated_delivery?: string;
  detail_notes?: string;
}

// 단계별 구분은 제거하고 섹션별로만 관리

interface ShippingOrderFormProps {
  onSuccess?: () => void;
  onNewOrder?: (orderInfo: {
    orderId: number;
    customerName: string;
    productName?: string;
    amount?: number;
  }) => void;
}

interface InfoCellProps {
  label: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  description?: string;
}

const InfoCell: React.FC<InfoCellProps> = ({ label, icon: Icon, children, required = false, error, description }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {children}
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  );
};

const ShippingOrderForm: React.FC<ShippingOrderFormProps> = ({ onSuccess, onNewOrder }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; trackingNumber?: string } | null>(null);
  // QR 코드 관련 상태 제거됨
  const [requestTypes, setRequestTypes] = useState<string[]>([]);
  const [isLoadingRequestTypes, setIsLoadingRequestTypes] = useState(false);

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
      setIsLoadingRequestTypes(true);
      try {
        const response = await requestTypesAPI.getRequestTypes();
        if (response.success && response.data) {
          setRequestTypes(response.data.map((item: any) => item.name));
        } else {
          throw new Error('의뢰종류 데이터를 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('의뢰종류 목록 로드 실패:', error);
        // 기본값으로 설정
        setRequestTypes(['일반', '회수', '조치', '쿠팡', '네이버']);
      } finally {
        setIsLoadingRequestTypes(false);
      }
    };

    loadRequestTypes();
  }, []);

  const { register, handleSubmit, formState: { errors }, watch, trigger, setValue } = useForm<DeliveryData>({
    defaultValues: {
      status: 'pending',
      elevator_available: false,
      ladder_truck: false,
      disposal: false,
      room_movement: false,
      wall_construction: false,
      floor_count: 1
    }
  });

  const watchedValues = watch();

  // 사용자 정보에서 발송인 기본값 설정
  useEffect(() => {
    if (user) {
      console.log('사용자 정보:', user);
      
      // 발송인 이름 설정
      if (user.default_sender_name) {
        setValue('sender_name', user.default_sender_name);
      } else if (user.name) {
        setValue('sender_name', user.name); // 기본값으로 사용자 이름 사용
      }

      // 발송인 주소 설정
      if (user.default_sender_address) {
        setValue('sender_address', user.default_sender_address);
      }

      // 발송인 상세주소 설정
      if (user.default_sender_detail_address) {
        setValue('sender_detail_address', user.default_sender_detail_address);
      }

      // 추가로 회사명이 있다면 furniture_company 필드에도 설정
      if (user.default_sender_company || user.company) {
        setValue('furniture_company', user.default_sender_company || user.company);
      }

      // 연락처가 있다면 emergency_contact에도 설정 (선택사항)
      if (user.default_sender_phone || user.phone) {
        setValue('emergency_contact', user.default_sender_phone || user.phone);
      }

      console.log('✅ 발송인 정보 자동 설정 완료:', {
        sender_name: user.default_sender_name || user.name,
        sender_address: user.default_sender_address,
        sender_detail_address: user.default_sender_detail_address,
        furniture_company: user.default_sender_company || user.company,
        emergency_contact: user.default_sender_phone || user.phone
      });
    }
  }, [user, setValue]);


  // 다음 단계로
  // 단계별 네비게이션 제거 - 이제 한 페이지 스크롤 방식

  // QR 코드 및 카메라 관련 함수들 제거됨 - 관리자용에서는 직접 입력만 사용

  // 주소 검색 함수들
  const openAddressSearch = (type: 'sender' | 'customer') => {
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data: any) {
        const addr = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
        const zonecode = data.zonecode;
        
        if (type === 'sender') {
          setValue('sender_address', addr);
        } else if (type === 'customer') {
          setValue('customer_address', addr);
        }
      }
    }).open();
  };

  // 폼 제출 (deliveries API 사용)
  const onSubmit = async (data: DeliveryData) => {
    setIsSubmitting(true);
    try {
      console.log('폼 제출 데이터:', data);
      
      // deliveries API를 사용하여 배송 생성
      const response = await deliveriesAPI.createDelivery(data);
      
      console.log('배송 생성 응답:', response);
      
      setSubmitResult({
        success: true,
        message: response.message || '배송이 성공적으로 접수되었습니다.',
        trackingNumber: response.trackingNumber
      });

      if (onNewOrder) {
        onNewOrder({
          orderId: response.deliveryId,
          customerName: data.customer_name,
          productName: data.product_name,
          amount: 0 // deliveries 테이블에는 금액 필드가 없음
        });
      }
        
      // 1.5초 후 새 배송접수 화면으로 리셋 (성공 메시지를 잠깐 보여주고)
      setTimeout(() => {
        // 폼 초기화 및 첫 단계로 돌아가기
        window.location.reload(); // 완전한 리셋을 위해
      }, 1500);
    } catch (error: any) {
      setSubmitResult({
        success: false,
        message: error.response?.data?.message || error.message || '배송 접수 중 오류가 발생했습니다.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 단계별 렌더링 함수들
  const renderStep1 = () => (
    <div className="space-y-6">

      {/* 발송인 정보 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <User className="w-5 h-5" />
          발송인 정보
        </h3>
        <p className="text-sm text-blue-600 mb-4 bg-blue-50 p-2 rounded">
          💡 내 정보에서 설정한 기본 발송인 정보가 자동으로 입력됩니다. 수정이 필요한 경우 직접 변경하세요.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              발송인 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('sender_name', { required: '발송인 이름은 필수입니다' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="발송인 이름을 입력하세요"
            />
            {errors.sender_name && <p className="mt-1 text-sm text-red-600">{errors.sender_name.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              발송인 주소 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                {...register('sender_address', { required: '발송인 주소는 필수입니다' })}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="주소를 입력하세요"
                readOnly
              />
              <button
                type="button"
                onClick={() => openAddressSearch('sender')}
                className="px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                주소검색
              </button>
            </div>
            <input
              type="text"
              {...register('sender_detail_address')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="상세주소를 입력하세요 (동, 호수, 건물명 등)"
            />
            {errors.sender_address && <p className="mt-1 text-sm text-red-600">{errors.sender_address.message}</p>}
          </div>
        </div>
      </div>


      {/* 고객 정보 */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          고객 정보 (방문지)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              고객 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('customer_name', { required: '고객 이름은 필수입니다' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="방문할 고객 이름"
            />
            {errors.customer_name && <p className="mt-1 text-sm text-red-600">{errors.customer_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              고객 전화번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              {...register('customer_phone', { required: '고객 전화번호는 필수입니다' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="010-1234-5678"
            />
            {errors.customer_phone && <p className="mt-1 text-sm text-red-600">{errors.customer_phone.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              고객 주소 (방문지) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                {...register('customer_address', { required: '고객 주소는 필수입니다' })}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="방문할 주소를 입력하세요"
                readOnly
              />
              <button
                type="button"
                onClick={() => openAddressSearch('customer')}
                className="px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                주소검색
              </button>
            </div>
            <input
              type="text"
              {...register('customer_detail_address')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
              placeholder="상세주소를 입력하세요 (동, 호수, 건물명 등)"
            />
            {errors.customer_address && <p className="mt-1 text-sm text-red-600">{errors.customer_address.message}</p>}
            
            {/* 네이버 지도 */}
            {watchedValues.customer_address && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  고객 주소 위치
                </label>
                <SimpleNaverMap 
                  address={watchedValues.customer_address}
                  height="200px"
                  zoom={16}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 기본 배송 정보 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          배송 유형
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">의뢰종류</label>
            <select
              {...register('request_type')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoadingRequestTypes}
            >
              <option value="">선택하세요</option>
              {isLoadingRequestTypes ? (
                <option disabled>로딩 중...</option>
              ) : (
                requestTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">시공 유형</label>
            <select
              {...register('construction_type')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">선택하세요</option>
              <option value="1인시공">1인시공</option>
              <option value="2인시공">2인시공</option>
            </select>
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">방문 날짜</label>
            <input
              type="date"
              {...register('visit_date')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">방문 시간</label>
            <input
              type="time"
              {...register('visit_time')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">가구회사</label>
            <input
              type="text"
              {...register('furniture_company')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="가구회사명"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">긴급 연락처</label>
            <input
              type="tel"
              {...register('emergency_contact')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="010-0000-0000"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* 건물 정보 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Home className="w-5 h-5" />
          건물 정보
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              건물 유형 <span className="text-red-500">*</span>
            </label>
            <select
              {...register('building_type', { required: '건물 유형은 필수입니다' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">선택하세요</option>
              <option value="apartment">아파트</option>
              <option value="villa">빌라</option>
              <option value="house">단독주택</option>
              <option value="officetel">오피스텔</option>
              <option value="commercial">상가</option>
            </select>
            {errors.building_type && <p className="mt-1 text-sm text-red-600">{errors.building_type.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              층수 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              {...register('floor_count', { required: '층수는 필수입니다', min: 1 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="몇 층인지 입력하세요"
            />
            {errors.floor_count && <p className="mt-1 text-sm text-red-600">{errors.floor_count.message}</p>}
          </div>
        </div>
      </div>

      {/* 현장 접근성 */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-600" />
          현장 접근성
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              {...register('elevator_available')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">엘리베이터 이용 가능</span>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              {...register('ladder_truck')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">사다리차 이용 가능</span>
          </label>
        </div>
      </div>

      {/* 작업 유형 */}
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-yellow-600" />
          작업 유형
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              {...register('disposal')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">폐기물 처리</span>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              {...register('room_movement')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">방 간 이동</span>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              {...register('wall_construction')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">벽체 시공</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">

      {/* 기본 상품 정보 섹션 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          기본 상품 정보
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCell 
            label="상품코드" 
            icon={Tag} 
            description="상품의 메인 분류 코드를 입력하세요"
          >
            <input
              type="text"
              {...register('furniture_product_code')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: FUR001"
            />
          </InfoCell>

          <InfoCell 
            label="내부코드" 
            icon={Tag} 
            description="상품의 세부 분류 코드를 입력하세요"
          >
            <input
              type="text"
              {...register('box_size')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: SOFA-L"
            />
          </InfoCell>

          <InfoCell 
            label="상품명" 
            icon={Tag} 
            required 
            error={errors.product_name?.message}
            description="고객이 쉽게 알아볼 수 있는 상품명을 입력하세요"
          >
            <input
              type="text"
              {...register('product_name', { required: '상품명은 필수입니다' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: 침실 3인용 소파"
            />
          </InfoCell>

          <InfoCell 
            label="상품 무게" 
            icon={Weight}
            description="배송비 계산에 사용됩니다 (kg 단위)"
          >
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.1"
                {...register('product_weight')}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.0"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">kg</span>
              </div>
            </div>
          </InfoCell>

          <InfoCell 
            label="상품 크기" 
            icon={Ruler}
            description="포장 크기 또는 실제 크기를 입력하세요"
          >
            <input
              type="text"
              {...register('product_size')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: 200x80x75cm 또는 대형"
            />
          </InfoCell>
        </div>
      </div>

      {/* 가격 정보 섹션 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          가격 정보
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCell 
            label="배송비 (기본)" 
            icon={DollarSign}
            description="일반 배송시 적용되는 기본 배송비"
          >
            <div className="relative">
              <input
                type="number"
                min="0"
                {...register('delivery_fee')}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">원</span>
              </div>
            </div>
          </InfoCell>

          <InfoCell 
            label="보험 가치" 
            icon={DollarSign}
            description="상품의 보험 가치 또는 실제 가치"
          >
            <div className="relative">
              <input
                type="number"
                min="0"
                {...register('insurance_value')}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">원</span>
              </div>
            </div>
          </InfoCell>
        </div>
      </div>

      {/* 상품 메모 섹션 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-yellow-600" />
          상품 설명 및 특이사항
        </h3>
        
        <InfoCell 
          label="상품 메모" 
          icon={FileText}
          description="배송시 주의사항, 조립 방법, 특별 요구사항 등을 상세히 기록하세요"
        >
          <textarea
            {...register('special_instructions')}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="예시:
• 깨지기 쉬운 유리 부품이 포함되어 있음
• 2인 이상 작업 필요 (무게: 50kg 이상)
• 엘리베이터 없는 건물은 추가비용 발생
• 조립 시 전용 공구 필요
• 배송 전 고객 연락 필수"
          />
        </InfoCell>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      {/* 가구사 요청사항 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          가구사 요청사항
        </h3>
        <textarea
          {...register('furniture_requests')}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="가구회사에서 전달한 특별 요청사항이나 주의사항을 입력하세요"
        />
      </div>

      {/* 메인 메모 */}
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-yellow-600" />
          메인 메모
        </h3>
        <textarea
          {...register('main_memo')}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="중요한 배송 정보나 특별 지시사항을 입력하세요"
        />
      </div>

      {/* 기사님 메모 */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          기사님 메모
        </h3>
        <textarea
          {...register('driver_notes')}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="기사님을 위한 특별 메모나 주의사항"
        />
      </div>

      {/* 배정된 기사 */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-green-600" />
          배정된 기사
        </h3>
        <input
          type="text"
          {...register('assigned_driver')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="배정된 기사명 (선택사항)"
        />
      </div>

      {/* 배송 비용 및 특별 옵션 */}
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          배송 비용 및 옵션
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">배송비 (원)</label>
            <input
              type="number"
              min="0"
              {...register('delivery_fee')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="배송비를 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">보험가치 (원)</label>
            <input
              type="number"
              min="0"
              {...register('insurance_value')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="보험가치를 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">착불금액 (원)</label>
            <input
              type="number"
              min="0"
              {...register('cod_amount')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="착불금액을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">배송 시간 선호도</label>
            <select
              {...register('delivery_time_preference')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">선택하세요</option>
              <option value="오전(09:00~12:00)">오전(09:00~12:00)</option>
              <option value="오후(12:00~18:00)">오후(12:00~18:00)</option>
              <option value="저녁(18:00~21:00)">저녁(18:00~21:00)</option>
              <option value="주말">주말</option>
              <option value="평일">평일</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              {...register('fragile')}
              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="text-gray-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              깨지기 쉬운 물품 (취급주의)
            </span>
          </label>
        </div>
      </div>

      {/* 특별 지시사항 */}
      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-600" />
          특별 지시사항
        </h3>
        <textarea
          {...register('special_instructions')}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="특별한 배송 지시사항이나 주의사항을 입력하세요"
        />
      </div>

      {/* 예상 배송일 */}
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          예상 배송일
        </h3>
        <input
          type="datetime-local"
          {...register('estimated_delivery')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 상세 메모 */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <PenTool className="w-5 h-5 text-gray-600" />
          상세 메모
        </h3>
        <textarea
          {...register('detail_notes')}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="추가적인 상세 메모나 기타 정보를 입력하세요"
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      {submitResult ? (
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
          
          {submitResult.success && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                새 접수하기
              </button>
            </div>
          )}
          
          {!submitResult.success && (
            <div className="mt-4">
              <button
                onClick={() => setSubmitResult(null)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">배송접수 정보 확인</h3>
          
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">발송인</h4>
                <p>{watchedValues.sender_name}</p>
                <p className="text-gray-600">{watchedValues.sender_address}</p>
              </div>
              
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">고객 (방문지)</h4>
              <p>{watchedValues.customer_name} ({watchedValues.customer_phone})</p>
              <p className="text-gray-600">{watchedValues.customer_address}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">제품 정보</h4>
              <p>{watchedValues.product_name}</p>
              {watchedValues.product_weight && (
                <p className="text-gray-600">무게: {watchedValues.product_weight}kg</p>
              )}
            </div>
          </div>
          
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-full mt-6 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-4 text-lg rounded-lg transition-colors"
          >
            {isSubmitting ? '접수 처리 중...' : '배송접수 완료'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* QR 스캔 모달 제거됨 - 관리자용에서는 직접 입력만 사용 */}

      {/* 완료 결과 표시 */}
      {submitResult && (
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className={`text-center ${submitResult.success ? 'text-green-600' : 'text-red-600'}`}>
              <div className="text-3xl font-bold mb-4">
                {submitResult.success ? '✅ 접수 완료' : '❌ 접수 실패'}
              </div>
              <p className="text-xl mb-6">{submitResult.message}</p>
              {submitResult.success && submitResult.trackingNumber && (
                <p className="text-lg text-gray-600 mb-6">
                  운송장 번호: <span className="font-mono font-bold text-2xl text-blue-600">{submitResult.trackingNumber}</span>
                </p>
              )}
              <button
                onClick={onSuccess}
                className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg text-lg"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {!submitResult && (
        <div className="max-w-4xl mx-auto p-6">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              새 배송 접수
            </h1>
            <p className="text-lg text-gray-600">
              모든 정보를 입력하여 배송 접수를 완료하세요
            </p>
          </div>

          {/* 통합 폼 */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 기본 정보 섹션 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                <User className="w-7 h-7 text-blue-500" />
                기본 정보
              </h2>
              {renderStep1()}
            </div>

            {/* 현장 정보 섹션 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                <Building className="w-7 h-7 text-purple-500" />
                현장 정보
              </h2>
              {renderStep2()}
            </div>

            {/* 상품 정보 섹션 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                <Package className="w-7 h-7 text-green-500" />
                상품 정보
              </h2>
              {renderStep3()}
            </div>

            {/* 특별 요청 섹션 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                <AlertTriangle className="w-7 h-7 text-orange-500" />
                특별 요청
              </h2>
              {renderStep4()}
            </div>

            {/* 최종 확인 섹션 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                <Check className="w-7 h-7 text-green-500" />
                최종 확인
              </h2>
              {renderStep5()}
            </div>

            {/* 제출 버튼 */}
            <div className="sticky bottom-6 bg-white rounded-lg shadow-xl p-6 border-t">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors text-xl"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    처리 중...
                  </>
                ) : (
                  <>
                    <Check className="w-7 h-7" />
                    배송 접수 완료
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ShippingOrderForm;