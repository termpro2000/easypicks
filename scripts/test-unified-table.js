const axios = require('axios');

async function testUnifiedTable() {
  try {
    console.log('🧪 통합된 테이블 기능 테스트 시작...\n');
    
    // 1. 인증을 위한 로그인 (더미 토큰 사용)
    const dummyToken = 'test-token';  // 실제 환경에서는 유효한 토큰 필요
    
    // 2. 배송 목록 조회 테스트
    console.log('📋 배송 목록 조회 테스트...');
    try {
      const listResponse = await axios.get('http://localhost:8080/api/delivery/list?status=pending', {
        headers: { 'Authorization': `Bearer ${dummyToken}` }
      });
      console.log(`✅ 배송 목록 조회 성공: ${listResponse.data.deliveries?.length || 0}개 항목`);
      console.log(`   첫 번째 항목 tracking_number: ${listResponse.data.deliveries?.[0]?.tracking_number || 'N/A'}\n`);
    } catch (error) {
      console.log('⚠️  배송 목록 조회 실패 (더미 데이터로 폴백 예상):', error.response?.status || 'Network Error');
    }
    
    // 3. 배송 상세정보 조회 테스트 (더미 데이터)
    console.log('📦 배송 상세정보 조회 테스트...');
    try {
      const detailResponse = await axios.get('http://localhost:8080/api/delivery/detail/MK202401001', {
        headers: { 'Authorization': `Bearer ${dummyToken}` }
      });
      
      const delivery = detailResponse.data.delivery;
      console.log('✅ 배송 상세정보 조회 성공');
      console.log(`   Tracking: ${delivery.tracking_number}`);
      console.log(`   고객: ${delivery.customerName || delivery.receiver_name}`);
      console.log(`   주소: ${delivery.customerAddress || delivery.receiver_address}`);
      
      // 새로운 통합 필드들 확인
      console.log('\n📊 통합된 필드들 확인:');
      console.log(`   delivery_fee: ${delivery.delivery_fee || 'N/A'}`);
      console.log(`   driver_name: ${delivery.driver_name || 'N/A'}`);
      console.log(`   insurance_value: ${delivery.insurance_value || 'N/A'}`);
      console.log(`   last_location: ${delivery.last_location || 'N/A'}`);
      
      // details 객체 호환성 확인
      if (delivery.details) {
        console.log('\n🔗 기존 호환성 details 객체:');
        console.log(`   details.delivery_fee: ${delivery.details.delivery_fee || 'N/A'}`);
        console.log(`   details.driver_name: ${delivery.details.driver_name || 'N/A'}`);
      }
      
    } catch (error) {
      console.log('❌ 배송 상세정보 조회 실패:', error.response?.data?.error || error.message);
    }
    
    // 4. 서명 기능 테스트 (저장)
    console.log('\n✒️  서명 기능 테스트...');
    const testSignature = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAwLDEwMCBMMzAwLDEwMCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=';
    
    try {
      const signatureResponse = await axios.post('http://localhost:8080/api/delivery/signature/MK202401001', {
        signatureData: testSignature
      }, {
        headers: { 'Authorization': `Bearer ${dummyToken}` }
      });
      
      console.log('✅ 서명 저장 성공:', signatureResponse.data.message);
    } catch (error) {
      console.log('❌ 서명 저장 실패:', error.response?.data?.error || error.message);
    }
    
    // 5. 서명 조회 테스트
    try {
      const getSignatureResponse = await axios.get('http://localhost:8080/api/delivery/signature/MK202401001', {
        headers: { 'Authorization': `Bearer ${dummyToken}` }
      });
      
      if (getSignatureResponse.data.signatureData) {
        console.log('✅ 서명 조회 성공: 서명 데이터 존재함');
      } else {
        console.log('⚠️  서명 조회 성공: 서명 데이터 없음');
      }
    } catch (error) {
      console.log('❌ 서명 조회 실패:', error.response?.data?.error || error.message);
    }
    
    console.log('\n🎉 테이블 통합 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error.message);
  }
}

if (require.main === module) {
  testUnifiedTable();
}

module.exports = testUnifiedTable;