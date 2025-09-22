import axios from 'axios';
import type { 
  User, 
  LoginData, 
  RegisterData, 
  ShippingOrderData,
  ShippingOrder,
  ShippingOrderListItem,
  Pagination,
  DatabaseSchema
} from '../types';

/**
 * API 베이스 URL 설정 (환경변수에서 가져오거나 기본값 사용)
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * JWT 토큰을 localStorage에서 가져오는 함수
 */
const getToken = (): string | null => {
  return localStorage.getItem('jwt_token');
};

/**
 * JWT 토큰을 localStorage에 저장하는 함수
 */
const setToken = (token: string): void => {
  localStorage.setItem('jwt_token', token);
};

/**
 * JWT 토큰을 localStorage에서 제거하는 함수
 */
const removeToken = (): void => {
  localStorage.removeItem('jwt_token');
};

/**
 * Axios 클라이언트 인스턴스 생성
 * JWT 토큰 기반 인증 및 세션 쿠키 포함 (백워드 호환성)
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 세션 쿠키 포함 (백워드 호환성)
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * 요청 인터셉터 - JWT 토큰 헤더 추가 (디버깅 로그 포함)
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    console.log('[API Request]', config.method?.toUpperCase(), config.url);
    console.log('[JWT Token Check]', token ? `토큰 있음: ${token.substring(0, 20)}...` : '토큰 없음');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[Authorization Header]', '설정됨');
    } else {
      console.log('[Authorization Header]', '설정 안됨 - JWT 토큰 없음');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 응답 인터셉터 설정 - 인증 오류 처리 및 토큰 만료 처리
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // 인증 실패 또는 토큰 만료 시 토큰 제거
      removeToken();
      console.warn('인증이 필요합니다.');
    }
    return Promise.reject(error);
  }
);

/**
 * 인증 관련 API 함수들
 * 회원가입, 로그인, 로그아웃, 사용자 정보 조회 기능 제공
 */
export const authAPI = {
  // 회원가입
  register: async (data: RegisterData) => {
    const response = await apiClient.post('/auth/register', {
      username: data.username,
      password: data.password,
      name: data.name,
      phone: data.phone,
      company: data.company
    });
    return response.data;
  },

  // 아이디 중복 확인
  checkUsername: async (username: string) => {
    const response = await apiClient.get(`/auth/check-username/${username}`);
    return response.data;
  },

  // 로그인
  login: async (data: LoginData) => {
    console.log('[Login]', '로그인 요청 시작:', data.username);
    const response = await apiClient.post('/auth/login', data);
    
    console.log('[Login Response]', response.data);
    
    // JWT 토큰이 있으면 localStorage에 저장
    if (response.data.token) {
      console.log('[JWT Token]', `받은 토큰: ${response.data.token.substring(0, 30)}...`);
      setToken(response.data.token);
      console.log('[JWT Token]', 'localStorage에 저장 완료');
      
      // 저장 확인
      const savedToken = getToken();
      console.log('[JWT Token Verification]', savedToken ? '저장된 토큰 확인됨' : '저장 실패!');
    } else {
      console.log('[JWT Token]', '서버에서 토큰을 받지 못함');
    }
    
    return response.data;
  },

  // 로그아웃
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    
    // JWT 토큰 제거
    removeToken();
    
    return response.data;
  },

  // 현재 사용자 정보
  me: async (): Promise<{ user: User; authenticated: boolean }> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};

/**
 * 배송 관련 API 함수들
 * 배송 접수 생성, 조회, 수정, 운송장 추적 기능 제공
 */
