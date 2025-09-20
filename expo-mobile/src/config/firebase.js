import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

// EAS Build 환경인지 확인 (Expo Go가 아닌 standalone 앱)
const isEASBuild = Constants.appOwnership !== 'expo';

// Firebase 설정 - 실제 프로젝트 설정 (easypicks-delivery)
const firebaseConfig = {
  apiKey: "AIzaSyCKb2Rs9vOF6pppEO_HfQ3Qub5L9OACAng",
  authDomain: "easypicks-delivery.firebaseapp.com",
  projectId: "easypicks-delivery",
  storageBucket: "easypicks-delivery.firebasestorage.app",
  messagingSenderId: "992445415586",
  appId: "1:992445415586:web:2e00d58272a1107ca4d7fb",
  measurementId: "G-X99E25Z2BS"
};

// Firebase 앱 초기화 (모든 환경에서 사용)
let app = null;
let storage = null;

try {
  console.log('🔥 [FIREBASE] Firebase 초기화 시작...');
  console.log('🔥 [FIREBASE] 환경:', isEASBuild ? 'EAS Build' : 'Expo Go');
  console.log('🔥 [FIREBASE] 설정:', {
    apiKey: firebaseConfig.apiKey?.substring(0, 20) + '...',
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket
  });
  
  app = initializeApp(firebaseConfig);
  console.log('🔥 [FIREBASE] Firebase 앱 초기화 성공');
  console.log('🔥 [FIREBASE] App 객체:', app ? '생성됨' : '생성 실패');
  
  try {
    storage = getStorage(app);
    console.log('🔥 [FIREBASE] Storage 객체 생성 성공');
    console.log('🔥 [FIREBASE] Storage 객체 타입:', typeof storage);
    console.log('🔥 [FIREBASE] Storage 객체 정보:', {
      app: storage?.app ? 'OK' : 'Missing',
      bucket: storage?._delegate?.bucket || 'Unknown'
    });
  } catch (storageError) {
    console.error('❌ [FIREBASE] Storage 객체 생성 실패:', storageError);
    console.error('❌ [FIREBASE] Storage 오류 상세:', {
      message: storageError.message,
      code: storageError.code,
      name: storageError.name
    });
    storage = null;
  }
  
  console.log('✅ [FIREBASE] Firebase 전체 초기화 완료');
  console.log('🔥 [FIREBASE] 최종 상태:', {
    app: app ? 'OK' : 'Failed',
    storage: storage ? 'OK' : 'Failed'
  });
} catch (error) {
  console.error('❌ [FIREBASE] Firebase 전체 초기화 실패:', error);
  console.error('❌ [FIREBASE] 오류 상세:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
}

export { storage, firebaseConfig };

// Firebase Storage 설정 상태 확인 함수
export const isFirebaseStorageConfigured = () => {
  console.log('🔥 [FIREBASE] Firebase Storage 설정 확인 시작...');
  
  // 실제 Firebase 프로젝트 credentials 확인
  const isRealConfig = firebaseConfig.apiKey === "AIzaSyCKb2Rs9vOF6pppEO_HfQ3Qub5L9OACAng" &&
                      firebaseConfig.projectId === "easypicks-delivery" &&
                      firebaseConfig.storageBucket === "easypicks-delivery.firebasestorage.app";
  
  console.log('🔥 [FIREBASE] Credentials 확인 결과:', {
    apiKeyMatch: firebaseConfig.apiKey === "AIzaSyCKb2Rs9vOF6pppEO_HfQ3Qub5L9OACAng",
    projectIdMatch: firebaseConfig.projectId === "easypicks-delivery",
    storageBucketMatch: firebaseConfig.storageBucket === "easypicks-delivery.firebasestorage.app",
    isRealConfig
  });
  
  // Storage 객체가 없으면 재시도
  let hasStorage = storage !== null;
  
  if (!hasStorage && app) {
    console.log('🔥 [FIREBASE] Storage 객체 재생성 시도...');
    try {
      const { getStorage } = require('firebase/storage');
      storage = getStorage(app);
      hasStorage = storage !== null;
      console.log('🔥 [FIREBASE] Storage 재생성 결과:', hasStorage ? '성공' : '실패');
    } catch (retryError) {
      console.error('❌ [FIREBASE] Storage 재생성 실패:', retryError);
    }
  }
  
  const isConfigured = isRealConfig && hasStorage;
  
  console.log('🔥 [FIREBASE] Firebase Storage 설정 상태:', {
    environment: isEASBuild ? 'EAS Build' : 'Expo Go',
    hasRealCredentials: isRealConfig,
    hasStorageObject: hasStorage,
    storageRetryAttempted: !hasStorage && app,
    finalResult: isConfigured ? '✅ 사용 가능' : '❌ 사용 불가'
  });
  
  if (!isConfigured) {
    console.log('🔥 [FIREBASE] 설정 실패 원인 분석:', {
      credentialsIssue: !isRealConfig,
      storageObjectIssue: !hasStorage,
      appObjectExists: app !== null,
      possibleCause: !hasStorage ? 'Storage 초기화 실패' : 'Credentials 불일치'
    });
  }
  
  return isConfigured;
};

export default app;