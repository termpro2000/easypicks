import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Clipboard,
  Linking,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { deliveryDetailsAPI } from '../config/api';

const UserDeliveryDetailScreen = ({ route, navigation }) => {
  const { delivery } = route.params;
  
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isBuildingInfoExpanded, setIsBuildingInfoExpanded] = useState(false);

  useEffect(() => {
    loadDeliveryProducts();
  }, []);

  // 상품 정보 로드
  const loadDeliveryProducts = async () => {
    try {
      setLoadingProducts(true);
      console.log('상품 정보 로드 시작 - delivery ID:', delivery.id);
      
      const response = await deliveryDetailsAPI.getDeliveryProducts(delivery.id);
      
      if (response.success && response.products) {
        console.log('상품 정보 로드 성공:', response.products.length, '개');
        setProducts(response.products);
      } else {
        console.log('상품 정보 없음 또는 로드 실패');
        setProducts([]);
      }
    } catch (error) {
      console.error('상품 정보 로드 실패:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // 상태 텍스트 변환
  const getStatusText = (status) => {
    const statusMap = {
      'pending': '접수완료',
      'assigned': '배차완료',
      'in_progress': '배송중',
      'delivered': '배송완료',
      'cancelled': '배송취소',
      'delayed': '배송연기',
      '접수완료': '접수완료',
      '배차완료': '배차완료',
      '배송중': '배송중',
      '배송완료': '배송완료',
      '배송취소': '배송취소',
      '배송연기': '배송연기',
    };
    return statusMap[status] || status || '알 수 없음';
  };

  // 상태별 색상
  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#FFC107',
      'assigned': '#2196F3',
      'in_progress': '#FF9800',
      'delivered': '#4CAF50',
      'cancelled': '#F44336',
      'delayed': '#FF9800',
      '접수완료': '#FFC107',
      '배차완료': '#2196F3',
      '배송중': '#FF9800',
      '배송완료': '#4CAF50',
      '배송취소': '#F44336',
      '배송연기': '#FF9800',
    };
    return colorMap[status] || '#9E9E9E';
  };

  // 주소 복사
  const handleCopyAddress = () => {
    const address = delivery.customerAddress || delivery.receiver_address || '';
    if (address) {
      Clipboard.setString(address);
      Alert.alert('복사 완료', '주소가 클립보드에 복사되었습니다.');
    } else {
      Alert.alert('알림', '복사할 주소가 없습니다.');
    }
  };

  // 전화 걸기
  const handlePhoneCall = (phoneNumber) => {
    if (phoneNumber && phoneNumber !== '-') {
      const phoneUrl = `tel:${phoneNumber}`;
      Linking.canOpenURL(phoneUrl)
        .then((supported) => {
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

  // 배송 상세 항목 컴포넌트
  const DetailItem = ({ label, value, icon }) => (
    <View style={styles.detailItem}>
      <View style={styles.detailRow}>
        {icon && <Ionicons name={icon} size={16} color="#666" style={styles.detailIcon} />}
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value || '-'}</Text>
    </View>
  );

  // 전화번호가 있는 상세 항목 컴포넌트
  const PhoneDetailItem = ({ label, value, icon = "call-outline" }) => (
    <View style={styles.detailItem}>
      <View style={styles.detailRow}>
        <Ionicons name={icon} size={16} color="#666" style={styles.detailIcon} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <View style={styles.phoneRow}>
        <Text style={styles.detailValue}>{value || '-'}</Text>
        {value && value !== '-' && (
          <TouchableOpacity 
            style={styles.phoneButton} 
            onPress={() => handlePhoneCall(value)}
          >
            <Ionicons name="call" size={14} color="#FFFFFF" />
            <Text style={styles.phoneButtonText}>전화</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // 섹션 헤더 컴포넌트
  const SectionHeader = ({ title, icon }) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={24} color="#2196F3" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>배송 상세정보</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 상태 배지 */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
            <Text style={styles.statusText}>{getStatusText(delivery.status)}</Text>
          </View>
          {delivery.trackingNumber && (
            <Text style={styles.trackingNumber}>배송번호: {delivery.trackingNumber}</Text>
          )}
        </View>

        {/* 취소 상태 표시 */}
        {(delivery.cancel_status === 1 || delivery.canceled_at || delivery.status === 'cancelled' || delivery.status === '배송취소') && (
          <View style={styles.cancelAlert}>
            <Ionicons name="warning" size={24} color="#F44336" />
            <View style={styles.cancelAlertContent}>
              <Text style={styles.cancelAlertTitle}>배송이 취소되었습니다</Text>
              {delivery.canceled_at && (
                <Text style={styles.cancelAlertText}>
                  취소일시: {new Date(delivery.canceled_at).toLocaleString('ko-KR')}
                </Text>
              )}
              {delivery.cancel_reason && (
                <Text style={styles.cancelAlertText}>
                  취소사유: {delivery.cancel_reason}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* 고객 정보 섹션 */}
        <View style={styles.section}>
          <SectionHeader title="고객 정보" icon="person-outline" />
          <DetailItem 
            label="고객명" 
            value={delivery.customerName || delivery.receiver_name} 
            icon="person"
          />
          <PhoneDetailItem 
            label="연락처" 
            value={delivery.customerPhone || delivery.receiver_phone} 
          />
          <View style={styles.addressContainer}>
            <DetailItem 
              label="배송 주소" 
              value={delivery.customerAddress || delivery.receiver_address} 
              icon="location"
            />
            {(delivery.customerAddress || delivery.receiver_address) && (
              <TouchableOpacity style={styles.copyAddressButton} onPress={handleCopyAddress}>
                <Ionicons name="copy-outline" size={16} color="#2196F3" />
                <Text style={styles.copyAddressText}>주소 복사</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 기본 정보 섹션 */}
        <View style={styles.section}>
          <SectionHeader title="기본 정보" icon="information-circle-outline" />
          <DetailItem label="의뢰타입" value={delivery.requestType || '일반'} icon="list" />
          <DetailItem label="시공유형" value={delivery.constructionType} icon="construct" />
          <DetailItem label="방문일" value={delivery.visitDate} icon="calendar" />
          <DetailItem label="방문시간" value={delivery.visitTime} icon="time" />
          <DetailItem label="가구사" value={delivery.furnitureCompany} icon="business" />
          {delivery.mainMemo && (
            <DetailItem label="주요메모" value={delivery.mainMemo} icon="document-text" />
          )}
          {delivery.emergencyContact && (
            <PhoneDetailItem 
              label="비상연락망" 
              value={delivery.emergencyContact}
              icon="call"
            />
          )}
        </View>

        {/* 현장 정보(방문지) 섹션 - 접힘/펼침 가능 */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.collapsibleHeader} 
            onPress={() => setIsBuildingInfoExpanded(!isBuildingInfoExpanded)}
          >
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="business-outline" size={24} color="#2196F3" />
              <Text style={styles.sectionTitle}>현장 정보(방문지)</Text>
            </View>
            <Ionicons 
              name={isBuildingInfoExpanded ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
          
          {isBuildingInfoExpanded && (
            <View style={styles.collapsibleContent}>
              <DetailItem label="건물형태" value={delivery.buildingType} icon="home" />
              <DetailItem label="층수" value={delivery.floorCount} icon="layers" />
              <DetailItem 
                label="엘리베이터" 
                value={delivery.elevatorAvailable ? '사용가능' : '사용불가'} 
                icon="arrow-up"
              />
              <DetailItem 
                label="사다리차" 
                value={delivery.ladderTruck ? '필요' : '불필요'} 
                icon="car"
              />
              <DetailItem 
                label="폐기물처리" 
                value={delivery.disposal ? '필요' : '불필요'} 
                icon="trash"
              />
            </View>
          )}
        </View>

        {/* 상품 정보 섹션 */}
        <View style={styles.section}>
          <SectionHeader title="상품 정보" icon="cube-outline" />
          
          {loadingProducts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.loadingText}>상품 정보를 불러오는 중...</Text>
            </View>
          ) : products.length > 0 ? (
            <View style={styles.productsContainer}>
              {products.map((product, index) => (
                <View key={product.id || index} style={styles.productItem}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>
                      {product.product_name || `상품 ${index + 1}`}
                    </Text>
                    <Text style={styles.productCode}>
                      {product.product_code || '-'}
                    </Text>
                  </View>
                  <View style={styles.productDetails}>
                    <DetailItem label="크기" value={product.product_size} />
                    <DetailItem label="무게" value={product.product_weight} />
                    <DetailItem label="박스크기" value={product.box_size} />
                  </View>
                </View>
              ))}
              <View style={styles.productsSummary}>
                <Text style={styles.productsSummaryText}>
                  총 {products.length}개 상품
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noProductsContainer}>
              <Ionicons name="cube-outline" size={48} color="#CCC" />
              <Text style={styles.noProductsText}>등록된 상품이 없습니다</Text>
            </View>
          )}
        </View>

        {/* 추가 정보 섹션 */}
        {(delivery.specialInstructions || delivery.driverNotes || delivery.detail_notes) && (
          <View style={styles.section}>
            <SectionHeader title="추가 정보" icon="document-text-outline" />
            {delivery.specialInstructions && (
              <DetailItem 
                label="특별지시사항" 
                value={delivery.specialInstructions} 
                icon="alert-circle"
              />
            )}
            {delivery.driverNotes && (
              <DetailItem 
                label="기사 메모" 
                value={delivery.driverNotes} 
                icon="create"
              />
            )}
            {delivery.detail_notes && (
              <DetailItem 
                label="상세 메모" 
                value={delivery.detail_notes} 
                icon="document"
              />
            )}
          </View>
        )}

        {/* 배송 완료 정보 (완료된 경우만) */}
        {(delivery.status === 'delivered' || delivery.status === '배송완료') && (
          <View style={styles.section}>
            <SectionHeader title="배송 완료 정보" icon="checkmark-circle-outline" />
            {delivery.actual_delivery && (
              <DetailItem 
                label="완료일시" 
                value={new Date(delivery.actual_delivery).toLocaleString('ko-KR')} 
                icon="time"
              />
            )}
            {delivery.completion_notes && (
              <DetailItem 
                label="완료 메모" 
                value={delivery.completion_notes} 
                icon="document-text"
              />
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  trackingNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  cancelAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  cancelAlertContent: {
    flex: 1,
    marginLeft: 10,
  },
  cancelAlertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 5,
  },
  cancelAlertText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  detailItem: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
    lineHeight: 22,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  phoneButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addressContainer: {
    position: 'relative',
  },
  copyAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    gap: 4,
  },
  copyAddressText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  productsContainer: {
    gap: 15,
  },
  productItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  productCode: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  productDetails: {
    gap: 8,
  },
  productsSummary: {
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  productsSummaryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  noProductsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noProductsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  bottomPadding: {
    height: 30,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapsibleContent: {
    paddingTop: 20,
  },
});

export default UserDeliveryDetailScreen;