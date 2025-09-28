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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const UserShippingForm = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  
  // 스텝 관리
  const [currentStep, setCurrentStep] = useState(1);
  const [senderInfoExpanded, setSenderInfoExpanded] = useState(true);

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

  const validateStep = (step) => {
    switch (step) {
      case 1: // 수취인 정보
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
        return true; // 배송 옵션은 선택사항
      case 4: // 건물 정보
        return true; // 건물 정보는 선택사항
      case 5: // 기타 정보
        return true; // 기타 정보는 선택사항
      default:
        return true;
    }
  };

  const validateForm = () => {
    // 발송인 정보 검증
    if (!senderName.trim()) {
      Alert.alert('입력 오류', '발송인 이름을 입력해주세요.');
      return false;
    }
    if (!senderAddress.trim()) {
      Alert.alert('입력 오류', '발송인 주소를 입력해주세요.');
      return false;
    }
    
    // 모든 스텝 검증
    for (let i = 1; i <= 5; i++) {
      if (!validateStep(i)) {
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return '수취인 정보';
      case 2: return '제품 정보';
      case 3: return '배송 옵션';
      case 4: return '건물 정보';
      case 5: return '기타 정보';
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

      console.log('📦 UserShippingForm: 배송 데이터 전송');
      console.log('👤 사용자 정보:', userInfo);
      console.log('🏢 Partner ID:', userInfo?.id || null);

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

  const FormSection = ({ title, icon, children, collapsible = false, expanded = true, onToggle }) => (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.sectionHeader} 
        onPress={collapsible ? onToggle : undefined}
        disabled={!collapsible}
      >
        <Ionicons name={icon} size={24} color="#2196F3" />
        <Text style={styles.sectionTitle}>{title}</Text>
        {collapsible && (
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
            style={styles.toggleIcon}
          />
        )}
      </TouchableOpacity>
      <View style={!expanded ? styles.hiddenStep : null}>
        {children}
      </View>
    </View>
  );

  const InputField = React.memo(({ label, value, onChangeText, placeholder, required = false, ...props }) => (
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
        autoCapitalize="none"
        autoCorrect={false}
        key={`input-${label}`}
        {...props}
      />
    </View>
  ));

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

  const NavigationButtons = () => (
    <View style={styles.navigationContainer}>
      {currentStep > 1 && (
        <TouchableOpacity 
          style={styles.previousButton}
          onPress={handlePrevious}
        >
          <Ionicons name="arrow-back" size={20} color="#2196F3" />
          <Text style={styles.previousButtonText}>이전</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.buttonSpacer} />
      
      {currentStep < 5 ? (
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>다음</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
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
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>새배송접수</Text>
            <Text style={styles.stepIndicator}>{currentStep}/5 단계 - {getStepTitle()}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 발송인 정보 - 접을 수 있는 섹션 */}
          <FormSection 
            title="발송인 정보" 
            icon="person-outline"
            collapsible={true}
            expanded={senderInfoExpanded}
            onToggle={() => setSenderInfoExpanded(!senderInfoExpanded)}
          >
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

          {/* 단계별 폼 내용 - 조건부 렌더링 대신 display 속성 사용 */}
          <View style={currentStep !== 1 ? styles.hiddenStep : null}>
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
          </View>

          <View style={currentStep !== 2 ? styles.hiddenStep : null}>
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
          </View>

          <View style={currentStep !== 3 ? styles.hiddenStep : null}>
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
          </View>

          <View style={currentStep !== 4 ? styles.hiddenStep : null}>
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
          </View>

          <View style={currentStep !== 5 ? styles.hiddenStep : null}>
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
          </View>

          {/* 네비게이션 버튼 */}
          <NavigationButtons />
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
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
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  toggleIcon: {
    marginLeft: 10,
  },
  hiddenStep: {
    height: 0,
    overflow: 'hidden',
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
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  previousButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSpacer: {
    flex: 1,
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
});

export default UserShippingForm;