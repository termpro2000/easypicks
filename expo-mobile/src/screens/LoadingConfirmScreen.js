import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const LoadingConfirmScreen = ({ route, navigation }) => {
  const { selectedDate, deliveriesData } = route.params || {};
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  
  const [selectedBranch, setSelectedBranch] = useState('전체');
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false); // 기본값을 false로 변경
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalBoxes, setTotalBoxes] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]); // 체크박스로 선택된 항목들

  useEffect(() => {
    loadUserInfo();
    // 전달받은 로컬 배송 데이터가 있으면 사용
    if (deliveriesData && deliveriesData.length > 0) {
      console.log('상차화면: 전달받은 로컬 데이터 사용:', deliveriesData.length, '개');
      loadDeliveriesFromLocal(deliveriesData);
    } else {
      // 로컬 데이터가 없으면 기존 방식으로 백엔드에서 가져오기
      console.log('상차화면: 로컬 데이터가 없어 백엔드에서 가져오기');
      loadSelectedDate();
    }
  }, []);

  // 화면이 포커스될 때마다 날짜를 새로 로드 (로컬 데이터가 없을 때만)
  useFocusEffect(
    useCallback(() => {
      if (!deliveriesData || deliveriesData.length === 0) {
        loadSelectedDate();
      }
    }, [])
  );

  useEffect(() => {
    // 로컬 데이터가 없을 때만 백엔드에서 가져오기
    if (currentDate && (!deliveriesData || deliveriesData.length === 0)) {
      fetchDeliveries();
    }
  }, [currentDate, selectedBranch]);

  const loadSelectedDate = async () => {
    try {
      const storedDate = await AsyncStorage.getItem('selectedDeliveryDate');
      if (storedDate) {
        const parsedDate = new Date(storedDate);
        const dateString = parsedDate.toISOString().split('T')[0];
        setCurrentDate(parsedDate);
        console.log('상차화면: 포커스 시 저장된 날짜 로드:', dateString);
      } else {
        console.log('상차화면: 저장된 날짜가 없어서 오늘 날짜 사용');
        setCurrentDate(new Date());
      }
    } catch (error) {
      console.error('상차화면: 날짜 로드 오류:', error);
      setCurrentDate(new Date());
    }
  };

  const loadUserInfo = async () => {
    try {
      const userInfoData = await AsyncStorage.getItem('user_info');
      if (userInfoData) {
        setUserInfo(JSON.parse(userInfoData));
      }
    } catch (error) {
      console.error('상차화면: 사용자 정보 로드 오류:', error);
    }
  };

  // 로컬 배송 데이터를 상차 형식으로 변환하는 함수
  const loadDeliveriesFromLocal = (localDeliveries) => {
    console.log('상차화면: 로컬 데이터 변환 시작');
    
    // 배송목록에서 받은 데이터를 상차 형식으로 변환
    const loadingDeliveries = localDeliveries.map(delivery => ({
      id: delivery.id,
      tracking_number: delivery.trackingNumber,
      customer_name: delivery.customerName,
      product_name: delivery.productInfo || delivery.furnitureRequest || '가구',
      visit_time: delivery.visitTime || delivery.assignmentTime,
      status: delivery.status,
      request_type: delivery.requestType,
      loaded: delivery.status === '상차완료' || 
              delivery.status === 'in_delivery' || 
              delivery.status === 'in_collection' || 
              delivery.status === 'in_processing'
    }));

    console.log('상차화면: 변환된 데이터:', loadingDeliveries.length, '개');
    console.log('상차화면: 첫 번째 변환 데이터:', loadingDeliveries[0]);

    setDeliveries(loadingDeliveries);
    calculateStats(loadingDeliveries);
    setLoading(false);
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      console.log('상차화면: API 요청 시작');
      
      const response = await api.get('/deliveries');
      
      console.log('상차화면: API 응답 성공');

      if (response.data && response.data.deliveries) {
        let allDeliveries = response.data.deliveries || [];
        
        console.log('상차화면: 전체 배송 데이터 수:', allDeliveries.length);
        console.log('상차화면: 첫 번째 배송 데이터:', allDeliveries[0]);

        // 날짜 필터링 - visit_date 필드와 비교 (시간 부분 제거)
        let filteredDeliveries = allDeliveries;
        if (currentDate) {
          const selectedDateString = currentDate.toISOString().split('T')[0];
          console.log('상차화면: 선택된 날짜:', selectedDateString);
          
          filteredDeliveries = allDeliveries.filter(delivery => {
            if (!delivery.visit_date) return false;
            // 시간 부분 제거하고 날짜만 비교
            const deliveryDateString = delivery.visit_date.split('T')[0];
            console.log('상차화면: 배송 날짜 비교:', deliveryDateString, 'vs', selectedDateString);
            return deliveryDateString === selectedDateString;
          });
          
          console.log('상차화면: 날짜 필터링 후 데이터 수:', filteredDeliveries.length);
        }

        // 지점 필터링
        if (selectedBranch !== '전체') {
          filteredDeliveries = filteredDeliveries.filter(delivery => 
            delivery.branch === selectedBranch
          );
        }

        // 상차용 데이터 변환 - 필요한 필드만 추출
        const loadingDeliveries = filteredDeliveries.map(delivery => ({
          id: delivery.id,
          tracking_number: delivery.tracking_number,
          customer_name: delivery.customer_name,
          product_name: delivery.product_name,
          visit_time: delivery.visit_time,
          status: delivery.status,
          loaded: false // 상차 상태 초기화
        }));

        console.log('상차화면: 최종 상차 데이터 수:', loadingDeliveries.length);
        console.log('상차화면: 첫 번째 상차 데이터:', loadingDeliveries[0]);

        setDeliveries(loadingDeliveries);
        calculateStats(loadingDeliveries);
      } else {
        console.log('상차화면: API 응답이 성공적이지 않음');
        setDeliveries([]);
      }
    } catch (error) {
      console.error('상차화면: 배송 목록 조회 오류:', error);
      console.error('상차화면: 오류 세부사항:', error.message);
      Alert.alert('네트워크 오류', `배송 목록을 불러올 수 없습니다.\n오류: ${error.message}`);
      // 빈 배열로 설정하여 앱이 계속 작동하도록 함
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (deliveryList) => {
    let boxes = 0;
    let volume = 0;
    let loaded = 0;

    deliveryList.forEach(delivery => {
      if (delivery.loaded) {
        loaded++;
      }
      // 박스 수와 부피 계산 (임시 데이터)
      boxes += 1;
      volume += parseFloat(delivery.weight || 0);
    });

    setLoadedCount(loaded);
    setTotalBoxes(boxes);
    setTotalVolume(volume);
  };


  const formatDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 체크박스 선택/해제
  const toggleItemSelection = (deliveryId) => {
    setSelectedItems(prevSelected => {
      const isSelected = prevSelected.includes(deliveryId);
      if (isSelected) {
        return prevSelected.filter(id => id !== deliveryId);
      } else {
        return [...prevSelected, deliveryId];
      }
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    const allIds = deliveries.map(item => item.id);
    
    if (selectedItems.length === allIds.length) {
      // 전체 해제
      setSelectedItems([]);
    } else {
      // 전체 선택 (모든 항목)
      setSelectedItems(allIds);
    }
  };

  // 선택된 항목들 일괄 상차
  const handleBatchLoad = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('알림', '상차할 항목을 선택해주세요.');
      return;
    }

    // 선택된 항목들의 상태를 로컬에서 먼저 변경
    const updatedDeliveries = deliveries.map(delivery => {
      if (selectedItems.includes(delivery.id)) {
        // 상차 상태로 변경 및 status를 배송중으로 변경
        return { ...delivery, loaded: true, status: 'in_delivery' };
      }
      return delivery;
    });

    setDeliveries(updatedDeliveries);

    // 카운트 업데이트 - 선택된 항목 중 아직 상차되지 않은 것들만 카운트에 추가
    const unloadedSelectedCount = selectedItems.filter(id => {
      const item = deliveries.find(d => d.id === id);
      return item && !item.loaded && item.status !== 'in_delivery';
    }).length;

    setLoadedCount(prev => prev + unloadedSelectedCount);

    // 선택된 항목들만 서버에 업데이트
    try {
      console.log('선택상차: 선택된 항목들의 status를 서버에 반영');

      const selectedUpdatePromises = selectedItems.map(async (itemId) => {
        try {
          const response = await api.patch(`/deliveries/${itemId}/status`, {
            status: 'in_delivery'
          });
          console.log(`배송 ${itemId} 상차완료 업데이트 성공:`, response.data);
          return { id: itemId, success: true };
        } catch (error) {
          console.error(`배송 ${itemId} 상차완료 업데이트 실패:`, error);
          return { id: itemId, success: false };
        }
      });

      const results = await Promise.all(selectedUpdatePromises);
      const successCount = results.filter(r => r.success).length;
      
      if (successCount === selectedItems.length) {
        // 배송목록 화면에도 상태 변경 알림
        try {
          const statusUpdates = selectedItems.map(itemId => ({ 
            id: itemId, 
            status: 'in_delivery' 
          }));
          
          await AsyncStorage.setItem('updatedDeliveryStatus', JSON.stringify({
            updates: statusUpdates,
            timestamp: Date.now()
          }));
          console.log('배송목록 업데이트 정보 저장됨:', statusUpdates);
        } catch (error) {
          console.error('AsyncStorage 저장 오류:', error);
        }
        
        console.log(`선택상차 완료: ${selectedItems.length}개 항목이 상차완료로 업데이트되었습니다.`);
      } else {
        Alert.alert('부분 완료', `${successCount}/${selectedItems.length}개 항목이 업데이트되었습니다.`);
      }

    } catch (error) {
      console.error('선택상차 오류:', error);
      Alert.alert('오류', '상태 업데이트 중 오류가 발생했습니다.');
    }

    setSelectedItems([]);
  };

  // 선택된 항목들 일괄 하차
  const handleBatchUnload = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('알림', '하차할 항목을 선택해주세요.');
      return;
    }

    // 선택된 항목들의 상태를 로컬에서 먼저 변경
    const updatedDeliveries = deliveries.map(delivery => {
      if (selectedItems.includes(delivery.id)) {
        // 상차 상태 해제 및 status를 배차완료로 변경
        return { ...delivery, loaded: false, status: 'dispatch_completed' };
      }
      return delivery;
    });

    setDeliveries(updatedDeliveries);

    // 카운트 업데이트 - 선택된 항목 중 실제로 loaded 상태였던 것들만 카운트에서 차감
    const loadedSelectedCount = selectedItems.filter(id => {
      const item = deliveries.find(d => d.id === id);
      return item && item.loaded;
    }).length;

    setLoadedCount(prev => prev - loadedSelectedCount);

    // 선택된 항목들만 서버에 업데이트
    try {
      console.log('선택하차: 선택된 항목들의 status를 서버에 반영');

      const selectedUpdatePromises = selectedItems.map(async (itemId) => {
        try {
          const response = await api.patch(`/deliveries/${itemId}/status`, {
            status: 'dispatch_completed'
          });
          console.log(`배송 ${itemId} 미상차 업데이트 성공:`, response.data);
          return { id: itemId, success: true };
        } catch (error) {
          console.error(`배송 ${itemId} 미상차 업데이트 실패:`, error);
          return { id: itemId, success: false };
        }
      });

      const results = await Promise.all(selectedUpdatePromises);
      const successCount = results.filter(r => r.success).length;
      
      if (successCount === selectedItems.length) {
        // 배송목록 화면에도 상태 변경 알림
        try {
          const statusUpdates = selectedItems.map(itemId => ({ 
            id: itemId, 
            status: 'dispatch_completed' 
          }));
          
          await AsyncStorage.setItem('updatedDeliveryStatus', JSON.stringify({
            updates: statusUpdates,
            timestamp: Date.now()
          }));
          console.log('배송목록 업데이트 정보 저장됨:', statusUpdates);
        } catch (error) {
          console.error('AsyncStorage 저장 오류:', error);
        }
        
        console.log(`선택하차 완료: ${selectedItems.length}개 항목이 미상차로 업데이트되었습니다.`);
      } else {
        Alert.alert('부분 완료', `${successCount}/${selectedItems.length}개 항목이 업데이트되었습니다.`);
      }

    } catch (error) {
      console.error('선택하차 오류:', error);
      Alert.alert('오류', '상태 업데이트 중 오류가 발생했습니다.');
    }

    setSelectedItems([]);
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

  const getStatusText = (status, requestType) => {
    return getStatusTextByRequestType(status, requestType);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'order_received':
      case 'dispatch_completed':
      case 'delivery_postponed':
      case 'pending':
        return '#FF9800'; // 주황색 - 접수/대기 상태
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
        return '#4CAF50'; // 초록색 - 완료 상태
      case 'delivery_cancelled':
      case 'cancelled':
        return '#F44336'; // 빨간색 - 취소
      default:
        return '#9E9E9E'; // 회색 - 기타
    }
  };

  const renderDeliveryItem = ({ item }) => {
    const isSelected = selectedItems.includes(item.id);
    const isLoaded = item.loaded || 
                      item.status === 'in_delivery' || 
                      item.status === 'in_collection' || 
                      item.status === 'in_processing';
    const canSelect = true; // 모든 항목 선택 가능하도록 변경

    return (
      <TouchableOpacity 
        style={[
          styles.deliveryItem,
          isSelected && styles.selectedDeliveryItem,
          isLoaded && styles.loadedDeliveryItem
        ]}
        onPress={() => toggleItemSelection(item.id)}
        activeOpacity={0.7}
      >
        {/* 체크박스 */}
        <View style={styles.checkboxContainer}>
          <View style={[
            styles.checkbox,
            isSelected && styles.checkedCheckbox
          ]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </View>

        {/* 배송 정보 */}
        <View style={styles.deliveryInfo}>
          <Text style={styles.trackingNumber}>
            {item.tracking_number}
          </Text>
          <Text style={styles.customerName}>
            {item.customer_name}
          </Text>
          <Text style={styles.visitTime}>
            {item.visit_time}
          </Text>
          <Text style={styles.productName}>
            {item.product_name}
          </Text>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status, item.requestType || item.request_type)}</Text>
          </View>
        </View>

      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.companyName}>상차목록</Text>
        <View style={styles.headerSpacer}>
        </View>
      </View>

      {/* 날짜 섹션 */}
      <View style={styles.dateSection}>
        <Text style={styles.dateSectionText}>{formatDate(currentDate)}</Text>
      </View>

      {/* 통계 섹션 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{deliveries.length}</Text>
          <Text style={styles.statLabel}>전체</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{loadedCount}</Text>
          <Text style={styles.statLabel}>상차</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{deliveries.length - loadedCount}</Text>
          <Text style={styles.statLabel}>미상차</Text>
        </View>
      </View>

      {/* 지점 선택 */}
      <View style={styles.branchContainer}>
        <Picker
          selectedValue={selectedBranch}
          style={styles.branchPicker}
          onValueChange={(itemValue) => setSelectedBranch(itemValue)}
        >
          <Picker.Item label="전체" value="전체" />
          <Picker.Item label="고양점" value="고양점" />
          <Picker.Item label="하남점" value="하남점" />
          <Picker.Item label="이천점" value="이천점" />
        </Picker>
      </View>

      {/* 박스 수와 부피 정보 */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>박스수: {totalBoxes}개</Text>
        <Text style={styles.infoText}>부피: {totalVolume.toFixed(1)}kg</Text>
      </View>

      {/* 상차 항목 리스트 */}
      <FlatList
        data={deliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContainer, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      />
      
      {/* 선택 정보 및 버튼들 */}
      <View style={styles.bottomActions}>
        {/* 선택 정보 */}
        <View style={styles.selectionInfo}>
          <TouchableOpacity 
            style={styles.selectAllButton}
            onPress={toggleSelectAll}
          >
            <Text style={styles.selectAllText}>
              {selectedItems.length > 0 ? '전체해제' : '전체선택'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.selectionCount}>
            {selectedItems.length}개 선택됨
          </Text>
        </View>

        {/* 액션 버튼들 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.batchLoadButton]}
            onPress={handleBatchLoad}
            disabled={selectedItems.length === 0}
          >
            <Text style={styles.actionButtonText}>
              선택 상차 ({selectedItems.filter(id => {
                const item = deliveries.find(d => d.id === id);
                return item && !item.loaded && item.status !== 'in_delivery';
              }).length})
            </Text>
          </TouchableOpacity>
          
          <View style={styles.spacer} />
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.batchUnloadButton]}
            onPress={handleBatchUnload}
            disabled={selectedItems.length === 0}
          >
            <Text style={styles.actionButtonText}>
              선택 하차 ({selectedItems.filter(id => {
                const item = deliveries.find(d => d.id === id);
                return item && (item.loaded || item.status === 'in_delivery');
              }).length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  backButton: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  dateSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  dateSectionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 1,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    height: 40,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  branchContainer: {
    backgroundColor: '#fff',
    marginBottom: 5,
  },
  branchPicker: {
    height: 50,
    width: '100%',
  },
  infoContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  listContainer: {
    padding: 10,
    paddingBottom: 360,
  },
  deliveryItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deliveryInfo: {
    flex: 1,
  },
  trackingNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 13,
    color: '#2196F3',
    marginBottom: 2,
  },
  visitTime: {
    fontSize: 12,
    color: '#FF9800',
    marginBottom: 2,
    fontWeight: '600',
  },
  address: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  productName: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  loadedStatus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '800',
    marginTop: 2,
  },
  // 체크박스 관련 스타일
  checkboxContainer: {
    paddingRight: 10,
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkedCheckbox: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  disabledCheckbox: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // 선택된 항목 스타일
  selectedDeliveryItem: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  loadedDeliveryItem: {
    backgroundColor: '#f0f8ff',
    opacity: 0.8,
  },
  loadedText: {
    color: '#666',
    textDecorationLine: 'line-through',
  },

  // 개별 버튼 스타일
  individualButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  individualButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // 하단 액션 영역
  bottomActions: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: -150,
    marginBottom: 50,
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectAllButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  selectAllText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  selectionCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  batchLoadButton: {
    backgroundColor: '#FF9800',
  },
  batchUnloadButton: {
    backgroundColor: '#FF5722',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoadingConfirmScreen;