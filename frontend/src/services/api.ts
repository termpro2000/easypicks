import axios from 'axios';
import type { 
  User, 
  LoginData, 
  RegisterData, 
  ShippingOrderData,
  ShippingOrder,
  ShippingOrderListItem,
  Pagination 
} from '../types';

/**
 * API 베이스 URL 설정 (환경변수에서 가져오거나 기본값 사용)
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * 로그인 세션 데이터 인터페이스
 */
interface LoginSession {
  token: string;
  user: any;
  expiresAt: number; // timestamp
  lastActivity: number; // timestamp
}

/**
 * JWT 토큰을 localStorage에서 가져오는 함수 (기존 호환성 유지)
 */
const getToken = (): string | null => {
  const session = getLoginSession();
  return session?.token || null;
};

/**
 * 로그인 세션을 localStorage에서 가져오고 유효성 검사하는 함수
 */
const getLoginSession = (): LoginSession | null => {
  try {
    const sessionData = localStorage.getItem('login_session');
    if (!sessionData) return null;

    const session: LoginSession = JSON.parse(sessionData);
    const now = Date.now();

    // 5일(432000초) 이상 비활성 상태이면 세션 만료
    const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000; // 5일을 밀리초로
    if (now - session.lastActivity > FIVE_DAYS) {
      console.log('세션이 5일 이상 비활성 상태로 만료됨');
      removeLoginSession();
      return null;
    }

    // 활동 시간 업데이트 (마지막 활동으로부터 1시간 이상 지났을 때만)
    const ONE_HOUR = 60 * 60 * 1000;
    if (now - session.lastActivity > ONE_HOUR) {
      session.lastActivity = now;
      localStorage.setItem('login_session', JSON.stringify(session));
    }

    return session;
  } catch (error) {
    console.error('로그인 세션 데이터 파싱 오류:', error);
    removeLoginSession();
    return null;
  }
};

/**
 * 로그인 세션을 localStorage에 저장하는 함수
 */
const setLoginSession = (token: string, user: any): void => {
  const now = Date.now();
  const session: LoginSession = {
    token,
    user,
    expiresAt: now + (30 * 24 * 60 * 60 * 1000), // 30일 후 만료 (서버 토큰 만료)
    lastActivity: now
  };
  
  localStorage.setItem('login_session', JSON.stringify(session));
  
  // 기존 호환성을 위해 jwt_token도 저장
  localStorage.setItem('jwt_token', token);
  
  console.log('로그인 세션 저장됨 - 5일간 자동 로그인 유지');
};

/**
 * 로그인 세션을 localStorage에서 제거하는 함수
 */
const removeLoginSession = (): void => {
  localStorage.removeItem('login_session');
  localStorage.removeItem('jwt_token');
  console.log('로그인 세션 제거됨');
};

/**
 * JWT 토큰을 localStorage에 저장하는 함수 (기존 호환성 유지)
 */
const setToken = (token: string): void => {
  localStorage.setItem('jwt_token', token);
};

/**
 * JWT 토큰을 localStorage에서 제거하는 함수 (기존 호환성 유지)
 */
const removeToken = (): void => {
  removeLoginSession();
};

/**
 * Axios 클라이언트 인스턴스 생성
 * JWT 토큰 기반 인증 및 세션 쿠키 포함 (백워드 호환성)
 */
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
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
    try {
      console.log('[Login]', '로그인 요청 시작:', data.username);
      console.log('[Login]', 'API URL:', '/api/auth/login (프록시 사용)');
      
      const response = await apiClient.post('/auth/login', data);
      
      console.log('[Login Response]', '응답 상태:', response.status);
      console.log('[Login Response]', '응답 데이터:', response.data);
      
      // 응답 구조 검증
      if (!response.data) {
        throw new Error('서버 응답이 없습니다');
      }
      
      if (!response.data.user) {
        console.error('[Login Error]', '사용자 정보가 응답에 없음:', response.data);
        throw new Error('사용자 정보를 받을 수 없습니다');
      }
      
      // JWT 토큰이 있으면 로그인 세션으로 저장 (5일 자동 로그인)
      if (response.data.token) {
        console.log('[JWT Token]', `받은 토큰: ${response.data.token.substring(0, 30)}...`);
        setLoginSession(response.data.token, response.data.user);
        console.log('[Login Session]', '로그인 세션 저장 완료 - 5일간 자동 로그인');
        
        // 저장 확인
        const savedToken = getToken();
        console.log('[JWT Token Verification]', savedToken ? '저장된 토큰 확인됨' : '저장 실패!');
      } else {
        console.log('[JWT Token]', '서버에서 토큰을 받지 못함');
      }
      
      console.log('[Login]', '로그인 성공, 사용자:', response.data.user.username);
      return response.data;
      
    } catch (error: any) {
      console.error('[Login Error]', '로그인 요청 실패:', error);
      console.error('[Login Error]', '에러 상세:', error.response?.data);
      console.error('[Login Error]', '에러 상태:', error.response?.status);
      throw error;
    }
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
 * 사용자 관리 API 함수들 (관리자/매니저 전용)
 * 사용자 CRUD, 활동 로그 조회 기능 제공
 */
