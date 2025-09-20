import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// IP 주소 설정 (개발 환경에 맞게 조정)
const getBaseURL = () => {
  if (__DEV__) {
    if (Platform.OS === 'ios') {
      return 'http://localhost:8080/api'; // iOS 시뮬레이터
    } else {
      return 'http://10.0.2.2:8080/api'; // Android 에뮬레이터
    }
  }
  return 'http://192.168.219.105:8080/api'; // 실제 기기
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
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_info');
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