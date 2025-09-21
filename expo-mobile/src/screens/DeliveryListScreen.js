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
import DraggableFlatList from 'react-native-draggable-flatlist';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import api from '../config/api';

const DeliveryListScreen = ({ navigation }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({ total: 0, completed: 0 });
  const [orderMode, setOrderMode] = useState('auto'); // 'auto' | 'manual'
  const [slideMenuVisible, setSlideMenuVisible] = useState(false);
  const [slideAnimation] = useState(new Animated.Value(Dimensions.get('window').width));

  useEffect(() => {
    loadUserInfo();
    loadOrderMode(); // 저장된 배송순서 모드 로드
    fetchDeliveries();
    // 초기 날짜를 AsyncStorage에 저장
    saveInitialDate();
  }, []);

  const saveInitialDate = async () => {
    try {
      await AsyncStorage.setItem('selectedDeliveryDate', selectedDate.toISOString());
      console.log('배송화면: 초기 날짜 저장:', selectedDate.toISOString().split('T')[0]);
    } catch (error) {
      console.error('배송화면: 초기 날짜 저장 오류:', error);
    }
  };

  // selectedDate가 변경될 때마다 배송 목록 다시 조회
  useEffect(() => {
    if (selectedDate) {
      fetchDeliveries();
    }
  }, [selectedDate]);

  // orderMode 변경 시 배송목록 다시 정렬
  useEffect(() => {
    if (deliveries.length > 0) {
      const sortedDeliveries = applyOrderMode(deliveries);
      setDeliveries(sortedDeliveries);
    }
  }, [orderMode]);

  // 상차 상태 업데이트 감지
  useEffect(() => {
    const checkForStatusUpdates = async () => {
      try {
        const updateInfo = await AsyncStorage.getItem('updatedDeliveryStatus');
        if (updateInfo) {
          const data = JSON.parse(updateInfo);
          
          // 1분 이내의 업데이트만 처리 (중복 처리 방지)
          if (Date.now() - data.timestamp < 60000) {
            // 새로운 구조와 기존 구조 모두 지원
            let updates = [];
            if (data.updates) {
              // 새로운 구조 (여러 상태 업데이트)
              updates = data.updates;
              console.log('배송목록: 상차 업데이트 감지됨 (새 구조):', updates);
            } else if (data.ids && data.status) {
              // 기존 구조 (단일 상태 업데이트)
              updates = data.ids.map(id => ({ id, status: data.status }));
              console.log('배송목록: 상차 업데이트 감지됨 (기존 구조):', data.ids, data.status);
            }
            
            // 로컬 상태 업데이트
            setDeliveries(prevDeliveries => 
              prevDeliveries.map(delivery => {
                const updateItem = updates.find(update => update.id === delivery.id);
                if (updateItem) {
                  return { ...delivery, status: updateItem.status };
                }
                return delivery;
              })
            );
            
            // 업데이트 정보 삭제
            await AsyncStorage.removeItem('updatedDeliveryStatus');
          }
        }
      } catch (error) {
        console.error('상태 업데이트 확인 오류:', error);
      }
    };

    // 화면이 포커스될 때마다 확인
    const unsubscribe = navigation.addListener('focus', checkForStatusUpdates);
    
    // 컴포넌트 마운트 시에도 확인
    checkForStatusUpdates();

    return unsubscribe;
  }, [navigation]);

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

  const loadOrderMode = async () => {
    try {
      const savedOrderMode = await AsyncStorage.getItem('deliveryOrderMode');
      if (savedOrderMode) {
        setOrderMode(savedOrderMode);
        console.log('저장된 배송순서 모드 로드:', savedOrderMode);
      }
    } catch (error) {
      console.log('배송순서 모드 로드 오류:', error);
    }
  };

  const saveOrderMode = async (mode) => {
    try {
      await AsyncStorage.setItem('deliveryOrderMode', mode);
      console.log('배송순서 모드 저장:', mode);
    } catch (error) {
      console.log('배송순서 모드 저장 오류:', error);
    }
  };

  // 날짜만 추출하는 헬퍼 함수 (시간 부분 완전 제거)
  const extractDateOnly = (dateInput) => {
    if (!dateInput) return null;
    
    // 문자열인 경우 (ISO 형식): "2025-09-16T15:00:00.000Z" -> "2025-09-16"
    if (typeof dateInput === 'string') {
      return dateInput.split('T')[0];
    }
    
    // Date 객체인 경우: UTC 날짜만 추출
    if (dateInput instanceof Date) {
      return dateInput.toISOString().split('T')[0];
    }
    
    return null;
  };

  const fetchDeliveries = async () => {
    try {
      const response = await api.get('/deliveries');
      console.log('API 응답:', response.data);
      
      if (response.data.deliveries) {
        // selectedDate를 YYYY-MM-DD 형식으로 변환 (시간 무시)
        const selectedDateString = extractDateOnly(selectedDate);
        console.log('선택된 날짜:', selectedDateString);
        
        const deliveriesData = response.data.deliveries
          .map(delivery => {
            console.log('원본 배송 데이터:', delivery.id, delivery.tracking_number);
            console.log('원본 action 필드:', {
              action_date: delivery.action_date,
              action_time: delivery.action_time,
              hasActionDate: !!delivery.action_date,
              hasActionTime: !!delivery.action_time
            });
            return {
            id: delivery.id,
            trackingNumber: delivery.tracking_number,
            customerName: delivery.customer_name || delivery.receiver_name,
            customerPhone: delivery.customer_phone || delivery.receiver_phone,
            customerAddress: delivery.customer_address || delivery.receiver_address,
            assignedDriver: delivery.assigned_driver,
            assignmentTime: delivery.visit_time,
            status: delivery.status,
            requestType: delivery.request_type,
            constructionType: delivery.construction_type,
            visitDate: delivery.visit_date,
            visitTime: delivery.visit_time,
            action_date: delivery.action_date,
            action_time: delivery.action_time,
            furnitureCompany: delivery.furniture_company,
            emergencyContact: delivery.emergency_contact,
            buildingType: delivery.building_type,
            floorCount: delivery.floor_count,
            elevatorAvailable: delivery.elevator_available,
            ladderTruck: delivery.ladder_truck,
            disposal: delivery.disposal,
            roomMovement: delivery.room_movement,
            wallConstruction: delivery.wall_construction,
            mainMemo: delivery.main_memo,
            productInfo: delivery.product_name,
            furnitureRequest: delivery.furniture_requests,
            driverMemo: delivery.driver_notes
            };
          })
          .filter(delivery => {
            console.log('배송 데이터:', {
              id: delivery.id,
              trackingNumber: delivery.trackingNumber,
              visitDate: delivery.visitDate,
              selectedDate: selectedDateString
            });
            
            if (!delivery.visitDate) {
              console.log('visitDate가 없는 배송:', delivery.trackingNumber);
              return false;
            }
            
            // 헬퍼 함수를 사용해서 날짜만 추출 (시간 완전 제거)
            const deliveryDateOnly = extractDateOnly(delivery.visitDate);
            const isMatch = deliveryDateOnly === selectedDateString;
            
            console.log('날짜 비교 (개선됨):', {
              trackingNumber: delivery.trackingNumber,
              visitDate: delivery.visitDate,
              deliveryDateOnly: deliveryDateOnly,
              selectedDate: selectedDateString,
              isMatch: isMatch
            });
            
            if (isMatch) {
              console.log('✅ 매칭된 배송:', delivery.trackingNumber, '날짜:', deliveryDateOnly);
            }
            
            return isMatch;
          });
        
        console.log('필터링된 배송 개수:', deliveriesData.length);
        
        // action_date/time 필드 확인 로그 (자세한 디버깅)
        deliveriesData.forEach((delivery, index) => {
          if (index < 3) { // 처음 3개만 로그 출력
            console.log(`📋 배송 ${index + 1} action 필드 확인:`, {
              trackingNumber: delivery.trackingNumber,
              action_date: delivery.action_date,
              action_time: delivery.action_time,
              status: delivery.status,
              rawActionDate: delivery.action_date,
              rawActionTime: delivery.action_time,
              hasActionDate: !!delivery.action_date,
              hasActionTime: !!delivery.action_time
            });
          }
        });
        
        // 배송순서 모드에 따라 정렬 적용
        const sortedDeliveries = applyOrderMode(deliveriesData);
        setDeliveries(sortedDeliveries);
        
        const totalCount = sortedDeliveries.length;
        const completedCount = deliveriesData.filter(item => 
          item.status === 'delivery_completed' || 
          item.status === 'collection_completed' || 
          item.status === 'processing_completed' || 
          item.status === 'completed' || 
          item.status === 'delivered' ||
          item.status === '배송완료' || 
          item.status === '수거완료' || 
          item.status === '조처완료'
        ).length;
        setStats({ total: totalCount, completed: completedCount });
      } else {
        // API에서 success: false를 반환한 경우
        setDeliveries([]);
        setStats({ total: 0, completed: 0 });
      }
    } catch (error) {
      console.log('배송목록 조회 오류:', error);
      
      // 데이터가 없으면 빈 상태로 표시
      setDeliveries([]);
      setStats({ total: 0, completed: 0 });
    } finally {
      setLoading(false);
    }
  };

  const changeDateBy = async (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    // setLoading(true) 제거 - useEffect에서 fetchDeliveries가 자동으로 호출되고 거기서 로딩 처리
    
    // 선택된 날짜를 AsyncStorage에 저장
    try {
      await AsyncStorage.setItem('selectedDeliveryDate', newDate.toISOString());
      console.log('배송화면: 선택된 날짜 저장:', newDate.toISOString().split('T')[0]);
    } catch (error) {
      console.error('배송화면: 날짜 저장 오류:', error);
    }
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
              // AsyncStorage에서 토큰과 사용자 정보 제거
              await AsyncStorage.removeItem('auth_token');
              await AsyncStorage.removeItem('user_info');
              
              console.log('로그아웃 완료 - 토큰 및 사용자 정보 제거됨');
              
              // 전역 로그아웃 함수만 호출 - 네비게이션은 App.js에서 자동 처리
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

  const navigateToDetail = (delivery) => {
    console.log('배송 상세로 이동:', delivery.id, delivery.trackingNumber);
    console.log('전달할 delivery 객체:', JSON.stringify(delivery, null, 2));
    navigation.navigate('DeliveryDetail', { delivery });
  };

  // 배송순서 정렬 함수들
  const sortDeliveriesByAddress = (deliveriesList) => {
    // 자동 모드: 상태 우선순위 기반 정렬 + 주소순 정렬
    return [...deliveriesList].sort((a, b) => {
      // 상태 우선순위: 미상차 -> 상차완료 -> 배송중 -> 완료된/취소된/연기된 항목들(맨 아래)
      const statusPriority = {
        '미상차': 1,
        '상차완료': 2,  
        '배송중': 3,
        '완료': 4,
        'completed': 4,
        'delivered': 4,
        // 맨 아래로 보낼 상태들
        '배송취소': 100,
        '배송연기': 100,
        '배송완료': 100,
        'cancelled': 100,
        'delivery_cancelled': 100,
        'postponed': 100,
        'delivery_postponed': 100,
        'delivery_completed': 100,
        'collection_completed': 100
      };
      
      const priorityA = statusPriority[a.status] || 5;
      const priorityB = statusPriority[b.status] || 5;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // 같은 우선순위면 action_date와 action_time 순으로 정렬
      const actionDateA = a.action_date || '';
      const actionDateB = b.action_date || '';
      
      if (actionDateA !== actionDateB) {
        return actionDateB.localeCompare(actionDateA); // 최신 날짜가 위로 (내림차순)
      }
      
      const actionTimeA = a.action_time || '';
      const actionTimeB = b.action_time || '';
      
      if (actionTimeA !== actionTimeB) {
        return actionTimeB.localeCompare(actionTimeA); // 최신 시간이 위로 (내림차순)
      }
      
      // action_date/time이 모두 같으면 주소순 정렬
      const addressA = a.customerAddress || '';
      const addressB = b.customerAddress || '';
      return addressA.localeCompare(addressB, 'ko');
    });
  };

  const applyOrderMode = (deliveriesList) => {
    if (orderMode === 'auto') {
      return sortDeliveriesByAddress(deliveriesList);
    }
    return deliveriesList; // 수동 모드는 원래 순서 유지
  };

  // 드래그 앤 드롭으로 순서 변경 핸들러
  const handleDragEnd = ({ data }) => {
    console.log('배송목록 순서 변경됨');
    setDeliveries(data);
  };

  const renderDeliveryItem = ({ item, drag, isActive, getIndex }) => {
    const index = getIndex ? getIndex() : deliveries.findIndex(delivery => delivery.id === item.id);
    
    // 배송완료 상태 확인 (디버깅용 로그 추가)
    const isCompleted = item.status === 'delivery_completed' || 
                       item.status === 'collection_completed' || 
                       item.status === 'processing_completed' || 
                       item.status === 'delivered' ||
                       item.status === 'completed' ||
                       item.status === '배송완료' || 
                       item.status === '수거완료' || 
                       item.status === '조처완료';
    
    if (isCompleted) {
      console.log('✅ 배송완료 상태 감지:', item.trackingNumber, item.status);
    }
    
    return (
    <TouchableOpacity 
      style={[
        styles.deliveryCard,
        isActive && styles.deliveryCardActive,
        orderMode === 'manual' && styles.deliveryCardManual,
        isCompleted && styles.deliveryCardCompleted,
        // 왼쪽 라인을 status 색상과 동일하게 동적 적용
        {
          borderLeftColor: getStatusColor(item.status),
          borderLeftWidth: 6, // 기존 4에서 6으로 더 굵게
        }
      ]}
      onPress={() => navigateToDetail(item)}
      onLongPress={orderMode === 'manual' ? drag : undefined}
      disabled={isActive}
    >
      {/* 수동 모드에서만 드래그 핸들 표시 */}
      {orderMode === 'manual' && (
        <View style={styles.dragHandle}>
          <Text style={styles.dragHandleText}>⋮⋮</Text>
        </View>
      )}
      
      <View style={[styles.cardContent, orderMode === 'manual' && styles.cardContentManual]}>
        <View style={styles.trackingInfo}>
          <Text style={styles.trackingNumber}>{item.trackingNumber}</Text>
          <Text style={styles.requestType}>{item.requestType || '일반'}</Text>
        </View>
        
        <View style={styles.cardHeader}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status, item.requestType || item.request_type)}</Text>
          </View>
        </View>
        
        <Text style={styles.customerAddress}>{item.customerAddress}</Text>
        
        {/* 날짜/시간 정보 표시 */}
        <View style={styles.dateTimeContainer}>
          <Text style={styles.visitDateTime}>
            방문: {(() => {
              // visit_date는 YYYY-MM-DD 형식만 표시
              const date = item.visitDate || item.visit_date || '';
              const displayDate = date ? date.split('T')[0] : '-'; // 시간 부분 제거
              
              // visit_time은 HH:MM 형식만 표시
              const time = item.visitTime || item.visit_time || '';
              let displayTime = '';
              if (time) {
                const timeParts = time.split(':');
                if (timeParts.length >= 2) {
                  displayTime = `${timeParts[0]}:${timeParts[1]}`;
                } else {
                  displayTime = time;
                }
              }
              
              return `${displayDate} ${displayTime}`.trim();
            })()}
          </Text>
          <Text style={styles.actionDateTime}>
            처리: {(() => {
              // 상태 변경이 일어난 경우에만 action_date 표시
              const hasActionStatus = ['배송연기', 'delivery_postponed', '배송취소', 'delivery_cancelled', 'cancelled', 
                                     '배송완료', 'delivery_completed', 'collection_completed', 'processing_completed', 
                                     'delivered', 'completed'].includes(item.status);
              
              if (!hasActionStatus || !item.action_date) {
                return '-';
              }
              
              // action_date는 YYYY-MM-DD 형식만 표시
              const date = item.action_date || '';
              const displayDate = date ? date.split('T')[0] : '-'; // 시간 부분 제거
              
              // action_time은 HH:MM 형식만 표시
              const time = item.action_time || '';
              let displayTime = '';
              if (time) {
                const timeParts = time.split(':');
                if (timeParts.length >= 2) {
                  displayTime = `${timeParts[0]}:${timeParts[1]}`;
                } else {
                  displayTime = time.substring(0, 5);
                }
              }
              
              return `${displayDate} ${displayTime}`.trim();
            })()}
          </Text>
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
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <TouchableOpacity 
            style={styles.loadingButton}
            onPress={() => navigation.navigate('LoadingConfirm', {
              selectedDate,
              deliveriesData: deliveries
            })}
          >
            <Text style={styles.loadingButtonText}>상차</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 배송순서 토글 컨트롤 */}
      <View style={styles.deliveryOrderContainer}>
        <Text style={styles.orderLabel}>배송순서</Text>
        <View style={styles.orderControls}>
          <View style={styles.orderToggle}>
            <TouchableOpacity 
              style={[styles.orderButton, orderMode === 'auto' && styles.orderButtonActive]}
              onPress={() => {
                setOrderMode('auto');
                saveOrderMode('auto');
              }}
            >
              <Text style={[styles.orderButtonText, orderMode === 'auto' && styles.orderButtonTextActive]}>
                자동
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.orderButton, orderMode === 'manual' && styles.orderButtonActive]}
              onPress={() => {
                setOrderMode('manual');
                saveOrderMode('manual');
              }}
            >
              <Text style={[styles.orderButtonText, orderMode === 'manual' && styles.orderButtonTextActive]}>
                수동
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.mapViewButton}
            onPress={() => navigation.navigate('DeliveryMapView', { deliveries })}
          >
            <Text style={styles.mapViewButtonText}>지도로보기</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {orderMode === 'manual' ? (
        <DraggableFlatList
          data={deliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id.toString()}
          onDragEnd={handleDragEnd}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>배송할 목록이 없습니다.</Text>
              <Text style={styles.emptySubText}>길게 눌러서 순서를 변경할 수 있습니다.</Text>
            </View>
          }
        />
      ) : (
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
      )}
      
      {/* 슬라이드 메뉴 모달 */}
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
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>🔔 알림 설정</Text>
              </TouchableOpacity>
              
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
                  navigation.navigate('MapSetting');
                }}
              >
                <Text style={styles.menuItemText}>🗺️ 지도설정</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  setSlideMenuVisible(false);
                  navigation.navigate('Profile');
                }}
              >
                <Text style={styles.menuItemText}>👤 기사프로필</Text>
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
  dateNavigation: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
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
  // 날짜/시간 정보 스타일
  dateTimeContainer: {
    flexDirection: 'column',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  visitDateTime: {
    fontSize: 12,
    color: '#2196F3', // 파란색 - 방문 예정
    fontWeight: '500',
    marginBottom: 2,
  },
  actionDateTime: {
    fontSize: 12,
    color: '#FF9800', // 주황색 - 처리 완료
    fontWeight: '500',
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
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  // 드래그 앤 드롭 관련 스타일
  deliveryCardActive: {
    opacity: 0.7,
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
  },
  deliveryCardManual: {
    flexDirection: 'row',
  },
  deliveryCardCompleted: {
    backgroundColor: '#f8fff8',
  },
  dragHandle: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginRight: 10,
    borderRadius: 8,
  },
  dragHandleText: {
    fontSize: 16,
    color: '#999',
    letterSpacing: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardContentManual: {
    flex: 1,
  },
  // 일련번호 스타일
  sequenceNumber: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  sequenceNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  loadingButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // 배송순서 토글 스타일
  deliveryOrderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  orderLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 15,
  },
  orderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  orderToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 2,
  },
  orderButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 18,
    minWidth: 60,
    alignItems: 'center',
  },
  orderButtonActive: {
    backgroundColor: '#2196F3',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  orderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  orderButtonTextActive: {
    color: '#fff',
  },
  // 지도로보기 버튼 스타일
  mapViewButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 18,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  mapViewButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default DeliveryListScreen;