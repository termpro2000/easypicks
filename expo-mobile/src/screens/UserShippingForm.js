import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const UserShippingForm = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // 발송인 정보
  const [senderName, setSenderName] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderDetailAddress, setSenderDetailAddress] = useState('');

  // 수취인 정보
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerDetailAddress, setCustomerDetailAddress] = useState('');

  // 제품 정보
  const [productName, setProductName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [productWeight, setProductWeight] = useState('');
  const [productSize, setProductSize] = useState('');
  const [boxSize, setBoxSize] = useState('');

  // 배송 옵션
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [insuranceValue, setInsuranceValue] = useState('');
  const [codAmount, setCodAmount] = useState('');

  // 건물 정보
  const [buildingType, setBuildingType] = useState('');
  const [floorCount, setFloorCount] = useState('');
  const [elevatorAvailable, setElevatorAvailable] = useState(false);
  const [ladderTruck, setLadderTruck] = useState(false);
  const [disposal, setDisposal] = useState(false);

  // 기타 정보
  const [mainMemo, setMainMemo] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [fragile, setFragile] = useState(false);
  const [requestType, setRequestType] = useState('일반배송');

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userInfoString = await AsyncStorage.getItem('user_info');
      if (userInfoString) {
        const parsedUserInfo = JSON.parse(userInfoString);
        setUserInfo(parsedUserInfo);
        
        // 발송인 정보를 사용자 정보로 자동 설정
        setSenderName(parsedUserInfo.name || parsedUserInfo.username || '');
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

  const validateForm = () => {
    if (!senderName.trim()) {
      Alert.alert('입력 오류', '발송인 이름을 입력해주세요.');
      return false;
    }
    if (!senderAddress.trim()) {
      Alert.alert('입력 오류', '발송인 주소를 입력해주세요.');
      return false;
    }
    if (!customerName.trim()) {
      Alert.alert('입력 오류', '수취인 이름을 입력해주세요.');
      return false;
    }
    if (!customerPhone.trim()) {
      Alert.alert('입력 오류', '수취인 전화번호를 입력해주세요.');
      return false;
    }
    if (!customerAddress.trim()) {
      Alert.alert('입력 오류', '수취인 주소를 입력해주세요.');
      return false;
    }
    if (!productName.trim()) {
      Alert.alert('입력 오류', '제품명을 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const deliveryData = {
        sender_name: senderName,
        sender_address: senderAddress,
        sender_detail_address: senderDetailAddress,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        customer_detail_address: customerDetailAddress,
        product_name: productName,
        product_code: productCode,
        product_weight: productWeight,
        product_size: productSize,
        box_size: boxSize,
        visit_date: visitDate,
        visit_time: visitTime,
        delivery_fee: deliveryFee ? parseFloat(deliveryFee) : null,
        insurance_value: insuranceValue ? parseFloat(insuranceValue) : null,
        cod_amount: codAmount ? parseFloat(codAmount) : null,
        building_type: buildingType,
        floor_count: floorCount ? parseInt(floorCount) : null,
        elevator_available: elevatorAvailable,
        ladder_truck: ladderTruck,
        disposal: disposal,
        main_memo: mainMemo,
        special_instructions: specialInstructions,
        fragile: fragile,
        request_type: requestType,
        status: '접수완료',
        partner_id: userInfo?.id || null,
      };

      const response = await api.post('/deliveries', deliveryData);
      
      if (response.data.success) {
        setSubmitResult({
          success: true,
          message: '배송 접수가 완료되었습니다.',
          trackingNumber: response.data.trackingNumber,
        });
        
        Alert.alert(
          '접수 완료',
          `배송 접수가 완료되었습니다.\n배송번호: ${response.data.trackingNumber}`,
          [
            {
              text: '확인',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(response.data.message || '배송 접수에 실패했습니다.');
      }
    } catch (error) {
      console.error('배송 접수 오류:', error);
      Alert.alert(
        '접수 실패',
        error.response?.data?.message || error.message || '배송 접수에 실패했습니다.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const FormSection = ({ title, icon, children }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={24} color="#2196F3" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const InputField = ({ label, value, onChangeText, placeholder, required = false, ...props }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        {...props}
      />
    </View>
  );

  const SwitchField = ({ label, value, onValueChange, description }) => (
    <View style={styles.switchContainer}>
      <View style={styles.switchLabelContainer}>
        <Text style={styles.switchLabel}>{label}</Text>
        {description && <Text style={styles.switchDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E0E0E0', true: '#2196F3' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>새배송접수</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 발송인 정보 */}
          <FormSection title="발송인 정보" icon="person-outline">
            <InputField
              label="발송인 이름"
              value={senderName}
              onChangeText={setSenderName}
              placeholder="발송인 이름을 입력하세요"
              required
            />
            <InputField
              label="발송인 주소"
              value={senderAddress}
              onChangeText={setSenderAddress}
              placeholder="발송인 주소를 입력하세요"
              required
            />
            <InputField
              label="상세 주소"
              value={senderDetailAddress}
              onChangeText={setSenderDetailAddress}
              placeholder="상세 주소를 입력하세요"
            />
          </FormSection>

          {/* 수취인 정보 */}
          <FormSection title="수취인 정보" icon="location-outline">
            <InputField
              label="수취인 이름"
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="수취인 이름을 입력하세요"
              required
            />
            <InputField
              label="수취인 전화번호"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="수취인 전화번호를 입력하세요"
              keyboardType="phone-pad"
              required
            />
            <InputField
              label="수취인 주소"
              value={customerAddress}
              onChangeText={setCustomerAddress}
              placeholder="수취인 주소를 입력하세요"
              required
            />
            <InputField
              label="상세 주소"
              value={customerDetailAddress}
              onChangeText={setCustomerDetailAddress}
              placeholder="상세 주소를 입력하세요"
            />
          </FormSection>

          {/* 제품 정보 */}
          <FormSection title="제품 정보" icon="cube-outline">
            <InputField
              label="제품명"
              value={productName}
              onChangeText={setProductName}
              placeholder="제품명을 입력하세요"
              required
            />
            <InputField
              label="제품 코드"
              value={productCode}
              onChangeText={setProductCode}
              placeholder="제품 코드를 입력하세요"
            />
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <InputField
                  label="제품 무게"
                  value={productWeight}
                  onChangeText={setProductWeight}
                  placeholder="예: 50kg"
                />
              </View>
              <View style={styles.halfWidth}>
                <InputField
                  label="제품 크기"
                  value={productSize}
                  onChangeText={setProductSize}
                  placeholder="예: 1200x800x600mm"
                />
              </View>
            </View>
            <InputField
              label="박스 크기"
              value={boxSize}
              onChangeText={setBoxSize}
              placeholder="예: 1300x900x700mm"
            />
          </FormSection>

          {/* 배송 옵션 */}
          <FormSection title="배송 옵션" icon="time-outline">
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <InputField
                  label="방문 희망일"
                  value={visitDate}
                  onChangeText={setVisitDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={styles.halfWidth}>
                <InputField
                  label="방문 희망시간"
                  value={visitTime}
                  onChangeText={setVisitTime}
                  placeholder="HH:MM"
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <InputField
                  label="배송비"
                  value={deliveryFee}
                  onChangeText={setDeliveryFee}
                  placeholder="배송비 (원)"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfWidth}>
                <InputField
                  label="보험가액"
                  value={insuranceValue}
                  onChangeText={setInsuranceValue}
                  placeholder="보험가액 (원)"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <InputField
              label="착불금액"
              value={codAmount}
              onChangeText={setCodAmount}
              placeholder="착불금액 (원)"
              keyboardType="numeric"
            />
          </FormSection>

          {/* 건물 정보 */}
          <FormSection title="건물 정보" icon="business-outline">
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <InputField
                  label="건물 유형"
                  value={buildingType}
                  onChangeText={setBuildingType}
                  placeholder="예: 아파트, 빌라, 단독주택"
                />
              </View>
              <View style={styles.halfWidth}>
                <InputField
                  label="층수"
                  value={floorCount}
                  onChangeText={setFloorCount}
                  placeholder="층수"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <SwitchField
              label="엘리베이터 사용 가능"
              value={elevatorAvailable}
              onValueChange={setElevatorAvailable}
              description="엘리베이터를 사용할 수 있는 경우 활성화"
            />
            <SwitchField
              label="사다리차 필요"
              value={ladderTruck}
              onValueChange={setLadderTruck}
              description="사다리차가 필요한 경우 활성화"
            />
            <SwitchField
              label="폐기물 처리"
              value={disposal}
              onValueChange={setDisposal}
              description="폐기물 처리가 필요한 경우 활성화"
            />
          </FormSection>

          {/* 기타 정보 */}
          <FormSection title="기타 정보" icon="document-text-outline">
            <SwitchField
              label="파손 주의"
              value={fragile}
              onValueChange={setFragile}
              description="파손 주의가 필요한 제품인 경우 활성화"
            />
            <InputField
              label="메인 메모"
              value={mainMemo}
              onChangeText={setMainMemo}
              placeholder="주요 전달사항을 입력하세요"
              multiline
              numberOfLines={3}
            />
            <InputField
              label="특별 지시사항"
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              placeholder="특별한 지시사항이 있으면 입력하세요"
              multiline
              numberOfLines={3}
            />
          </FormSection>

          {/* 접수 버튼 */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>배송 접수 완료</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requiredMark: {
    color: '#F44336',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 10,
  },
  switchLabelContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  submitContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default UserShippingForm;