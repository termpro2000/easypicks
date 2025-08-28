const pool = require('../config/database').pool;

async function seedQRCodeData() {
  console.log('🔧 QR 코드 샘플 데이터 추가 중...\n');

  try {
    // 샘플 QR 코드 데이터
    const sampleData = [
      {
        qr_code: 'EASY001',
        product_name: '삼성 갤럭시 스마트폰',
        quantity: 1,
        weight: 0.2,
        size: '15x7x1',
        description: '최신 안드로이드 스마트폰'
      },
      {
        qr_code: 'EASY002',
        product_name: 'iPad Pro 12.9인치',
        quantity: 1,
        weight: 0.68,
        size: '28x21x0.6',
        description: 'Apple 태블릿 컴퓨터'
      },
      {
        qr_code: 'EASY003',
        product_name: '무선 블루투스 헤드폰',
        quantity: 2,
        weight: 0.3,
        size: '20x18x8',
        description: '노이즈 캔슬링 기능 포함'
      },
      {
        qr_code: 'EASY004',
        product_name: '노트북 가방',
        quantity: 1,
        weight: 0.5,
        size: '40x30x5',
        description: '15인치 노트북용 가방'
      },
      {
        qr_code: 'EASY005',
        product_name: '커피머신',
        quantity: 1,
        weight: 4.2,
        size: '35x25x30',
        description: '원터치 에스프레소 머신'
      }
    ];

    // 데이터 삽입
    for (const item of sampleData) {
      await pool.execute(`
        INSERT INTO qrcorddb (qr_code, product_name, quantity, weight, size, description)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        product_name = VALUES(product_name),
        quantity = VALUES(quantity),
        weight = VALUES(weight),
        size = VALUES(size),
        description = VALUES(description)
      `, [item.qr_code, item.product_name, item.quantity, item.weight, item.size, item.description]);
    }

    console.log('✅ QR 코드 샘플 데이터가 성공적으로 추가되었습니다!\n');
    console.log('📋 추가된 QR 코드:');
    sampleData.forEach((item, index) => {
      console.log(`${index + 1}. ${item.qr_code} - ${item.product_name}`);
    });
    
    console.log('\n🧪 테스트 방법:');
    console.log('1. 프론트엔드에서 배송 접수 3단계로 이동');
    console.log('2. QR 코드 입력란에 "EASY001" 등 입력');
    console.log('3. QR코드 버튼 클릭하여 정보 자동 입력 확인');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ QR 코드 데이터 추가 중 오류:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  seedQRCodeData();
}

module.exports = { seedQRCodeData };