export const shippingAPI = {
  // 배송접수 생성
  createOrder: async (data: ShippingOrderData) => {
    const response = await apiClient.post('/shipping/orders', data);
    return response.data;
  },

  // 배송접수 목록 조회
  getOrders: async (page = 1, limit = 10): Promise<{
    orders: ShippingOrderListItem[];
    pagination: Pagination;
  }> => {
    const response = await apiClient.get(`/shipping/orders?page=${page}&limit=${limit}`);
    return response.data;
  },

  // 배송접수 상세 조회
  getOrder: async (id: number): Promise<{ order: ShippingOrder }> => {
    const response = await apiClient.get(`/shipping/orders/${id}`);
    return response.data;
  },

  // 운송장 추적 (공개 API)
  trackShipment: async (trackingNumber: string) => {
    const response = await apiClient.get(`/shipping/tracking/${trackingNumber}`);
    return response.data;
  },

  // 배송 접수 상태 업데이트
  updateOrderStatus: async (id: number, status: string) => {
    const response = await apiClient.patch(`/shipping/orders/${id}/status`, { status });
    return response.data;
  },

  // 관리자용 운송장 번호 할당
  assignTrackingNumber: async (id: number, trackingData: {
    tracking_number: string;
    tracking_company?: string;
    estimated_delivery?: string;
  }) => {
    const response = await apiClient.post(`/shipping/orders/${id}/tracking`, trackingData);
    return response.data;
  }
};


/**
 * 서버 상태 확인을 위한 헬스 체크 API
 * @returns 서버 상태 정보
 */
export const healthCheck = async () => {
  const response = await apiClient.get('/', { 
    baseURL: import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'
  });
  return response.data;
};

/**
 * 데이터베이스 스키마 관련 API 함수들
 * 시스템 테스트 도구에서 사용되는 스키마 뷰어 기능
 */
export const schemaAPI = {
  // 전체 데이터베이스 스키마 조회
  getSchema: async (): Promise<{ success: boolean; data: DatabaseSchema }> => {
    const response = await apiClient.get('/schema');
    return response.data;
  },

  // 특정 테이블 상세 정보 조회
  getTableDetails: async (tableName: string) => {
    const response = await apiClient.get(`/schema/table/${tableName}`);
    return response.data;
  }
};

/**
 * 테스트 관련 API 함수들
 * 시스템 테스트 및 개발용 데이터 관리 기능 제공
 */
export const testAPI = {
  // DB 스키마 정보 조회
  getDbSchema: async () => {
    const response = await apiClient.get('/test/db-schema');
    return response.data;
  },

  // 테이블 관계 정보 조회
  getTableRelationships: async () => {
    const response = await apiClient.get('/test/table-relationships');
    return response.data;
  },

  // 파트너사 목록 조회
  getPartnersList: async () => {
    const response = await apiClient.get('/test/partners');
    return response.data;
  },

  // 모든 파트너사 삭제
  deleteAllPartners: async () => {
    const response = await apiClient.delete('/test/partners');
    return response.data;
  },

  // 기사 목록 조회
  getDriversList: async () => {
    const response = await apiClient.get('/test/drivers');
    return response.data;
  },

  // 모든 기사 삭제
  deleteAllDrivers: async () => {
    const response = await apiClient.delete('/test/drivers');
    return response.data;
  },

  // 랜덤 기사 생성
  createRandomDriver: async () => {
    const response = await apiClient.post('/test/create-driver');
    return response.data;
  },

  // 랜덤 파트너사 사용자 생성
  createRandomPartner: async () => {
    const response = await apiClient.post('/test/create-partner');
    return response.data;
  },

  // 랜덤 배송 생성
  createRandomDelivery: async (visitDate?: string) => {
    const response = await apiClient.post('/test/create-delivery', visitDate ? { visit_date: visitDate } : {});
    return response.data;
  },

  // 커스텀 배송 생성
  createCustomDelivery: async (deliveryData: any) => {
    const response = await apiClient.post('/test/create-custom-delivery', deliveryData);
    return response.data;
  },

  // 모든 배송 삭제
  deleteAllDeliveries: async () => {
    const response = await apiClient.delete('/test/deliveries');
    return response.data;
  },

  // 배송 목록 조회
  getDeliveriesList: async () => {
    const response = await apiClient.get('/test/deliveries');
    return response.data;
  },

  // deliveries 테이블에 driver_id 컬럼 추가
  addDriverIdColumn: async () => {
    const response = await apiClient.post('/test/add-driver-column');
    return response.data;
  }
};

/**
 * 상품 관리 API 함수들
 * 상품 CRUD 작업을 위한 API 함수들
 */
