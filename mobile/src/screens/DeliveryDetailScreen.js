import React, { useState } from 'react';
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
} from 'react-native';

const DeliveryDetailScreen = ({ route, navigation }) => {
  const { delivery } = route.params;
  
  // 메모 및 서명 상태
  const [driverNotes, setDriverNotes] = useState(delivery.driverNotes || '');
  const [editingDriverNotes, setEditingDriverNotes] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const handleResultRegister = () => {
    Alert.alert(
      '결과 등록',
      '배송 결과를 등록하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            Alert.alert('완료', '결과가 등록되었습니다.');
            navigation.goBack();
          },
        },
      ]
    );
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

    Alert.alert(
      '네비게이션 연결',
      '어떤 앱으로 열까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '카카오맵',
          onPress: () => openKakaoMap(address),
        },
        {
          text: '네이버 지도',
          onPress: () => openNaverMap(address),
        },
      ]
    );
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

  const handlePhotoUpload = () => {
    Alert.alert(
      '사진 업로드',
      '사진을 업로드하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            Alert.alert('알림', '사진이 업로드되었습니다.');
          },
        },
      ]
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

  const handleClearSignature = () => {
    Alert.alert(
      '서명 지우기',
      '서명을 지우시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '지우기',
          onPress: () => {
            setHasSignature(false);
            Alert.alert('완료', '서명이 지워졌습니다.');
          },
        },
      ]
    );
  };

  const handleEditSignature = () => {
    Alert.alert('서명 수정', '서명을 다시 그려주세요.');
    setHasSignature(false);
  };

  const handleSaveSignature = () => {
    setHasSignature(true);
    Alert.alert('완료', '서명이 저장되었습니다.');
  };

  const DetailItem = ({ label, value }) => (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '-'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>배송 상세정보</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 방문지 정보 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 방문지 정보</Text>
            <DetailItem label="고객이름" value={delivery.customerName || delivery.receiver_name} />
            <DetailItem label="연락처" value={delivery.customerPhone || delivery.receiver_phone} />
            
            <View style={styles.addressRow}>
              <View style={styles.addressInfo}>
                <Text style={styles.detailLabel}>주소</Text>
                <Text style={styles.detailValue}>{delivery.customerAddress || delivery.receiver_address || '-'}</Text>
              </View>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
                <Text style={styles.copyButtonText}>주소복사</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.navigationButton} onPress={handleOpenNavigation}>
              <Text style={styles.navigationButtonText}>🧭 네비게이션 연결하기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>기본 정보</Text>
            <DetailItem label="의뢰타입" value={delivery.requestType || '일반'} />
            <DetailItem label="의뢰상태" value={delivery.status === 'pending' ? '대기' : delivery.status === 'in_transit' ? '배송중' : delivery.status === 'delivered' ? '완료' : '취소'} />
            <DetailItem label="시공유형" value={delivery.constructionType} />
            <DetailItem label="출고형태" value={delivery.shipmentType} />
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
            <DetailItem label="상품명" value={delivery.productName} />
            <DetailItem label="가구사 상품코드" value={delivery.furnitureProductCode} />
            <DetailItem label="무게" value={delivery.productWeight} />
            <DetailItem label="상품크기" value={delivery.productSize} />
            <DetailItem label="박스크기" value={delivery.boxSize} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>배송 정보</Text>
            <DetailItem label="출고지정보" value={delivery.warehouseInfo} />
            <DetailItem label="주문안내(해피콜)" value={delivery.orderGuidance} />
            <DetailItem label="사전안내" value={delivery.preNotification} />
            <DetailItem label="건물형태" value={delivery.buildingType} />
            <DetailItem label="층수" value={delivery.floorCount} />
            <DetailItem label="엘리베이터유무" value={delivery.elevatorAvailable} />
            <DetailItem label="계단이동" value={delivery.stairMovement} />
            <DetailItem label="사다리차" value={delivery.ladderTruck} />
            <DetailItem label="내림(폐기장이동)" value={delivery.disposal} />
            <DetailItem label="방간이동" value={delivery.roomMovement} />
            <DetailItem label="벽시공" value={delivery.wallConstruction} />
            <DetailItem label="톨게이트비용" value={delivery.tollgateCost} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📷 시공 설치 사진</Text>
            <TouchableOpacity style={styles.photoUploadButton} onPress={handlePhotoUpload}>
              <Text style={styles.photoUploadButtonText}>📸 사진 올리기</Text>
            </TouchableOpacity>
            
            <View style={styles.photoGrid}>
              {delivery.installationPhotos && delivery.installationPhotos.length > 0 ? (
                delivery.installationPhotos.slice(0, 4).map((photo, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.photoItem}
                    onPress={() => handleViewPhoto(photo)}
                  >
                    <Image source={{ uri: photo }} style={styles.photoImage} />
                    <View style={styles.photoOverlay}>
                      <Text style={styles.photoOverlayText}>설치 사진 {index + 1}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noPhotos}>등록된 사진이 없습니다.</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 가구사 요청사항</Text>
            <View style={styles.readonlyContent}>
              <Text style={styles.readonlyText}>
                {delivery.furnitureRequests || '가구사 요청사항이 없습니다.'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✍️ 기사님 메모</Text>
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
            <Text style={styles.sectionTitle}>✒️ 고객 서명</Text>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureCanvas}>
                <Text style={styles.signaturePlaceholder}>
                  {hasSignature ? '서명이 저장되었습니다' : '여기에 서명해주세요'}
                </Text>
              </View>
              <View style={styles.signatureButtons}>
                <TouchableOpacity style={styles.clearButton} onPress={handleClearSignature}>
                  <Text style={styles.buttonText}>지우기</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton} onPress={handleEditSignature}>
                  <Text style={styles.buttonText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveSignature}>
                  <Text style={styles.buttonText}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>메모 및 기타</Text>
            <DetailItem label="주요메모" value={delivery.mainMemo} />
            <DetailItem label="해피콜메모" value={delivery.happyCallMemo} />
            <DetailItem label="상품정보" value={delivery.productInfo} />
            <DetailItem label="가구사요청사항" value={delivery.furnitureRequest} />
            <DetailItem label="기사님메모" value={delivery.driverMemo} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.registerButton} onPress={handleResultRegister}>
          <Text style={styles.registerButtonText}>결과 등록</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
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
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
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
    backgroundColor: '#03C75A',
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
  photoUploadButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
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
    width: '48%',
    aspectRatio: 1,
    marginBottom: 10,
    borderRadius: 8,
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
    height: 120,
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
});

export default DeliveryDetailScreen;