// Firebase Storage 접근 테스트 스크립트
// Node.js 또는 브라우저 콘솔에서 실행 가능

import { initializeApp } from 'firebase/app';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCKb2Rs9vOF6pppEO_HfQ3Qub5L9OACAng",
  authDomain: "easypicks-delivery.firebaseapp.com",
  projectId: "easypicks-delivery",
  storageBucket: "easypicks-delivery.firebasestorage.app",
  messagingSenderId: "992445415586",
  appId: "1:992445415586:web:2e00d58272a1107ca4d7fb"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// 모든 배송 폴더 목록 조회
async function listAllDeliveries() {
  try {
    const deliveryPhotosRef = ref(storage, 'delivery-photos');
    const result = await listAll(deliveryPhotosRef);
    
    console.log('📁 발견된 배송 폴더들:');
    result.prefixes.forEach((folderRef, index) => {
      console.log(`${index + 1}. ${folderRef.name}`);
    });
    
    return result.prefixes.map(prefix => prefix.name);
  } catch (error) {
    console.error('❌ 폴더 목록 조회 실패:', error);
  }
}

// 특정 배송의 사진 목록 조회
async function listDeliveryPhotos(trackingNumber) {
  try {
    const deliveryRef = ref(storage, `delivery-photos/${trackingNumber}`);
    const result = await listAll(deliveryRef);
    
    console.log(`📷 ${trackingNumber} 배송 사진들:`);
    
    const photos = [];
    for (const itemRef of result.items) {
      const url = await getDownloadURL(itemRef);
      photos.push({
        name: itemRef.name,
        url: url,
        path: itemRef.fullPath
      });
      console.log(`  - ${itemRef.name}: ${url}`);
    }
    
    return photos;
  } catch (error) {
    console.error(`❌ ${trackingNumber} 사진 조회 실패:`, error);
    return [];
  }
}

// 사용 예시
async function example() {
  // 1. 모든 배송 폴더 목록
  const deliveries = await listAllDeliveries();
  
  // 2. 첫 번째 배송의 사진들 (있다면)
  if (deliveries.length > 0) {
    await listDeliveryPhotos(deliveries[0]);
  }
}

// 함수들을 전역으로 노출 (브라우저 콘솔에서 사용)
window.listAllDeliveries = listAllDeliveries;
window.listDeliveryPhotos = listDeliveryPhotos;
window.example = example;

export { listAllDeliveries, listDeliveryPhotos };