import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * 배송 사진을 Firebase Storage에 업로드
 * @param {string} imageUri - 로컬 이미지 URI
 * @param {string} trackingNumber - 배송 추적 번호
 * @param {function} onProgress - 업로드 진행률 콜백 (선택적)
 * @returns {Promise<string>} 업로드된 이미지의 다운로드 URL
 */
export const uploadDeliveryPhoto = async (imageUri, trackingNumber, onProgress = null) => {
  try {
    console.log('Firebase Storage 업로드 시작:', trackingNumber);
    
    // Blob으로 변환
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // 파일명 생성 (타임스탬프 + 랜덤)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const fileName = `${timestamp}_${randomId}.jpg`;
    
    // Storage 참조 생성
    const imageRef = ref(storage, `delivery-photos/${trackingNumber}/${fileName}`);
    
    // 업로드 실행
    console.log('업로드 중...', fileName);
    const snapshot = await uploadBytes(imageRef, blob);
    
    // 다운로드 URL 획득
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('업로드 완료:', downloadURL);
    return downloadURL;
    
  } catch (error) {
    console.error('Firebase Storage 업로드 오류:', error);
    throw new Error(`사진 업로드 실패: ${error.message}`);
  }
};

/**
 * 배송 번호에 해당하는 모든 사진 목록 조회
 * @param {string} trackingNumber - 배송 추적 번호
 * @returns {Promise<Array>} 사진 URL 배열
 */
export const getDeliveryPhotos = async (trackingNumber) => {
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
 * 특정 사진 삭제
 * @param {string} trackingNumber - 배송 추적 번호
 * @param {string} fileName - 삭제할 파일명
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
export const deleteDeliveryPhoto = async (trackingNumber, fileName) => {
  try {
    console.log('Firebase Storage 사진 삭제:', fileName);
    
    const imageRef = ref(storage, `delivery-photos/${trackingNumber}/${fileName}`);
    await deleteObject(imageRef);
    
    console.log('사진 삭제 완료:', fileName);
    return true;
    
  } catch (error) {
    console.error('Firebase Storage 사진 삭제 오류:', error);
    return false;
  }
};

/**
 * 여러 사진을 한번에 업로드
 * @param {Array} imageUris - 이미지 URI 배열
 * @param {string} trackingNumber - 배송 추적 번호
 * @param {function} onProgress - 전체 진행률 콜백
 * @returns {Promise<Array>} 업로드된 이미지 URL 배열
 */
export const uploadMultipleDeliveryPhotos = async (imageUris, trackingNumber, onProgress = null) => {
  try {
    console.log('Firebase Storage 다중 업로드 시작:', imageUris.length, '장');
    
    const uploadPromises = imageUris.map(async (imageUri, index) => {
      const url = await uploadDeliveryPhoto(imageUri, trackingNumber);
      
      if (onProgress) {
        const progress = ((index + 1) / imageUris.length) * 100;
        onProgress(progress);
      }
      
      return url;
    });
    
    const uploadedUrls = await Promise.all(uploadPromises);
    
    console.log('다중 업로드 완료:', uploadedUrls.length, '장');
    return uploadedUrls;
    
  } catch (error) {
    console.error('Firebase Storage 다중 업로드 오류:', error);
    throw error;
  }
};

/**
 * 배송 증빙 오디오 파일을 Firebase Storage에 업로드
 * @param {Object} audioFile - 오디오 파일 객체 {uri, name, type, size}
 * @param {string} trackingNumber - 배송 추적 번호
 * @param {function} onProgress - 업로드 진행률 콜백 (선택적)
 * @returns {Promise<Object>} 업로드된 오디오 파일 정보 {url, fileName, originalName, size}
 */
export const uploadDeliveryAudio = async (audioFile, trackingNumber, onProgress = null) => {
  try {
    console.log('🎤 Firebase Storage 오디오 업로드 시작:', trackingNumber, audioFile.name);
    
    // Blob으로 변환
    const response = await fetch(audioFile.uri);
    const blob = await response.blob();
    
    // 파일 확장자 추출
    const originalName = audioFile.name || 'audio.mp3';
    const fileExtension = originalName.substring(originalName.lastIndexOf('.')) || '.mp3';
    
    // 파일명 생성 (타임스탬프 + 추적번호 + 확장자)
    const timestamp = Date.now();
    const fileName = `${trackingNumber}_${timestamp}_evidence${fileExtension}`;
    
    // Storage 참조 생성 (delivery-audio 폴더 사용)
    const audioRef = ref(storage, `delivery-audio/${trackingNumber}/${fileName}`);
    
    // 메타데이터 설정
    const metadata = {
      contentType: audioFile.type || 'audio/mpeg',
      customMetadata: {
        originalName: originalName,
        trackingNumber: trackingNumber,
        uploadedAt: new Date().toISOString()
      }
    };
    
    // 업로드 실행
    console.log('🔄 오디오 업로드 중...', fileName);
    const snapshot = await uploadBytes(audioRef, blob, metadata);
    
    // 다운로드 URL 획득
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    const result = {
      url: downloadURL,
      fileName: fileName,
      originalName: originalName,
      size: audioFile.size,
      uploadedAt: new Date().toISOString()
    };
    
    console.log('✅ 오디오 업로드 완료:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Firebase Storage 오디오 업로드 오류:', error);
    throw new Error(`오디오 업로드 실패: ${error.message}`);
  }
};

/**
 * 배송 번호에 해당하는 모든 오디오 파일 목록 조회
 * @param {string} trackingNumber - 배송 추적 번호
 * @returns {Promise<Array>} 오디오 파일 정보 배열
 */
export const getDeliveryAudio = async (trackingNumber) => {
  try {
    console.log('🎤 Firebase Storage 오디오 목록 조회:', trackingNumber);
    
    const folderRef = ref(storage, `delivery-audio/${trackingNumber}`);
    const result = await listAll(folderRef);
    
    const audioFiles = await Promise.all(
      result.items.map(async (item) => {
        const url = await getDownloadURL(item);
        const metadata = await item.getMetadata();
        
        return {
          id: item.name,
          url: url,
          fileName: item.name,
          originalName: metadata.customMetadata?.originalName || item.name,
          size: metadata.size,
          uploadedAt: metadata.customMetadata?.uploadedAt || metadata.timeCreated,
          path: item.fullPath
        };
      })
    );
    
    console.log('✅ 오디오 목록 조회 완료:', audioFiles.length, '개');
    return audioFiles;
    
  } catch (error) {
    console.error('❌ Firebase Storage 오디오 목록 조회 오류:', error);
    return [];
  }
};

/**
 * 특정 오디오 파일 삭제
 * @param {string} trackingNumber - 배송 추적 번호
 * @param {string} fileName - 삭제할 파일명
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
export const deleteDeliveryAudio = async (trackingNumber, fileName) => {
  try {
    console.log('🗑️ Firebase Storage 오디오 삭제:', fileName);
    
    const audioRef = ref(storage, `delivery-audio/${trackingNumber}/${fileName}`);
    await deleteObject(audioRef);
    
    console.log('✅ 오디오 삭제 완료:', fileName);
    return true;
    
  } catch (error) {
    console.error('❌ Firebase Storage 오디오 삭제 오류:', error);
    return false;
  }
};