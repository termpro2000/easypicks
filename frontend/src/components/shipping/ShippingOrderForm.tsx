import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { 
  User, Phone, Mail, Building, MapPin, Package, Truck, 
  Calendar, Clock, AlertTriangle, Snowflake, FileText, 
  Shield, ChevronLeft, ChevronRight, Check, QrCode, Camera, X,
  Home, Wrench, Weight, Box, Ruler, Settings, Image, PenTool
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { shippingAPI, deliveriesAPI, qrcodeAPI, configAPI, requestTypesAPI } from '../../services/api';
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

const STEPS = [
  { id: 1, title: '기본 정보', description: '기본 배송 정보를 입력하세요' },
  { id: 2, title: '현장 정보', description: '현장 상황 정보를 입력하세요' },
  { id: 3, title: '상품 정보', description: '상품 및 가구 정보를 입력하세요' },
  { id: 4, title: '특별 요청', description: '특별 요청사항을 입력하세요' },
  { id: 5, title: '완료', description: '배송접수를 완료하세요' }
];

interface ShippingOrderFormProps {
  onSuccess?: () => void;
  onNewOrder?: (orderInfo: {
    orderId: number;
    customerName: string;
    productName?: string;
    amount?: number;
  }) => void;
}

const ShippingOrderForm: React.FC<ShippingOrderFormProps> = ({ onSuccess, onNewOrder }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; trackingNumber?: string } | null>(null);
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [requestTypes, setRequestTypes] = useState<string[]>([]);
  const [isLoadingRequestTypes, setIsLoadingRequestTypes] = useState(false);
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);

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
  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate as any);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  // 이전 단계로
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // 단계별 검증 필드 정의
  const getFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 1: return ['sender_name', 'sender_addr', 'customer_name', 'customer_phone', 'customer_address'];
      case 2: return ['building_type', 'floor_count'];
      case 3: return ['product_name'];
      case 4: return [];
      default: return [];
    }
  };

  // QR 코드 데이터 로드 (기존 함수 유지)
  const handleLoadFromQR = async () => {
    if (!qrCodeInput.trim()) {
      alert('QR 코드를 먼저 입력해주세요.');
      return;
    }

    setIsLoadingQR(true);
    try {
      const response = await qrcodeAPI.getProductByQRCode(qrCodeInput);
      
      if (response.success) {
        const data = response.product;
        setValue('product_name', data.product_name || '');
        setValue('furniture_product_code', data.qr_code || '');
        setValue('product_weight', data.weight || 0);
        setValue('product_size', data.size || '');
        
        alert('QR 코드 데이터가 성공적으로 로드되었습니다.');
      } else {
        alert('QR 코드 데이터를 불러오는데 실패했습니다: ' + response.message);
      }
    } catch (error: any) {
      console.error('QR 코드 로드 오류:', error);
      alert('QR 코드 데이터 로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingQR(false);
    }
  };

  // QR 스캔 기능 (기존 함수들 유지)
  const startQRCodeScan = async () => {
    try {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError) {
        alert('카메라 사용 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
        return;
      }
      
      setIsScanning(true);
      setTimeout(() => {
        initQRScanner();
      }, 100);
      
    } catch (error) {
      alert('카메라 접근에 실패했습니다. HTTPS 환경에서 사용해주세요.');
      setIsScanning(false);
    }
  };

  const initQRScanner = () => {
    try {
      if (qrScannerRef.current) {
        qrScannerRef.current.clear();
      }

      const element = document.getElementById('qr-reader');
      if (!element) {
        setIsScanning(false);
        return;
      }

      qrScannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          useBarCodeDetectorIfSupported: true,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true
        },
        false
      );

      qrScannerRef.current.render(
        (decodedText) => {
          setQrCodeInput(decodedText);
          stopQRCodeScan();
        },
        (errorMessage) => {
          if (errorMessage.includes('permission') || 
              errorMessage.includes('NotAllowed') ||
              errorMessage.includes('camera') ||
              errorMessage.includes('Camera')) {
            alert('카메라 접근 중 오류가 발생했습니다: ' + errorMessage);
            stopQRCodeScan();
          }
        }
      );
    } catch (error) {
      alert('QR 스캐너 초기화에 실패했습니다.');
      setIsScanning(false);
    }
  };

  const stopQRCodeScan = () => {
    try {
      if (qrScannerRef.current) {
        qrScannerRef.current.clear();
        qrScannerRef.current = null;
      }
      setIsScanning(false);
    } catch (error) {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      stopQRCodeScan();
    };
  }, []);

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
      {/* QR 코드 섹션 */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-green-600" />
            QR 코드 불러오기
          </h3>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={qrCodeInput}
              onChange={(e) => setQrCodeInput(e.target.value)}
              placeholder="QR 코드 입력"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoadingQR || isScanning}
            />
            <button
              type="button"
              onClick={startQRCodeScan}
              disabled={isLoadingQR || isScanning}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              {isScanning ? '스캔 중...' : '촬영'}
            </button>
            <button
              type="button"
              onClick={handleLoadFromQR}
              disabled={isLoadingQR || isScanning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <QrCode className="w-4 h-4" />
              {isLoadingQR ? '불러오는 중...' : 'QR코드'}
            </button>
          </div>
        </div>
      </div>

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
      {/* 제품 기본 정보 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          제품 기본 정보
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제품명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('product_name', { required: '제품명은 필수입니다' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="제품명을 입력하세요"
            />
            {errors.product_name && <p className="mt-1 text-sm text-red-600">{errors.product_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">가구 제품 코드</label>
            <input
              type="text"
              {...register('furniture_product_code')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="제품 코드"
            />
          </div>

        </div>
      </div>

      {/* 제품 상세 정보 */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Weight className="w-5 h-5 text-blue-600" />
          제품 상세 정보
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">무게 (kg)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              {...register('product_weight')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">전체 무게 (kg)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              {...register('weight')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">제품 크기</label>
            <input
              type="text"
              {...register('product_size')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="가로x세로x높이 (cm)"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">박스 크기</label>
            <input
              type="text"
              {...register('box_size')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="박스 크기 (가로x세로x높이 cm)"
            />
          </div>
        </div>
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
    <div className="max-w-4xl mx-auto p-6">
      {/* QR 코드 스캔 모달 */}
      {isScanning && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              stopQRCodeScan();
            }
          }}
        >
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">QR 코드 스캔</h3>
              <button
                onClick={stopQRCodeScan}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <div
                id="qr-reader"
                className="w-full"
              />
            </div>
            
            <div className="text-center text-sm text-gray-600 mb-4">
              <p>QR 코드를 카메라에 비춰주세요</p>
              <p className="text-xs mt-1 text-gray-500">
                * HTTPS 환경에서만 카메라 사용이 가능합니다<br/>
                * 브라우저에서 카메라 권한을 허용해주세요
              </p>
            </div>
            
            <div className="flex justify-center gap-2">
              <button
                onClick={stopQRCodeScan}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                스캔 중지
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 단계 표시기 */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex-1">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step.id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
              
              <div className="mt-2">
                <p className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 폼 내용 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          {STEPS[currentStep - 1].title}
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </form>
      </div>

      {/* 네비게이션 버튼 */}
      {!submitResult && (
        <div className="flex justify-between gap-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-4 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            이전
          </button>
          
          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              다음
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={() => handleSubmit(onSubmit)()}
              className="flex items-center gap-2 px-6 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
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
          )}
        </div>
      )}
    </div>
  );
};

export default ShippingOrderForm;