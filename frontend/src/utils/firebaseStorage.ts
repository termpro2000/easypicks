import { ref, getDownloadURL, listAll } from 'firebase/storage';
import { storage } from '../config/firebase';

interface DeliveryPhoto {
  id: string;
  url: string;
  name: string;
  path: string;
}

/**
 * 배송 번호에 해당하는 모든 사진 목록 조회
 * @param trackingNumber - 배송 추적 번호
 * @returns 사진 정보 배열
 */
export const getDeliveryPhotos = async (trackingNumber: string): Promise<DeliveryPhoto[]> => {
  try {
    console.log('Firebase Storage 사진 목록 조회:', trackingNumber);
    
    const folderRef = ref(storage, `delivery-photos/${trackingNumber}`);
    const result = await listAll(folderRef);
    
    const photoUrls = await Promise.all(
      result.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return {
          id: item.name,
          url: url,
          name: item.name,
          path: item.fullPath
        };
      })
    );
    
    console.log('사진 목록 조회 완료:', photoUrls.length, '장');
    return photoUrls;
    
  } catch (error) {
    console.error('Firebase Storage 사진 목록 조회 오류:', error);
    return [];
  }
};

/**
 * Firebase Storage 설정 상태 확인
 * @returns 설정 상태
 */
export const isFirebaseStorageConfigured = (): boolean => {
  try {
    return !!storage;
  } catch (error) {
    console.error('Firebase Storage 설정 확인 오류:', error);
    return false;
  }
};