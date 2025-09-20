import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import api from '../config/api';

const MapSettingScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mapPreference, setMapPreference] = useState(0);

  useEffect(() => {
    loadMapPreference();
  }, []);

  // 지도 설정 로드
  const loadMapPreference = async () => {
    try {
      setLoading(true);
      console.log('지도 설정 로드 시작 - API에서 최신 데이터 조회');
      
      const response = await api.get('/auth/map-preference');
      console.log('지도 설정 로드 응답:', response.data);
      
      if (response.data.success) {
        const serverMapPref = response.data.mapPreference;
        setMapPreference(serverMapPref);
        console.log('지도 설정 로드 완료:', serverMapPref);
        
        // 전역 상태도 업데이트
        if (global.setMapPreference) {
          global.setMapPreference(serverMapPref);
          console.log('전역 지도 설정도 업데이트:', serverMapPref);
        }
      }
    } catch (error) {
      console.error('지도 설정 로드 오류:', error);
      console.error('오류 상세:', error.response?.data);
      Alert.alert('오류', '지도 설정을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 지도 설정 변경
  const handleMapPreferenceChange = async (selectedMapIndex) => {
    try {
      setSaving(true);
      console.log('지도 설정 변경 시작:', selectedMapIndex);
      
      const response = await api.put('/auth/map-preference', {
        mapPreference: selectedMapIndex
      });
      
      console.log('지도 설정 변경 응답:', response.data);
      
      if (response.data.success) {
        setMapPreference(selectedMapIndex);
        // 전역 지도 설정도 업데이트
        if (global.setMapPreference) {
          global.setMapPreference(selectedMapIndex);
        }
        // DeliveryDetailScreen에 즉시 알림
        if (global.onMapPreferenceChange) {
          global.onMapPreferenceChange(selectedMapIndex);
        }
        
        Alert.alert('성공', '지도 설정이 변경되었습니다.');
      } else {
        console.error('지도 설정 변경 실패:', response.data);
        Alert.alert('오류', response.data.error || '지도 설정 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('지도 설정 변경 오류:', error);
      console.error('오류 상세:', error.response?.data);
      Alert.alert('오류', `지도 설정 변경에 실패했습니다: ${error.response?.data?.error || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.companyName}>지도 설정</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>지도 설정 로딩 중...</Text>
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
        <Text style={styles.companyName}>지도 설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 지도 설정 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗺️ 기본 지도 설정</Text>
        <Text style={styles.mapDescription}>
          배송 상세에서 사용할 기본 지도를 선택하세요
        </Text>
        
        <View style={styles.mapOptions}>
          {['네이버지도', '카카오지도', '티맵', '구글지도'].map((mapName, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.mapOption,
                mapPreference === index && styles.mapOptionSelected
              ]}
              onPress={() => handleMapPreferenceChange(index)}
              disabled={saving}
            >
              <View style={styles.mapOptionContent}>
                <Text style={[
                  styles.mapOptionText,
                  mapPreference === index && styles.mapOptionTextSelected
                ]}>
                  {mapName}
                </Text>
                {saving && mapPreference === index ? (
                  <ActivityIndicator size="small" color="#2196F3" />
                ) : mapPreference === index ? (
                  <Text style={styles.mapOptionCheck}>✓</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  headerSpacer: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  mapDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  mapOptions: {
    gap: 10,
  },
  mapOption: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mapOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  mapOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  mapOptionTextSelected: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  mapOptionCheck: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: 'bold',
  },
});

export default MapSettingScreen;