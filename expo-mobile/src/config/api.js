import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 동적 IP 주소 감지 함수
const getCurrentIP = async () => {
  try {
    // 먼저 expo의 터널 URL을 시도
    if (global.__expo && global.__expo.env && global.__expo.env.API_URL) {
      return global.__expo.env.API_URL;
    }
    
    // 일반적인 사설 IP 대역 순서로 시도
    const possibleIPs = [
      '192.168.219.104',  // 기존 IP
      '172.26.150.127',   // 현재 IP
      '192.168.0.1',
      '192.168.1.1',
      '10.0.0.1'
    ];
    
    for (const ip of possibleIPs) {
      try {
        const response = await fetch(`http://${ip}:8080/api/auth/test`, {
          method: 'GET',
          timeout: 3000,
        });
        if (response.ok || response.status === 401) { // 401도 서버가 응답한다는 의미
          console.log(`[IP 감지] 연결 성공: ${ip}`);
          return `http://${ip}:8080/api`;
        }
      } catch (e) {
        console.log(`[IP 감지] 연결 실패: ${ip}`);
        continue;
      }
    }
    
    // 모든 IP 실패 시 기본값 (Railway 서버)
    return 'https://efficient-abundance-production-d603.up.railway.app/api';
  } catch (error) {
    console.log('[IP 감지] 오류, 기본값 사용:', error.message);
    return 'https://efficient-abundance-production-d603.up.railway.app/api';
  }
};

// API URL 설정 (개발/프로덕션 환경 구분)
const getBaseURL = () => {
  let baseURL;
  
  // 앱 설정에서 API URL 가져오기
  const configApiUrl = Constants.expoConfig?.extra?.apiUrl;
  const environment = Constants.expoConfig?.extra?.environment;
  
  if (configApiUrl && environment === 'production') {
    // 프로덕션 빌드: app.json에서 설정된 URL 사용
    baseURL = configApiUrl;
    console.log(`[API Config] 프로덕션 모드 - 배포된 백엔드 사용: ${baseURL}`);
  } else if (__DEV__) {
    // 개발 모드: 로컬 IP 감지 시도 후 Railway 서버 사용
    console.log(`[API Config] 개발 모드 - Railway 서버 사용`);
    baseURL = 'https://efficient-abundance-production-d603.up.railway.app/api';
  } else {
    // 기본값: Railway 배포 서버
    baseURL = 'https://efficient-abundance-production-d603.up.railway.app/api';
    console.log(`[API Config] 기본값 - Railway 서버 사용: ${baseURL}`);
  }
  
  console.log(`[API Config] Platform: ${Platform.OS}, Environment: ${environment || 'development'}, BaseURL: ${baseURL}`);
  return baseURL;
};

const BASE_URL = getBaseURL();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 타임아웃 증가
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    // 로그인 및 회원가입 요청에는 토큰을 추가하지 않음
    const authEndpoints = ['/auth/login', '/auth/register'];
    const isAuthEndpoint = authEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (!isAuthEndpoint) {
      let token = await AsyncStorage.getItem('auth_token');
      
      // 개발 환경에서 토큰이 없거나 유효하지 않으면 test-token 사용
      if ((!token || token === 'undefined' || token === 'null') && __DEV__) {
        console.log('[API] 토큰이 없거나 유효하지 않아서 test-token 사용');
        token = 'test-token';
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Authorization 헤더 설정:', `Bearer ${token.substring(0, 10)}...`);
      }
    } else {
      console.log('[API] 인증 엔드포인트 - Authorization 헤더 생략:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.log('API Error:', error);
    
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.error('네트워크 오류 - 서버 연결을 확인하세요:', BASE_URL);
    }
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('[API] 인증 오류 - 토큰 제거');
      await AsyncStorage.removeItem('auth_token');
      
      // 로그인 요청인 경우 재시도하지 않음
      if (error.config?.url?.includes('/auth/login')) {
        console.log('[API] 로그인 요청 실패 - 재시도하지 않음');
        return Promise.reject(error);
      }
      
      // 개발 환경에서는 test-token으로 재시도
      if (__DEV__) {
        console.log('[API] 개발 환경에서 test-token으로 재시도');
        await AsyncStorage.setItem('auth_token', 'test-token');
        
        // 원래 요청을 test-token으로 재시도
        const originalRequest = error.config;
        originalRequest.headers.Authorization = 'Bearer test-token';
        
        try {
          return await api(originalRequest);
        } catch (retryError) {
          console.log('[API] test-token으로 재시도 실패:', retryError.message);
        }
      } else {
        // 프로덕션 환경에서만 로그아웃 처리
        await AsyncStorage.removeItem('user_info');
        if (global.logout) {
          global.logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

// API 요청 로깅 추가
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;