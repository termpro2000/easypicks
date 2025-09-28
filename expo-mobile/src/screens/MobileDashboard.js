import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const MobileDashboard = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userInfoString = await AsyncStorage.getItem('user_info');
      if (userInfoString) {
        const parsedUserInfo = JSON.parse(userInfoString);
        setUserInfo(parsedUserInfo);
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

  const handleNewDelivery = () => {
    // 새배송접수 화면으로 이동
    navigation.navigate('UserShippingForm');
  };

  const handleDeliveryStatus = () => {
    // 배송현황으로 이동
    navigation.navigate('UserDeliveryList');
  };

  const handleStatistics = () => {
    // 통계보기 기능 구현 예정
    Alert.alert('통계보기', '통계보기 화면으로 이동합니다.');
    // navigation.navigate('StatisticsScreen');
  };

  const handleLogout = async () => {
    try {
      Alert.alert(
        '로그아웃',
        '정말 로그아웃 하시겠습니까?',
        [
          {
            text: '취소',
            style: 'cancel'
          },
          {
            text: '로그아웃',
            onPress: async () => {
              await AsyncStorage.removeItem('auth_token');
              await AsyncStorage.removeItem('user_info');
              
              // 전역 로그인 상태 업데이트
              if (global.checkLoginStatus) {
                global.checkLoginStatus();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  const DashboardButton = ({ icon, title, subtitle, onPress, color }) => (
    <TouchableOpacity style={[styles.button, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.buttonContent}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={32} color={color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.buttonTitle}>{title}</Text>
          <Text style={styles.buttonSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>모바일 대시보드</Text>
            <Text style={styles.headerSubtitle}>
              {userInfo ? `${userInfo.name || userInfo.username}님 환영합니다` : '사용자 대시보드'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 메인 콘텐츠 */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>주요 기능</Text>
        
        <View style={styles.buttonContainer}>
          <DashboardButton
            icon="add-circle-outline"
            title="새배송접수"
            subtitle="새로운 배송 주문을 접수합니다"
            onPress={handleNewDelivery}
            color="#4CAF50"
          />
          
          <DashboardButton
            icon="list-outline"
            title="배송현황"
            subtitle="진행 중인 배송 현황을 확인합니다"
            onPress={handleDeliveryStatus}
            color="#2196F3"
          />
          
          <DashboardButton
            icon="bar-chart-outline"
            title="통계보기"
            subtitle="배송 통계 및 실적을 확인합니다"
            onPress={handleStatistics}
            color="#FF9800"
          />
        </View>
      </View>

      {/* 푸터 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>이지픽스 배송 관리 시스템</Text>
        <Text style={styles.versionText}>모바일 대시보드 v1.0</Text>
      </View>
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
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});

export default MobileDashboard;