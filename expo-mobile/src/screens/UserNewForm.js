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
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const UserNewForm = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [senderSectionExpanded, setSenderSectionExpanded] = useState(false);

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
        setSenderName(parsedUserInfo.name || parsedUserInfo.username || '');
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1: // 발송인 & 수취인 정보
        if (!senderName.trim()) {
          Alert.alert('입력 오류', '발송인 이름을 입력해주세요.');
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
        return true;
      case 2: // 제품 정보
        if (!productName.trim()) {
          Alert.alert('입력 오류', '제품명을 입력해주세요.');
          return false;
        }
        return true;
      case 3: // 배송 옵션
        return true; // 선택사항
      case 4: // 기타 정보
        return true; // 선택사항
      default:
        return true;
    }
  };

  const validateForm = () => {
    for (let i = 1; i <= totalSteps; i++) {
      if (!validateStep(i)) {
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return '발송인 & 수취인 정보';
      case 2: return '제품 정보';
      case 3: return '배송 옵션';
      case 4: return '기타 정보';
      default: return '';
    }
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

      console.log('📦 UserNewForm: 배송 데이터 전송');
      console.log('👤 사용자 정보:', userInfo);
      console.log('🏢 Partner ID:', userInfo?.id || null);

      const response = await api.post('/deliveries', deliveryData);
      
      if (response.data.success) {
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View>
            {/* 발솠인 정보 - 접을 수 있는 섹션 */}
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.collapsibleSectionHeader}
                onPress={() => setSenderSectionExpanded(!senderSectionExpanded)}
              >
                <View style={styles.sectionHeaderContent}>
                  <Ionicons name="person-outline" size={24} color="#2196F3" />
                  <Text style={styles.sectionTitle}>발송인 정보</Text>
                </View>
                <Ionicons 
                  name={senderSectionExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              {senderSectionExpanded && (
                <View style={styles.collapsibleContent}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>발송인 이름 <Text style={styles.requiredMark}>*</Text></Text>
                    <TextInput
                      style={styles.textInput}
                      value={senderName}
                      onChangeText={setSenderName}
                      placeholder="발송인 이름을 입력하세요"
                      placeholderTextColor="#999"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>발송인 주소</Text>
                    <TextInput
                      style={styles.textInput}
                      value={senderAddress}
                      onChangeText={setSenderAddress}
                      placeholder="발송인 주소를 입력하세요"
                      placeholderTextColor="#999"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>상세 주소</Text>
                    <TextInput
                      style={styles.textInput}
                      value={senderDetailAddress}
                      onChangeText={setSenderDetailAddress}
                      placeholder="상세 주소를 입력하세요"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              )}
            </View>

            {/* 수취인 정보 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={24} color="#2196F3" />
                <Text style={styles.sectionTitle}>수취인 정보</Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>수취인 이름 <Text style={styles.requiredMark}>*</Text></Text>
                <TextInput
                  style={styles.textInput}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="수취인 이름을 입력하세요"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>수취인 전화번호 <Text style={styles.requiredMark}>*</Text></Text>
                <TextInput
                  style={styles.textInput}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  placeholder="수취인 전화번호를 입력하세요"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>수취인 주소 <Text style={styles.requiredMark}>*</Text></Text>
                <TextInput
                  style={styles.textInput}
                  value={customerAddress}
                  onChangeText={setCustomerAddress}
                  placeholder="수취인 주소를 입력하세요"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>상세 주소</Text>
                <TextInput
                  style={styles.textInput}
                  value={customerDetailAddress}
                  onChangeText={setCustomerDetailAddress}
                  placeholder="상세 주소를 입력하세요"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cube-outline" size={24} color="#2196F3" />
              <Text style={styles.sectionTitle}>제품 정보</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>제품명 <Text style={styles.requiredMark}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                value={productName}
                onChangeText={setProductName}
                placeholder="제품명을 입력하세요"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>제품 코드</Text>
              <TextInput
                style={styles.textInput}
                value={productCode}
                onChangeText={setProductCode}
                placeholder="제품 코드를 입력하세요"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>제품 무게</Text>
                  <TextInput
                    style={styles.textInput}
                    value={productWeight}
                    onChangeText={setProductWeight}
                    placeholder="예: 50kg"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              <View style={styles.halfWidth}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>제품 크기</Text>
                  <TextInput
                    style={styles.textInput}
                    value={productSize}
                    onChangeText={setProductSize}
                    placeholder="예: 1200x800x600mm"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>박스 크기</Text>
              <TextInput
                style={styles.textInput}
                value={boxSize}
                onChangeText={setBoxSize}
                placeholder="예: 1300x900x700mm"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={24} color="#2196F3" />
              <Text style={styles.sectionTitle}>배송 옵션</Text>
            </View>
            
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>방문 희망일</Text>
                  <TextInput
                    style={styles.textInput}
                    value={visitDate}
                    onChangeText={setVisitDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              <View style={styles.halfWidth}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>방문 희망시간</Text>
                  <TextInput
                    style={styles.textInput}
                    value={visitTime}
                    onChangeText={setVisitTime}
                    placeholder="HH:MM"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>배송비</Text>
                  <TextInput
                    style={styles.textInput}
                    value={deliveryFee}
                    onChangeText={setDeliveryFee}
                    placeholder="배송비 (원)"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.halfWidth}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>보험가액</Text>
                  <TextInput
                    style={styles.textInput}
                    value={insuranceValue}
                    onChangeText={setInsuranceValue}
                    placeholder="보험가액 (원)"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>착불금액</Text>
              <TextInput
                style={styles.textInput}
                value={codAmount}
                onChangeText={setCodAmount}
                placeholder="착불금액 (원)"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={24} color="#2196F3" />
              <Text style={styles.sectionTitle}>기타 정보</Text>
            </View>
            
            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>파손 주의</Text>
                <Text style={styles.switchDescription}>파손 주의가 필요한 제품인 경우 활성화</Text>
              </View>
              <Switch
                value={fragile}
                onValueChange={setFragile}
                trackColor={{ false: '#E0E0E0', true: '#2196F3' }}
                thumbColor={fragile ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>메인 메모</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={mainMemo}
                onChangeText={setMainMemo}
                placeholder="주요 전달사항을 입력하세요"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>특별 지시사항</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                placeholder="특별한 지시사항이 있으면 입력하세요"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        );


      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>새배송접수</Text>
          <Text style={styles.stepIndicator}>단계 {currentStep}/{totalSteps} - {getStepTitle()}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
        {/* 단계별 콘텐츠 */}
        {renderStepContent()}
        
        {/* 네비게이션 버튼 - 섹션 바로 아래 */}
        <View style={styles.inlineNavigationContainer}>
        <View style={styles.buttonRow}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.navButton, styles.previousButton]}
              onPress={handlePrevious}
            >
              <Ionicons name="chevron-back" size={20} color="#666" />
              <Text style={styles.previousButtonText}>이전</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < totalSteps ? (
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>다음</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>배송접수 완료</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
  },
  backButton: {
    padding: 5,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  stepIndicator: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  placeholder: {
    width: 34,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 100,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  navigationContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  previousButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  previousButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#2196F3',
    marginLeft: 'auto',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  collapsibleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapsibleContent: {
    marginTop: 15,
  },
  inlineNavigationContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});

export default UserNewForm;