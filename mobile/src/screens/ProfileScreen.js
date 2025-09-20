import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const ProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    delivery_area: '',
    vehicle_type: '',
    vehicle_number: '',
    cargo_capacity: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userInfoStr = await AsyncStorage.getItem('user_info');
      if (userInfoStr) {
        const user = JSON.parse(userInfoStr);
        setUserInfo(user);
        
        // 서버에서 최신 프로필 정보 가져오기
        const response = await api.get('/auth/profile');
        const profileData = response.data.user;
        
        setFormData({
          name: profileData.name || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
          delivery_area: profileData.delivery_area || '',
          vehicle_type: profileData.vehicle_type || '',
          vehicle_number: profileData.vehicle_number || '',
          cargo_capacity: profileData.cargo_capacity || '',
        });
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error);
      Alert.alert('오류', '프로필 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      Alert.alert('오류', '이름은 필수 입력 항목입니다.');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/auth/profile', formData);
      
      // AsyncStorage의 사용자 정보도 업데이트
      const updatedUser = { ...userInfo, ...response.data.user };
      await AsyncStorage.setItem('user_info', JSON.stringify(updatedUser));
      setUserInfo(updatedUser);
      
      Alert.alert('성공', '프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      const errorMessage = error.response?.data?.error || '프로필 업데이트에 실패했습니다.';
      Alert.alert('오류', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('오류', '모든 비밀번호 필드를 입력해주세요.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('오류', '새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      Alert.alert('성공', '비밀번호가 성공적으로 변경되었습니다.');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordChange(false);
    } catch (error) {
      const errorMessage = error.response?.data?.error || '비밀번호 변경에 실패했습니다.';
      Alert.alert('오류', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          onPress: async () => {
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('user_info');
            // 최상위 네비게이터로 이동하여 로그인 화면으로
            navigation.getParent()?.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>프로필 로딩 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>프로필</Text>
        <Text style={styles.userId}>기사 ID: {userInfo.user_id}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>기본 정보</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>이름 *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
            placeholder="이름을 입력하세요"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>전화번호</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({...formData, phone: text})}
            placeholder="전화번호를 입력하세요"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>이메일</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            placeholder="이메일을 입력하세요"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>배송지역</Text>
          <TextInput
            style={styles.input}
            value={formData.delivery_area}
            onChangeText={(text) => setFormData({...formData, delivery_area: text})}
            placeholder="예: 서울 강남구, 서초구, 송파구"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>차량 정보</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>차량종류</Text>
          <TextInput
            style={styles.input}
            value={formData.vehicle_type}
            onChangeText={(text) => setFormData({...formData, vehicle_type: text})}
            placeholder="예: 1톤 트럭, 2.5톤 트럭"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>차량번호</Text>
          <TextInput
            style={styles.input}
            value={formData.vehicle_number}
            onChangeText={(text) => setFormData({...formData, vehicle_number: text})}
            placeholder="예: 서울12가3456"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>화물총크기</Text>
          <TextInput
            style={styles.input}
            value={formData.cargo_capacity}
            onChangeText={(text) => setFormData({...formData, cargo_capacity: text})}
            placeholder="예: 최대 1톤, 3m x 2m x 2m"
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSaveProfile}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>프로필 저장</Text>
        )}
      </TouchableOpacity>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.passwordToggleButton}
          onPress={() => setShowPasswordChange(!showPasswordChange)}
        >
          <Text style={styles.passwordToggleText}>
            {showPasswordChange ? '비밀번호 변경 취소' : '비밀번호 변경'}
          </Text>
        </TouchableOpacity>

        {showPasswordChange && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>현재 비밀번호</Text>
              <TextInput
                style={styles.input}
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
                placeholder="현재 비밀번호를 입력하세요"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>새 비밀번호</Text>
              <TextInput
                style={styles.input}
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
                placeholder="새 비밀번호를 입력하세요 (6자 이상)"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>새 비밀번호 확인</Text>
              <TextInput
                style={styles.input}
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
                placeholder="새 비밀번호를 다시 입력하세요"
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, styles.passwordButton, saving && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>비밀번호 변경</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>로그아웃</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacing} />
    </ScrollView>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userId: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
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
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passwordToggleButton: {
    padding: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  passwordToggleText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
  },
  passwordButton: {
    backgroundColor: '#FF9800',
    margin: 0,
    marginTop: 15,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ProfileScreen;