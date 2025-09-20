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

async function testSignatureAPI() {
  try {
    console.log('🧪 서명 API 테스트 시작...\n');
    
    // 1. 데이터베이스 구조 확인 (서명 저장 테스트)
    console.log('📝 서명 저장 테스트...');
    const testSignature = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAwLDEwMCBMMzAwLDEwMCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=';
    
    const saveResponse = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/delivery/signature/MK202401001',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ signatureData: testSignature })
    });
    
    console.log(`저장 응답: ${saveResponse.status}`);
    console.log('저장 결과:', saveResponse.data);
    
    // 2. 서명 조회 테스트
    console.log('\n🔍 서명 조회 테스트...');
    const getResponse = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/delivery/signature/MK202401001',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log(`조회 응답: ${getResponse.status}`);
    console.log('조회 결과:', getResponse.data);
    
    // 3. 배송 상세 조회로 서명 확인
    console.log('\n📦 배송 상세에서 서명 확인...');
    const detailResponse = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/delivery/detail/MK202401001',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log(`상세 조회 응답: ${detailResponse.status}`);
    if (detailResponse.data && detailResponse.data.delivery) {
      const hasSignature = !!detailResponse.data.delivery.customer_signature;
      console.log(`배송 상세에서 서명 존재 여부: ${hasSignature ? '있음' : '없음'}`);
      if (hasSignature) {
        console.log('서명 데이터 길이:', detailResponse.data.delivery.customer_signature.length);
      }
    }
    
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error);
  }
}

if (require.main === module) {
  testSignatureAPI();
}

module.exports = testSignatureAPI;