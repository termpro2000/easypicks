import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DeliveryListScreen from './src/screens/DeliveryListScreen';
import DeliveryDetailScreen from './src/screens/DeliveryDetailScreen';
import LoadingConfirmScreen from './src/screens/LoadingConfirmScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MapSettingScreen from './src/screens/MapSettingScreen';
import DeliveryMapViewScreen from './src/screens/DeliveryMapViewScreen';

const Stack = createStackNavigator();

// 더 이상 탭 네비게이터가 필요하지 않으므로 제거됨

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [globalMapPreference, setGlobalMapPreference] = useState(0); // 0: 네이버, 1: 카카오, 2: 티맵, 3: 구글

  useEffect(() => {
    checkForUpdates(); // 자동 업데이트 체크 활성화
    checkLoginStatus();
    
    // 로그아웃 이벤트 리스너 (전역적으로 로그아웃 처리)
    const handleLogout = () => {
      setIsLoggedIn(false);
      // 로그아웃 시 지도 설정을 기본값으로 초기화 (다른 사용자 로그인을 위해)
      setGlobalMapPreference(0);
      console.log('로그아웃: 지도 설정을 기본값(0)으로 초기화');
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

  const checkForUpdates = async () => {
    try {
      console.log('🔄 [EAS UPDATE] 업데이트 확인 시작...');
      console.log('🔄 [EAS UPDATE] Updates.isEnabled:', Updates.isEnabled);
      console.log('🔄 [EAS UPDATE] Updates.runtimeVersion:', Updates.runtimeVersion);
      console.log('🔄 [EAS UPDATE] Updates.updateId:', Updates.updateId);
      console.log('🔄 [EAS UPDATE] Updates.createdAt:', Updates.createdAt);
      console.log('🔄 [EAS UPDATE] Updates.channel:', Updates.channel);
      console.log('🔄 [EAS UPDATE] __DEV__:', __DEV__);
      console.log('🔄 [EAS UPDATE] Constants.appOwnership:', Constants.appOwnership);
      console.log('🔄 [EAS UPDATE] Constants.executionEnvironment:', Constants.executionEnvironment);
      
      if (!Updates.isEnabled) {
        console.log('❌ [EAS UPDATE] 업데이트가 비활성화됨 - 이유:');
        console.log('   - 개발 모드(__DEV__):', __DEV__);
        console.log('   - 앱 소유권:', Constants.appOwnership);
        console.log('   - 실행 환경:', Constants.executionEnvironment);
        
        // 강제로 업데이트 체크 시도
        console.log('🔄 [EAS UPDATE] 강제 업데이트 체크 시도...');
      }

      const update = await Updates.checkForUpdateAsync();
      console.log('📋 [EAS UPDATE] 업데이트 확인 결과:', JSON.stringify(update, null, 2));
      
      if (update.isAvailable) {
        console.log('✅ [EAS UPDATE] 새 업데이트 발견!');
        console.log('📦 [EAS UPDATE] 새 업데이트 정보:', {
          updateId: update.manifest?.id,
          createdAt: update.manifest?.createdAt,
          runtimeVersion: update.manifest?.runtimeVersion
        });
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
                  console.log('[업데이트 체크] 업데이트 다운로드 완료, 재시작 중...');
                  await Updates.reloadAsync();
                } catch (error) {
                  console.error('[업데이트 체크] 업데이트 다운로드 실패:', error);
                  Alert.alert('업데이트 오류', '업데이트 다운로드에 실패했습니다.');
                }
              }
            }
          ]
        );
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
      if (token) {
        setIsLoggedIn(true);
        // 로그인된 상태라면 지도 설정도 로드
        await loadMapPreference();
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.log('토큰 확인 오류:', error);
      setIsLoggedIn(false);
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
                name="DeliveryMapView"
                component={DeliveryMapViewScreen}
                options={{ title: '지도로 보기', headerShown: false }}
              />
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
