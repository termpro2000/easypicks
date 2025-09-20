const pool = require('../db/connection');

async function mergeDeliveryTables() {
  try {
    console.log('🔄 배송 테이블 통합 시작...');
    
    // 1. deliveries 테이블에 delivery_details 필드들 추가
    console.log('📋 deliveries 테이블에 새 필드들 추가...');
    
    const alterQueries = [
      `ALTER TABLE deliveries 
       ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT NULL,
       ADD COLUMN special_instructions TEXT DEFAULT NULL,
       ADD COLUMN delivery_time_preference VARCHAR(100) DEFAULT NULL,
       ADD COLUMN fragile BOOLEAN DEFAULT FALSE,
       ADD COLUMN insurance_value DECIMAL(10,2) DEFAULT NULL,
       ADD COLUMN cod_amount DECIMAL(10,2) DEFAULT NULL,
       ADD COLUMN driver_id VARCHAR(50) DEFAULT NULL,
       ADD COLUMN driver_name VARCHAR(100) DEFAULT NULL,
       ADD COLUMN estimated_delivery TIMESTAMP DEFAULT NULL,
       ADD COLUMN actual_delivery TIMESTAMP DEFAULT NULL,
       ADD COLUMN delivery_attempts INT DEFAULT 0,
       ADD COLUMN last_location VARCHAR(200) DEFAULT NULL,
       ADD COLUMN detail_notes TEXT DEFAULT NULL,
       ADD COLUMN customer_signature LONGTEXT DEFAULT NULL`,
    ];
    
    for (const query of alterQueries) {
      try {
        await pool.execute(query);
        console.log('✅ 필드 추가 완료');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠️  필드가 이미 존재합니다 (건너뜀)');
        } else {
          console.log('⚠️  필드 추가 중 오류:', error.message);
        }
      }
    }
    
    // 2. 기존 delivery_details 데이터를 deliveries로 이전
    console.log('📦 기존 데이터 이전 중...');
    
    const migrateQuery = `
      UPDATE deliveries d
      LEFT JOIN delivery_details dd ON d.id = dd.delivery_id
      SET 
        d.delivery_fee = COALESCE(d.delivery_fee, dd.delivery_fee),
        d.special_instructions = COALESCE(d.special_instructions, dd.special_instructions),
        d.delivery_time_preference = COALESCE(d.delivery_time_preference, dd.delivery_time_preference),
        d.fragile = COALESCE(d.fragile, dd.fragile),
        d.insurance_value = COALESCE(d.insurance_value, dd.insurance_value),
        d.cod_amount = COALESCE(d.cod_amount, dd.cod_amount),
        d.driver_id = COALESCE(d.driver_id, dd.driver_id),
        d.driver_name = COALESCE(d.driver_name, dd.driver_name),
        d.estimated_delivery = COALESCE(d.estimated_delivery, dd.estimated_delivery),
        d.actual_delivery = COALESCE(d.actual_delivery, dd.actual_delivery),
        d.delivery_attempts = COALESCE(d.delivery_attempts, dd.delivery_attempts),
        d.last_location = COALESCE(d.last_location, dd.last_location),
        d.detail_notes = COALESCE(d.detail_notes, dd.notes)
      WHERE dd.id IS NOT NULL
    `;
    
    try {
      const [result] = await pool.execute(migrateQuery);
      console.log(`✅ ${result.affectedRows}개 레코드 데이터 이전 완료`);
    } catch (error) {
      console.log('⚠️  데이터 이전 중 오류:', error.message);
    }
    
    // 3. 인덱스 추가 (성능 향상)
    console.log('🚀 성능 최적화 인덱스 추가...');
    
    const indexQueries = [
      'CREATE INDEX idx_deliveries_driver_id ON deliveries(driver_id)',
      'CREATE INDEX idx_deliveries_estimated_delivery ON deliveries(estimated_delivery)',
      'CREATE INDEX idx_deliveries_actual_delivery ON deliveries(actual_delivery)'
    ];
    
    for (const indexQuery of indexQueries) {
      try {
        await pool.execute(indexQuery);
        console.log('✅ 인덱스 추가 완료');
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log('⚠️  인덱스가 이미 존재합니다 (건너뜀)');
        } else {
          console.log('⚠️  인덱스 추가 중 오류:', error.message);
        }
      }
    }
    
    // 4. 변경사항 확인
    console.log('🔍 테이블 구조 확인...');
    const [columns] = await pool.execute('SHOW COLUMNS FROM deliveries');
    console.log('📋 deliveries 테이블 필드 수:', columns.length);
    
    // 새로 추가된 필드들 확인
    const newFields = [
      'delivery_fee', 'special_instructions', 'delivery_time_preference', 
      'fragile', 'insurance_value', 'cod_amount', 'driver_id', 'driver_name',
      'estimated_delivery', 'actual_delivery', 'delivery_attempts', 
      'last_location', 'detail_notes', 'customer_signature'
    ];
    
    const existingFields = columns.map(col => col.Field);
    const addedFields = newFields.filter(field => existingFields.includes(field));
    
    console.log('✅ 추가된 필드들:', addedFields);
    console.log('🎉 테이블 통합 완료!');
    
  } catch (error) {
    console.error('❌ 테이블 통합 중 오류:', error);
  } finally {
    await pool.end();
  }
}

// 스크립트 실행
if (require.main === module) {
  mergeDeliveryTables();
}

module.exports = mergeDeliveryTables;