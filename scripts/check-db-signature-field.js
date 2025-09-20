const pool = require('../db/connection');

async function checkSignatureField() {
  try {
    console.log('🔍 데이터베이스 서명 필드 확인...\n');
    
    // 1. deliveries 테이블 구조 확인
    console.log('📋 deliveries 테이블 구조 확인:');
    const [columns] = await pool.execute('SHOW COLUMNS FROM deliveries');
    
    const signatureField = columns.find(col => 
      col.Field.toLowerCase().includes('signature')
    );
    
    if (signatureField) {
      console.log('✅ customer_signature 필드 존재함:');
      console.log(`   필드명: ${signatureField.Field}`);
      console.log(`   타입: ${signatureField.Type}`);
      console.log(`   NULL 허용: ${signatureField.Null}`);
      console.log(`   기본값: ${signatureField.Default}`);
    } else {
      console.log('❌ customer_signature 필드가 없음!');
      console.log('\n현재 deliveries 테이블의 필드들:');
      columns.forEach(col => {
        console.log(`   ${col.Field} (${col.Type})`);
      });
    }
    
    // 2. 테스트 데이터 확인
    console.log('\n📦 테스트 배송 데이터 확인:');
    const [deliveries] = await pool.execute(
      'SELECT tracking_number, customer_signature FROM deliveries WHERE tracking_number = ?',
      ['MK202401001']
    );
    
    if (deliveries.length > 0) {
      const delivery = deliveries[0];
      console.log(`✅ 배송 데이터 존재: ${delivery.tracking_number}`);
      console.log(`서명 데이터: ${delivery.customer_signature ? '있음' : '없음'}`);
      if (delivery.customer_signature) {
        console.log(`서명 데이터 길이: ${delivery.customer_signature.length} 문자`);
      }
    } else {
      console.log('❌ MK202401001 배송 데이터가 없음');
      
      // 다른 배송 데이터 확인
      const [allDeliveries] = await pool.execute(
        'SELECT tracking_number, customer_signature FROM deliveries LIMIT 3'
      );
      
      console.log('📋 사용 가능한 배송 데이터:');
      allDeliveries.forEach(d => {
        console.log(`   ${d.tracking_number} - 서명: ${d.customer_signature ? '있음' : '없음'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 데이터베이스 확인 중 오류:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkSignatureField();
}

module.exports = checkSignatureField;