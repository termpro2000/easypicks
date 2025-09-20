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

async function testRealSignature() {
  try {
    console.log('🧪 실제 데이터로 서명 API 테스트...\n');
    
    const realTrackingNumber = 'MD2025090308082'; // DB에 실제 존재하는 번호
    
    // 1. 서명 저장 테스트
    console.log('📝 서명 저장 테스트:', realTrackingNumber);
    const testSignature = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAwLDEwMCBMMzAwLDEwMCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=';
    
    const saveResponse = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: `/api/delivery/signature/${realTrackingNumber}`,
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
      path: `/api/delivery/signature/${realTrackingNumber}`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log(`조회 응답: ${getResponse.status}`);
    console.log('조회 결과:', getResponse.data);
    
    if (getResponse.data.signatureData) {
      console.log('✅ 서명 데이터 확인됨, 길이:', getResponse.data.signatureData.length);
    }
    
    console.log('\n🎉 서명 기능 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error);
  }
}

if (require.main === module) {
  testRealSignature();
}

module.exports = testRealSignature;