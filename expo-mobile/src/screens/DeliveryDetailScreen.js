import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Clipboard,
  Linking,
  Image,
  TextInput,
  Platform,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SignatureCanvas from 'react-native-signature-canvas';
import SimpleNaverMap from '../components/map/SimpleNaverMap';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import api from '../config/api';
import { 
  uploadMultipleDeliveryPhotos, 
  getDeliveryPhotos, 
  deleteDeliveryPhoto,
  uploadDeliveryAudio,
  getDeliveryAudio,
  deleteDeliveryAudio
} from '../utils/firebaseStorage';
import { isFirebaseStorageConfigured, firebaseConfig, storage } from '../config/firebase';
import Constants from 'expo-constants';

// API 베이스 URL 설정
const getBaseURL = () => {
  if (__DEV__) {
    if (Platform.OS === 'web') {
      return 'http://localhost:8080/api';
    } else {
      return 'http://172.26.150.127:8080/api';
    }
  }
  return 'http://172.26.150.127:8080/api';
};

const DeliveryDetailScreen = ({ route, navigation }) => {
  const { delivery } = route.params;
  
  // delivery 객체 디버깅
  console.log('DeliveryDetailScreen - delivery 객체:', delivery);
  console.log('DeliveryDetailScreen - delivery 키들:', Object.keys(delivery || {}));
  console.log('DeliveryDetailScreen - trackingNumber:', delivery?.trackingNumber);
  console.log('DeliveryDetailScreen - id:', delivery?.id);
  console.log('DeliveryDetailScreen - customerName:', delivery?.customerName);
  console.log('DeliveryDetailScreen - productInfo:', delivery?.productInfo);
  console.log('DeliveryDetailScreen - requestType:', delivery?.requestType);
  
  // 메모 및 서명 상태
  const [driverNotes, setDriverNotes] = useState(delivery.driverMemo || '');
  const [editingDriverNotes, setEditingDriverNotes] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signaturePaths, setSignaturePaths] = useState([]);
  const [loadedSignature, setLoadedSignature] = useState(null);
  const [showMap, setShowMap] = useState(false); // 지도 표시 상태
  const [mobileSignatureData, setMobileSignatureData] = useState(null); // 모바일 서명 데이터
  const [isSignatureModalVisible, setIsSignatureModalVisible] = useState(false); // 서명 모달 표시 상태
  const [currentMapPreference, setCurrentMapPreference] = useState(0); // 현재 지도 설정
  const [selectedPhotos, setSelectedPhotos] = useState([]); // 선택된 사진들
  const [viewingPhoto, setViewingPhoto] = useState(null); // 보고 있는 사진
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false); // 사진 모달 표시 상태
  const [uploadedPhotos, setUploadedPhotos] = useState([]); // 서버에서 조회된 사진들
  const [loadingPhotos, setLoadingPhotos] = useState(false); // 사진 로딩 상태
  const [loading, setLoading] = useState(false); // 배송완료 처리 로딩 상태
  const [isEditingPhotos, setIsEditingPhotos] = useState(false); // 사진 편집 모드
  const [uploadProgress, setUploadProgress] = useState(0); // 업로드 진행률
  const [isPostponeModalVisible, setIsPostponeModalVisible] = useState(false); // 배송연기 모달 표시 상태
  const [postponeDate, setPostponeDate] = useState(''); // 연기 날짜
  const [postponeReason, setPostponeReason] = useState(''); // 연기 사유
  const [showDatePicker, setShowDatePicker] = useState(false); // 날짜 선택기 표시 상태
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date()); // 달력에서 선택된 날짜
  const [currentMonth, setCurrentMonth] = useState(new Date()); // 달력 현재 월
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false); // 배송취소 모달 표시 상태
  const [cancelReason, setCancelReason] = useState(''); // 취소 사유
  const [customerRequestedCompletion, setCustomerRequestedCompletion] = useState(false); // 고객요청에 의한 배송완료처리
  const [furnitureCompanyRequestedCompletion, setFurnitureCompanyRequestedCompletion] = useState(false); // 가구사요청에 의한 배송완료처리
  const [completionAudioFile, setCompletionAudioFile] = useState(null); // 배송완료 증빙 녹음파일
  const canvasRef = useRef(null);


  // 컴포넌트 로드 시 기존 서명 및 업로드된 사진 가져오기
  useEffect(() => {
    loadExistingSignature();
    loadUploadedPhotos();
  }, []);

  // 전역 지도 설정 변경 감지 및 초기화
  useEffect(() => {
    // 초기 설정 - 전역 상태에서 가져와서 초기화
    const initialMapPreference = global.getMapPreference ? global.getMapPreference() : 0;
    setCurrentMapPreference(initialMapPreference);
    
    const checkMapPreference = () => {
      const globalMapPref = global.getMapPreference ? global.getMapPreference() : 0;
      if (globalMapPref !== currentMapPreference) {
        setCurrentMapPreference(globalMapPref);
      }
    };
    
    // 전역 변경 감지 함수 등록
    global.onMapPreferenceChange = (newValue) => {
      setCurrentMapPreference(newValue);
    };
    
    // 지도 설정 변경 감지 (1초 간격)
    const interval = setInterval(checkMapPreference, 1000);
    
    return () => {
      clearInterval(interval);
      delete global.onMapPreferenceChange;
    };
  }, []); // 의존성 배열을 빈 배열로 변경하여 무한 루프 방지

  // 현재 지도 설정 가져오기 (상태 사용)
  const getMapPreference = () => {
    return currentMapPreference;
  };




  const loadExistingSignature = async () => {
    try {
      // 웹 환경에서는 항상 test-token 사용
      let testToken = 'test-token';
      
      if (Platform.OS !== 'web') {
        const token = await AsyncStorage.getItem('auth_token');
        testToken = token || 'test-token';
      }
      
      // tracking_number 다양한 속성명 확인
      const trackingNumber = delivery.trackingNumber || delivery.tracking_number || delivery.id || 'unknown';
      console.log('서명 로드 시작:', trackingNumber);
      console.log('로드용 토큰:', testToken);
      console.log('플랫폼:', Platform.OS);
      
      // 기존 배송 상세 조회 엔드포인트에서 서명 데이터 가져오기 - tracking_number로 올바른 ID 찾기
      let actualDeliveryId = delivery.id;
      
      console.log('초기 배송 ID:', actualDeliveryId);
      console.log('추적 번호:', trackingNumber);
      
      // 배송 목록에서 tracking_number로 실제 ID 찾기
      try {
        const listResponse = await api.get('/deliveries');
        const foundDelivery = listResponse.data.deliveries?.find(d => d.tracking_number === trackingNumber);
        if (foundDelivery) {
          actualDeliveryId = foundDelivery.id;
          console.log('서명 로드용 실제 찾은 배송 ID:', actualDeliveryId);
        }
      } catch (e) {
        console.log('배송 목록 조회 실패, 기존 ID 사용:', e.message);
      }
      
      const response = await api.get(`/deliveries/${actualDeliveryId}`);

      console.log('서명 로드 응답 상태:', response.status);
      console.log('서명 로드 결과:', response.data);
      
      // customer_signature 필드에서 서명 데이터 확인
      if (response.data.delivery && response.data.delivery.customer_signature) {
        console.log('기존 서명 로드 성공');
        // 서명 데이터 처리
        try {
          const signatureData = response.data.delivery.customer_signature;
          console.log('서명 데이터 확인:', signatureData?.substring(0, 100));
          
          setLoadedSignature(signatureData);
          setHasSignature(true);
        } catch (e) {
          console.log('서명 데이터 처리 오류:', e);
          setLoadedSignature(response.data.delivery.customer_signature);
          setHasSignature(true);
        }
      } else {
        console.log('저장된 서명 없음');
      }
    } catch (error) {
      console.log('서명 로드 오류:', error);
      // 오류가 있어도 앱이 계속 작동하도록 함
    }
  };

  const handleResultRegister = () => {
    // 체크박스 상태 확인
    const hasCompletionProcessing = customerRequestedCompletion || furnitureCompanyRequestedCompletion;
    
    let confirmMessage = '배송 결과를 등록하시겠습니까?';
    
    if (hasCompletionProcessing) {
      const completionTypes = [];
      if (customerRequestedCompletion) completionTypes.push('소비자 귀책사항');
      if (furnitureCompanyRequestedCompletion) completionTypes.push('가구사 귀책사항');
      
      confirmMessage = `배송완료처리 유형: ${completionTypes.join(', ')}\n`;
      
      if (completionAudioFile) {
        confirmMessage += `증빙 녹음파일: ${completionAudioFile.name}\n\n`;
      } else {
        confirmMessage += '증빙 녹음파일: 없음\n\n';
      }
      
      confirmMessage += '배송 결과를 등록하시겠습니까?';
    }
    
    Alert.alert(
      '결과 등록 확인',
      confirmMessage,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: handleDeliveryCompletionSubmit,
        },
      ]
    );
  };

  // 배송완료 처리 제출
  const handleDeliveryCompletionSubmit = async () => {
    try {
      setLoading(true);
      
      const trackingNumber = delivery.trackingNumber || delivery.tracking_number || delivery.id || 'unknown';
      
      // 오디오 파일이 있으면 먼저 업로드
      let audioFileName = null;
      if (completionAudioFile) {
        console.log('오디오 파일 업로드 시작:', completionAudioFile.name);
        audioFileName = await uploadAudioFile(trackingNumber, completionAudioFile);
      }
      
      // 현재 날짜와 시간 생성
      const now = new Date();
      const actionDate = now.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      const actionTime = now.toTimeString().split(' ')[0]; // HH:MM:SS 형식
      
      // 배송완료 데이터 준비
      const completionData = {
        deliveryId: delivery.id,
        driverNotes: driverNotes,
        customerRequestedCompletion: customerRequestedCompletion,
        furnitureCompanyRequestedCompletion: furnitureCompanyRequestedCompletion,
        completionAudioFile: audioFileName,
        completedAt: new Date().toISOString(),
        action_date: actionDate,
        action_time: actionTime
      };
      
      // 배송완료 처리 API 호출 (axios 인스턴스 사용)
      const response = await api.post(`/deliveries/complete/${delivery.id}`, completionData);
      
      console.log('배송완료 처리 응답 상태:', response.status);
      console.log('배송완료 처리 응답 데이터:', response.data);
      
      const result = response.data;
      console.log('배송완료 처리 응답 결과:', result);
      
      if (result.success) {
        const { data } = result;
        const statusMessage = data.newStatus ? `\n의뢰상태: ${data.previousStatus} → ${data.newStatus}` : '';
        
        // DeliveryListScreen으로 상태 업데이트 전달
        try {
          // API에서 action_date/time이 없으면 현재 시간 사용
          const now = new Date();
          const currentActionDate = data.action_date || now.toISOString().split('T')[0];
          const currentActionTime = data.action_time || now.toTimeString().split(' ')[0];
          
          await AsyncStorage.setItem('updatedDeliveryStatus', JSON.stringify({
            updates: [{
              id: delivery.id,
              status: data.newStatus,
              action_date: currentActionDate,
              action_time: currentActionTime
            }],
            timestamp: Date.now()
          }));
          console.log('배송완료: 상태 업데이트 AsyncStorage 저장됨:', delivery.id, data.newStatus, currentActionDate, currentActionTime);
        } catch (asyncError) {
          console.error('배송완료: AsyncStorage 저장 오류:', asyncError);
        }
        
        Alert.alert(
          '완료', 
          `배송 결과가 성공적으로 등록되었습니다.${statusMessage}`,
          [
            {
              text: '확인',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('오류', result.error || '배송완료 처리에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('배송완료 처리 오류:', error);
      
      let errorMessage = '배송완료 처리 중 오류가 발생했습니다.';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 오디오 파일 업로드 (Firebase Storage 사용)
  const uploadAudioFile = async (trackingNumber, audioFile) => {
    try {
      console.log('🎤 오디오 파일 업로드 시작 - Firebase Storage 사용');
      
      // Firebase Storage에 오디오 파일 업로드 (설정 상태 체크)
      const isConfigured = isFirebaseStorageConfigured();
      
      if (!isConfigured) {
        console.log('🔧 Firebase Storage 미설정 - 백엔드 업로드 방식 사용');
        throw new Error('Firebase Storage 미설정');
      }
      
      const firebaseResult = await uploadDeliveryAudio(
        audioFile, 
        trackingNumber, 
        (progress) => {
          console.log(`오디오 업로드 진행률: ${progress.toFixed(1)}%`);
        }
      );
      
      console.log('✅ Firebase Storage 오디오 업로드 완료:', firebaseResult.fileName);
      
      // 백엔드 API에 Firebase Storage URL 정보 저장 (선택적)
      try {
        const formData = new FormData();
        formData.append('audioUrl', firebaseResult.url);
        formData.append('fileName', firebaseResult.fileName);
        formData.append('originalName', firebaseResult.originalName);
        formData.append('size', firebaseResult.size.toString());
        
        // 웹 환경에서는 항상 test-token 사용
        let uploadToken = 'test-token';
        
        if (Platform.OS !== 'web') {
          const token = await AsyncStorage.getItem('auth_token');
          uploadToken = token || 'test-token';
        }
        
        const response = await fetch(`${getBaseURL()}/audio/firebase-url/${trackingNumber}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${uploadToken}`,
          },
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('📝 백엔드에 Firebase URL 저장 완료:', result);
        } else {
          console.log('⚠️ 백엔드 URL 저장 실패 (Firebase 업로드는 성공)');
        }
      } catch (backendError) {
        console.log('⚠️ 백엔드 연동 오류 (Firebase 업로드는 성공):', backendError.message);
      }
      
      // Firebase 파일명 반환
      return firebaseResult.fileName;
      
    } catch (error) {
      console.error('❌ Firebase Storage 오디오 업로드 오류:', error);
      
      // Firebase 실패 시 기존 백엔드 업로드 방식으로 폴백
      console.log('🔄 기존 백엔드 업로드 방식으로 폴백...');
      
      try {
        const formData = new FormData();
        
        formData.append('audio', {
          uri: audioFile.uri,
          type: audioFile.type,
          name: audioFile.name,
        });
        
        // 웹 환경에서는 항상 test-token 사용
        let uploadToken = 'test-token';
        
        if (Platform.OS !== 'web') {
          const token = await AsyncStorage.getItem('auth_token');
          uploadToken = token || 'test-token';
        }
        
        const response = await fetch(`${getBaseURL()}/audio/upload/${trackingNumber}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${uploadToken}`,
          },
          body: formData,
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log('✅ 백엔드 오디오 파일 업로드 성공:', result.file.fileName);
          return result.file.fileName;
        } else {
          throw new Error(result.error || '오디오 파일 업로드 실패');
        }
        
      } catch (fallbackError) {
        console.error('❌ 백엔드 폴백 업로드도 실패:', fallbackError);
        throw new Error('오디오 파일 업로드에 실패했습니다. 네트워크 연결을 확인해주세요.');
      }
    }
  };

  const handleCopyAddress = () => {
    const address = delivery.customerAddress || delivery.receiver_address;
    if (address) {
      Clipboard.setString(address);
      Alert.alert('성공', '주소가 복사되었습니다.');
    } else {
      Alert.alert('오류', '복사할 주소가 없습니다.');
    }
  };

  const handleOpenNavigation = () => {
    const address = delivery.customerAddress || delivery.receiver_address;
    if (!address) {
      Alert.alert('오류', '주소 정보가 없습니다.');
      return;
    }

    // 전역 지도 설정에 따라 직접 연결
    const mapPreference = getMapPreference();
    const mapNames = ['네이버지도', '카카오지도', '티맵', '구글지도'];
    const mapFunctions = [openNaverMap, openKakaoMap, openTMap, openGoogleMap];
    
    console.log(`기본 지도 설정: ${mapNames[mapPreference]}로 네비게이션 연결`);
    
    // 선택된 지도 앱으로 바로 연결
    mapFunctions[mapPreference](address);
  };

  const openKakaoMap = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const kakaoUrl = `kakaomap://route?ep=${encodedAddress}&by=CAR`;
    
    Linking.canOpenURL(kakaoUrl).then(supported => {
      if (supported) {
        Linking.openURL(kakaoUrl);
      } else {
        // 카카오맵이 설치되지 않은 경우 웹으로 열기
        const webUrl = `https://map.kakao.com/link/to/${encodedAddress}`;
        Linking.openURL(webUrl);
      }
    });
  };

  const openNaverMap = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const naverUrl = `nmap://route/car?dlat=&dlng=&dname=${encodedAddress}`;
    
    Linking.canOpenURL(naverUrl).then(supported => {
      if (supported) {
        Linking.openURL(naverUrl);
      } else {
        // 네이버 지도가 설치되지 않은 경우 웹으로 열기
        const webUrl = `https://map.naver.com/v5/search/${encodedAddress}`;
        Linking.openURL(webUrl);
      }
    });
  };

  const openTMap = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const tmapUrl = `tmap://route?goalname=${encodedAddress}`;
    
    Linking.canOpenURL(tmapUrl).then(supported => {
      if (supported) {
        Linking.openURL(tmapUrl);
      } else {
        // 티맵이 설치되지 않은 경우 웹으로 열기
        const webUrl = `https://www.tmap.co.kr/tmap/app/search/location?query=${encodedAddress}`;
        Linking.openURL(webUrl);
      }
    });
  };

  const openGoogleMap = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const googleUrl = `comgooglemaps://?q=${encodedAddress}&directionsmode=driving`;
    
    Linking.canOpenURL(googleUrl).then(supported => {
      if (supported) {
        Linking.openURL(googleUrl);
      } else {
        // 구글맵이 설치되지 않은 경우 웹으로 열기
        const webUrl = `https://maps.google.com/?q=${encodedAddress}&navigate=yes`;
        Linking.openURL(webUrl);
      }
    });
  };

  const handlePhotoUpload = async () => {
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      // 사진 선택 옵션 표시
      Alert.alert(
        '사진 선택',
        '사진을 선택하는 방법을 선택하세요',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '갤러리에서 선택',
            onPress: () => pickImageFromGallery(),
          },
          {
            text: '카메라로 촬영',
            onPress: () => pickImageFromCamera(),
          },
        ]
      );
    } catch (error) {
      console.error('사진 업로드 준비 오류:', error);
      Alert.alert('오류', '사진 업로드 준비 중 오류가 발생했습니다.');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // 다중 선택 시 편집 비활성화
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 10, // 최대 10장까지 선택 가능
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotos = result.assets.map(asset => ({
          id: Date.now() + Math.random(), // 고유 ID 생성
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        }));
        
        console.log('선택된 이미지들:', newPhotos);
        
        // 기존 사진에 새 사진들 추가
        setSelectedPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
      }
    } catch (error) {
      console.error('갤러리 선택 오류:', error);
      Alert.alert('오류', '갤러리에서 사진을 선택하는 중 오류가 발생했습니다.');
    }
  };

  const pickImageFromCamera = async () => {
    try {
      // 카메라 권한 요청
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newPhoto = {
          id: Date.now() + Math.random(), // 고유 ID 생성
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          fileName: `camera_${Date.now()}.jpg`,
        };
        
        console.log('촬영된 이미지:', newPhoto);
        
        // 촬영한 사진을 목록에 추가
        setSelectedPhotos(prevPhotos => [...prevPhotos, newPhoto]);
      }
    } catch (error) {
      console.error('카메라 촬영 오류:', error);
      Alert.alert('오류', '카메라 촬영 중 오류가 발생했습니다.');
    }
  };

  // 선택된 사진 삭제 함수
  const removePhoto = (photoId) => {
    Alert.alert(
      '사진 삭제',
      '이 사진을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setSelectedPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
          }
        }
      ]
    );
  };

  // 업로드된 사진 삭제 함수 (Firebase Storage)
  const removeUploadedPhoto = async (photo) => {
    Alert.alert(
      '사진 삭제',
      'Firebase Storage에서 이 사진을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const trackingNumber = delivery.trackingNumber || delivery.tracking_number || delivery.id || 'unknown';
              
              console.log(`Firebase Storage 사진 삭제 시작 - 파일명: ${photo.fileName}`);

              // Firebase Storage에서 사진 삭제
              const deleteSuccess = await deleteDeliveryPhoto(trackingNumber, photo.fileName);

              if (deleteSuccess) {
                // 로컬 상태에서 삭제된 사진 제거
                setUploadedPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photo.id));
                
                // 백엔드의 installation_photos에서도 해당 URL 제거
                await updateBackendPhotoList(trackingNumber);
                
                console.log('Firebase Storage 사진 삭제 완료');
              } else {
                Alert.alert('오류', '사진 삭제에 실패했습니다.');
              }

            } catch (error) {
              console.error('Firebase Storage 사진 삭제 오류:', error);
              Alert.alert('삭제 오류', `사진 삭제 중 오류가 발생했습니다: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  // 백엔드의 사진 목록 업데이트
  const updateBackendPhotoList = async (trackingNumber) => {
    try {
      // 현재 Firebase Storage의 최신 사진 목록 조회
      const currentPhotos = await getDeliveryPhotos(trackingNumber);
      const photoUrls = currentPhotos.map(photo => photo.url);
      
      // 백엔드에 업데이트된 사진 목록 저장
      await savePhotoUrlsToBackend(trackingNumber, photoUrls);
      
    } catch (error) {
      console.error('백엔드 사진 목록 업데이트 오류:', error);
    }
  };

  // 사진 편집 모드 토글
  const togglePhotoEditMode = () => {
    setIsEditingPhotos(!isEditingPhotos);
  };

  // 선택된 사진들을 Firebase Storage에 업로드하는 함수
  const uploadPhotos = async () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('알림', '업로드할 사진이 없습니다.');
      return;
    }

    try {
      // tracking_number 다양한 속성명 확인
      const trackingNumber = delivery.trackingNumber || delivery.tracking_number || delivery.id || 'unknown';
      
      console.log(`Firebase Storage 업로드 시작 - 배송번호: ${trackingNumber}, 사진 개수: ${selectedPhotos.length}`);
      
      // 업로드 진행률 상태 추가
      setUploadProgress(0);
      
      // 이미지 URI 배열 추출
      const imageUris = selectedPhotos.map(photo => photo.uri);
      
      // Firebase Storage 설정 확인
      const isConfigured = isFirebaseStorageConfigured();
      
      if (!isConfigured) {
        const debugInfo = `
환경: ${Constants.appOwnership !== 'expo' ? 'EAS Build' : 'Expo Go'}
Storage 객체: ${storage ? '정상' : '없음'}
API Key: ${firebaseConfig?.apiKey ? firebaseConfig.apiKey.substring(0, 20) + '...' : '없음'}
Project ID: ${firebaseConfig?.projectId || '없음'}
Storage Bucket: ${firebaseConfig?.storageBucket || '없음'}
        `.trim();
        
        Alert.alert(
          'Firebase Storage 설정 필요', 
          `Firebase Storage를 사용할 수 없습니다.\n\n디버깅 정보:\n${debugInfo}\n\n콘솔 로그를 확인해주세요.`
        );
        setSelectedPhotos([]);
        setUploadProgress(0);
        return;
      }

      // Firebase Storage에 다중 업로드
      const uploadedUrls = await uploadMultipleDeliveryPhotos(
        imageUris, 
        trackingNumber, 
        (progress) => {
          setUploadProgress(progress);
          console.log(`업로드 진행률: ${progress.toFixed(1)}%`);
        }
      );
      
      console.log('Firebase Storage 업로드 완료:', uploadedUrls);
      
      // 백엔드에 사진 URL들을 저장 (선택적)
      await savePhotoUrlsToBackend(trackingNumber, uploadedUrls);
      
      Alert.alert('성공', `${selectedPhotos.length}장의 사진이 성공적으로 업로드되었습니다.`);
      
      // 업로드 성공 후 상태 초기화
      setSelectedPhotos([]);
      setUploadProgress(0);
      
      // 업로드된 사진 목록 다시 불러오기
      loadUploadedPhotos();

    } catch (error) {
      console.error('Firebase Storage 업로드 오류:', error);
      setUploadProgress(0);
      Alert.alert('업로드 오류', `사진 업로드 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 백엔드에 사진 URL들을 저장하는 함수 (새로운 전용 API 사용)
  const savePhotoUrlsToBackend = async (trackingNumber, photoUrls) => {
    try {
      console.log('백엔드에 사진 URL 저장:', photoUrls.length, '개');
      
      // 새로운 배송 사진 업로드 API 사용
      const response = await api.post(`/photos/upload/${trackingNumber}`, {
        photoUrls: photoUrls
      });
      
      console.log('백엔드에 사진 URL 저장 완료:', response.data);
    } catch (error) {
      console.error('백엔드 사진 URL 저장 오류:', error);
      // 백엔드 저장 실패해도 Firebase 업로드는 성공이므로 에러 던지지 않음
    }
  };

  // 업로드된 사진 목록을 불러오는 함수
  const loadUploadedPhotos = async () => {
    try {
      setLoadingPhotos(true);
      
      const trackingNumber = delivery.trackingNumber || delivery.tracking_number || delivery.id || 'unknown';
      console.log('사진 목록 로드:', trackingNumber);
      
      // Firebase Storage 설정 확인
      const isConfigured = isFirebaseStorageConfigured();
      
      if (!isConfigured) {
        console.log('Firebase Storage 설정 필요 - 임시로 빈 목록 표시');
        setUploadedPhotos([]);
        return;
      }

      // Firebase Storage에서 사진 목록 로드
      const photos = await getDeliveryPhotos(trackingNumber);
      setUploadedPhotos(photos);
      console.log('사진 목록 로드 완료:', photos.length, '장');
      
    } catch (error) {
      console.error('사진 로드 오류:', error);
      setUploadedPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };

  // 사진 크게 보기 함수
  const viewPhoto = (photo) => {
    setViewingPhoto(photo);
    setIsPhotoModalVisible(true);
  };

  // 모달 닫기 함수
  const closePhotoModal = () => {
    setIsPhotoModalVisible(false);
    setViewingPhoto(null);
  };

  // 배송연기 모달 관련 함수들
  const handlePostponeDelivery = () => {
    setIsPostponeModalVisible(true);
    setPostponeDate('');
    setPostponeReason('');
  };

  const closePostponeModal = () => {
    setIsPostponeModalVisible(false);
    setPostponeDate('');
    setPostponeReason('');
  };

  const confirmPostponeDelivery = () => {
    if (!postponeDate) {
      Alert.alert('알림', '연기 날짜를 입력해주세요.');
      return;
    }
    if (!postponeReason.trim()) {
      Alert.alert('알림', '연기 사유를 입력해주세요.');
      return;
    }
    
    Alert.alert(
      '배송연기 확인',
      `연기 날짜: ${postponeDate}\n연기 사유: ${postponeReason}\n\n배송을 연기하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: handlePostponeRequest,
        },
      ]
    );
  };

  // 배송연기 API 호출
  const handlePostponeRequest = async () => {
    try {
      setLoading(true);
      
      const trackingNumber = delivery.tracking_number || delivery.trackingNumber;
      console.log('배송연기 API 호출 - tracking number:', trackingNumber);
      
      if (!trackingNumber) {
        Alert.alert('오류', '추적번호를 찾을 수 없습니다.');
        return;
      }
      
      // 현재 날짜와 시간 생성
      const now = new Date();
      const actionDate = now.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      const actionTime = now.toTimeString().split(' ')[0]; // HH:MM:SS 형식
      
      const response = await api.post(`/deliveries/delay/${trackingNumber}`, {
        delayDate: postponeDate,
        delayReason: postponeReason.trim(),
        action_date: actionDate,
        action_time: actionTime
      });
      
      if (response.data.success) {
        const { data } = response.data;
        const statusMessage = data.newStatus ? `\n의뢰상태: ${data.previousStatus} → ${data.newStatus}` : '';
        
        // DeliveryListScreen으로 상태 업데이트 전달
        try {
          console.log('🔍 [배송연기] API 응답 data:', JSON.stringify(data, null, 2));
          
          // API에서 action_date/time이 없으면 현재 시간 사용
          const now = new Date();
          const currentActionDate = data.action_date || now.toISOString().split('T')[0];
          const currentActionTime = data.action_time || now.toTimeString().split(' ')[0];
          
          const updateData = {
            updates: [{
              id: delivery.id,
              status: data.newStatus,
              action_date: currentActionDate,
              action_time: currentActionTime
            }],
            timestamp: Date.now()
          };
          
          console.log('🔍 [배송연기] AsyncStorage 저장할 데이터:', JSON.stringify(updateData, null, 2));
          
          await AsyncStorage.setItem('updatedDeliveryStatus', JSON.stringify(updateData));
          console.log('배송연기: 상태 업데이트 AsyncStorage 저장됨:', delivery.id, data.newStatus, currentActionDate, currentActionTime);
        } catch (asyncError) {
          console.error('배송연기: AsyncStorage 저장 오류:', asyncError);
        }
        
        Alert.alert(
          '연기 완료', 
          `배송이 ${postponeDate}로 연기되었습니다.${statusMessage}`,
          [
            {
              text: '확인',
              onPress: () => {
                closePostponeModal();
                // 배송 정보 새로고침
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('오류', response.data.error || '배송연기에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('배송연기 오류:', error);
      
      let errorMessage = '배송연기 중 오류가 발생했습니다.';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 날짜 선택 관련 함수들
  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  const handleDateSelect = (selectedDate) => {
    // 시간대 문제를 방지하기 위해 로컬 날짜를 직접 포맷
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    console.log('달력 선택 날짜:', selectedDate, '포맷된 날짜:', formattedDate);
    setPostponeDate(formattedDate);
    
    // 자동 연기 사유 생성
    const originalDate = delivery.visitDate ? new Date(delivery.visitDate).toISOString().split('T')[0] : '미정';
    const autoReason = `${originalDate}에서 ${formattedDate}로 연기 되었습니다.`;
    setPostponeReason(autoReason);
    
    setShowDatePicker(false);
  };

  // 달력 관련 헬퍼 함수들
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getPrevMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };

  const getNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  const selectCalendarDate = (day) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedCalendarDate(selectedDate);
  };

  const confirmCalendarDate = () => {
    handleDateSelect(selectedCalendarDate);
  };

  // 배송취소 모달 관련 함수들
  const handleCancelDelivery = () => {
    setIsCancelModalVisible(true);
    setCancelReason('');
  };

  const closeCancelModal = () => {
    setIsCancelModalVisible(false);
    setCancelReason('');
  };

  const confirmCancelDelivery = () => {
    if (!cancelReason.trim()) {
      Alert.alert('알림', '취소 사유를 입력해주세요.');
      return;
    }
    
    Alert.alert(
      '배송취소 확인',
      `취소 사유: ${cancelReason}\n\n정말로 배송을 취소하시겠습니까?\n\n취소된 배송은 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          style: 'destructive',
          onPress: handleCancelRequest,
        },
      ]
    );
  };

  // 배송취소 API 호출
  const handleCancelRequest = async () => {
    try {
      setLoading(true);
      
      // 현재 날짜와 시간 생성
      const now = new Date();
      const actionDate = now.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      const actionTime = now.toTimeString().split(' ')[0]; // HH:MM:SS 형식
      
      const response = await api.post(`/deliveries/cancel/${delivery.id}`, {
        cancelReason: cancelReason.trim(),
        action_date: actionDate,
        action_time: actionTime
      });
      
      if (response.data.success) {
        const { data } = response.data;
        const statusMessage = data.newStatus ? `\n의뢰상태: ${data.previousStatus} → ${data.newStatus}` : '';
        
        // DeliveryListScreen으로 상태 업데이트 전달
        try {
          // API에서 action_date/time이 없으면 현재 시간 사용
          const now = new Date();
          const currentActionDate = data.action_date || now.toISOString().split('T')[0];
          const currentActionTime = data.action_time || now.toTimeString().split(' ')[0];
          
          await AsyncStorage.setItem('updatedDeliveryStatus', JSON.stringify({
            updates: [{
              id: delivery.id,
              status: data.newStatus,
              action_date: currentActionDate,
              action_time: currentActionTime
            }],
            timestamp: Date.now()
          }));
          console.log('배송취소: 상태 업데이트 AsyncStorage 저장됨:', delivery.id, data.newStatus, currentActionDate, currentActionTime);
        } catch (asyncError) {
          console.error('배송취소: AsyncStorage 저장 오류:', asyncError);
        }
        
        Alert.alert(
          '취소 완료', 
          `배송이 성공적으로 취소되었습니다.${statusMessage}`,
          [
            {
              text: '확인',
              onPress: () => {
                closeCancelModal();
                // 화면을 새로고침하거나 이전 화면으로 돌아가기
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('오류', response.data.error || '배송취소에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('배송취소 오류:', error);
      
      let errorMessage = '배송취소 중 오류가 발생했습니다.';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 녹음파일 선택 처리
  const handleSelectAudioFile = async () => {
    try {
      console.log('🎤 오디오 파일 선택 시작...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'audio/*',
          'audio/mpeg',
          'audio/mp3',
          'audio/wav',
          'audio/m4a',
          'audio/aac',
          'audio/ogg',
          'audio/3gp',
          'audio/amr'
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('DocumentPicker 결과:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('선택된 오디오 파일:', asset);
        
        // 파일 확장자 확인
        const allowedExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.3gp', '.amr'];
        const fileExtension = asset.name.toLowerCase().substring(asset.name.lastIndexOf('.'));
        
        if (!allowedExtensions.includes(fileExtension)) {
          Alert.alert(
            '지원하지 않는 파일 형식',
            '지원하는 오디오 형식: MP3, WAV, M4A, AAC, OGG, 3GP, AMR'
          );
          return;
        }
        
        // 파일 크기 확인 (50MB 제한)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (asset.size > maxSize) {
          Alert.alert(
            '파일 크기 오류', 
            `파일 크기는 50MB 이하여야 합니다.\n현재 파일 크기: ${(asset.size / 1024 / 1024).toFixed(2)}MB`
          );
          return;
        }

        // 파일 정보 설정
        const audioFile = {
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          type: asset.mimeType || 'audio/mpeg'
        };

        setCompletionAudioFile(audioFile);
        
        // 성공 메시지
        const sizeInMB = (asset.size / 1024 / 1024).toFixed(2);
        Alert.alert(
          '파일 선택 완료', 
          `📄 파일명: ${asset.name}\n📊 크기: ${sizeInMB}MB\n🎵 형식: ${fileExtension.toUpperCase()}`
        );
      } else if (result.canceled) {
        console.log('사용자가 파일 선택을 취소했습니다.');
      }
    } catch (error) {
      console.error('오디오 파일 선택 오류:', error);
      Alert.alert(
        '파일 선택 오류', 
        '오디오 파일을 선택하는 중 오류가 발생했습니다.\n다시 시도해주세요.'
      );
    }
  };

  // 녹음파일 제거
  const handleRemoveAudioFile = () => {
    Alert.alert(
      '파일 제거',
      '선택된 녹음파일을 제거하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제거',
          onPress: () => setCompletionAudioFile(null)
        }
      ]
    );
  };

  // 달력 렌더링 함수
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const today = new Date();
    
    const monthNames = [
      '1월', '2월', '3월', '4월', '5월', '6월',
      '7월', '8월', '9월', '10월', '11월', '12월'
    ];
    
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    
    // 빈 날짜들 (이전 달)
    const emptyDays = [];
    for (let i = 0; i < firstDay; i++) {
      emptyDays.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    // 실제 날짜들
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = today.getDate() === day && 
                     today.getMonth() === currentMonth.getMonth() && 
                     today.getFullYear() === currentMonth.getFullYear();
      
      const isSelected = selectedCalendarDate.getDate() === day &&
                        selectedCalendarDate.getMonth() === currentMonth.getMonth() &&
                        selectedCalendarDate.getFullYear() === currentMonth.getFullYear();
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isToday && styles.calendarToday,
            isSelected && styles.calendarSelected
          ]}
          onPress={() => selectCalendarDate(day)}
        >
          <Text style={[
            styles.calendarDayText,
            isToday && styles.calendarTodayText,
            isSelected && styles.calendarSelectedText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <View style={styles.calendarContainer}>
        {/* 달력 헤더 */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={getPrevMonth} style={styles.calendarArrow}>
            <Text style={styles.calendarArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.calendarMonthText}>
            {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
          </Text>
          <TouchableOpacity onPress={getNextMonth} style={styles.calendarArrow}>
            <Text style={styles.calendarArrowText}>›</Text>
          </TouchableOpacity>
        </View>
        
        {/* 요일 헤더 */}
        <View style={styles.calendarWeekHeader}>
          {dayNames.map((dayName, index) => (
            <View key={dayName} style={styles.calendarWeekDay}>
              <Text style={[
                styles.calendarWeekDayText,
                index === 0 && styles.calendarSundayText,
                index === 6 && styles.calendarSaturdayText
              ]}>
                {dayName}
              </Text>
            </View>
          ))}
        </View>
        
        {/* 날짜 그리드 */}
        <View style={styles.calendarGrid}>
          {emptyDays}
          {days}
        </View>
      </View>
    );
  };

  // 확대/축소 가능한 이미지 컴포넌트
  const ZoomableImage = ({ uri }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    
    const baseScale = useRef(1);
    const pinchScale = useRef(1);
    const lastScale = useRef(1);
    
    const baseTranslateX = useRef(0);
    const baseTranslateY = useRef(0);
    const lastTranslateX = useRef(0);
    const lastTranslateY = useRef(0);

    const onPinchEvent = Animated.event(
      [{ nativeEvent: { scale: pinchScale.current } }],
      { useNativeDriver: true }
    );

    const onPinchStateChange = (event) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        lastScale.current *= event.nativeEvent.scale;
        baseScale.current = lastScale.current;
        pinchScale.current = 1;

        // 최소/최대 확대 비율 제한
        if (lastScale.current < 1) {
          lastScale.current = 1;
          baseScale.current = 1;
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
          
          // 확대 비율이 1로 돌아갔을 때 위치도 초기화
          lastTranslateX.current = 0;
          lastTranslateY.current = 0;
          baseTranslateX.current = 0;
          baseTranslateY.current = 0;
          
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }),
          ]).start();
        } else if (lastScale.current > 3) {
          lastScale.current = 3;
          baseScale.current = 3;
          Animated.spring(scale, {
            toValue: 3,
            useNativeDriver: true,
          }).start();
        }
      }
    };

    const onPanEvent = Animated.event(
      [{ 
        nativeEvent: { 
          translationX: translateX,
          translationY: translateY,
        } 
      }],
      { useNativeDriver: true }
    );

    const onPanStateChange = (event) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        lastTranslateX.current += event.nativeEvent.translationX;
        lastTranslateY.current += event.nativeEvent.translationY;
        
        baseTranslateX.current = lastTranslateX.current;
        baseTranslateY.current = lastTranslateY.current;
        
        translateX.setOffset(lastTranslateX.current);
        translateX.setValue(0);
        translateY.setOffset(lastTranslateY.current);
        translateY.setValue(0);
      }
    };

    const animatedScale = Animated.multiply(baseScale.current, pinchScale.current);

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <PanGestureHandler
          onGestureEvent={onPanEvent}
          onHandlerStateChange={onPanStateChange}
          enabled={lastScale.current > 1}
        >
          <Animated.View>
            <PinchGestureHandler
              onGestureEvent={onPinchEvent}
              onHandlerStateChange={onPinchStateChange}
            >
              <Animated.View style={{ overflow: 'hidden' }}>
                <Animated.Image
                  source={{ uri }}
                  style={[
                    {
                      width: Dimensions.get('window').width,
                      height: Dimensions.get('window').height * 0.7,
                    },
                    {
                      transform: [
                        { scale: animatedScale },
                        { translateX: translateX },
                        { translateY: translateY },
                      ],
                    },
                  ]}
                  resizeMode="contain"
                />
              </Animated.View>
            </PinchGestureHandler>
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
  };


  const handleViewPhoto = (photoUrl) => {
    Alert.alert('사진 보기', `사진을 크게 보시겠습니까?\n${photoUrl}`, [
      { text: '취소', style: 'cancel' },
      { text: '보기', onPress: () => console.log('사진 보기:', photoUrl) },
    ]);
  };

  const handleEditMemo = () => {
    if (editingDriverNotes) {
      Alert.alert('저장', '기사님 메모가 저장되었습니다.');
    }
    setEditingDriverNotes(!editingDriverNotes);
  };

  const handleOpenSignatureModal = () => {
    // 서명 모달 열기
    setIsSignatureModalVisible(true);
    setHasSignature(false);
    setSignaturePaths([]);
    setMobileSignatureData(null);
  };

  const handleCloseSignatureModal = () => {
    // 서명 모달 닫기 (서명이 저장된 경우 데이터 유지)
    setIsSignatureModalVisible(false);
    if (Platform.OS !== 'web' && canvasRef.current) {
      canvasRef.current.clearSignature();
    }
    // 저장되지 않은 서명 데이터만 초기화 (저장된 경우 loadedSignature에 반영됨)
    if (!loadedSignature) {
      setMobileSignatureData(null);
    }
  };

  const handleEditSignature = () => {
    // 서명 편집 - 모달 열기
    if (Platform.OS === 'web') {
      // 웹에서는 기존 방식 유지
      setHasSignature(false);
      setSignaturePaths([]);
      setLoadedSignature(null);
    } else {
      // 모바일에서는 모달 열기
      handleOpenSignatureModal();
    }
  };

  const handleMobileSignatureOK = (signature) => {
    console.log('모바일 서명 완료, 데이터 길이:', signature?.length);
    setMobileSignatureData(signature);
    setHasSignature(true);
    console.log('서명 데이터가 준비되었습니다.');
  };


  const handleSaveSignature = async () => {
    // 웹에서는 SVG 경로 확인, 모바일에서는 서명 데이터 확인
    if (Platform.OS === 'web' && signaturePaths.length === 0) {
      Alert.alert('오류', '서명을 먼저 그려주세요.');
      return;
    }
    
    if (Platform.OS !== 'web' && !mobileSignatureData) {
      Alert.alert('오류', '서명을 먼저 그려주세요.');
      return;
    }

    try {
      // tracking_number 다양한 속성명 확인
      const trackingNumber = delivery.trackingNumber || delivery.tracking_number || delivery.id || 'unknown';
      console.log('서명 저장 시작:', trackingNumber);
      console.log('플랫폼:', Platform.OS);
      
      let base64Data;
      
      if (Platform.OS === 'web') {
        // 웹에서는 SVG 경로를 Base64로 변환
        console.log('서명 경로 개수:', signaturePaths.length);
        const svgData = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">${signaturePaths.map(path => 
          `<path d="${Array.isArray(path) ? path.join(' ') : path}" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`
        ).join('')}</svg>`;
        base64Data = `data:image/svg+xml;base64,${btoa(svgData)}`;
      } else {
        // 모바일에서는 캔버스 서명 데이터 사용
        console.log('모바일 서명 데이터 길이:', mobileSignatureData?.length);
        base64Data = mobileSignatureData;
      }
      
      console.log('최종 데이터 길이:', base64Data?.length);
      
      // 웹 환경에서는 항상 test-token 사용
      let saveToken = 'test-token';
      
      if (Platform.OS !== 'web') {
        const token = await AsyncStorage.getItem('auth_token');
        saveToken = token || 'test-token';
      }
      
      console.log('저장용 토큰:', saveToken);
      console.log('플랫폼:', Platform.OS);
      
      // API로 서명 저장 - 먼저 배송 목록에서 tracking_number로 올바른 ID 찾기
      let actualDeliveryId = delivery.id;
      
      console.log('초기 배송 ID:', actualDeliveryId);
      console.log('추적 번호:', trackingNumber);
      
      // 배송 목록에서 tracking_number로 실제 ID 찾기
      try {
        const listResponse = await api.get('/deliveries');
        const foundDelivery = listResponse.data.deliveries?.find(d => d.tracking_number === trackingNumber);
        if (foundDelivery) {
          actualDeliveryId = foundDelivery.id;
          console.log('실제 찾은 배송 ID:', actualDeliveryId);
        }
      } catch (e) {
        console.log('배송 목록 조회 실패, 기존 ID 사용:', e.message);
      }
      
      const response = await api.put(`/deliveries/${actualDeliveryId}`, {
        customer_signature: base64Data
      });

      console.log('API 응답 상태:', response.status);
      console.log('API 응답 결과:', response.data);
      
      if (response.status === 200) {
        setHasSignature(true);
        setSignaturePaths([]); // 저장 후 그려진 경로 초기화
        
        // 플랫폼에 맞는 서명 데이터로 설정
        if (Platform.OS !== 'web' && mobileSignatureData) {
          // 모바일에서는 PNG 데이터를 img 태그로 설정
          setLoadedSignature(mobileSignatureData);
        } else {
          // 웹에서는 SVG 데이터로 설정
          setLoadedSignature(base64Data);
        }
        
        console.log('서명 저장 완료');
        // 서명 저장 완료 - 알림 제거
      } else {
        Alert.alert('오류', response.data?.error || '서명 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('서명 저장 오류:', error);
      console.error('서명 저장 오류 상세:', error.response?.data);
      console.error('서명 저장 오류 상태:', error.response?.status);
      Alert.alert('네트워크 오류', `서버와의 연결에 문제가 있습니다. ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSaveSignatureWithData = async (signatureData) => {
    if (!signatureData) {
      Alert.alert('오류', '서명을 먼저 그려주세요.');
      return;
    }

    try {
      // tracking_number 다양한 속성명 확인
      const trackingNumber = delivery.trackingNumber || delivery.tracking_number || delivery.id || 'unknown';
      console.log('서명 저장 시작:', trackingNumber);
      console.log('delivery 객체 keys:', Object.keys(delivery));
      console.log('플랫폼:', Platform.OS);
      console.log('서명 데이터 길이:', signatureData?.length);
      
      // 서명 데이터 크기 제한 (50KB)
      if (signatureData && signatureData.length > 50000) {
        Alert.alert('오류', '서명 데이터가 너무 큽니다. 더 간단하게 서명해 주세요.');
        return;
      }
      
      // 웹 환경에서는 항상 test-token 사용
      let saveToken = 'test-token';
      
      if (Platform.OS !== 'web') {
        const token = await AsyncStorage.getItem('auth_token');
        saveToken = token || 'test-token';
      }
      
      console.log('저장용 토큰:', saveToken);
      
      // API로 서명 저장 - 먼저 배송 목록에서 tracking_number로 올바른 ID 찾기
      let actualDeliveryId = delivery.id;
      
      console.log('초기 배송 ID:', actualDeliveryId);
      console.log('추적 번호:', trackingNumber);
      
      // 배송 목록에서 tracking_number로 실제 ID 찾기
      try {
        const listResponse = await api.get('/deliveries');
        const foundDelivery = listResponse.data.deliveries?.find(d => d.tracking_number === trackingNumber);
        if (foundDelivery) {
          actualDeliveryId = foundDelivery.id;
          console.log('실제 찾은 배송 ID:', actualDeliveryId);
        }
      } catch (e) {
        console.log('배송 목록 조회 실패, 기존 ID 사용:', e.message);
      }
      
      const response = await api.put(`/deliveries/${actualDeliveryId}`, {
        customer_signature: signatureData
      });

      console.log('API 응답 상태:', response.status);
      console.log('API 응답 결과:', response.data);
      
      if (response.status === 200) {
        setHasSignature(true);
        setSignaturePaths([]); // 저장 후 그려진 경로 초기화
        setLoadedSignature(signatureData); // 서명 데이터로 설정
        
        console.log('서명 저장 완료');
        // 서명 저장 완료 - 알림 제거
      } else {
        Alert.alert('오류', response.data?.error || '서명 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('서명 저장 오류:', error);
      console.error('서명 저장 오류 상세:', error.response?.data);
      console.error('서명 저장 오류 상태:', error.response?.status);
      Alert.alert('네트워크 오류', `서버와의 연결에 문제가 있습니다. ${error.response?.data?.message || error.message}`);
    }
  };

  // 의뢰종류에 따른 동적 status 처리
  const getStatusTextByRequestType = (status, requestType) => {
    // 영어 status를 한글로 변환하는 기본 매핑
    const statusMapping = {
      'order_received': '접수완료',
      'dispatch_completed': '배차완료',
      'in_delivery': '배송중',
      'delivery_cancelled': '배송취소',
      'delivery_completed': '배송완료',
      'in_collection': '수거중',
      'collection_completed': '수거완료',
      'in_processing': '조처중',
      'processing_completed': '조처완료',
      'delivery_postponed': '배송연기'
    };

    // 한글 status가 직접 들어온 경우 그대로 반환
    if (statusMapping[status]) {
      return statusMapping[status];
    }

    // 기존 영문 status 호환성 처리
    switch (status) {
      case 'pending':
        return '접수완료';
      case 'in_transit':
        // 의뢰종류에 따라 다르게 처리
        if (requestType === '회수') return '수거중';
        if (requestType === '조처') return '조처중';
        return '배송중';
      case 'delivered':
      case 'completed':
        // 의뢰종류에 따라 다르게 처리
        if (requestType === '회수') return '수거완료';
        if (requestType === '조처') return '조처완료';
        return '배송완료';
      case 'cancelled':
        return '배송취소';
      default:
        return status || '알 수 없음';
    }
  };

  const getStatusText = (status, requestType = delivery?.requestType || delivery?.request_type) => {
    return getStatusTextByRequestType(status, requestType);
  };

  // 배송완료 상태 확인 함수
  const isDeliveryCompleted = (status) => {
    return status === 'delivery_completed' || 
           status === 'collection_completed' || 
           status === 'processing_completed' || 
           status === 'delivered' ||
           status === 'completed' ||
           status === '배송완료' || 
           status === '수거완료' || 
           status === '조처완료';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'order_received':
      case 'dispatch_completed':
      case 'pending':
        return '#FF9800'; // 주황색 - 접수/대기 상태
      case 'delivery_postponed':
      case '배송연기':
        return '#FFC107'; // 노란색 - 배송연기
      case 'in_delivery':
      case 'in_collection':
      case 'in_processing':
      case 'in_transit':
        return '#2196F3'; // 파란색 - 진행 중
      case 'delivery_completed':
      case 'collection_completed':
      case 'processing_completed':
      case 'delivered':
      case 'completed':
      case '배송완료':
      case '수거완료':
      case '조처완료':
        return '#4CAF50'; // 녹색 - 완료 상태
      case 'delivery_cancelled':
      case 'cancelled':
      case '배송취소':
        return '#F44336'; // 빨간색 - 취소
      default:
        return '#9E9E9E'; // 회색 - 기타
    }
  };

  const DetailItem = ({ label, value }) => (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '-'}</Text>
    </View>
  );

  const PhoneDetailItem = ({ label, value }) => {
    const handlePhoneCall = () => {
      if (value && value !== '-') {
        const phoneNumber = value.replace(/[^0-9]/g, ''); // 숫자만 추출
        const phoneUrl = `tel:${phoneNumber}`;
        
        Linking.canOpenURL(phoneUrl)
          .then(supported => {
            if (supported) {
              return Linking.openURL(phoneUrl);
            } else {
              Alert.alert('오류', '전화 기능을 사용할 수 없습니다.');
            }
          })
          .catch(err => {
            console.error('전화걸기 오류:', err);
            Alert.alert('오류', '전화 연결에 실패했습니다.');
          });
      } else {
        Alert.alert('알림', '연락처 정보가 없습니다.');
      }
    };

    return (
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>{label}</Text>
        <View style={styles.phoneRow}>
          <Text style={styles.detailValue}>{value || '-'}</Text>
          {value && value !== '-' && (
            <TouchableOpacity 
              style={styles.phoneButton} 
              onPress={handlePhoneCall}
            >
              <Text style={styles.phoneButtonText}>전화</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* 배송 취소 상태 표시 (취소된 경우만) */}
          {(delivery.cancel_status === 1 || delivery.canceled_at || delivery.status === 'cancelled') && (
            <View style={styles.cancelStatusSection}>
              <View style={styles.cancelStatusHeader}>
                <Text style={styles.cancelStatusIcon}>⚠️</Text>
                <Text style={styles.cancelStatusTitle}>배송 취소됨</Text>
              </View>
              
              <View style={styles.cancelStatusContent}>
                {delivery.canceled_at && (
                  <DetailItem 
                    label="취소일시" 
                    value={new Date(delivery.canceled_at).toLocaleString('ko-KR')} 
                  />
                )}
                {delivery.cancel_reason && (
                  <DetailItem 
                    label="취소사유" 
                    value={delivery.cancel_reason} 
                  />
                )}
                <View style={styles.cancelStatusNote}>
                  <Text style={styles.cancelStatusNoteText}>
                    이 배송은 취소되었습니다. 취소된 배송은 처리할 수 없습니다.
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          {/* 방문지 정보 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 방문지 정보</Text>
            <DetailItem label="고객이름" value={delivery.customerName || delivery.receiver_name} />
            <PhoneDetailItem label="연락처" value={delivery.customerPhone || delivery.receiver_phone} />
            
            <View style={styles.addressRow}>
              <View style={styles.addressInfo}>
                <Text style={styles.detailLabel}>주소</Text>
                <Text style={styles.detailValue}>{delivery.customerAddress || delivery.receiver_address || '-'}</Text>
              </View>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
                <Text style={styles.copyButtonText}>주소복사</Text>
              </TouchableOpacity>
            </View>
            
            {/* 지도 토글 버튼 */}
            {!showMap && (
              <TouchableOpacity style={styles.showMapButton} onPress={() => setShowMap(true)}>
                <Text style={styles.showMapButtonText}>🗺️ 지도 보이기</Text>
              </TouchableOpacity>
            )}

            {/* 심플 네이버 지도 - 조건부 렌더링 */}
            {showMap && (
              <View style={styles.mapContainer}>
                <View style={styles.mapHeader}>
                  <TouchableOpacity style={styles.hideMapButtonFull} onPress={() => setShowMap(false)}>
                    <Text style={styles.hideMapButtonText}>지도 감추기</Text>
                  </TouchableOpacity>
                </View>
                <SimpleNaverMap
                  address={delivery.customerAddress || delivery.receiver_address}
                  width="100%"
                  height={300}
                  zoom={16}
                  className="rounded-b-lg"
                />
              </View>
            )}
            
            <TouchableOpacity style={styles.navigationButton} onPress={handleOpenNavigation}>
              <Text style={styles.navigationButtonText}>🧭 네비게이션 연결하기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>기본 정보</Text>
            <DetailItem label="의뢰타입" value={delivery.requestType || '일반'} />
            <DetailItem label="의뢰상태" value={getStatusText(delivery.status)} />
            <DetailItem label="시공유형" value={delivery.constructionType} />
            <DetailItem label="방문일" value={delivery.visitDate} />
            <DetailItem label="방문시간" value={delivery.visitTime} />
            <DetailItem label="담당기사" value={delivery.assignedDriver} />
            <DetailItem label="가구사" value={delivery.furnitureCompany} />
            <DetailItem label="주요메모" value={delivery.mainMemo} />
            <DetailItem label="비상연락망" value={delivery.emergencyContact} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏗️ 현장 정보(방문지)</Text>
            <DetailItem label="건물형태" value={delivery.buildingType} />
            <DetailItem label="층수" value={delivery.floorCount} />
            <DetailItem label="엘레베이터유무" value={delivery.elevatorAvailable} />
            <DetailItem label="사다리차 필요여부" value={delivery.ladderTruck} />
            <DetailItem label="내림 유무(폐기장 이동)" value={delivery.disposal} />
            <DetailItem label="방간이동" value={delivery.roomMovement} />
            <DetailItem label="벽시공" value={delivery.wallConstruction} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📦 상품 정보</Text>
            <DetailItem label="상품명" value={delivery.productInfo} />
            <DetailItem label="의뢰타입" value={delivery.requestType} />
            <DetailItem label="시공유형" value={delivery.constructionType} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>배송 정보</Text>
            <DetailItem label="배송상태" value={getStatusText(delivery.status)} />
            <DetailItem label="방문일" value={delivery.visitDate} />
            <DetailItem label="방문시간" value={delivery.visitTime} />
            <DetailItem label="배정시간" value={delivery.assignmentTime} />
            <DetailItem label="담당기사" value={delivery.assignedDriver} />
            <DetailItem label="가구회사" value={delivery.furnitureCompany} />
            <DetailItem label="비상연락망" value={delivery.emergencyContact} />
          </View>


          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 가구사 요청사항</Text>
            <View style={styles.readonlyContent}>
              <Text style={styles.readonlyText}>
                {delivery.furnitureRequest || '가구사 요청사항이 없습니다.'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✍️ 기사님 메모</Text>
            
            {/* 배송완료처리 체크박스 섹션 */}
            <View style={styles.completionProcessingSection}>
              <Text style={styles.completionProcessingTitle}>배송완료처리 귀책사항</Text>
              
              <View style={styles.checkboxContainer}>
                <TouchableOpacity 
                  style={styles.checkboxRow}
                  onPress={() => setCustomerRequestedCompletion(!customerRequestedCompletion)}
                >
                  <View style={[styles.checkbox, customerRequestedCompletion && styles.checkboxChecked]}>
                    {customerRequestedCompletion && <Text style={styles.checkboxText}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>고객요청에 의한 배송완료처리 (소비자 귀책사항)</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.checkboxRow}
                  onPress={() => setFurnitureCompanyRequestedCompletion(!furnitureCompanyRequestedCompletion)}
                >
                  <View style={[styles.checkbox, furnitureCompanyRequestedCompletion && styles.checkboxChecked]}>
                    {furnitureCompanyRequestedCompletion && <Text style={styles.checkboxText}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>가구사요청에 의한 배송완료처리 (가구사 귀책사항)</Text>
                </TouchableOpacity>
              </View>
              
              {/* 증빙파일(녹음파일) 첨부 섹션 */}
              <View style={styles.audioFileSection}>
                <Text style={styles.audioFileTitle}>
                  해당 요청에 대한 증빙파일첨부 (로컬 녹음파일 선택)
                  {'\n'}🔥 Firebase Storage 자동 업로드
                </Text>
                
                {completionAudioFile ? (
                  <View style={styles.audioFileSelected}>
                    <View style={styles.audioFileInfo}>
                      <Text style={styles.audioFileName}>📄 {completionAudioFile.name}</Text>
                      <Text style={styles.audioFileSize}>
                        크기: {(completionAudioFile.size / 1024 / 1024).toFixed(2)}MB
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.audioFileRemoveButton}
                      onPress={handleRemoveAudioFile}
                    >
                      <Text style={styles.audioFileRemoveText}>제거</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.audioFileUploadButton}
                    onPress={handleSelectAudioFile}
                  >
                    <Text style={styles.audioFileUploadText}>📁 로컬 녹음파일 선택</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <View style={styles.memoContainer}>
              <TextInput
                style={styles.memoInput}
                multiline
                placeholder="기사님 메모를 입력하세요..."
                value={driverNotes}
                onChangeText={setDriverNotes}
                editable={editingDriverNotes}
              />
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={handleEditMemo}
              >
                <Text style={styles.editButtonText}>
                  {editingDriverNotes ? '저장' : '수정'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📷 시공 설치 사진</Text>
            
            {/* 사진 추가 및 수정 버튼 영역 */}
            <View style={styles.photoButtonsContainer}>
              <TouchableOpacity 
                style={[
                  styles.photoUploadButton,
                  uploadedPhotos.length > 0 && !isDeliveryCompleted(delivery.status) && styles.halfWidthButton
                ]} 
                onPress={handlePhotoUpload}
              >
                <Text style={styles.photoUploadButtonText}>📸 사진 추가</Text>
              </TouchableOpacity>
              
              {uploadedPhotos.length > 0 && !isDeliveryCompleted(delivery.status) && (
                <TouchableOpacity 
                  style={[
                    styles.photoEditButton,
                    styles.halfWidthButton,
                    isEditingPhotos && styles.editPhotosButtonActive
                  ]} 
                  onPress={togglePhotoEditMode}
                >
                  <Text style={styles.photoUploadButtonText}>
                    {isEditingPhotos ? '완료' : '수정'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* 선택된 사진들 표시 */}
            {selectedPhotos.length > 0 && (
              <View style={styles.selectedPhotosContainer}>
                <View style={styles.selectedPhotosHeader}>
                  <Text style={styles.selectedPhotosTitle}>선택된 사진 ({selectedPhotos.length}장)</Text>
                  <TouchableOpacity 
                    style={[styles.uploadButton, uploadProgress > 0 && styles.uploadButtonDisabled]} 
                    onPress={uploadPhotos}
                    disabled={uploadProgress > 0}
                  >
                    <Text style={styles.uploadButtonText}>
                      {uploadProgress > 0 ? `📤 업로드 중... ${uploadProgress.toFixed(0)}%` : '📤 업로드'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* 업로드 진행률 바 */}
                {uploadProgress > 0 && (
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
                  </View>
                )}
                <View style={styles.photoGrid}>
                  {selectedPhotos.map((photo) => (
                    <View key={photo.id} style={styles.photoItem}>
                      <TouchableOpacity 
                        style={styles.photoTouchArea}
                        onPress={() => viewPhoto(photo)}
                      >
                        <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(photo.id)}
                      >
                        <Text style={styles.removePhotoButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* 업로드된 사진들 표시 */}
            <View style={styles.uploadedPhotosSection}>
              <View style={styles.uploadedPhotosHeader}>
                <Text style={styles.uploadedPhotosTitle}>
                  업로드된 사진 ({uploadedPhotos.length}장)
                </Text>
                <View style={styles.uploadedPhotosRightSection}>
                  {loadingPhotos && (
                    <Text style={styles.loadingText}>로딩 중...</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.photoGrid}>
                {uploadedPhotos.length > 0 ? (
                  uploadedPhotos.map((photo, index) => (
                    <View key={`uploaded_${photo.id}`} style={styles.photoItem}>
                      <TouchableOpacity 
                        style={styles.photoTouchArea}
                        onPress={() => !isEditingPhotos && viewPhoto({
                          id: photo.id,
                          uri: photo.url,
                          fileName: photo.file_name,
                          fileSize: photo.file_size,
                          width: 800, // 기본값
                          height: 600 // 기본값
                        })}
                      >
                        <Image source={{ uri: photo.url }} style={styles.photoImage} />
                      </TouchableOpacity>
                      
                      {isEditingPhotos && (
                        <TouchableOpacity 
                          style={styles.removeUploadedPhotoButton}
                          onPress={() => removeUploadedPhoto(photo)}
                        >
                          <Text style={styles.removePhotoButtonText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                ) : !loadingPhotos ? (
                  <Text style={styles.noPhotos}>
                    {selectedPhotos.length === 0 ? '업로드된 사진이 없습니다.' : '사진을 업로드하면 여기에 표시됩니다.'}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✒️ 고객 서명</Text>
            <View style={styles.signatureContainer}>
              {Platform.OS === 'web' ? (
                <View style={styles.webSignatureContainer}>
                  <View style={styles.webSignatureCanvas}>
                    <svg
                      width="100%"
                      height="200"
                      viewBox="0 0 400 200"
                      style={{
                        border: '2px dashed #ccc',
                        borderRadius: 8,
                        backgroundColor: signaturePaths.length > 0 ? 'white' : '#fafafa',
                        cursor: 'crosshair'
                      }}
                      onMouseDown={(e) => {
                        // 새로운 서명을 시작할 때 기존 로드된 서명 지우기
                        if (loadedSignature) {
                          setLoadedSignature(null);
                        }
                        
                        const svg = e.currentTarget;
                        const rect = svg.getBoundingClientRect();
                        const startX = ((e.clientX - rect.left) / rect.width) * 400;
                        const startY = ((e.clientY - rect.top) / rect.height) * 200;
                        
                        let isDrawing = true;
                        let currentPath = [`M${startX},${startY}`];
                        
                        const handleMouseMove = (moveEvent) => {
                          if (!isDrawing) return;
                          const x = ((moveEvent.clientX - rect.left) / rect.width) * 400;
                          const y = ((moveEvent.clientY - rect.top) / rect.height) * 200;
                          currentPath.push(`L${x},${y}`);
                          
                          setSignaturePaths(prev => [...prev.slice(0, -1), currentPath]);
                        };
                        
                        const handleMouseUp = () => {
                          isDrawing = false;
                          setHasSignature(true);
                          setSignaturePaths(prev => [...prev, currentPath]);
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        setSignaturePaths(prev => [...prev, currentPath]);
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    >
                      {signaturePaths.map((path, index) => (
                        <path
                          key={index}
                          d={Array.isArray(path) ? path.join(' ') : path}
                          stroke="#000"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ))}
                      {!hasSignature && signaturePaths.length === 0 && !loadedSignature && (
                        <text x="200" y="100" textAnchor="middle" fill="#999" fontSize="14">
                          마우스로 서명해주세요
                        </text>
                      )}
                      {loadedSignature && signaturePaths.length === 0 && (
                        <g dangerouslySetInnerHTML={{
                          __html: loadedSignature.replace('<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">', '').replace('</svg>', '')
                        }} />
                      )}
                    </svg>
                  </View>
                </View>
              ) : (
                <View style={styles.mobileSignatureContainer}>
                  {loadedSignature ? (
                    // 저장된 서명이 있을 때 - 저장된 서명 표시
                    <View style={styles.loadedSignatureContainer}>
                      <Image
                        source={{ uri: loadedSignature }}
                        style={styles.signatureImage}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    // 저장된 서명이 없을 때 - 플레이스홀더 표시
                    <View style={styles.signatureCanvas}>
                      <Text style={styles.signaturePlaceholder}>
                        아직 서명이 없습니다. 서명받기 버튼을 눌러 서명하세요.
                      </Text>
                    </View>
                  )}
                </View>
              )}
              
              <View style={styles.signatureButtons}>
                <TouchableOpacity style={styles.editButton} onPress={handleEditSignature}>
                  <Text style={styles.buttonText}>서명받기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>메모 및 기타</Text>
            <DetailItem label="주요메모" value={delivery.mainMemo} />
            <DetailItem label="상품정보" value={delivery.productInfo} />
            <DetailItem label="가구사요청사항" value={delivery.furnitureRequest} />
            <DetailItem label="기사님메모" value={delivery.driverMemo} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.postponeButton} onPress={handlePostponeDelivery}>
            <Text style={styles.postponeButtonText}>배송연기</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.cancelButton, 
              (delivery.cancel_status === 1 || delivery.canceled_at || delivery.status === 'cancelled') && styles.disabledButton
            ]} 
            onPress={(delivery.cancel_status === 1 || delivery.canceled_at || delivery.status === 'cancelled') 
              ? null 
              : handleCancelDelivery
            }
            disabled={delivery.cancel_status === 1 || delivery.canceled_at || delivery.status === 'cancelled'}
          >
            <Text style={[
              styles.cancelButtonText,
              (delivery.cancel_status === 1 || delivery.canceled_at || delivery.status === 'cancelled') && styles.disabledButtonText
            ]}>
              {(delivery.cancel_status === 1 || delivery.canceled_at || delivery.status === 'cancelled') ? '취소됨' : '배송취소'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.registerButton} onPress={handleResultRegister}>
            <Text style={styles.registerButtonText}>배송완료</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 서명 모달 */}
      <Modal
        visible={isSignatureModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseSignatureModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseSignatureModal}>
              <Text style={styles.modalCloseButton}>× 닫기</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>고객 서명</Text>
          </View>

          <View style={styles.modalSignatureContainer}>
            <SignatureCanvas
              ref={canvasRef}
              onOK={async (signature) => {
                console.log('완료 버튼 클릭됨, 자동저장 시작');
                handleMobileSignatureOK(signature);
                // 완료 버튼을 누르면 자동으로 저장하고 모달 닫기
                try {
                  // signature 데이터를 직접 사용해서 저장
                  await handleSaveSignatureWithData(signature);
                  setIsSignatureModalVisible(false);
                  console.log('자동저장 완료 및 모달 닫기');
                } catch (error) {
                  console.error('자동저장 중 오류:', error);
                }
              }}
              onEmpty={() => {
                console.log('서명이 비어있음');
                setMobileSignatureData(null);
                setHasSignature(false);
              }}
              onBegin={() => {
                console.log('서명 시작됨');
                setHasSignature(false);
              }}
              onClear={() => {
                console.log('서명 지워짐');
                setMobileSignatureData(null);
                setHasSignature(false);
              }}
              descriptionText="손가락으로 서명해주세요"
              clearText="지우기"
              confirmText="완료"
              autoClear={false}
              imageType={'image/png'}
              dataURL=""
              webStyle={`
                .m-signature-pad {
                  box-shadow: none;
                  border: 1px solid #ddd;
                  border-radius: 8px;
                  touch-action: none;
                  user-select: none;
                  -webkit-user-select: none;
                }
                .m-signature-pad--body {
                  border: none;
                  height: 300px;
                  touch-action: none;
                  user-select: none;
                  -webkit-user-select: none;
                }
                .m-signature-pad--footer {
                  display: flex;
                  padding: 15px;
                  background: #f0f0f0;
                  border-top: 1px solid #ddd;
                  justify-content: space-between;
                }
                .m-signature-pad--footer .button {
                  background: #2196F3;
                  color: white;
                  border: none;
                  padding: 18px 24px;
                  border-radius: 6px;
                  font-size: 16px;
                  cursor: pointer;
                  min-width: 100px;
                  min-height: 55px;
                  text-align: center;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .m-signature-pad--footer .button.clear {
                  background: #f44336;
                }
                canvas {
                  touch-action: none;
                  user-select: none;
                  -webkit-user-select: none;
                }
              `}
              style={styles.fullSignatureCanvas}
            />
          </View>
        </View>
      </Modal>

      {/* 날짜 선택 모달 */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDatePicker}
      >
        <View style={styles.datePickerModalContainer}>
          <View style={styles.datePickerModalContent}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={closeDatePicker}>
                <Text style={styles.datePickerCancelText}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>날짜 선택</Text>
              <TouchableOpacity onPress={confirmCalendarDate}>
                <Text style={styles.datePickerConfirmText}>확인</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContent}>
              <Text style={styles.datePickerInstruction}>원하는 날짜를 선택하세요</Text>
              
              {/* 달력 */}
              {renderCalendar()}
              
              {/* 간단한 날짜 선택 버튼들 */}
              <View style={styles.dateOptionsContainer}>
                <TouchableOpacity 
                  style={styles.dateOption}
                  onPress={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    handleDateSelect(tomorrow);
                  }}
                >
                  <Text style={styles.dateOptionText}>내일</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.dateOption}
                  onPress={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    handleDateSelect(nextWeek);
                  }}
                >
                  <Text style={styles.dateOptionText}>1주일 후</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.dateOption}
                  onPress={() => {
                    const nextMonth = new Date();
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    handleDateSelect(nextMonth);
                  }}
                >
                  <Text style={styles.dateOptionText}>1개월 후</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 배송연기 모달 */}
      <Modal
        visible={isPostponeModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closePostponeModal}
      >
        <View style={styles.postponeModalContainer}>
          <View style={styles.postponeModalHeader}>
            <TouchableOpacity onPress={closePostponeModal}>
              <Text style={styles.postponeModalCloseButton}>✕ 닫기</Text>
            </TouchableOpacity>
            <Text style={styles.postponeModalTitle}>배송 연기</Text>
            <View style={styles.postponeModalHeaderSpacer} />
          </View>

          <View style={styles.postponeModalContent}>
            <View style={styles.postponeFormSection}>
              <Text style={styles.postponeFormLabel}>연기 날짜</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={styles.postponeDateInputWithButton}
                  placeholder="YYYY-MM-DD 형식으로 입력"
                  value={postponeDate}
                  onChangeText={(text) => {
                    setPostponeDate(text);
                    // YYYY-MM-DD 형식이 완성되면 자동 사유 생성
                    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
                      const originalDate = delivery.visitDate ? new Date(delivery.visitDate).toISOString().split('T')[0] : '미정';
                      const autoReason = `${originalDate}에서 ${text}로 연기 되었습니다.`;
                      setPostponeReason(autoReason);
                    }
                  }}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.datePickerButton} onPress={openDatePicker}>
                  <Text style={styles.datePickerButtonText}>🗓</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.postponeFormSection}>
              <Text style={styles.postponeFormLabel}>연기 사유</Text>
              <TextInput
                style={styles.postponeReasonInput}
                placeholder="연기 사유를 입력하세요..."
                value={postponeReason}
                onChangeText={setPostponeReason}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.postponeModalButtons}>
              <TouchableOpacity style={styles.postponeCancelButton} onPress={closePostponeModal}>
                <Text style={styles.postponeCancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postponeConfirmButton} onPress={confirmPostponeDelivery}>
                <Text style={styles.postponeConfirmButtonText}>연기하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 배송취소 모달 */}
      <Modal
        visible={isCancelModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeCancelModal}
      >
        <View style={styles.cancelModalContainer}>
          <View style={styles.cancelModalHeader}>
            <TouchableOpacity onPress={closeCancelModal}>
              <Text style={styles.cancelModalCloseButton}>✕ 닫기</Text>
            </TouchableOpacity>
            <Text style={styles.cancelModalTitle}>배송 취소</Text>
            <View style={styles.cancelModalHeaderSpacer} />
          </View>

          <View style={styles.cancelModalContent}>
            <View style={styles.cancelFormSection}>
              <Text style={styles.cancelFormLabel}>취소 사유</Text>
              <TextInput
                style={styles.cancelReasonInput}
                placeholder="배송 취소 사유를 입력하세요..."
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
              <Text style={styles.cancelWarningText}>
                ⚠️ 취소된 배송은 되돌릴 수 없습니다.
              </Text>
            </View>

            <View style={styles.cancelModalButtons}>
              <TouchableOpacity style={styles.cancelCancelButton} onPress={closeCancelModal}>
                <Text style={styles.cancelCancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelConfirmButton} onPress={confirmCancelDelivery}>
                <Text style={styles.cancelConfirmButtonText}>취소하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 사진 보기 모달 */}
      <Modal
        visible={isPhotoModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closePhotoModal}
      >
        {viewingPhoto && (
          <View style={styles.customImageModalContainer}>
            {/* 배경 터치 영역 */}
            <TouchableOpacity 
              style={styles.customImageModalBackground}
              onPress={closePhotoModal}
              activeOpacity={1}
            />
            
            {/* 닫기 버튼 */}
            <View style={styles.imageViewerHeader}>
              <TouchableOpacity 
                style={styles.imageViewerCloseButton}
                onPress={closePhotoModal}
              >
                <Text style={styles.imageViewerCloseButtonText}>✕ 닫기</Text>
              </TouchableOpacity>
            </View>

            {/* 확대/축소 가능한 이미지 */}
            <View style={styles.customImageContainer}>
              <ZoomableImage uri={viewingPhoto.uri} />
            </View>

            {/* 하단 정보 */}
            <View style={styles.imageViewerFooter}>
              <Text style={styles.imageViewerInfoText}>
                크기: {viewingPhoto.width} × {viewingPhoto.height} | 용량: {Math.round(viewingPhoto.fileSize / 1024)}KB
              </Text>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    ...(Platform.OS === 'web' && {
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
    }),
  },
  scrollContainer: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      height: '100vh',
      overflow: 'auto',
    }),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // 하단 여백 추가
    ...(Platform.OS === 'web' && {
      minHeight: '100%',
    }),
  },
  content: {
    padding: 15,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    backgroundColor: '#ffffff',
    padding: 12,
    margin: -15,
    marginBottom: 15,
    borderRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  // 섹션 헤더에 버튼이 있는 경우의 스타일
  sectionHeaderWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    margin: -15,
    marginBottom: 15,
    borderRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  editPhotosButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editPhotosButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editPhotosButtonActive: {
    backgroundColor: '#4CAF50',
  },
  removeUploadedPhotoButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  detailItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
  footer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 40, // 스마트폰 하단 버튼과 겹치지 않도록 여백 추가
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  postponeButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  postponeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // 방문지 정보 전용 스타일
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addressInfo: {
    flex: 1,
    marginRight: 10,
  },
  copyButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 2,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  navigationButton: {
    backgroundColor: '#78909c',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // 사진 관련 스타일
  photoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  photoUploadButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  photoEditButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  halfWidthButton: {
    flex: 0.48,
  },
  photoUploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoItem: {
    width: '31%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  photoOverlayText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  noPhotos: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
    width: '100%',
  },
  // 배송완료처리 스타일
  completionProcessingSection: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E3E8ED',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  completionProcessingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  checkboxContainer: {
    marginBottom: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  audioFileSection: {
    borderTopWidth: 1,
    borderTopColor: '#E3E8ED',
    paddingTop: 15,
  },
  audioFileTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  audioFileUploadButton: {
    backgroundColor: '#28A745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  audioFileUploadText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  audioFileSelected: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#28A745',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioFileInfo: {
    flex: 1,
  },
  audioFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  audioFileSize: {
    fontSize: 12,
    color: '#666',
  },
  audioFileRemoveButton: {
    backgroundColor: '#DC3545',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  audioFileRemoveText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // 메모 및 서명 스타일
  memoContainer: {
    marginBottom: 10,
  },
  memoInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  signatureContainer: {
    alignItems: 'center',
  },
  signatureCanvas: {
    width: '100%',
    height: 300,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  signaturePlaceholder: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  signatureButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  readonlyContent: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    minHeight: 60,
  },
  readonlyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  mapContainer: {
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 300,
  },
  mapPlaceholder: {
    height: 160,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e7ff',
    borderStyle: 'dashed',
  },
  mapText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  mapSubText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  webSignatureContainer: {
    width: '100%',
    marginBottom: 15,
  },
  webSignatureCanvas: {
    width: '100%',
    height: 200,
  },
  map: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  mapButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 5,
  },
  mapButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    minWidth: 60,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  primaryMapButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)', // 녹색으로 강조
    borderWidth: 2,
    borderColor: '#fff',
  },
  primaryMapButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mapInfoContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mapInfoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  showMapButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  showMapButtonText: {
    color: '#546e7a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mapHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  hideMapButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  hideMapButtonFull: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  hideMapButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // 모바일 서명 스타일
  mobileSignatureContainer: {
    width: '100%',
    height: 200,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 15,
    overflow: 'hidden',
  },
  loadedSignatureContainer: {
    width: '100%',
    height: 300,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureWebView: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  signatureImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 0.5 }, { translateY: -100 }],
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  // 모달 스타일
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2196F3',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSignatureContainer: {
    height: '50%',
    margin: 20,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fullSignatureCanvas: {
    width: '100%',
    height: '100%',
  },
  // 새로 추가된 사진 선택 스타일들
  selectedPhotosContainer: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  selectedPhotosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedPhotosTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removePhotoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  photoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  photoInfoText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  // 사진 터치 영역 스타일
  photoTouchArea: {
    width: '100%',
    height: '100%',
  },
  // 사진 모달 스타일들
  photoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  photoModalContent: {
    position: 'absolute',
    top: '5%',
    left: '2.5%',
    right: '2.5%',
    bottom: '5%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2196F3',
  },
  photoModalCloseButton: {
    padding: 8,
  },
  photoModalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoModalImage: {
    width: '100%',
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  photoModalInfo: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  photoModalInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  // ImageViewer 스타일들
  imageViewerHeader: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
  },
  imageViewerCloseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageViewerCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageViewerFooter: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  imageViewerInfoText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  imageViewerHelpText: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // 커스텀 이미지 모달 스타일들
  customImageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customImageModalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  customImageScrollView: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
  },
  customImageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  customImageModalImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.7,
    backgroundColor: 'transparent',
  },
  customImageContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
  },
  // 업로드된 사진 섹션 스타일들
  uploadedPhotosSection: {
    marginTop: 15,
  },
  uploadedPhotosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadedPhotosTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  uploadedPhotosRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  // 배송연기 모달 스타일
  postponeModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  postponeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FF9800',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  postponeModalCloseButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postponeModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  postponeModalHeaderSpacer: {
    width: 50,
  },
  postponeModalContent: {
    flex: 1,
    padding: 20,
  },
  postponeFormSection: {
    marginBottom: 25,
  },
  postponeFormLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postponeDateInputWithButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    flex: 1,
  },
  datePickerButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerButtonText: {
    fontSize: 18,
  },
  postponeDateInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  postponeReasonInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 120,
  },
  postponeModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginTop: 30,
  },
  postponeCancelButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  postponeCancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postponeConfirmButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  postponeConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 배송취소 모달 스타일
  cancelModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Constants.statusBarHeight,
  },
  cancelModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#DC3545',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelModalCloseButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelModalHeaderSpacer: {
    width: 50,
  },
  cancelModalContent: {
    flex: 1,
    padding: 20,
  },
  cancelFormSection: {
    marginBottom: 25,
  },
  cancelFormLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cancelReasonInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 120,
    marginBottom: 15,
  },
  cancelWarningText: {
    fontSize: 14,
    color: '#DC3545',
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFF5F5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginTop: 30,
  },
  cancelCancelButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelCancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelConfirmButton: {
    backgroundColor: '#DC3545',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 배송취소 상태 표시 스타일
  cancelStatusSection: {
    backgroundColor: '#FFF5F5',
    borderWidth: 2,
    borderColor: '#DC3545',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cancelStatusHeader: {
    backgroundColor: '#DC3545',
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelStatusIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  cancelStatusTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelStatusContent: {
    padding: 15,
  },
  cancelStatusNote: {
    backgroundColor: '#FECACA',
    borderRadius: 6,
    padding: 12,
    marginTop: 10,
  },
  cancelStatusNoteText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // 비활성 버튼 스타일
  disabledButton: {
    backgroundColor: '#E5E5E5',
    borderColor: '#CCCCCC',
  },
  disabledButtonText: {
    color: '#999999',
  },
  // 날짜 선택 모달 스타일
  datePickerModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2196F3',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  datePickerCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  datePickerConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerContent: {
    padding: 20,
  },
  datePickerInstruction: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  dateOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 10,
  },
  dateOption: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  dateOptionText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: 'bold',
  },
  datePickerButtons: {
    alignItems: 'center',
  },
  datePickerCancelButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  datePickerCancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 달력 스타일
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  calendarArrow: {
    padding: 8,
  },
  calendarArrowText: {
    fontSize: 24,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  calendarWeekDay: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  calendarWeekDayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  calendarSundayText: {
    color: '#f44336',
  },
  calendarSaturdayText: {
    color: '#2196F3',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  calendarDay: {
    width: '14.28%', // 7분의 1
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
  },
  calendarToday: {
    backgroundColor: '#e3f2fd',
  },
  calendarTodayText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  calendarSelected: {
    backgroundColor: '#2196F3',
  },
  calendarSelectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Firebase Storage 업로드 관련 스타일
  uploadButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  // 전화걸기 버튼 스타일
  phoneRow: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 8,
  },
  phoneButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default DeliveryDetailScreen;