import type { User, ShippingOrderData } from '../types';

// Mock 사용자 데이터
export const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    name: '관리자',
    email: 'admin@easypicks.com',
    phone: '010-1234-5678',
    company: '이지픽스',
    role: 'admin',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    default_sender_name: '관리자',
    default_sender_company: '이지픽스',
    default_sender_phone: '010-1234-5678',
    default_sender_address: '서울시 강남구 테헤란로 123',
    default_sender_detail_address: '456호',
    default_sender_zipcode: '12345'
  },
  {
    id: 2,
    username: 'partner1',
    name: '김파트너',
    email: 'partner1@example.com',
    phone: '010-2345-6789',
    company: '파트너회사A',
    role: 'partner',
    is_active: true,
    created_at: '2024-01-15T00:00:00Z',
    default_sender_name: '김파트너',
    default_sender_company: '파트너회사A',
    default_sender_phone: '010-2345-6789',
    default_sender_address: '서울시 서초구 서초대로 456',
    default_sender_detail_address: '789호',
    default_sender_zipcode: '54321'
  },
  {
    id: 3,
    username: 'driver1',
    name: '이기사',
    email: 'driver1@example.com',
    phone: '010-3456-7890',
    company: null,
    role: 'driver',
    is_active: true,
    created_at: '2024-02-01T00:00:00Z'
  }
];

// Mock 관리자 사용자
export const mockAdminUser: User = mockUsers[0];

// Mock 파트너 사용자
export const mockPartnerUser: User = mockUsers[1];

// Mock 기사 사용자
export const mockDriverUser: User = mockUsers[2];

// Mock 배송 데이터
export const mockDeliveryData: ShippingOrderData = {
  sender_name: '김발송자',
  sender_address: '서울시 강남구 테헤란로 123',
  sender_detail_address: '456호',
  customer_name: '박고객',
  customer_phone: '010-9876-5432',
  customer_address: '서울시 송파구 올림픽로 789',
  customer_detail_address: '101호',
  product_name: '테스트 상품',
  building_type: 'apartment',
  floor_count: 5,
  status: 'pending',
  weight: 10.5,
  request_type: '일반',
  construction_type: '1인시공',
  visit_date: '2024-12-31',
  visit_time: '14:00',
  assigned_driver: '이기사',
  furniture_company: '파트너회사A',
  main_memo: '테스트 메모',
  emergency_contact: '010-1111-2222',
  elevator_available: true,
  ladder_truck: false,
  disposal: false,
  room_movement: true,
  wall_construction: false,
  furniture_product_code: 'TEST001',
  product_weight: 8.5,
  product_size: '100x50x30',
  box_size: '110x60x40',
  furniture_requests: '조심히 다뤄주세요',
  driver_notes: '2층까지 운반',
  delivery_fee: 50000,
  special_instructions: '주말 배송 희망',
  fragile: true,
  insurance_value: 500000,
  cod_amount: 0,
  estimated_delivery: '2024-12-31T15:00:00Z',
  detail_notes: '추가 상세 메모',
  delivery_time_preference: '오후(12:00~18:00)'
};

// Mock 배송 목록 데이터
export const mockDeliveries = [
  {
    id: 1,
    ...mockDeliveryData,
    status: 'pending',
    tracking_number: 'EP2024001',
    created_at: '2024-12-01T09:00:00Z',
    updated_at: '2024-12-01T09:00:00Z'
  },
  {
    id: 2,
    ...mockDeliveryData,
    sender_name: '이발송자',
    customer_name: '최고객',
    product_name: '다른 상품',
    status: 'in_transit',
    tracking_number: 'EP2024002',
    created_at: '2024-12-02T10:00:00Z',
    updated_at: '2024-12-02T14:00:00Z'
  },
  {
    id: 3,
    ...mockDeliveryData,
    sender_name: '박발송자',
    customer_name: '김고객',
    product_name: '완료된 상품',
    status: 'completed',
    tracking_number: 'EP2024003',
    created_at: '2024-12-03T11:00:00Z',
    updated_at: '2024-12-03T17:00:00Z'
  }
];

// Mock 제품 데이터
export const mockProducts = [
  {
    id: 1,
    maincode: 'MAIN001',
    subcode: 'SUB001',
    name: '테스트 침대',
    weight: 50,
    size: '200x160x30',
    cost1: 300000,
    cost2: 350000,
    memo: '킹사이즈 침대',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    maincode: 'MAIN002',
    subcode: 'SUB002',
    name: '테스트 소파',
    weight: 35,
    size: '220x90x80',
    cost1: 400000,
    cost2: 450000,
    memo: '3인용 소파',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
];

// Mock 기사 데이터
export const mockDrivers = [
  {
    id: 1,
    username: 'driver1',
    name: '이기사',
    phone: '010-3456-7890',
    email: 'driver1@example.com',
    vehicle_type: '1톤 트럭',
    vehicle_number: '12가3456',
    license_number: 'LIC123456',
    is_active: true,
    created_at: '2024-02-01T00:00:00Z'
  },
  {
    id: 2,
    username: 'driver2',
    name: '박기사',
    phone: '010-4567-8901',
    email: 'driver2@example.com',
    vehicle_type: '라보',
    vehicle_number: '34나5678',
    license_number: 'LIC789012',
    is_active: true,
    created_at: '2024-02-02T00:00:00Z'
  }
];

// Mock 의뢰종류 데이터
export const mockRequestTypes = [
  { id: 1, name: '일반', description: '일반 배송', sort_order: 1, is_active: true },
  { id: 2, name: '회수', description: '상품 회수', sort_order: 2, is_active: true },
  { id: 3, name: '조치', description: '설치 및 조치', sort_order: 3, is_active: true },
  { id: 4, name: '쿠팡', description: '쿠팡 배송', sort_order: 4, is_active: true },
  { id: 5, name: '네이버', description: '네이버 배송', sort_order: 5, is_active: true }
];

// Mock API 응답 형태
export const mockApiResponse = {
  success: true,
  message: '성공',
  data: null
};

// Mock 로그인 응답
export const mockLoginResponse = {
  success: true,
  message: '로그인 성공',
  token: 'mock-jwt-token-12345',
  user: mockAdminUser
};

// Mock 배송 생성 응답
export const mockCreateDeliveryResponse = {
  success: true,
  message: '배송이 성공적으로 접수되었습니다.',
  trackingNumber: 'EP2024999',
  data: {
    id: 999,
    ...mockDeliveryData,
    tracking_number: 'EP2024999',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
};