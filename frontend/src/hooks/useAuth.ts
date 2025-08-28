import { useState, useEffect, createContext, useContext } from 'react';
import type { User, LoginData, RegisterData } from '../types';
import { authAPI, tokenAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkUsername: (username: string) => Promise<{ available: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 컴포넌트 마운트 시 기존 세션 유지 여부 확인
   * 브라우저 새로고침 시에도 로그인 상태 유지
   */
  useEffect(() => {
    checkSession();
  }, []);

  /**
   * JWT 토큰 또는 세션 상태를 확인하고 사용자 정보를 가져오는 함수
   */
  const checkSession = async () => {
    try {
      setIsLoading(true);
      
      // JWT 토큰이 있는지 먼저 확인
      if (tokenAPI.isAuthenticated()) {
        console.log('JWT 토큰이 존재함, 서버에서 사용자 정보 확인');
      }
      
      const response = await authAPI.me();
      if (response.authenticated && response.user) {
        setUser(response.user);
        console.log('사용자 인증 상태 확인됨:', response.user.username);
      } else {
        // 토큰이 있지만 서버에서 인증 실패한 경우 토큰 제거
        if (tokenAPI.isAuthenticated()) {
          console.log('서버 인증 실패, JWT 토큰 제거');
          tokenAPI.removeToken();
        }
      }
    } catch (error) {
      console.log('인증 실패 - 세션 또는 JWT 토큰 없음/만료됨');
      // 토큰이 만료되었거나 무효한 경우 제거
      tokenAPI.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 사용자 로그인 처리 함수 (JWT 토큰 지원)
   * @param data - 로그인 정보 (사용자명, 비밀번호)
   * @throws {Error} 로그인 실패 시 에러 발생
   */
  const login = async (data: LoginData) => {
    try {
      const response = await authAPI.login(data);
      if (response.user) {
        setUser(response.user);
        console.log('로그인 성공:', response.user.username);
        
        // JWT 토큰이 있는 경우 로그 출력
        if (response.token) {
          console.log('JWT 토큰 받음, localStorage에 저장됨');
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.message || '로그인에 실패했습니다.';
      throw new Error(message);
    }
  };

  /**
   * 사용자 회원가입 처리 함수
   * 회원가입 성공 후 자동으로 로그인 처리
   * @param data - 회원가입 정보
   * @throws {Error} 회원가입 실패 시 에러 발생
   */
  const register = async (data: RegisterData) => {
    try {
      await authAPI.register(data);
      // 회원가입 성공 후 자동 로그인
      await login({
        username: data.username,
        password: data.password
      });
    } catch (error: any) {
      const message = error.response?.data?.message || '회원가입에 실패했습니다.';
      throw new Error(message);
    }
  };

  /**
   * 사용자 로그아웃 처리 함수 (JWT 토큰 제거 포함)
   * 서버 오류가 있어도 클라이언트에서는 로그아웃 상태로 처리
   */
  const logout = async () => {
    try {
      await authAPI.logout(); // 이미 JWT 토큰 제거가 포함됨
      setUser(null);
      console.log('로그아웃 완료, JWT 토큰 제거됨');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      // 로그아웃은 서버 오류가 있어도 클라이언트에서는 처리
      tokenAPI.removeToken();
      setUser(null);
    }
  };

  /**
   * 아이디 중복 여부를 확인하는 함수
   * @param username - 확인할 사용자 아이디
   * @returns {Promise<{available: boolean, message: string}>} 사용 가능 여부와 메시지
   * @throws {Error} 아이디 확인 실패 시 에러 발생
   */
  const checkUsername = async (username: string) => {
    try {
      return await authAPI.checkUsername(username);
    } catch (error: any) {
      const message = error.response?.data?.message || '아이디 확인에 실패했습니다.';
      throw new Error(message);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkUsername
  };
};

export { AuthContext };