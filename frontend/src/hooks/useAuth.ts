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
  refreshUser: () => Promise<void>;
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
   * 로그인 세션 상태를 확인하고 사용자 정보를 가져오는 함수
   * 5일간 자동 로그인 유지 기능 포함
   */
  const checkSession = async () => {
    try {
      setIsLoading(true);
      
      // 1. 먼저 로컬 세션 확인 (5일 자동 로그인)
      const localSession = tokenAPI.getLoginSession();
      if (localSession) {
        console.log('💾 로컬 세션 발견 - 자동 로그인 시도:', localSession.user.username);
        setUser(localSession.user);
        setIsLoading(false);
        
        // 백그라운드에서 서버 세션도 확인 (선택적)
        try {
          const response = await authAPI.me();
          if (response.authenticated && response.user) {
            console.log('✅ 서버 세션도 유효함');
            // 서버에서 최신 사용자 정보로 업데이트
            setUser(response.user);
            // 로컬 세션도 최신 사용자 정보로 업데이트
            tokenAPI.setLoginSession(localSession.token, response.user);
          }
        } catch (error) {
          console.log('⚠️ 서버 세션 확인 실패, 로컬 세션 유지');
        }
        return;
      }
      
      // 2. 로컬 세션이 없으면 서버에서 확인
      console.log('🔍 로컬 세션 없음, 서버 세션 확인...');
      const response = await authAPI.me();
      console.log('🔍 Frontend checkSession - /auth/me 응답:', response);
      
      if (response.authenticated && response.user) {
        setUser(response.user);
        console.log('✅ 서버 세션 인증 성공:', response.user.username);
        
        // 서버 세션이 있지만 로컬 세션이 없는 경우, JWT 토큰으로 로컬 세션 생성
        const token = tokenAPI.getToken();
        if (token) {
          console.log('💾 로컬 세션 생성 - 5일간 자동 로그인 설정');
          tokenAPI.setLoginSession(token, response.user);
        }
      } else {
        // 서버에서도 인증 실패한 경우 모든 토큰 제거
        console.log('❌ 서버 인증 실패, 모든 세션 제거');
        tokenAPI.removeLoginSession();
      }
    } catch (error) {
      console.log('❌ 인증 실패 - 세션 또는 JWT 토큰 없음/만료됨');
      // 인증 실패시 모든 세션 제거
      tokenAPI.removeLoginSession();
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
        
        // 로그인 직후 최신 사용자 정보 새로고침 (발송인 정보 포함)
        console.log('로그인 후 사용자 정보 새로고침 중...');
        await refreshUser();
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
   * 사용자 로그아웃 처리 함수 (로그인 세션 완전 제거)
   * 서버 오류가 있어도 클라이언트에서는 로그아웃 상태로 처리
   */
  const logout = async () => {
    try {
      await authAPI.logout(); // 서버 세션 종료
      setUser(null);
      tokenAPI.removeLoginSession(); // 로컬 세션 완전 제거
      console.log('🔓 로그아웃 완료, 모든 세션 제거됨');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      // 로그아웃은 서버 오류가 있어도 클라이언트에서는 처리
      tokenAPI.removeLoginSession(); // 로컬 세션 완전 제거
      setUser(null);
      console.log('🔓 서버 오류 발생, 로컬 세션만 제거함');
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

  /**
   * 사용자 정보를 서버에서 새로고침하는 함수
   */
  const refreshUser = async () => {
    try {
      const response = await authAPI.me();
      console.log('🔍 Frontend refreshUser - /auth/me 응답:', response);
      console.log('🔍 Frontend refreshUser - 발송인 정보:', {
        default_sender_name: response.user?.default_sender_name,
        default_sender_company: response.user?.default_sender_company,
        default_sender_phone: response.user?.default_sender_phone,
        default_sender_address: response.user?.default_sender_address,
        default_sender_detail_address: response.user?.default_sender_detail_address,
        default_sender_zipcode: response.user?.default_sender_zipcode
      });
      
      if (response.authenticated && response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('사용자 정보 새로고침 오류:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkUsername,
    refreshUser
  };
};

export { AuthContext };