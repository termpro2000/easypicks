import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';

const AppInfoScreen = ({ navigation }) => {
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const appVersion = Updates.runtimeVersion || Constants.manifest?.version || '1.2.1';
  const appName = Constants.manifest?.name || '이지픽스 가구배송';
  
  // EAS 업데이트 정보 포맷팅
  const formatUpdateDate = (createdAt) => {
    if (!createdAt) return 'N/A';
    const date = new Date(createdAt);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 수동 업데이트 체크 및 실행
  const handleManualUpdate = async () => {
    if (!Updates.isEnabled) {
      Alert.alert(
        '업데이트 불가',
        '현재 환경에서는 업데이트가 지원되지 않습니다.\n(개발 모드 또는 Expo Go 환경)'
      );
      return;
    }

    setIsCheckingUpdate(true);
    
    try {
      console.log('🔄 [수동 업데이트] 업데이트 확인 시작...');
      console.log('📱 [수동 업데이트] 현재 업데이트 ID:', Updates.updateId);
      
      const update = await Updates.checkForUpdateAsync();
      console.log('📋 [수동 업데이트] 업데이트 확인 결과:', JSON.stringify(update, null, 2));
      
      if (update.isAvailable) {
        const newUpdateId = update.manifest?.id;
        const currentUpdateId = Updates.updateId;
        
        console.log('🆕 [수동 업데이트] 새 업데이트 발견!');
        console.log('📱 [수동 업데이트] 현재 ID:', currentUpdateId?.slice(0, 8));
        console.log('📱 [수동 업데이트] 새 ID:', newUpdateId?.slice(0, 8));
        
        Alert.alert(
          '업데이트 가능',
          `새로운 업데이트가 있습니다.\n\n현재: ${currentUpdateId?.slice(0, 8) || 'N/A'}\n최신: ${newUpdateId?.slice(0, 8) || 'N/A'}\n\n업데이트를 다운로드하고 앱을 재시작하시겠습니까?`,
          [
            {
              text: '취소',
              style: 'cancel'
            },
            {
              text: '업데이트',
              onPress: async () => {
                try {
                  console.log('📥 [수동 업데이트] 업데이트 다운로드 시작...');
                  await Updates.fetchUpdateAsync();
                  console.log('📥 [수동 업데이트] 업데이트 다운로드 완료!');
                  
                  Alert.alert(
                    '업데이트 완료',
                    '앱을 재시작합니다.',
                    [
                      {
                        text: '확인',
                        onPress: () => {
                          console.log('🔄 [수동 업데이트] 앱 재시작 중...');
                          Updates.reloadAsync();
                        }
                      }
                    ]
                  );
                } catch (downloadError) {
                  console.error('❌ [수동 업데이트] 다운로드 실패:', downloadError);
                  Alert.alert('오류', '업데이트 다운로드에 실패했습니다.');
                }
              }
            }
          ]
        );
      } else {
        console.log('✅ [수동 업데이트] 최신 버전입니다.');
        Alert.alert(
          '최신 버전',
          `이미 최신 버전을 사용하고 있습니다.\n\n업데이트 ID: ${Updates.updateId?.slice(0, 8) || 'N/A'}`
        );
      }
    } catch (error) {
      console.error('❌ [수동 업데이트] 체크 실패:', error);
      Alert.alert('오류', '업데이트 확인 중 오류가 발생했습니다.');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>앱 정보</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoSection}>
          {/* 앱 아이콘 영역 */}
          <View style={styles.appIconContainer}>
            <View style={styles.appIcon}>
              <Text style={styles.appIconText}>📱</Text>
            </View>
          </View>

          {/* 앱 정보 */}
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>앱 이름</Text>
              <Text style={styles.infoValue}>{appName} 기사용 앱</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>앱 버전</Text>
              <Text style={styles.infoValue}>{appVersion}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>개발사</Text>
              <Text style={styles.infoValue}>이지픽스</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>업데이트 ID</Text>
              <Text style={styles.infoValue}>{Updates.updateId?.slice(0, 8) || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>빌드 환경</Text>
              <Text style={styles.infoValue}>
                {__DEV__ ? '개발 모드' : '프로덕션'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>마지막 업데이트</Text>
              <Text style={styles.infoValue}>{formatUpdateDate(Updates.createdAt)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>업데이트 활성화</Text>
              <Text style={styles.infoValue}>
                {Updates.isEnabled ? '✅ 활성화' : '❌ 비활성화'}
              </Text>
            </View>
          </View>

          {/* 수동 업데이트 버튼 */}
          {Updates.isEnabled && (
            <TouchableOpacity 
              style={styles.updateButton}
              onPress={handleManualUpdate}
              disabled={isCheckingUpdate}
            >
              {isCheckingUpdate ? (
                <View style={styles.updateButtonContent}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.updateButtonText, { marginLeft: 8 }]}>업데이트 확인 중...</Text>
                </View>
              ) : (
                <Text style={styles.updateButtonText}>앱 업데이트</Text>
              )}
            </TouchableOpacity>
          )}

          {/* 추가 정보 */}
          <View style={styles.additionalInfo}>
            <Text style={styles.additionalInfoTitle}>앱 설명</Text>
            <Text style={styles.additionalInfoText}>
              이지픽스 가구배송 기사용 모바일 앱입니다.{'\n'}
              배송 관리, 사진 업로드, 고객 서명 등의 기능을 제공합니다.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1976D2',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    padding: 20,
  },
  appIconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  appIconText: {
    fontSize: 40,
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  additionalInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  additionalInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  additionalInfoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  updateButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  updateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AppInfoScreen;