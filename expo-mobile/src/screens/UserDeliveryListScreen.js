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
  const [expandedItems, setExpandedItems] = useState(new Set());

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

  const toggleStatusTimeline = (itemId) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(itemId)) {
      newExpandedItems.delete(itemId);
    } else {
      newExpandedItems.add(itemId);
    }
    setExpandedItems(newExpandedItems);
  };

  const DeliveryStatusTimeline = ({ currentStatus, createdAt, updatedAt, actual_delivery, requestType }) => {
    // request_type에 따른 타임라인 선택
    const getStatusSteps = (requestType) => {
      switch (requestType) {
        case '회수':
          // 기본옵션2: 접수완료,배차완료,수거중,수거완료
          return [
            { key: '접수완료', label: '접수완료', icon: '📝', color: '#FF9800' },
            { key: '배차완료', label: '배차완료', icon: '🚛', color: '#2196F3' },
            { key: '수거중', label: '수거중', icon: '📦', color: '#FF9800' },
            { key: '수거완료', label: '수거완료', icon: '✅', color: '#4CAF50' }
          ];
        case '조치':
          // 기본옵션3: 접수완료,배차완료,조처진행,조처완료
          return [
            { key: '접수완료', label: '접수완료', icon: '📝', color: '#FF9800' },
            { key: '배차완료', label: '배차완료', icon: '🚛', color: '#2196F3' },
            { key: '조처진행', label: '조처진행', icon: '🔧', color: '#FF9800' },
            { key: '조처완료', label: '조처완료', icon: '✅', color: '#4CAF50' }
          ];
        default:
          // 기본옵션1: 접수완료,배차완료,배송중,배송완료 (일반 및 기타)
          return [
            { key: '접수완료', label: '접수완료', icon: '📝', color: '#FF9800' },
            { key: '배차완료', label: '배차완료', icon: '🚛', color: '#2196F3' },
            { key: '배송중', label: '배송중', icon: '🚚', color: '#FF9800' },
            { key: '배송완료', label: '배송완료', icon: '✅', color: '#4CAF50' }
          ];
      }
    };

    const statusSteps = getStatusSteps(requestType);

    const currentIndex = statusSteps.findIndex(step => step.key === currentStatus);

    const formatDateTime = (dateTime) => {
      if (!dateTime) return null;
      
      let datetime;
      if (typeof dateTime === 'number') {
        datetime = new Date(dateTime * 1000);
      } else if (typeof dateTime === 'string') {
        if (dateTime.includes('T')) {
          datetime = new Date(dateTime);
        } else if (dateTime.includes(' ')) {
          datetime = new Date(dateTime.replace(' ', 'T'));
        } else {
          datetime = new Date(dateTime);
        }
      } else {
        return null;
      }
      
      if (isNaN(datetime.getTime())) {
        return null;
      }
      
      const displayDate = datetime.toLocaleDateString('ko-KR');
      const displayTime = datetime.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      return `${displayDate} ${displayTime}`;
    };

    return (
      <View style={styles.timelineContainer}>
        <Text style={styles.timelineTitle}>🔄 배송 진행상황</Text>
        
        {statusSteps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === statusSteps.length - 1;
          
          let stepTime = null;
          if (index === 0 && createdAt) {
            stepTime = formatDateTime(createdAt);
          } else if (index === currentIndex && actual_delivery) {
            stepTime = formatDateTime(actual_delivery);
          } else if (index === currentIndex && updatedAt) {
            stepTime = formatDateTime(updatedAt);
          }

          return (
            <View key={step.key} style={styles.timelineStep}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineCircle,
                  {
                    backgroundColor: isCompleted ? step.color : '#E0E0E0',
                    borderColor: isCurrent ? step.color : (isCompleted ? step.color : '#E0E0E0'),
                    borderWidth: isCurrent ? 3 : 2,
                  }
                ]}>
                  <Text style={[
                    styles.timelineIcon,
                    { color: isCompleted ? '#fff' : '#999' }
                  ]}>
                    {step.icon}
                  </Text>
                </View>
                
                {!isLast && (
                  <View style={[
                    styles.timelineLine,
                    { backgroundColor: isCompleted ? step.color : '#E0E0E0' }
                  ]} />
                )}
              </View>
              
              <View style={styles.timelineRight}>
                <Text style={[
                  styles.timelineLabel,
                  { 
                    color: isCompleted ? '#333' : '#999',
                    fontWeight: isCurrent ? 'bold' : 'normal'
                  }
                ]}>
                  {isCompleted ? '✓' : '○'} {step.label}
                </Text>
                
                {stepTime && (
                  <Text style={[
                    styles.timelineTime,
                    { color: isCurrent ? step.color : '#666' }
                  ]}>
                    {stepTime}
                  </Text>
                )}
                
                {!isCompleted && index === currentIndex + 1 && (
                  <Text style={styles.timelineWaiting}>
                    대기중
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
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
          
          {/* 배송상태 보기 토글 버튼 */}
          <TouchableOpacity 
            style={styles.statusToggleButton}
            onPress={(e) => {
              e.stopPropagation(); // 부모 TouchableOpacity 이벤트 방지
              toggleStatusTimeline(item.id);
            }}
          >
            <Text style={styles.statusToggleText}>📊 배송상태 보기</Text>
            <Text style={styles.statusToggleIcon}>
              {expandedItems.has(item.id) ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          {/* 수직 타임라인 (펼쳐졌을 때만 표시) */}
          {expandedItems.has(item.id) && (
            <DeliveryStatusTimeline 
              currentStatus={item.status}
              createdAt={item.createdAt}
              updatedAt={item.updatedAt}
              actual_delivery={item.actual_delivery}
              requestType={item.requestType}
            />
          )}
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
  
  // 배송상태 토글 버튼
  statusToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 8,
  },
  statusToggleText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginRight: 4,
  },
  statusToggleIcon: {
    fontSize: 12,
    color: '#2196F3',
  },
  
  // 수직 타임라인 컨테이너
  timelineContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  
  // 타임라인 스텝
  timelineStep: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineLeft: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  timelineIcon: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  timelineLine: {
    position: 'absolute',
    top: 28,
    width: 2,
    height: 20,
    left: 11,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 8,
    paddingTop: 2,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 11,
    fontWeight: '400',
  },
  timelineWaiting: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default UserDeliveryListScreen;