export const userAPI = {
  // 모든 사용자 조회 (관리자/매니저만)
  getAllUsers: async (page = 1, limit = 10, search = '', role = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(role && { role })
    });
    const response = await apiClient.get(`/users?${params}`);
    return response.data;
  },

  // 특정 사용자 조회
  getUser: async (id: number) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // 사용자 생성 (관리자만)
  createUser: async (userData: {
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
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  // 사용자 업데이트 (관리자만)
  updateUser: async (id: number, userData: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    role?: string;
    is_active?: boolean;
    password?: string;
    default_sender_address?: string;
    default_sender_detail_address?: string;
    default_sender_zipcode?: string;
  }) => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },

  // 사용자 삭제 (관리자만)
  deleteUser: async (id: number) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  // 사용자 활동 로그 조회
  getUserActivities: async (page = 1, limit = 20, userId?: number, action?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(userId && { user_id: userId.toString() }),
      ...(action && { action })
    });
    const response = await apiClient.get(`/users/activities/logs?${params}`);
    return response.data;
  },

  // 사용자 프로필 업데이트
  updateProfile: async (data: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    password?: string;
    default_sender_name?: string;
    default_sender_company?: string;
    default_sender_phone?: string;
    default_sender_address?: string;
    default_sender_detail_address?: string;
    default_sender_zipcode?: string;
  }) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  }
};

/**
 * 배송 관리 API 함수들 (새로운 deliveries 테이블)
 * deliveries 테이블을 사용한 배송 생성, 조회, 수정, 추적 기능 제공
 */
export const deliveriesAPI = {
  // 새 배송 생성
  createDelivery: async (data: any) => {
    const response = await apiClient.post('/deliveries', data);
    return response.data;
  },

  // 배송 목록 조회 (페이지네이션, 상태 필터링)
  getDeliveries: async (page = 1, limit = 10, status = 'all') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status !== 'all' && { status })
    });
    const response = await apiClient.get(`/deliveries?${params}`);
    return response.data;
  },

  // 특정 배송 상세 조회
  getDelivery: async (id: number) => {
    const response = await apiClient.get(`/deliveries/${id}`);
    return response.data;
  },

  // 배송 정보 전체 업데이트
  updateDelivery: async (id: number, data: any) => {
    const response = await apiClient.put(`/deliveries/${id}`, data);
    return response.data;
  },

  // 배송 상태만 업데이트
  updateDeliveryStatus: async (id: number, status: string) => {
    const response = await apiClient.patch(`/deliveries/${id}/status`, { status });
    return response.data;
  },

  // 운송장 번호로 배송 추적 (공개 API)
  trackDelivery: async (trackingNumber: string) => {
    const response = await apiClient.get(`/deliveries/track/${trackingNumber}`);
    return response.data;
  }
};

/**
 * QR 코드 API
 */
export const qrcodeAPI = {
  // QR 코드로 상품 정보 조회
  getProductByQRCode: async (qrCode: string) => {
    const response = await apiClient.get(`/qrcode/product/${qrCode}`);
    return response.data;
  },

  // QR 코드 상품 등록 (관리자만)
  createQRCodeProduct: async (data: {
    qr_code: string;
    product_name: string;
    quantity?: number;
    weight?: number;
    size?: string;
    description?: string;
  }) => {
    const response = await apiClient.post('/qrcode/product', data);
    return response.data;
  },

  // 모든 QR 코드 상품 목록 조회
  getAllQRCodeProducts: async () => {
    const response = await apiClient.get('/qrcode/products');
    return response.data;
  }
};