export const productsAPI = {
  // 모든 상품 조회
  getAllProducts: async () => {
    const response = await apiClient.get('/products');
    return response.data;
  },

  // 특정 상품 조회
  getProduct: async (id: number) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  // 새 상품 생성
  createProduct: async (data: {
    maincode?: string;
    subcode?: string;
    name: string;
    weight?: number;
    size?: string;
    cost1?: number;
    cost2?: number;
    memo?: string;
  }) => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },

  // 상품 수정
  updateProduct: async (id: number, data: {
    maincode?: string;
    subcode?: string;
    name: string;
    weight?: number;
    size?: string;
    cost1?: number;
    cost2?: number;
    memo?: string;
  }) => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },

  // 상품 삭제
  deleteProduct: async (id: number) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  // 상품 검색
  searchProducts: async (query: string) => {
    const response = await apiClient.get(`/products/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};

/**
 * 상품 사진 관리 API 함수들
 * 상품 사진 업로드, 조회, 삭제를 위한 API 함수들
 */
export const productPhotosAPI = {
  // 상품 사진 업로드
  uploadPhoto: async (productId: number, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('product_id', productId.toString());

    const response = await apiClient.post('/product-photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // 상품 사진 목록 조회
  getProductPhotos: async (productId: number) => {
    const response = await apiClient.get(`/product-photos/product/${productId}`);
    return response.data;
  },

  // 상품 사진 삭제
  deletePhoto: async (photoId: number) => {
    const response = await apiClient.delete(`/product-photos/${photoId}`);
    return response.data;
  }
};

/**
 * 배송 관리 API 함수들
 * 배송 조회, 수정, 기사 배정을 위한 API 함수들
 */
export const deliveriesAPI = {
  // 배송 목록 조회
  getDeliveries: async (page: number = 1, limit: number = 50) => {
    const response = await apiClient.get(`/deliveries?page=${page}&limit=${limit}`);
    return response.data;
  },

  // 배송 상세 조회
  getDelivery: async (id: number) => {
    const response = await apiClient.get(`/deliveries/${id}`);
    return response.data;
  },

  // 배송 수정
  updateDelivery: async (id: number, data: any) => {
    const response = await apiClient.put(`/deliveries/${id}`, data);
    return response.data;
  },

  // 배송 기사 배정
  assignDriver: async (deliveryId: number, driverId: number) => {
    const response = await apiClient.post(`/deliveries/${deliveryId}/assign`, { driver_id: driverId });
    return response.data;
  }
};

/**
 * 기사 관리 API 함수들
 * 기사 조회, 등록, 수정을 위한 API 함수들
 */
export const driversAPI = {
  // 모든 기사 조회
  getAllDrivers: async () => {
    const response = await apiClient.get('/drivers');
    return response.data;
  },

  // 기사 상세 조회
  getDriver: async (id: number) => {
    const response = await apiClient.get(`/drivers/${id}`);
    return response.data;
  },

  // 기사 등록
  createDriver: async (data: any) => {
    const response = await apiClient.post('/drivers', data);
    return response.data;
  },

  // 기사 수정
  updateDriver: async (id: number, data: any) => {
    const response = await apiClient.put(`/drivers/${id}`, data);
    return response.data;
  }
};

/**
 * 사용자 관리 API 함수들
 * 사용자 CRUD 및 인증을 위한 API 함수들
 */
export const userAPI = {
  // 모든 사용자 조회
  getAllUsers: async (page: number = 1, limit: number = 50, searchTerm: string = '', roleFilter: string = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(searchTerm && { search: searchTerm }),
      ...(roleFilter && { role: roleFilter })
    });
    const response = await apiClient.get(`/users?${params}`);
    return response.data;
  },

  // 사용자 상세 조회
  getUser: async (id: number) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // 사용자 생성
  createUser: async (data: {
    username: string;
    password: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    role?: string;
    default_sender_address?: string;
    default_sender_detail_address?: string;
    default_sender_zipcode?: string;
  }) => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  // 사용자 수정
  updateUser: async (id: number, data: any) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },

  // 사용자 삭제
  deleteUser: async (id: number) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  // 사용자 로그인
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  },

  // 사용자 등록
  register: async (userData: any) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  }
};

/**
 * JWT 토큰 관리 함수들
 */
export const tokenAPI = {
  getToken,
  setToken,
  removeToken,
  isAuthenticated: (): boolean => !!getToken()
};

/**
 * API 클라이언트 인스턴스 내보내기
 * named export와 default export로 모두 사용 가능
 */
export const api = apiClient;
export default apiClient;