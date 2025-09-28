import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DeliveryListScreen from './src/screens/DeliveryListScreen';
import UserDeliveryListScreen from './src/screens/UserDeliveryListScreen';
import MobileDashboard from './src/screens/MobileDashboard';
import UserShippingForm from './src/screens/UserShippingForm';
import UserDeliveryDetailScreen from './src/screens/UserDeliveryDetailScreen';
import DeliveryDetailScreen from './src/screens/DeliveryDetailScreen';
import LoadingConfirmScreen from './src/screens/LoadingConfirmScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MapSettingScreen from './src/screens/MapSettingScreen';
import DeliveryMapViewScreen from './src/screens/DeliveryMapViewScreen';
import AppInfoScreen from './src/screens/AppInfoScreen';

const Stack = createStackNavigator();

// 더 이상 탭 네비게이터가 필요하지 않으므로 제거됨

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // 'driver' or 'user'
  const [globalMapPreference, setGlobalMapPreference] = useState(0); // 0: 네이버, 1: 카카오, 2: 티맵, 3: 구글

  useEffect(() => {
    setupUpdateListener(); // EAS Update 이벤트 리스너 설정
    checkLoginStatus();
    
    // 로그아웃 이벤트 리스너 (전역적으로 로그아웃 처리)
    const handleLogout = () => {
      setIsLoggedIn(false);
      setUserRole(null);
      // 로그아웃 시 지도 설정을 기본값으로 초기화 (다른 사용자 로그인을 위해)
      setGlobalMapPreference(0);
      console.log('로그아웃: 지도 설정을 기본값(0)으로 초기화, 사용자 역할 초기화');
    };
    
    // 글로벌 함수들 설정
    global.logout = handleLogout;
    global.checkLoginStatus = checkLoginStatus;
    global.loadMapPreference = loadMapPreference;
    global.checkForUpdates = checkForUpdates; // 수동 업데이트 체크용
    global.getMapPreference = () => {
      return globalMapPreference;
    };
    global.setMapPreference = (newValue) => {
      console.log('🔥 App.js: global.setMapPreference 호출됨, 새 값:', newValue);
      setGlobalMapPreference(newValue);
    };
    
    return () => {
      delete global.logout;
      delete global.checkLoginStatus;
      delete global.loadMapPreference;
      delete global.checkForUpdates;
      delete global.getMapPreference;
      delete global.setMapPreference;
    };
  }, []);

  // globalMapPreference가 변경될 때마다 전역 함수 업데이트
  useEffect(() => {
    global.getMapPreference = () => {
      return globalMapPreference;
    };
  }, [globalMapPreference]);

  // EAS Update 자동 체크 및 다운로드
  const setupUpdateListener = () => {
    console.log('🔄 [EAS UPDATE] 업데이트 체크 설정 시작...');
    console.log('🔄 [EAS UPDATE] Updates.isEnabled:', Updates.isEnabled);
    console.log('🔄 [EAS UPDATE] Updates.runtimeVersion:', Updates.runtimeVersion);
    console.log('🔄 [EAS UPDATE] Updates.updateId:', Updates.updateId);
    console.log('🔄 [EAS UPDATE] Constants.appOwnership:', Constants.appOwnership);
    
    if (!Updates.isEnabled) {
      console.log('❌ [EAS UPDATE] 업데이트가 비활성화됨 (개발 모드 또는 Expo Go)');
      return;
    }

    // 앱 시작 후 3초 후에 업데이트 확인 (앱이 완전히 로드된 후)
    setTimeout(async () => {
      await checkForUpdatesWithNotification();
    }, 3000);
  };

  // 업데이트 확인 및 다운로드 (알림 포함)
  const checkForUpdatesWithNotification = async () => {
    try {
      console.log('🔄 [EAS UPDATE] 업데이트 확인 시작...');
      
      const update = await Updates.checkForUpdateAsync();
      console.log('📋 [EAS UPDATE] 업데이트 확인 결과:', JSON.stringify(update, null, 2));
      
      if (update.isAvailable) {
        console.log('✅ [EAS UPDATE] 새 업데이트 발견!');
        console.log('📦 [EAS UPDATE] 업데이트 정보:', {
          updateId: update.manifest?.id,
          createdAt: update.manifest?.createdAt,
          runtimeVersion: update.manifest?.runtimeVersion
        });
        
        try {
          console.log('📥 [EAS UPDATE] 업데이트 다운로드 시작...');
          await Updates.fetchUpdateAsync();
          console.log('📥 [EAS UPDATE] 업데이트 다운로드 완료!');
          
          // 조용히 자동 재시작 (사용자 알림 없음)
          console.log('🔄 [EAS UPDATE] 조용히 앱 재시작 중...');
          Updates.reloadAsync();
        } catch (downloadError) {
          console.error('❌ [EAS UPDATE] 업데이트 다운로드 실패:', downloadError);
        }
      } else {
        console.log('✅ [EAS UPDATE] 최신 버전입니다.');
        console.log('📱 [EAS UPDATE] 현재 앱 정보:', {
          currentUpdateId: Updates.updateId,
          currentRuntimeVersion: Updates.runtimeVersion,
          createdAt: Updates.createdAt
        });
      }
    } catch (error) {
      console.error('❌ [EAS UPDATE] 업데이트 확인 오류:', error);
      console.error('❌ [EAS UPDATE] 오류 상세:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
    }
  };

  // 수동 업데이트 체크 (기존 호환성 유지)
  const checkForUpdates = async () => {
    try {
      if (!Updates.isEnabled) {
        Alert.alert('알림', '업데이트는 프로덕션 빌드에서만 가능합니다.');
        return;
      }

      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        Alert.alert(
          '업데이트 알림',
          '새 업데이트가 있습니다. 다운로드하시겠습니까?',
          [
            { text: '나중에', style: 'cancel' },
            { 
              text: '지금 업데이트', 
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                } catch (error) {
                  Alert.alert('업데이트 오류', '업데이트 다운로드에 실패했습니다.');
                }
              }
            }
          ]
        );
      } else {
        // 조용히 로그만 남기고 사용자에게는 알리지 않음
        console.log('✅ [EAS UPDATE] 수동 체크: 이미 최신 버전입니다.');
      }
    } catch (error) {
      Alert.alert('오류', '업데이트 확인 중 오류가 발생했습니다.');
    }
  };

  const loadMapPreference = async () => {
    try {
      console.log('지도 설정 로드 시작...');
      // 임시로 기본값 사용 (easypicks 백엔드에 해당 API가 없음)
      console.log('기본 지도 설정 사용 (Google Maps)');
      setGlobalMapPreference(0); // 0: Google Maps (기본값)
      
      // TODO: easypicks 백엔드에 지도 설정 API 추가 후 활성화
      /*
      const api = require('./src/config/api').default;
      const response = await api.get('/auth/map-preference');
      
      console.log('지도 설정 API 응답:', response.data);
      
      if (response.data.success) {
        setGlobalMapPreference(response.data.mapPreference);
        console.log('전역 지도 설정 로드 완료:', response.data.mapPreference);
      } else {
        console.error('지도 설정 로드 실패:', response.data);
      }
      */
    } catch (error) {
      console.error('지도 설정 로드 오류:', error);
      console.error('오류 상세:', error.response?.data);
      // 오류가 있어도 기본값(0) 유지
    }
  };

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userInfoString = await AsyncStorage.getItem('user_info');
      
      if (token && userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        setIsLoggedIn(true);
        
        // 사용자 역할 확인 (role 필드 기준)
        if (userInfo.role === 'user') {
          setUserRole('user');
          console.log('일반 사용자로 로그인됨');
        } else {
          setUserRole('driver');
          console.log('기사로 로그인됨');
        }
        
        // 로그인된 상태라면 지도 설정도 로드
        await loadMapPreference();
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    } catch (error) {
      console.log('토큰 확인 오류:', error);
      setIsLoggedIn(false);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}>
          {isLoggedIn ? (
            <>
              {userRole === 'user' ? (
                <>
                  <Stack.Screen
                    name="MobileDashboard"
                    component={MobileDashboard}
                    options={{ 
                      title: '모바일 대시보드',
                      headerShown: false 
                    }}
                  />
                  <Stack.Screen
                    name="UserShippingForm"
                    component={UserShippingForm}
                    options={{ 
                      title: '새배송접수',
                      headerShown: false 
                    }}
                  />
                  <Stack.Screen
                    name="UserDeliveryList"
                    component={UserDeliveryListScreen}
                    options={{ 
                      title: '배송현황',
                      headerShown: false 
                    }}
                  />
                  <Stack.Screen
                    name="UserDeliveryDetail"
                    component={UserDeliveryDetailScreen}
                    options={{ 
                      title: '배송 상세정보',
                      headerShown: false 
                    }}
                  />
                  <Stack.Screen
                    name="DeliveryDetail"
                    component={DeliveryDetailScreen}
                    options={{ title: '배송 상세정보' }}
                  />
                  <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{ title: '사용자 프로필' }}
                  />
                  <Stack.Screen
                    name="AppInfo"
                    component={AppInfoScreen}
                    options={{ title: '앱 정보', headerShown: false }}
                  />
                </>
              ) : (
                <>
                  <Stack.Screen
                    name="DeliveryList"
                    component={DeliveryListScreen}
                    options={{ 
                      title: '이지픽스',
                      headerShown: false 
                    }}
                  />
                  <Stack.Screen
                    name="DeliveryDetail"
                    component={DeliveryDetailScreen}
                    options={{ title: '배송 상세정보' }}
                  />
                  <Stack.Screen
                    name="LoadingConfirm"
                    component={LoadingConfirmScreen}
                    options={{ title: '상차확인', headerShown: false }}
                  />
                  <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{ title: '기사 프로필' }}
                  />
                  <Stack.Screen
                    name="MapSetting"
                    component={MapSettingScreen}
                    options={{ title: '지도 설정' }}
                  />
                  <Stack.Screen
                    name="AppInfo"
                    component={AppInfoScreen}
                    options={{ title: '앱 정보', headerShown: false }}
                  />
                  <Stack.Screen
                    name="DeliveryMapView"
                    component={DeliveryMapViewScreen}
                    options={{ title: '지도로 보기', headerShown: false }}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ title: '로그인' }}
              />
              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ title: '회원가입' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </>
  );
};

export default App;
