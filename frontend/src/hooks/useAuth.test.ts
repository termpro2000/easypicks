import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { mockAdminUser, mockLoginResponse, mockApiResponse } from '../test/mockData';
import * as api from '../services/api';

// Mock the API
vi.mock('../services/api');
const mockApi = vi.mocked(api);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('초기 상태', () => {
    it('초기값이 올바르게 설정되어야 함', () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('로그인 기능', () => {
    it('성공적인 로그인이 처리되어야 함', async () => {
      mockApi.authAPI.login.mockResolvedValue(mockLoginResponse);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        const response = await result.current.login('testuser', 'password123');
        expect(response).toEqual(mockLoginResponse);
      });
      
      await waitFor(() => {
        expect(result.current.user).toEqual(mockLoginResponse.user);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(mockApi.authAPI.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123'
      });
    });

    it('로그인 실패가 처리되어야 함', async () => {
      const errorMessage = '로그인 실패';
      mockApi.authAPI.login.mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        try {
          await result.current.login('wronguser', 'wrongpass');
        } catch (error) {
          expect(error).toEqual(new Error(errorMessage));
        }
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('로그아웃 기능', () => {
    it('성공적인 로그아웃이 처리되어야 함', async () => {
      mockApi.authAPI.logout.mockResolvedValue(mockApiResponse);
      
      const { result } = renderHook(() => useAuth());
      
      // 먼저 로그인 상태로 설정
      act(() => {
        result.current.user = mockAdminUser;
      });
      
      await act(async () => {
        await result.current.logout();
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockApi.authAPI.logout).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('login_session');
    });
  });

  describe('회원가입 기능', () => {
    it('성공적인 회원가입이 처리되어야 함', async () => {
      const registerData = {
        username: 'newuser',
        password: 'password123',
        name: '새사용자',
        phone: '010-1234-5678',
        company: '새회사'
      };
      
      mockApi.authAPI.register.mockResolvedValue({
        success: true,
        message: '회원가입이 완료되었습니다'
      });
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        const response = await result.current.register(registerData);
        expect(response.success).toBe(true);
      });
      
      expect(mockApi.authAPI.register).toHaveBeenCalledWith(registerData);
    });

    it('회원가입 실패가 처리되어야 함', async () => {
      const registerData = {
        username: 'existinguser',
        password: 'password123',
        name: '기존사용자',
        phone: '010-1234-5678',
        company: '기존회사'
      };
      
      const errorMessage = '이미 존재하는 사용자입니다';
      mockApi.authAPI.register.mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        try {
          await result.current.register(registerData);
        } catch (error) {
          expect(error).toEqual(new Error(errorMessage));
        }
      });
    });
  });

  describe('프로필 업데이트', () => {
    it('프로필 업데이트가 처리되어야 함', async () => {
      const updateData = {
        name: '업데이트된 이름',
        phone: '010-9876-5432',
        company: '업데이트된 회사'
      };
      
      const updatedUser = { ...mockAdminUser, ...updateData };
      
      mockApi.userAPI.updateProfile.mockResolvedValue({
        success: true,
        data: updatedUser
      });
      
      const { result } = renderHook(() => useAuth());
      
      // 먼저 로그인 상태로 설정
      act(() => {
        result.current.user = mockAdminUser;
      });
      
      await act(async () => {
        await result.current.updateProfile(updateData);
      });
      
      expect(mockApi.userAPI.updateProfile).toHaveBeenCalledWith(updateData);
      expect(result.current.user).toEqual(updatedUser);
    });
  });

  describe('세션 관리', () => {
    it('저장된 세션이 복원되어야 함', async () => {
      const sessionData = {
        token: 'saved-token',
        user: mockAdminUser,
        expiresAt: Date.now() + 86400000, // 24시간 후
        lastActivity: Date.now()
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData));
      mockApi.authAPI.me.mockResolvedValue({
        user: mockAdminUser,
        authenticated: true
      });
      
      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.user).toEqual(mockAdminUser);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('만료된 세션이 제거되어야 함', async () => {
      const expiredSessionData = {
        token: 'expired-token',
        user: mockAdminUser,
        expiresAt: Date.now() - 86400000, // 24시간 전
        lastActivity: Date.now() - (5 * 24 * 60 * 60 * 1000) // 5일 전
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredSessionData));
      
      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('login_session');
      });
    });

    it('활동 시간이 업데이트되어야 함', async () => {
      const oldTime = Date.now() - (2 * 60 * 60 * 1000); // 2시간 전
      const sessionData = {
        token: 'valid-token',
        user: mockAdminUser,
        expiresAt: Date.now() + 86400000,
        lastActivity: oldTime
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData));
      mockApi.authAPI.me.mockResolvedValue({
        user: mockAdminUser,
        authenticated: true
      });
      
      renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'login_session',
          expect.stringContaining('"lastActivity"')
        );
      });
    });
  });

  describe('토큰 관리', () => {
    it('토큰이 localStorage에 저장되어야 함', async () => {
      mockApi.authAPI.login.mockResolvedValue(mockLoginResponse);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.login('testuser', 'password123');
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'login_session',
        expect.stringContaining(mockLoginResponse.token)
      );
    });

    it('로그아웃 시 토큰이 제거되어야 함', async () => {
      mockApi.authAPI.logout.mockResolvedValue(mockApiResponse);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        await result.current.logout();
      });
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('login_session');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('jwt_token');
    });
  });

  describe('에러 처리', () => {
    it('네트워크 에러가 처리되어야 함', async () => {
      const networkError = new Error('Network Error');
      mockApi.authAPI.login.mockRejectedValue(networkError);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        try {
          await result.current.login('testuser', 'password123');
        } catch (error) {
          expect(error).toBe(networkError);
        }
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('API 에러 응답이 처리되어야 함', async () => {
      const apiError = {
        response: {
          data: { message: 'Invalid credentials' },
          status: 401
        }
      };
      mockApi.authAPI.login.mockRejectedValue(apiError);
      
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        try {
          await result.current.login('testuser', 'wrongpass');
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });
    });
  });

  describe('권한 확인', () => {
    it('관리자 권한이 올바르게 확인되어야 함', async () => {
      const { result } = renderHook(() => useAuth());
      
      act(() => {
        result.current.user = { ...mockAdminUser, role: 'admin' };
      });
      
      expect(result.current.user?.role).toBe('admin');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('파트너 권한이 올바르게 확인되어야 함', async () => {
      const { result } = renderHook(() => useAuth());
      
      act(() => {
        result.current.user = { ...mockAdminUser, role: 'partner' };
      });
      
      expect(result.current.user?.role).toBe('partner');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});