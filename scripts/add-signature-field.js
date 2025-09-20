const pool = require('../db/connection');

async function addSignatureField() {
  try {
    console.log('🖊️  deliveries 테이블에 고객 서명 필드 추가 중...');

    // 고객 서명 필드 추가
    try {
      await pool.execute(`ALTER TABLE deliveries ADD COLUMN customer_signature LONGTEXT`);
      console.log('  ✅ customer_signature 필드 추가 완료');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('  ⚠️  customer_signature 필드 이미 존재');
      } else {
        console.log('  ❌ customer_signature 필드 추가 실패:', error.message);
      }
    }

    // 테이블 구조 확인
    console.log('\n📋 업데이트된 테이블 구조:');
    const [columns] = await pool.execute('DESCRIBE deliveries');
    const signatureColumn = columns.find(col => col.Field === 'customer_signature');
    if (signatureColumn) {
      console.log('customer_signature 필드:', signatureColumn);
    }

    console.log('🎉 서명 필드 추가 완료!');

  } catch (error) {
    console.error('❌ 서명 필드 추가 오류:', error.message);
    console.error('세부 정보:', error);
  }
}

if (require.main === module) {
  addSignatureField();
}

module.exports = { addSignatureField };