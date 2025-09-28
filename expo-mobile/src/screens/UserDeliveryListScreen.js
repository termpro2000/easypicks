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
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import api from '../config/api';

const UserDeliveryListScreen = ({ navigation }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState({ total: 0, completed: 0 });
  const [slideMenuVisible, setSlideMenuVisible] = useState(false);
  const [slideAnimation] = useState(new Animated.Value(Dimensions.get('window').width));

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


  const fetchDeliveries = async () => {
    try {
      // 사용자 정보 새로고침
      const userInfoString = await AsyncStorage.getItem('user_info');
      const currentUserInfo = userInfoString ? JSON.parse(userInfoString) : null;
      
      let apiUrl = '/deliveries';
      if (currentUserInfo?.id) {
        // partner_id로 필터링
        apiUrl = `/deliveries?partner_id=${currentUserInfo.id}`;
      }
      
      console.log('📡 사용자 배송목록 API 호출:', {
        url: apiUrl,
        userInfo: currentUserInfo ? { id: currentUserInfo.id, name: currentUserInfo.name } : null
      });
      
      const response = await api.get(apiUrl);
      console.log('API 응답:', response.data);
      
      if (response.data.deliveries) {
        const deliveriesData = response.data.deliveries
          .map(delivery => ({
            id: delivery.id,
            trackingNumber: delivery.tracking_number,
            customerName: delivery.customer_name || delivery.receiver_name,
            customerPhone: delivery.customer_phone || delivery.receiver_phone,
            customerAddress: delivery.customer_address || delivery.receiver_address,
            status: delivery.status,
            requestType: delivery.request_type,
            constructionType: delivery.construction_type,
            visitDate: delivery.visit_date,
            visitTime: delivery.visit_time,
            actual_delivery: delivery.actual_delivery,
            productInfo: delivery.product_name,
            senderName: delivery.sender_name,
            senderAddress: delivery.sender_address,
            mainMemo: delivery.main_memo,
            driverName: delivery.driver_name,
            createdAt: delivery.created_at,
            updatedAt: delivery.updated_at
          }));
        
        console.log('배송 개수:', deliveriesData.length);
        
        const sortedDeliveries = deliveriesData.sort((a, b) => {
          const statusPriority = {
            '접수완료': 1,
            '배차완료': 2,
            '배송중': 3,
            '배송완료': 4,
            '배송취소': 5,
            '배송연기': 5
          };
          
          const priorityA = statusPriority[a.status] || 3;
          const priorityB = statusPriority[b.status] || 3;
          
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
        
        setDeliveries(sortedDeliveries);
        
        const totalCount = sortedDeliveries.length;
        const completedCount = deliveriesData.filter(item => 
          item.status === '배송완료' || 
          item.status === '수거완료' || 
          item.status === '조처완료'
        ).length;
        setStats({ total: totalCount, completed: completedCount });
      } else {
        setDeliveries([]);
        setStats({ total: 0, completed: 0 });
      }
    } catch (error) {
      console.log('배송목록 조회 오류:', error);
      setDeliveries([]);
      setStats({ total: 0, completed: 0 });
    } finally {
      setLoading(false);
    }
  };


  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveries();
    setRefreshing(false);
  };

  const openSlideMenu = () => {
    setSlideMenuVisible(true);
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSlideMenu = () => {
    Animated.timing(slideAnimation, {
      toValue: Dimensions.get('window').width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSlideMenuVisible(false);
    });
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
            try {
              await AsyncStorage.removeItem('auth_token');
              await AsyncStorage.removeItem('user_info');
              
              console.log('로그아웃 완료 - 토큰 및 사용자 정보 제거됨');
              
              if (global.logout) {
                global.logout();
              }
              
            } catch (error) {
              console.error('로그아웃 처리 중 오류:', error);
              Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '접수완료':
        return '#FF9800';
      case '배차완료':
        return '#2196F3';
      case '배송중':
        return '#03A9F4';
      case '배송완료':
      case '수거완료':
      case '조처완료':
        return '#4CAF50';
      case '배송취소':
        return '#F44336';
      case '배송연기':
        return '#FFC107';
      default:
        return '#9E9E9E';
    }
  };

  const navigateToDetail = (delivery) => {
    console.log('배송 상세로 이동:', delivery.id, delivery.trackingNumber);
    console.log('전달할 delivery 객체:', JSON.stringify(delivery, null, 2));
    navigation.navigate('UserDeliveryDetail', { delivery });
  };

  const renderDeliveryItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={[
          styles.deliveryCard,
          {
            borderLeftColor: getStatusColor(item.status),
            borderLeftWidth: 6,
          }
        ]}
        onPress={() => navigateToDetail(item)}
      >
        <View style={styles.cardContent}>
          <View style={styles.trackingInfo}>
            <Text style={styles.trackingNumber}>{item.trackingNumber}</Text>
            <Text style={styles.requestType}>{item.requestType || '일반'}</Text>
          </View>
          
          <View style={styles.cardHeader}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          
          <Text style={styles.customerAddress}>{item.customerAddress}</Text>
          
          <View style={styles.dateTimeContainer}>
            <Text style={styles.visitDateTime}>
              방문: {(() => {
                const date = item.visitDate || '';
                const displayDate = date ? date.split('T')[0] : '-';
                
                const time = item.visitTime || '';
                let displayTime = '';
                if (time) {
                  const timeParts = time.split(':');
                  if (timeParts.length >= 2) {
                    displayTime = `${timeParts[0]}:${timeParts[1]}`;
                  } else {
                    displayTime = time.substring(0, 5);
                  }
                }
                
                return displayTime ? `${displayDate} ${displayTime}` : displayDate;
              })()}
            </Text>
            
            {item.actual_delivery && (
              <Text style={styles.actionDateTime}>
                처리: {(() => {
                  let datetime;
                  
                  if (typeof item.actual_delivery === 'number') {
                    datetime = new Date(item.actual_delivery * 1000);
                  } else if (typeof item.actual_delivery === 'string') {
                    if (item.actual_delivery.includes('T')) {
                      datetime = new Date(item.actual_delivery);
                    } else if (item.actual_delivery.includes(' ')) {
                      datetime = new Date(item.actual_delivery.replace(' ', 'T'));
                    } else {
                      datetime = new Date(item.actual_delivery);
                    }
                  } else {
                    return item.actual_delivery;
                  }
                  
                  if (isNaN(datetime.getTime())) {
                    return item.actual_delivery;
                  }
                  
                  const displayDate = datetime.toLocaleDateString('ko-KR');
                  const displayTime = datetime.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  });
                  
                  return `${displayDate} ${displayTime}`;
                })()}
              </Text>
            )}
          </View>
          
          <View style={styles.additionalInfo}>
            <Text style={styles.productInfo}>상품: {item.productInfo || '-'}</Text>
            {item.driverName && (
              <Text style={styles.driverInfo}>기사: {item.driverName}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
        <View style={styles.headerSpacer}>
          {userInfo && (
            <Text style={styles.userName}>{userInfo.name || userInfo.user_id}</Text>
          )}
        </View>
        <View style={styles.companyNameContainer}>
          <Text style={styles.companyName}>이지픽스</Text>
          <Text style={styles.versionText}>v{Updates.runtimeVersion || Constants.manifest?.version || '1.2.1'}</Text>
        </View>
        <View style={styles.headerSpacer}>
          <TouchableOpacity style={styles.settingsButton} onPress={openSlideMenu}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      
      <FlatList
        data={deliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContainer, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
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
      
      <Modal
        visible={slideMenuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeSlideMenu}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            activeOpacity={1} 
            onPress={closeSlideMenu}
          />
          <Animated.View 
            style={[
              styles.slideMenu,
              { transform: [{ translateX: slideAnimation }] }
            ]}
          >
            <View style={styles.slideMenuHeader}>
              <Text style={styles.slideMenuTitle}>설정</Text>
              <TouchableOpacity onPress={closeSlideMenu}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.slideMenuContent}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setSlideMenuVisible(false);
                  navigation.navigate('AppInfo');
                }}
              >
                <Text style={styles.menuItemText}>📱 앱 정보</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  setSlideMenuVisible(false);
                  navigation.navigate('Profile');
                }}
              >
                <Text style={styles.menuItemText}>👤 사용자 프로필</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Text style={[styles.menuItemText, styles.logoutText]}>🚪 로그아웃</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1976D2',
  },
  companyNameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 2,
  },
  headerSpacer: {
    width: 36,
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingsIcon: {
    fontSize: 18,
    color: '#fff',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 80,
    minHeight: '100%',
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
  },
  trackingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  requestType: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
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
    marginBottom: 8,
    lineHeight: 20,
  },
  dateTimeContainer: {
    flexDirection: 'column',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  visitDateTime: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
    marginBottom: 2,
  },
  actionDateTime: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  additionalInfo: {
    flexDirection: 'column',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  productInfo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  driverInfo: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  cardContent: {
    flex: 1,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBackground: {
    flex: 1,
  },
  slideMenu: {
    width: Dimensions.get('window').width * 0.8,
    backgroundColor: '#fff',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'absolute',
    right: 0,
  },
  slideMenuHeader: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slideMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  slideMenuContent: {
    flex: 1,
    padding: 20,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  logoutText: {
    color: '#f44336',
  },
});

export default UserDeliveryListScreen;