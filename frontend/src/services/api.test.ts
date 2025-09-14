import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { authAPI, deliveriesAPI, userAPI, productsAPI } from './api';
import { mockLoginResponse, mockAdminUser, mockDeliveryData, mockProducts, mockUsers } from '../test/mockData';

// Mock axios
vi.mock('axios');
const mockAxios = vi.mocked(axios);

// Mock axios.create
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn(),
    },
    response: {
      use: vi.fn(),
    },
  },
};

mockAxios.create.mockReturnValue(mockAxiosInstance as any);

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    global.localStorage = localStorageMock as any;
  });

  describe('authAPI', () => {
    describe('login', () => {
      it('성공적인 로그인 요청이 처리되어야 함', async () => {
        const loginData = { username: 'testuser', password: 'password123' };
        mockAxiosInstance.post.mockResolvedValue({ data: mockLoginResponse });
        
        const result = await authAPI.login(loginData);
        
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', loginData);
        expect(result).toEqual(mockLoginResponse);
      });

      it('로그인 실패가 처리되어야 함', async () => {
        const loginData = { username: 'wronguser', password: 'wrongpass' };
        const errorResponse = {
          response: {
            data: { message: 'Invalid credentials' },
            status: 401
          }
        };
        
        mockAxiosInstance.post.mockRejectedValue(errorResponse);
        
        await expect(authAPI.login(loginData)).rejects.toEqual(errorResponse);
      });
    });

    describe('register', () => {
      it('회원가입 요청이 처리되어야 함', async () => {
        const registerData = {
          username: 'newuser',
          password: 'password123',
          name: '새사용자',
          phone: '010-1234-5678',
          company: '새회사'
        };
        
        const response = { success: true, message: '회원가입 완료' };
        mockAxiosInstance.post.mockResolvedValue({ data: response });
        
        const result = await authAPI.register(registerData);
        
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/register', registerData);
        expect(result).toEqual(response);
      });
    });

    describe('checkUsername', () => {
      it('아이디 중복 확인이 처리되어야 함', async () => {
        const username = 'testuser';
        const response = { success: true, available: true };
        mockAxiosInstance.get.mockResolvedValue({ data: response });
        
        const result = await authAPI.checkUsername(username);
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/auth/check-username/${username}`);
        expect(result).toEqual(response);
      });
    });

    describe('logout', () => {
      it('로그아웃 요청이 처리되어야 함', async () => {
        const response = { success: true, message: '로그아웃 완료' };
        mockAxiosInstance.post.mockResolvedValue({ data: response });
        
        const result = await authAPI.logout();
        
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout');
        expect(result).toEqual(response);
      });
    });

    describe('me', () => {
      it('현재 사용자 정보 요청이 처리되어야 함', async () => {
        const response = { user: mockAdminUser, authenticated: true };
        mockAxiosInstance.get.mockResolvedValue({ data: response });
        
        const result = await authAPI.me();
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/me');
        expect(result).toEqual(response);
      });
    });
  });

  describe('deliveriesAPI', () => {
    describe('createDelivery', () => {
      it('새 배송 생성이 처리되어야 함', async () => {
        const response = {
          success: true,
          message: '배송이 생성되었습니다',
          trackingNumber: 'EP2024001'
        };
        mockAxiosInstance.post.mockResolvedValue({ data: response });
        
        const result = await deliveriesAPI.createDelivery(mockDeliveryData);
        
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/deliveries', mockDeliveryData);
        expect(result).toEqual(response);
      });
    });

    describe('getDeliveries', () => {
      it('배송 목록 조회가 처리되어야 함', async () => {
        const response = {
          success: true,
          data: [mockDeliveryData],
          pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
        };
        mockAxiosInstance.get.mockResolvedValue({ data: response });
        
        const result = await deliveriesAPI.getDeliveries(1, 10, 'pending');
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/deliveries?page=1&limit=10&status=pending');
        expect(result).toEqual(response);
      });

      it('전체 상태 조회 시 status 파라미터가 제외되어야 함', async () => {
        const response = {
          success: true,
          data: [mockDeliveryData],
          pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
        };
        mockAxiosInstance.get.mockResolvedValue({ data: response });
        
        await deliveriesAPI.getDeliveries(1, 10, 'all');
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/deliveries?page=1&limit=10');
      });
    });

    describe('getDelivery', () => {
      it('특정 배송 조회가 처리되어야 함', async () => {
        const deliveryId = 1;
        const response = { success: true, data: mockDeliveryData };
        mockAxiosInstance.get.mockResolvedValue({ data: response });
        
        const result = await deliveriesAPI.getDelivery(deliveryId);
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/deliveries/${deliveryId}`);
        expect(result).toEqual(response);
      });
    });

    describe('updateDelivery', () => {
      it('배송 정보 업데이트가 처리되어야 함', async () => {
        const deliveryId = 1;
        const updateData = { status: 'in_transit' };
        const response = { success: true, message: '배송 정보가 업데이트되었습니다' };
        mockAxiosInstance.put.mockResolvedValue({ data: response });
        
        const result = await deliveriesAPI.updateDelivery(deliveryId, updateData);
        
        expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/deliveries/${deliveryId}`, updateData);
        expect(result).toEqual(response);
      });
    });

    describe('trackDelivery', () => {
      it('배송 추적이 처리되어야 함', async () => {
        const trackingNumber = 'EP2024001';
        const response = { success: true, data: mockDeliveryData };
        mockAxiosInstance.get.mockResolvedValue({ data: response });
        
        const result = await deliveriesAPI.trackDelivery(trackingNumber);
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/deliveries/track/${trackingNumber}`);
        expect(result).toEqual(response);
      });
    });
  });

  describe('userAPI', () => {
    describe('getAllUsers', () => {
      it('모든 사용자 조회가 처리되어야 함', async () => {
        const response = { success: true, data: mockUsers };
        mockAxiosInstance.get.mockResolvedValue({ data: response });
        
        const result = await userAPI.getAllUsers(1, 10, 'test', 'partner');
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users?page=1&limit=10&search=test&role=partner');
        expect(result).toEqual(response);
      });

      it('빈 검색어와 역할로 요청 시 파라미터가 제외되어야 함', async () => {
        const response = { success: true, data: mockUsers };
        mockAxiosInstance.get.mockResolvedValue({ data: response });
        
        await userAPI.getAllUsers(1, 10, '', '');
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users?page=1&limit=10');
      });
    });

    describe('createUser', () => {
      it('새 사용자 생성이 처리되어야 함', async () => {
        const userData = {
          username: 'newuser',
          password: 'password123',
          name: '새사용자',
          phone: '010-1234-5678',
          company: '새회사',
          role: 'partner'
        };
        const response = { success: true, message: '사용자가 생성되었습니다' };
        mockAxiosInstance.post.mockResolvedValue({ data: response });
        
        const result = await userAPI.createUser(userData);
        
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users', userData);
        expect(result).toEqual(response);
      });
    });

    describe('updateUser', () => {
      it('사용자 정보 업데이트가 처리되어야 함', async () => {
        const userId = 1;
        const updateData = { name: '업데이트된 이름', phone: '010-9876-5432' };
        const response = { success: true, message: '사용자 정보가 업데이트되었습니다' };
        mockAxiosInstance.put.mockResolvedValue({ data: response });
        
        const result = await userAPI.updateUser(userId, updateData);
        
        expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/users/${userId}`, updateData);
        expect(result).toEqual(response);
      });
    });

    describe('deleteUser', () => {
      it('사용자 삭제가 처리되어야 함', async () => {
        const userId = 1;
        const response = { success: true, message: '사용자가 삭제되었습니다' };
        mockAxiosInstance.delete.mockResolvedValue({ data: response });
        
        const result = await userAPI.deleteUser(userId);
        
        expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/users/${userId}`);
        expect(result).toEqual(response);
      });
    });
  });

  describe('productsAPI', () => {
    describe('getAllProducts', () => {
      it('모든 제품 조회가 처리되어야 함', async () => {
        const response = { success: true, data: mockProducts };
        mockAxiosInstance.get.mockResolvedValue({ data: response });
        
        const result = await productsAPI.getAllProducts();
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/products');
        expect(result).toEqual(response);
      });
    });

    describe('createProduct', () => {
      it('새 제품 생성이 처리되어야 함', async () => {
        const productData = {
          name: '새 제품',
          maincode: 'NEW001',
          weight: 10,
          cost1: 100000
        };
        const response = { success: true, message: '제품이 생성되었습니다' };
        mockAxiosInstance.post.mockResolvedValue({ data: response });
        
        const result = await productsAPI.createProduct(productData);
        
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/products', productData);
        expect(result).toEqual(response);
      });
    });

    describe('updateProduct', () => {
      it('제품 정보 업데이트가 처리되어야 함', async () => {
        const productId = 1;
        const updateData = { name: '업데이트된 제품', cost1: 150000 };
        const response = { success: true, message: '제품 정보가 업데이트되었습니다' };
        mockAxiosInstance.put.mockResolvedValue({ data: response });
        
        const result = await productsAPI.updateProduct(productId, updateData);
        
        expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/products/${productId}`, updateData);
        expect(result).toEqual(response);
      });
    });

    describe('searchProducts', () => {
      it('제품 검색이 처리되어야 함', async () => {
        const searchQuery = '침대';
        const response = { success: true, data: mockProducts.filter(p => p.name.includes('침대')) };
        mockAxiosInstance.get.mockResolvedValue({ data: response });
        
        const result = await productsAPI.searchProducts(searchQuery);
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/products/search?q=${encodeURIComponent(searchQuery)}`);
        expect(result).toEqual(response);
      });

      it('특수문자가 포함된 검색어가 올바르게 인코딩되어야 함', async () => {
        const searchQuery = '테스트 & 검색';
        const response = { success: true, data: [] };
        mockAxiosInstance.get.mockResolvedValue({ data: response });
        
        await productsAPI.searchProducts(searchQuery);
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/products/search?q=${encodeURIComponent(searchQuery)}`);
      });
    });
  });

  describe('API 에러 처리', () => {
    it('네트워크 에러가 올바르게 전파되어야 함', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValue(networkError);
      
      await expect(deliveriesAPI.getDeliveries()).rejects.toEqual(networkError);
    });

    it('HTTP 에러 응답이 올바르게 전파되어야 함', async () => {
      const httpError = {
        response: {
          status: 404,
          data: { message: 'Not Found' }
        }
      };
      mockAxiosInstance.get.mockRejectedValue(httpError);
      
      await expect(deliveriesAPI.getDelivery(999)).rejects.toEqual(httpError);
    });

    it('서버 에러가 올바르게 전파되어야 함', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        }
      };
      mockAxiosInstance.post.mockRejectedValue(serverError);
      
      await expect(deliveriesAPI.createDelivery(mockDeliveryData)).rejects.toEqual(serverError);
    });
  });

  describe('요청 인터셉터', () => {
    it('인터셉터가 설정되어야 함', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });
});