import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  User, Phone, Building, MapPin, Package, Truck, 
  Calendar, Clock, AlertTriangle, FileText, Shield, 
  Home, Wrench, Weight, Box, Settings, ArrowLeft, Check, Search, Plus, Trash2, Zap, Mail
} from 'lucide-react';
import { shippingAPI, deliveriesAPI, productsAPI, userDetailAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import ProductSelectionModal from '../partner/ProductSelectionModal';

// Daum 우편번호 서비스 타입 선언
declare global {
  interface Window {
    daum: any;
  }
}

interface DeliveryData {
  sender_name: string;
  sender_address: string;
  sender_detail_address?: string;
  sender_phone?: string;
  sender_email?: string;
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

interface ShippingOrderFormProps {
  onSuccess?: () => void;
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

const ShippingOrderForm: React.FC<ShippingOrderFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; trackingNumber?: string } | null>(null);
  const [requestTypes, setRequestTypes] = useState<string[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [products, setProducts] = useState<{
    id?: number; 
    product_code: string;
    product_name?: string;
    product_size?: string;
    box_size?: string;
    product_weight?: string;
    cost1?: string;
  }[]>([]);
  
  // 제품 검색 관련 상태
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productSearchResults, setProductSearchResults] = useState<any[]>([]);
  const [isProductSearching, setIsProductSearching] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProductForAdd, setSelectedProductForAdd] = useState<any>(null);
  
  // 제품 입력 필드들
  const [currentProductWeight, setCurrentProductWeight] = useState('');
  const [currentProductSize, setCurrentProductSize] = useState('');
  const [currentBoxSize, setCurrentBoxSize] = useState('');
  const [currentProductCost1, setCurrentProductCost1] = useState('');

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
        // 더미 데이터 사용 (향후 백엔드 API 연결)
        const response = { success: true, data: ['일반', '회수', '조치', '쿠팡', '네이버'] };
        if (response.success && response.data) {
          setRequestTypes(response.data);
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

  // 제품 검색 드롭다운 외부 클릭 처리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.product-search-container')) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<DeliveryData>({
    defaultValues: {
      status: 'pending',
      building_type: '아파트',
      request_type: '일반',
      construction_type: '1인시공',
      elevator_available: false,
      ladder_truck: false,
      disposal: false,
      room_movement: false,
      wall_construction: false,
      fragile: false,
      floor_count: 1
    }
  });

  // 사용자 정보로 발송인 정보 자동 채우기
  useEffect(() => {
    const loadUserInfo = async () => {
      if (user) {
        try {
          // 발송인 이름 설정 (name 또는 username 사용)
          if (user.name) {
            setValue('sender_name', user.name);
          } else if (user.username) {
            setValue('sender_name', user.username);
          }

          // 기본 사용자 정보 설정
          if (user.phone) {
            setValue('sender_phone', user.phone);
          }
          
          if (user.email) {
            setValue('sender_email', user.email);
          }

          // 사용자 상세 정보에서 파트너 추가 정보의 발송인 주소 가져오기
          if (user.id) {
            try {
              const userDetailResponse = await userDetailAPI.getUserDetail(user.id);
              if (userDetailResponse.success && userDetailResponse.detail) {
                const detail = typeof userDetailResponse.detail === 'string' 
                  ? JSON.parse(userDetailResponse.detail) 
                  : userDetailResponse.detail;

                // 파트너 추가 정보의 발송인 주소를 우선적으로 사용
                if (detail.sender_address) {
                  setValue('sender_address', detail.sender_address);
                }
                
                if (detail.sender_detail_address) {
                  setValue('sender_detail_address', detail.sender_detail_address);
                }

                // 회사명이 있고 발송인 이름이 없다면 회사명을 발송인 이름으로 설정 (옵션)
                if (detail.company && !user.name) {
                  setValue('sender_name', detail.company);
                }
              }
            } catch (error) {
              console.log('사용자 상세 정보 로드 실패 (선택사항):', error);
              // 에러가 발생해도 기본 사용자 정보는 이미 설정되었으므로 무시
            }
          }

          // 파트너 추가 정보에 주소가 없는 경우에만 기본 주소 사용 (폴백)
          if (!user.id) {
            if (user.default_sender_address) {
              setValue('sender_address', user.default_sender_address);
            }
            
            if (user.default_sender_detail_address) {
              setValue('sender_detail_address', user.default_sender_detail_address);
            }
          }
        } catch (error) {
          console.error('사용자 정보 로드 실패:', error);
        }
      }
    };

    loadUserInfo();
  }, [user, setValue]);

  // 랜덤 데이터 생성 함수들
  const generateRandomName = () => {
    const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
    const names = ['민수', '지영', '현우', '수진', '동호', '영희', '철수', '미경', '준호', '은지'];
    return surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)];
  };

  const generateRandomPhone = () => {
    const prefixes = ['010', '011', '016', '017', '018', '019'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const middle = Math.floor(Math.random() * 9000) + 1000;
    const last = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${middle}-${last}`;
  };

  const generateRandomAddress = () => {
    const cities = ['서울시', '부산시', '대구시', '인천시', '광주시', '대전시', '울산시'];
    const districts = ['강남구', '강서구', '송파구', '영등포구', '마포구', '종로구', '중구', '서초구'];
    const streets = ['테헤란로', '강남대로', '세종대로', '을지로', '청담로', '논현로', '선릉로', '봉은사로'];
    const numbers = Math.floor(Math.random() * 999) + 1;
    
    return `${cities[Math.floor(Math.random() * cities.length)]} ${districts[Math.floor(Math.random() * districts.length)]} ${streets[Math.floor(Math.random() * streets.length)]} ${numbers}`;
  };

  const generateRandomCompany = () => {
    const types = ['㈜', '(주)', ''];
    const names = ['삼성전자', '엘지전자', '현대', '기아', '포스코', '한화', '두산', '롯데', 'SK', 'KT'];
    const suffixes = ['', '코퍼레이션', '그룹', '홀딩스', '테크놀로지', '시스템'];
    
    return `${types[Math.floor(Math.random() * types.length)]}${names[Math.floor(Math.random() * names.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  };

  const generateRandomProduct = () => {
    const products = ['소파', '침대', '옷장', '식탁', '의자', '책상', '서랍장', '냉장고', '세탁기', '에어컨', 'TV', '책장'];
    const adjectives = ['럭셔리', '모던', '클래식', '빈티지', '심플', '프리미엄', '스마트', '컴팩트'];
    
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${products[Math.floor(Math.random() * products.length)]}`;
  };

  const generateRandomDate = () => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // 30일 내 랜덤
    return futureDate.toISOString().split('T')[0];
  };

  const generateRandomTime = () => {
    const hours = ['09', '10', '11', '12', '13', '14', '15', '16', '17'];
    const minutes = ['00', '30'];
    return `${hours[Math.floor(Math.random() * hours.length)]}:${minutes[Math.floor(Math.random() * minutes.length)]}`;
  };

  // 자동 채움 핸들러
  const handleAutoFill = () => {
    const randomData = {
      sender_name: generateRandomName(),
      sender_address: generateRandomAddress(),
      sender_detail_address: `${Math.floor(Math.random() * 20) + 1}층 ${Math.floor(Math.random() * 10) + 1}호`,
      customer_name: generateRandomName(),
      customer_phone: generateRandomPhone(),
      customer_address: generateRandomAddress(),
      customer_detail_address: `${Math.floor(Math.random() * 15) + 1}층`,
      product_name: generateRandomProduct(),
      furniture_company: generateRandomCompany(),
      visit_date: generateRandomDate(),
      visit_time: generateRandomTime(),
      emergency_contact: generateRandomName(),
      main_memo: '테스트용 자동 생성 데이터입니다.',
      special_instructions: '조심히 배송 부탁드립니다.',
      driver_notes: '배송 시 주의사항을 확인해주세요.',
      furniture_requests: '설치 후 정리 부탁드립니다.',
      delivery_fee: Math.floor(Math.random() * 50000) + 10000, // 10,000 ~ 60,000원
      insurance_value: Math.floor(Math.random() * 1000000) + 100000, // 100,000 ~ 1,100,000원
      floor_count: Math.floor(Math.random() * 20) + 1, // 1 ~ 20층
      status: 'pending',
      request_type: ['일반', '긴급', '예약'][Math.floor(Math.random() * 3)],
      construction_type: ['설치', '배송만', '조립'][Math.floor(Math.random() * 3)],
      building_type: ['아파트', '빌라', '오피스텔', '단독주택', '상가'][Math.floor(Math.random() * 5)],
      elevator_available: Math.random() > 0.3, // 70% 확률로 엘리베이터 있음
      ladder_truck: Math.random() > 0.7, // 30% 확률로 사다리차 필요
      disposal: Math.random() > 0.8, // 20% 확률로 폐기물 처리
      room_movement: Math.random() > 0.6, // 40% 확률로 방간이동
      wall_construction: Math.random() > 0.8, // 20% 확률로 벽시공
      fragile: Math.random() > 0.5 // 50% 확률로 파손주의
    };

    // 모든 필드에 값 설정
    Object.entries(randomData).forEach(([key, value]) => {
      setValue(key as keyof DeliveryData, value);
    });

    console.log('🎲 테스트용 자동 채움 완료:', randomData);
  };

  // 주소 검색 함수
  const openAddressSearch = (type: 'sender' | 'customer') => {
    if (!window.daum || !window.daum.Postcode) {
      console.log('주소 검색 서비스를 로드하는 중입니다.');
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

  // 제품 검색 함수
  const handleProductSearch = async (query: string) => {
    setProductSearchQuery(query);
    
    if (query.length < 2) {
      setProductSearchResults([]);
      setShowProductDropdown(false);
      return;
    }
    
    setIsProductSearching(true);
    try {
      const response = await productsAPI.searchProducts(query);
      setProductSearchResults(response.products || []);
      setShowProductDropdown(true);
    } catch (error) {
      console.error('제품 검색 오류:', error);
      setProductSearchResults([]);
    } finally {
      setIsProductSearching(false);
    }
  };

  // 제품 선택 처리 (검색 드롭다운에서 선택)
  const handleSelectProductFromSearch = (product: any) => {
    setSelectedProductForAdd(product);
    setProductSearchQuery(product.name);
    setShowProductDropdown(false);
    
    // 제품 정보 자동 입력 (모달 선택과 동일한 로직)
    if (product.weight) {
      const weightStr = typeof product.weight === 'number' 
        ? `${product.weight}kg` 
        : String(product.weight);
      setCurrentProductWeight(weightStr);
    }
    
    if (product.size) {
      setCurrentProductSize(product.size);
    }
    
    // 박스 크기 자동 설정
    if (product.size && !currentBoxSize) {
      setCurrentBoxSize(product.size);
    }
    
    // 폼 필드들에 자동 입력
    setValue('product_name', product.name || '');
    
    if (product.maincode) {
      setValue('furniture_product_code', product.maincode);
    }
    
    console.log('검색에서 제품 선택 완료:', product.name);
  };

  // 제품선택 버튼 클릭 처리 (기존 ProductSelectionModal 활용)
  const handleOpenProductSelectionModal = () => {
    setIsProductModalOpen(true);
  };

  // ProductSelectionModal에서 제품 선택 시 호출되는 함수 수정
  const handleSelectProduct = (product: any) => {
    console.log('선택된 제품:', product);
    
    // 기존 선택 제품 상태 업데이트
    setSelectedProductForAdd(product);
    setProductSearchQuery(product.name || '');
    
    // 제품 정보 자동 입력 - 모든 필드 자동 채움
    if (product.weight) {
      // 숫자인 경우 kg 단위 추가, 문자열인 경우 그대로 사용
      const weightStr = typeof product.weight === 'number' 
        ? `${product.weight}kg` 
        : String(product.weight);
      setCurrentProductWeight(weightStr);
    }
    
    if (product.size) {
      setCurrentProductSize(product.size);
    }
    
    // 박스 크기는 제품 크기보다 약간 크게 자동 설정 (옵션)
    if (product.size && !currentBoxSize) {
      setCurrentBoxSize(product.size); // 기본값으로 제품 크기와 동일하게 설정
    }
    
    // 폼 필드들에 자동 입력
    setValue('product_name', product.name || '');
    
    // 제품 코드도 설정 (maincode 또는 subcode 사용)
    if (product.maincode) {
      // furniture_product_code 필드가 있다면 설정
      setValue('furniture_product_code', product.maincode);
    }
    
    // 모달 닫기
    setIsProductModalOpen(false);
    
    // 성공 메시지
    console.log('제품 정보 자동 입력 완료:', {
      name: product.name,
      weight: product.weight,
      size: product.size,
      code: product.maincode
    });
    
    // 사용자에게 알림 (옵션)
    if (product.name) {
      // alert 대신 더 나은 UX를 위해 console로만 처리
      console.log(`"${product.name}" 제품이 선택되었습니다.`);
    }
  };

  // 제품 추가 함수
  const handleAddProduct = () => {
    const productCode = selectedProductForAdd?.code || selectedProductForAdd?.maincode || productSearchQuery.trim();
    const productName = selectedProductForAdd?.name || productSearchQuery.trim();
    
    if (!productCode && !productName) {
      alert('제품을 검색하여 선택하거나 제품명을 직접 입력해주세요.');
      return;
    }

    // 중복 제품 확인
    if (products.some(p => p.product_code === (productCode || productName))) {
      alert('이미 추가된 제품입니다.');
      return;
    }

    const newProduct = {
      id: selectedProductForAdd?.id,
      product_code: productCode || productName,
      product_name: productName,
      product_size: currentProductSize.trim() || undefined,
      box_size: currentBoxSize.trim() || undefined,
      product_weight: currentProductWeight.trim() || undefined,
      cost1: currentProductCost1.trim() || undefined,
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);

    // 입력 필드들 초기화
    setProductSearchQuery('');
    setSelectedProductForAdd(null);
    setShowProductDropdown(false);
    setCurrentProductWeight('');
    setCurrentProductSize('');
    setCurrentBoxSize('');
    setCurrentProductCost1('');
    
    console.log('제품이 추가되었습니다:', newProduct);
  };

  // 제품 제거 함수
  const handleRemoveProduct = (index: number) => {
    if (confirm('이 제품을 제거하시겠습니까?')) {
      const updatedProducts = products.filter((_, i) => i !== index);
      setProducts(updatedProducts);
      console.log('제품이 제거되었습니다:', products[index]);
    }
  };

  // 폼 제출
  const onSubmit = async (data: DeliveryData) => {
    setIsSubmitting(true);
    try {
      console.log('배송접수 폼 제출 데이터:', data);
      console.log('선택된 제품 목록:', products);
      
      // 데이터 형식을 deliveriesAPI에 맞게 변환 (멀티-프로덕트 지원)
      const deliveryData = {
        // 기본 배송 정보
        sender_name: data.sender_name,
        sender_address: data.sender_address,
        sender_detail_address: data.sender_detail_address,
        sender_phone: data.sender_phone,
        sender_email: data.sender_email,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_address: data.customer_address,
        customer_detail_address: data.customer_detail_address,
        product_name: products.length > 0 ? products[0].product_name || products[0].product_code : '',
        
        // 배송 옵션
        request_type: data.request_type,
        construction_type: data.construction_type,
        visit_date: data.visit_date,
        visit_time: data.visit_time,
        furniture_company: data.furniture_company,
        main_memo: data.main_memo,
        emergency_contact: data.emergency_contact,
        
        // 건물 정보
        building_type: data.building_type,
        floor_count: data.floor_count,
        elevator_available: data.elevator_available,
        ladder_truck: data.ladder_truck,
        disposal: data.disposal,
        room_movement: data.room_movement,
        wall_construction: data.wall_construction,
        
        // 기타 정보
        delivery_fee: data.delivery_fee,
        special_instructions: data.special_instructions,
        fragile: data.fragile,
        insurance_value: data.insurance_value,
        cod_amount: data.cod_amount,
        estimated_delivery: data.estimated_delivery,
        furniture_requests: data.furniture_requests,
        driver_notes: data.driver_notes,
        detail_notes: data.detail_notes,
        delivery_time_preference: data.delivery_time_preference,
        
        // 멀티-프로덕트 지원: products 배열 추가
        products: products
      };
      
      const response = await deliveriesAPI.createDelivery(deliveryData);
      console.log('멀티-프로덕트 배송 생성 응답:', response);
      console.log('저장된 제품 수:', response.delivery?.productsCount || 0);
      
      setSubmitResult({
        success: true,
        message: `배송이 성공적으로 접수되었습니다. (제품 ${products.length}개 포함)`,
        trackingNumber: response.trackingNumber || response.delivery?.tracking_number,
        deliveryId: response.delivery?.id,
        productsCount: products.length
      });
    } catch (error: any) {
      console.error('❌ 배송 접수 오류:', error);
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
        <div className="max-w-md mx-auto pt-20">
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
                onClick={() => onSuccess?.()}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                메인으로
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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

              <InfoCell label="발송인 전화번호" icon={Phone}>
                <input
                  type="tel"
                  {...register('sender_phone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="010-1234-5678"
                />
              </InfoCell>

              <InfoCell label="발송인 이메일" icon={Mail}>
                <input
                  type="email"
                  {...register('sender_email')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="example@company.com"
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
              <InfoCell label="제품 검색" icon={Package} required>
                <div className="flex gap-2 relative product-search-container">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => handleProductSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="제품명 또는 코드로 검색..."
                      onFocus={() => productSearchResults.length > 0 && setShowProductDropdown(true)}
                    />
                    {isProductSearching && (
                      <div className="absolute right-2 top-2.5">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* 제품선택 버튼 */}
                  <button
                    type="button"
                    onClick={handleOpenProductSelectionModal}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 flex items-center gap-2 whitespace-nowrap"
                  >
                    <Search className="w-4 h-4" />
                    제품선택
                  </button>
                  
                  <div className="relative">
                    {isProductSearching && (
                      <div className="absolute right-2 top-2.5">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    
                    {/* 검색 결과 드롭다운 */}
                    {showProductDropdown && productSearchResults.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {productSearchResults.map((product, index) => (
                          <div
                            key={index}
                            onClick={() => handleSelectProductFromSearch(product)}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-600">
                              코드: {product.code || product.maincode || '-'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* 검색 결과 없음 메시지 */}
                    {showProductDropdown && productSearchResults.length === 0 && productSearchQuery.length >= 2 && !isProductSearching && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-gray-500 text-sm">
                        검색 결과가 없습니다.
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                    title="제품 추가"
                  >
                    <Plus className="w-4 h-4" />
                    추가
                  </button>
                </div>
              </InfoCell>

              <InfoCell label="제품무게" icon={Weight}>
                <input
                  type="text"
                  value={currentProductWeight}
                  onChange={(e) => setCurrentProductWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 50kg"
                />
              </InfoCell>

              <InfoCell label="제품크기" icon={Box}>
                <input
                  type="text"
                  value={currentProductSize}
                  onChange={(e) => setCurrentProductSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 1200x800x600mm"
                />
              </InfoCell>

              <InfoCell label="박스크기" icon={Box}>
                <input
                  type="text"
                  value={currentBoxSize}
                  onChange={(e) => setCurrentBoxSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 1300x900x700mm"
                />
              </InfoCell>

              <InfoCell label="배송비용" icon={Shield}>
                <input
                  type="number"
                  value={currentProductCost1}
                  onChange={(e) => setCurrentProductCost1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 50000"
                  min="0"
                />
              </InfoCell>

              {/* 선택된 상품 목록 */}
              {products.length > 0 && (
                <div className="col-span-full">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        선택된 제품 목록
                        <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                          {products.length}개
                        </span>
                      </div>
                    </h4>
                    <div className="space-y-3">
                      {products.map((product, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* 제품명 */}
                              {product.product_name && (
                                <div className="mb-2">
                                  <h5 className="font-semibold text-gray-900 text-lg">{product.product_name}</h5>
                                </div>
                              )}
                              
                              {/* 제품 정보 그리드 */}
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                                <div className="bg-gray-50 rounded-md p-2">
                                  <span className="font-medium text-gray-600 block">제품코드</span>
                                  <span className="font-mono text-gray-900 text-xs">{product.product_code}</span>
                                </div>
                                <div className="bg-gray-50 rounded-md p-2">
                                  <span className="font-medium text-gray-600 block">제품명</span>
                                  <span className="text-gray-900">{product.product_name || '-'}</span>
                                </div>
                                <div className="bg-gray-50 rounded-md p-2">
                                  <span className="font-medium text-gray-600 block">제품무게</span>
                                  <span className="text-gray-900">{product.product_weight || '-'}</span>
                                </div>
                                <div className="bg-gray-50 rounded-md p-2">
                                  <span className="font-medium text-gray-600 block">제품크기</span>
                                  <span className="text-gray-900">{product.product_size || '-'}</span>
                                </div>
                                <div className="bg-gray-50 rounded-md p-2">
                                  <span className="font-medium text-gray-600 block">박스크기</span>
                                  <span className="text-gray-900">{product.box_size || '-'}</span>
                                </div>
                                <div className="bg-gray-50 rounded-md p-2">
                                  <span className="font-medium text-gray-600 block">배송비용</span>
                                  <span className="text-gray-900">{product.cost1 ? `${parseInt(product.cost1).toLocaleString()}원` : '-'}</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveProduct(index)}
                              className="ml-3 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              title="제품 제거"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 요약 정보 */}
                    <div className="mt-4 pt-3 border-t border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <span>제품 종류: {products.length}개</span>
                        <span>
                          예상 총 중량: {products.reduce((sum, p) => {
                            const weight = parseFloat(p.product_weight?.replace(/[^0-9.]/g, '') || '0');
                            return sum + weight;
                          }, 0).toFixed(1)}kg
                        </span>
                        <span>
                          총 배송비용: {products.reduce((sum, p) => {
                            const cost = parseFloat(p.cost1?.replace(/[^0-9.]/g, '') || '0');
                            return sum + cost;
                          }, 0).toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
          {/* 파일명 표시 */}
          <div className="mt-4 text-xs text-gray-400 text-center">
            ShippingOrderForm.tsx
          </div>
        </form>
      </main>

      {/* 상품 선택 모달 */}
      <ProductSelectionModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelectProduct={handleSelectProduct}
      />
    </div>
  );
};

export default ShippingOrderForm;