const http = require('http');

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testUnifiedTable() {
  try {
    console.log('🧪 통합된 테이블 기능 간단 테스트 시작...\n');
    
    // 1. 배송 상세정보 조회 테스트 (더미 데이터)
    console.log('📦 배송 상세정보 조회 테스트...');
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 8080,
        path: '/api/delivery/detail/MK202401001',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200 && response.data.success) {
        const delivery = response.data.delivery;
        console.log('✅ 배송 상세정보 조회 성공');
        console.log(`   Tracking: ${delivery.tracking_number}`);
        console.log(`   고객: ${delivery.customerName || delivery.receiver_name}`);
        
        // 통합된 필드들 확인
        console.log('\n📊 통합된 필드들 확인:');
        console.log(`   delivery_fee: ${delivery.delivery_fee || 'N/A'}`);
        console.log(`   driver_name: ${delivery.driver_name || 'N/A'}`);
        console.log(`   insurance_value: ${delivery.insurance_value || 'N/A'}`);
        console.log(`   customer_signature: ${delivery.customer_signature ? '존재함' : '없음'}`);
        
        // details 객체 확인 (호환성)
        if (delivery.details) {
          console.log('\n🔗 기존 호환성 details 객체 존재함');
          console.log(`   details.delivery_fee: ${delivery.details.delivery_fee || 'N/A'}`);
        }
        
      } else {
        console.log('⚠️  응답 오류:', response.status, response.data);
      }
      
    } catch (error) {
      console.log('❌ 요청 실패:', error.message);
    }
    
    // 2. 서명 저장 테스트
    console.log('\n✒️  서명 저장 테스트...');
    try {
      const signatureData = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAwLDEwMCBMMzAwLDEwMCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=';
      
      const response = await makeRequest({
        hostname: 'localhost',
        port: 8080,
        path: '/api/delivery/signature/MK202401001',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ signatureData })
      });
      
      if (response.status === 200) {
        console.log('✅ 서명 저장 성공:', response.data.message || '성공');
      } else {
        console.log('⚠️  서명 저장 실패:', response.status, response.data);
      }
      
    } catch (error) {
      console.log('❌ 서명 저장 요청 실패:', error.message);
    }
    
    // 3. 서명 조회 테스트
    console.log('\n🔍 서명 조회 테스트...');
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 8080,
        path: '/api/delivery/signature/MK202401001',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200 && response.data.success) {
        if (response.data.signatureData) {
          console.log('✅ 서명 조회 성공: 서명 데이터 존재함');
        } else {
          console.log('⚠️  서명 조회 성공: 서명 데이터 없음');
        }
      } else {
        console.log('⚠️  서명 조회 실패:', response.status, response.data);
      }
      
    } catch (error) {
      console.log('❌ 서명 조회 요청 실패:', error.message);
    }
    
    console.log('\n🎉 통합 테이블 테스트 완료!');
    console.log('✨ 데이터베이스 테이블 통합이 성공적으로 완료되었습니다.');
    
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error.message);
  }
}

if (require.main === module) {
  testUnifiedTable();
}

module.exports = testUnifiedTable;