/**
 * 의뢰타입 관리 API
 */
export const requestTypesAPI = {
  // 의뢰타입 목록 조회
  getRequestTypes: async () => {
    const response = await apiClient.get('/request-types');
    return response.data;
  },

  // 의뢰타입 생성 (관리자만)
  createRequestType: async (data: {
    name: string;
    description?: string;
    sort_order?: number;
  }) => {
    const response = await apiClient.post('/request-types', data);
    return response.data;
  },

  // 의뢰타입 수정 (관리자만)
  updateRequestType: async (id: number, data: {
    name?: string;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
  }) => {
    const response = await apiClient.put(`/request-types/${id}`, data);
    return response.data;
  },

  // 의뢰타입 삭제 (관리자만)
  deleteRequestType: async (id: number) => {
    const response = await apiClient.delete(`/request-types/${id}`);
    return response.data;
  }
};

/**
 * 서버 상태 확인을 위한 헬스 체크 API
 * @returns 서버 상태 정보
 */
export const healthCheck = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

/**
 * 설정 관리 API 함수들
 * request_type.txt 파일 기반 의뢰타입 관리
 */
export const configAPI = {
  // 의뢰타입 목록 조회
  getRequestTypes: async () => {
    const response = await apiClient.get('/config/request-types');
    return response.data;
  },

  // 의뢰타입 목록 업데이트 (관리자만)
  updateRequestTypes: async (requestTypes: string[]) => {
    const response = await apiClient.put('/config/request-types', { requestTypes });
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
  isAuthenticated: (): boolean => !!getToken(),
  // 세션 관리 함수들
  getLoginSession,
  setLoginSession,
  removeLoginSession,
  hasValidSession: (): boolean => {
    const session = getLoginSession();
    return !!session;
  },
  getSessionUser: () => {
    const session = getLoginSession();
    return session?.user || null;
  }
};

/**
 * 테스트 관리 API 함수들 (관리자 전용)
 * DB 스키마 조회 및 시각화 기능 제공
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
  // 3명의 특정 파트너사 생성
  create3Partners: async () => {
    const response = await apiClient.post('/test/create-3-partners');
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
 * 상품 관리 API
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
    user_id?: number;
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
    user_id?: number;
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
 * 기사 관리 API 함수들
 * 기사 CRUD 작업을 위한 API 함수들
 */
export const driversAPI = {
  // 모든 기사 조회
  getAllDrivers: async () => {
    const response = await apiClient.get('/drivers');
    return response.data;
  },

  // 특정 기사 조회
  getDriver: async (id: number) => {
    const response = await apiClient.get(`/drivers/${id}`);
    return response.data;
  },

  // 새 기사 생성
  createDriver: async (data: {
    username: string;
    password: string;
    name: string;
    phone?: string;
    email?: string;
    vehicle_type?: string;
    vehicle_number?: string;
    license_number?: string;
  }) => {
    const response = await apiClient.post('/drivers', data);
    return response.data;
  },

  // 기사 정보 수정
  updateDriver: async (id: number, data: {
    username?: string;
    password?: string;
    name?: string;
    phone?: string;
    email?: string;
    vehicle_type?: string;
    vehicle_number?: string;
    license_number?: string;
    is_active?: boolean;
  }) => {
    const response = await apiClient.put(`/drivers/${id}`, data);
    return response.data;
  },

  // 기사 삭제
  deleteDriver: async (id: number) => {
    const response = await apiClient.delete(`/drivers/${id}`);
    return response.data;
  },

  // 기사 검색
  searchDrivers: async (query: string) => {
    const response = await apiClient.get(`/drivers/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};

/**
 * 상품 사진 관련 API 함수들
 * 상품 사진 업로드, 조회, 삭제 기능 제공
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
 * API 클라이언트 인스턴스 내보내기
 * named export와 default export로 모두 사용 가능
 */
export const api = apiClient;
export default apiClient;