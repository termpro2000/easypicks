const pool = require('../db/connection');

async function updateDeliveriesTable() {
  try {
    console.log('🔧 deliveries 테이블에 새 컬럼 추가 중...');

    // 새로운 컬럼들을 하나씩 추가
    const newColumns = [
      // 기본 정보
      { name: 'request_type', type: 'VARCHAR(20) DEFAULT "일반"' },
      { name: 'construction_type', type: 'VARCHAR(50)' },
      { name: 'shipment_type', type: 'VARCHAR(50)' },
      { name: 'visit_date', type: 'DATE' },
      { name: 'visit_time', type: 'VARCHAR(50)' },
      { name: 'assigned_driver', type: 'VARCHAR(50)' },
      { name: 'furniture_company', type: 'VARCHAR(100)' },
      { name: 'main_memo', type: 'TEXT' },
      { name: 'emergency_contact', type: 'VARCHAR(20)' },
      
      // 고객 정보 (기존 receiver_* 컬럼 대신 사용)
      { name: 'customer_name', type: 'VARCHAR(100)' },
      { name: 'customer_phone', type: 'VARCHAR(20)' },
      { name: 'customer_address', type: 'TEXT' },
      
      // 현장 정보
      { name: 'building_type', type: 'VARCHAR(50)' },
      { name: 'floor_count', type: 'VARCHAR(20)' },
      { name: 'elevator_available', type: 'VARCHAR(10)' },
      { name: 'ladder_truck', type: 'VARCHAR(10)' },
      { name: 'disposal', type: 'VARCHAR(10)' },
      { name: 'room_movement', type: 'VARCHAR(10)' },
      { name: 'wall_construction', type: 'VARCHAR(10)' },
      
      // 상품 정보
      { name: 'product_name', type: 'VARCHAR(200)' },
      { name: 'furniture_product_code', type: 'VARCHAR(100)' },
      { name: 'product_weight', type: 'VARCHAR(20)' },
      { name: 'product_size', type: 'VARCHAR(100)' },
      { name: 'box_size', type: 'VARCHAR(100)' },
      
      // 메모
      { name: 'furniture_requests', type: 'TEXT' },
      { name: 'driver_notes', type: 'TEXT' },
      { name: 'installation_photos', type: 'JSON' }
    ];

    for (const column of newColumns) {
      try {
        await pool.execute(`ALTER TABLE deliveries ADD COLUMN ${column.name} ${column.type}`);
        console.log(`  ✅ ${column.name} 컬럼 추가 완료`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`  ⚠️  ${column.name} 컬럼 이미 존재`);
        } else {
          console.log(`  ❌ ${column.name} 컬럼 추가 실패:`, error.message);
        }
      }
    }

    console.log('🎉 테이블 업데이트 완료!');

    // 업데이트된 테이블 구조 확인
    console.log('\n📦 업데이트된 deliveries 테이블 구조:');
    const [columns] = await pool.execute('DESCRIBE deliveries');
    console.log('총 컬럼 수:', columns.length);
    
    // 중요한 컬럼들만 표시
    const importantColumns = columns.filter(col => 
      ['tracking_number', 'customer_name', 'product_name', 'furniture_requests', 'driver_notes'].includes(col.Field)
    );
    console.table(importantColumns);

  } catch (error) {
    console.error('❌ 테이블 업데이트 오류:', error.message);
    console.error('세부 정보:', error);
  }
}

if (require.main === module) {
  updateDeliveriesTable();
}

module.exports = { updateDeliveriesTable };