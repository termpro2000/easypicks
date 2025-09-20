import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const DeliveryListScreen = ({ navigation }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    loadUserInfo();
    fetchDeliveries();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userInfoString = await AsyncStorage.getItem('user_info');
      if (userInfoString) {
        setUserInfo(JSON.parse(userInfoString));
      }
    } catch (error) {
      console.log('사용자 정보 로드 오류:', error);
    }
  };

  const generateExtendedDummyData = () => {
    const data = [
      {
        id: 1,
        tracking_number: 'MK202401001',
        customerName: '김철수',
        customerPhone: '010-1234-5678',
        customerAddress: '서울시 강남구 테헤란로 123, 101동 502호',
        assignedDriver: '이기사',
        assignmentTime: '09:30',
        status: 'pending',
        requestType: '새가구 배송',
        constructionType: '조립 설치',
        shipmentType: '직배송',
        visitDate: '2024-01-15',
        visitTime: '14:00-16:00',
        furnitureCompany: '한샘가구',
        emergencyContact: '010-9999-8888',
        warehouseInfo: '김포물류센터',
        orderGuidance: '완료',
        preNotification: '필요',
        buildingType: '아파트',
        floorCount: '5층',
        elevatorAvailable: '있음',
        stairMovement: '불필요',
        ladderTruck: '불필요',
        disposal: '없음',
        roomMovement: '거실→침실',
        wallConstruction: '벽걸이 TV',
        tollgateCost: '5,000원',
        mainMemo: '조심스럽게 운반 요청',
        happyCallMemo: '고객 매우 만족',
        productInfo: '침실세트 (침대, 옷장, 화장대)',
        furnitureRequest: '스크래치 주의',
        driverMemo: '주차 어려움'
      },
      {
        id: 2,
        tracking_number: 'MK202401002',
        customerName: '박영희',
        customerPhone: '010-2345-6789',
        customerAddress: '부산시 해운대구 마린시티 456, 202호',
        assignedDriver: '박기사',
        assignmentTime: '10:15',
        status: 'completed',
        requestType: '중고가구 교체',
        constructionType: '해체 후 설치',
        shipmentType: '택배배송',
        visitDate: '2024-01-15',
        visitTime: '10:00-12:00',
        furnitureCompany: '이케아',
        emergencyContact: '010-8888-7777',
        warehouseInfo: '부산물류센터',
        orderGuidance: '완료',
        preNotification: '완료',
        buildingType: '오피스텔',
        floorCount: '15층',
        elevatorAvailable: '있음',
        stairMovement: '불필요',
        ladderTruck: '불필요',
        disposal: '기존가구 폐기',
        roomMovement: '현관→거실',
        wallConstruction: '없음',
        tollgateCost: '0원',
        mainMemo: '기존 가구 처리 필요',
        happyCallMemo: '시간 준수 요청',
        productInfo: '소파 3인용',
        furnitureRequest: '포장재 정리',
        driverMemo: '엘베 사용 가능'
      },
      {
        id: 3,
        tracking_number: 'MK202401003',
        customerName: '최민수',
        customerPhone: '010-3456-7890',
        customerAddress: '대구시 수성구 동대구로 789, 빌라 3층',
        assignedDriver: '김기사',
        assignmentTime: '11:00',
        status: 'pending',
        requestType: '새가구 배송',
        constructionType: '조립 설치',
        shipmentType: '직배송',
        visitDate: '2024-01-15',
        visitTime: '16:00-18:00',
        furnitureCompany: '시디즈',
        emergencyContact: '010-7777-6666',
        warehouseInfo: '대구물류센터',
        orderGuidance: '대기중',
        preNotification: '필요',
        buildingType: '빌라',
        floorCount: '3층',
        elevatorAvailable: '없음',
        stairMovement: '필요',
        ladderTruck: '불필요',
        disposal: '없음',
        roomMovement: '현관→서재',
        wallConstruction: '없음',
        tollgateCost: '0원',
        mainMemo: '계단 이용, 무게 주의',
        happyCallMemo: '배송 전 연락 요청',
        productInfo: '사무용 의자',
        furnitureRequest: '조립 설명서 전달',
        driverMemo: '좁은 계단'
      },
      {
        id: 4,
        tracking_number: 'MK202401004',
        customerName: '정수진',
        customerPhone: '010-4567-8901',
        customerAddress: '인천시 남동구 구월로 321, 101동 201호',
        assignedDriver: '홍기사',
        assignmentTime: '13:30',
        status: 'completed',
        requestType: '수리 서비스',
        constructionType: '수리',
        shipmentType: '서비스출장',
        visitDate: '2024-01-15',
        visitTime: '13:00-15:00',
        furnitureCompany: '까사미아',
        emergencyContact: '010-6666-5555',
        warehouseInfo: '서비스센터',
        orderGuidance: '완료',
        preNotification: '완료',
        buildingType: '아파트',
        floorCount: '10층',
        elevatorAvailable: '있음',
        stairMovement: '불필요',
        ladderTruck: '불필요',
        disposal: '없음',
        roomMovement: '거실 내',
        wallConstruction: '없음',
        tollgateCost: '3,000원',
        mainMemo: '문짝 교체 작업',
        happyCallMemo: '만족도 높음',
        productInfo: '수납장 문짝',
        furnitureRequest: '색상 매칭 확인',
        driverMemo: '작업 완료'
      },
      {
        id: 5,
        tracking_number: 'MK202401005',
        customerName: '윤재호',
        customerPhone: '010-5678-9012',
        customerAddress: '광주시 서구 상무대로 654, 상가 1층',
        assignedDriver: '조기사',
        assignmentTime: '14:45',
        status: 'pending',
        requestType: '사무용가구',
        constructionType: '조립 설치',
        shipmentType: '직배송',
        visitDate: '2024-01-15',
        visitTime: '15:00-17:00',
        furnitureCompany: '퍼시스',
        emergencyContact: '010-5555-4444',
        warehouseInfo: '광주물류센터',
        orderGuidance: '진행중',
        preNotification: '필요',
        buildingType: '상가',
        floorCount: '1층',
        elevatorAvailable: '없음',
        stairMovement: '불필요',
        ladderTruck: '필요',
        disposal: '기존책상 폐기',
        roomMovement: '입구→사무실',
        wallConstruction: '모니터 거치대',
        tollgateCost: '0원',
        mainMemo: '사무실 레이아웃 변경',
        happyCallMemo: '시간 조율 필요',
        productInfo: '사무용 책상, 의자 세트',
        furnitureRequest: '배선 정리 도움',
        driverMemo: '사다리차 예약됨'
      }
    ];
    
    return data.map(item => ({
      ...item,
      created_at: selectedDate.toISOString()
    }));
  };

  const fetchDeliveries = async () => {
    try {
      const dummyData = generateExtendedDummyData();
      setDeliveries(dummyData);
      
      const totalCount = dummyData.length;
      const completedCount = dummyData.filter(item => item.status === 'completed').length;
      setStats({ total: totalCount, completed: completedCount });
    } catch (error) {
      console.log('배송목록 조회 오류:', error);
      Alert.alert('오류', '배송목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const changeDateBy = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    setLoading(true);
    fetchDeliveries();
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveries();
    setRefreshing(false);
  };


  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: async () => {
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('user_info');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return '배송 대기';
      case 'in_transit':
        return '배송 중';
      case 'delivered':
        return '배송 완료';
      case 'cancelled':
        return '취소';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'in_transit':
        return '#2196F3';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const navigateToDetail = (delivery) => {
    navigation.navigate('DeliveryDetail', { delivery });
  };

  const renderDeliveryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.deliveryCard}
      onPress={() => navigateToDetail(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.customerAddress}>{item.customerAddress}</Text>
      
      <View style={styles.cardFooter}>
        <Text style={styles.driverInfo}>
          기사: {item.assignedDriver}
        </Text>
        <Text style={styles.assignmentTime}>
          배정시간: {item.assignmentTime}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>배송목록을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.companyName}>미래코리아</Text>
        <View style={styles.headerSpacer}>
          {userInfo && (
            <Text style={styles.userName}>{userInfo.name || userInfo.user_id}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.dateNavigation}>
        <TouchableOpacity 
          style={styles.dateArrow}
          onPress={() => changeDateBy(-1)}
        >
          <Text style={styles.dateArrowText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        <TouchableOpacity 
          style={styles.dateArrow}
          onPress={() => changeDateBy(1)}
        >
          <Text style={styles.dateArrowText}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>전체건수</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>완료건수</Text>
        </View>
      </View>
      
      <FlatList
        data={deliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>배송할 목록이 없습니다.</Text>
          </View>
        }
      />
    </View>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1976D2',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 36,
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  dateNavigation: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateArrow: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  dateArrowText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  listContainer: {
    padding: 15,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  customerAddress: {
    fontSize: 15,
    color: '#555',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  driverInfo: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  assignmentTime: {
    fontSize: 13,
    color: '#666',
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default DeliveryListScreen;