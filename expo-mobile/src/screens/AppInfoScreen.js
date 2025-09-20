import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';

const AppInfoScreen = ({ navigation }) => {
  const appVersion = Updates.runtimeVersion || Constants.manifest?.version || '1.2.1';
  const appName = Constants.manifest?.name || '이지픽스 가구배송';

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
          </View>

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
});

export default AppInfoScreen;