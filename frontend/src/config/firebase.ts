import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Firebase 설정 (모바일 앱과 동일한 설정)
const firebaseConfig = {
  apiKey: "AIzaSyCKb2Rs9vOF6pppEO_HfQ3Qub5L9OACAng",
  authDomain: "easypicks-delivery.firebaseapp.com",
  projectId: "easypicks-delivery",
  storageBucket: "easypicks-delivery.firebasestorage.app",
  messagingSenderId: "992445415586",
  appId: "1:992445415586:web:2e00d58272a1107ca4d7fb",
  measurementId: "G-X99E25Z2BS"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Storage 인스턴스
export const storage = getStorage(app);

export default app;