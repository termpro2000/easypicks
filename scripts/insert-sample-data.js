const pool = require('../db/connection');

async function insertSampleData() {
  try {
    console.log('📦 샘플 데이터 업데이트 중...');

    // 기존 데이터에 새 필드 업데이트
    const sampleData = [
      {
        tracking_number: 'MK202401001',
        data: {
          request_type: '일반',
          construction_type: '조립설치',
          shipment_type: '직배송',
          visit_date: '2024-01-17',
          visit_time: '14:00-18:00',
          assigned_driver: '김기사',
          furniture_company: '한샘가구',
          main_memo: '신속 배송 요청',
          emergency_contact: '010-9999-8888',
          customer_name: '이영희',
          customer_phone: '010-1234-5678',
          customer_address: '부산시 해운대구 마린시티 456',
          building_type: '아파트',
          floor_count: '15층',
          elevator_available: '있음',
          ladder_truck: '불필요',
          disposal: '없음',
          room_movement: '있음',
          wall_construction: '필요',
          product_name: '3인용 소파 세트',
          furniture_product_code: 'HSM-SF-001',
          product_weight: '45kg',
          product_size: '220 x 90 x 80cm',
          box_size: '230 x 100 x 90cm',
          furniture_requests: '소파 배치 시 TV 보는 각도 고려 부탁드립니다.',
          driver_notes: '엘리베이터 사용 가능, 고객 매우 친절함',
          installation_photos: JSON.stringify([
            'https://picsum.photos/300/300?random=1',
            'https://picsum.photos/300/300?random=2',
            'https://picsum.photos/300/300?random=3',
            'https://picsum.photos/300/300?random=4'
          ])
        }
      },
      {
        tracking_number: 'MK202401002',
        data: {
          request_type: '쿠방',
          construction_type: '단순배송',
          shipment_type: '물류센터경유',
          visit_date: '2024-01-16',
          visit_time: '09:00-12:00',
          assigned_driver: '이기사',
          furniture_company: '이케아',
          main_memo: '냉장상품 - 온도관리 주의',
          emergency_contact: '010-8888-7777',
          customer_name: '최지훈',
          customer_phone: '010-9876-5432',
          customer_address: '대구시 수성구 동대구로 321',
          building_type: '빌라',
          floor_count: '5층',
          elevator_available: '없음',
          ladder_truck: '필요',
          disposal: '있음',
          room_movement: '있음',
          wall_construction: '불필요',
          product_name: '냉장고 (4도어)',
          furniture_product_code: 'IKEA-RF-402',
          product_weight: '85kg',
          product_size: '180 x 60 x 70cm',
          box_size: '190 x 70 x 80cm',
          furniture_requests: '냉장고 설치 후 전원 연결 및 동작 테스트 필수',
          driver_notes: '5층 엘리베이터 없음, 사다리차 이용함',
          installation_photos: JSON.stringify([
            'https://picsum.photos/300/300?random=5',
            'https://picsum.photos/300/300?random=6'
          ])
        }
      }
    ];

    // 각 샘플 데이터 업데이트
    for (const sample of sampleData) {
      try {
        const setClause = Object.entries(sample.data)
          .map(([key, value]) => `${key} = ?`)
          .join(', ');
        
        const values = Object.values(sample.data);
        values.push(sample.tracking_number);

        await pool.execute(
          `UPDATE deliveries SET ${setClause} WHERE tracking_number = ?`,
          values
        );

        console.log(`  ✅ ${sample.tracking_number} 데이터 업데이트 완료`);
      } catch (error) {
        console.log(`  ❌ ${sample.tracking_number} 업데이트 실패:`, error.message);
      }
    }

    // 업데이트된 데이터 확인
    console.log('\n🔍 업데이트된 데이터 확인...');
    const [deliveries] = await pool.execute(`
      SELECT 
        tracking_number, 
        customer_name, 
        product_name, 
        furniture_company,
        request_type,
        status
      FROM deliveries 
      WHERE tracking_number IN ('MK202401001', 'MK202401002')
    `);

    console.table(deliveries);

    // 상세 데이터 하나만 확인
    console.log('\n📋 상세 데이터 샘플 (MK202401001):');
    const [detail] = await pool.execute(`
      SELECT 
        customer_name,
        customer_address,
        product_name,
        furniture_requests,
        driver_notes,
        installation_photos
      FROM deliveries 
      WHERE tracking_number = 'MK202401001'
    `);

    if (detail.length > 0) {
      const data = detail[0];
      console.log('고객명:', data.customer_name);
      console.log('주소:', data.customer_address);
      console.log('상품:', data.product_name);
      console.log('가구사 요청:', data.furniture_requests);
      console.log('기사 메모:', data.driver_notes);
      
      if (data.installation_photos) {
        const photos = JSON.parse(data.installation_photos);
        console.log('설치 사진:', photos.length + '장');
      }
    }

    console.log('\n🎉 샘플 데이터 업데이트 완료!');

  } catch (error) {
    console.error('❌ 샘플 데이터 업데이트 오류:', error.message);
    console.error('세부 정보:', error);
  }
}

if (require.main === module) {
  insertSampleData();
}

module.exports = { insertSampleData };