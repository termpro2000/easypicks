const pool = require('../db/connection');

async function addDeliveryFields() {
  try {
    console.log('🔄 deliveries 테이블에 개별 필드 추가 시작...');
    
    const fieldsToAdd = [
      { name: 'delivery_fee', type: 'DECIMAL(10,2) DEFAULT NULL' },
      { name: 'special_instructions', type: 'TEXT DEFAULT NULL' },
      { name: 'delivery_time_preference', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'fragile', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'insurance_value', type: 'DECIMAL(10,2) DEFAULT NULL' },
      { name: 'cod_amount', type: 'DECIMAL(10,2) DEFAULT NULL' },
      { name: 'driver_id', type: 'VARCHAR(50) DEFAULT NULL' },
      { name: 'driver_name', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'estimated_delivery', type: 'TIMESTAMP DEFAULT NULL' },
      { name: 'actual_delivery', type: 'TIMESTAMP DEFAULT NULL' },
      { name: 'delivery_attempts', type: 'INT DEFAULT 0' },
      { name: 'last_location', type: 'VARCHAR(200) DEFAULT NULL' },
      { name: 'detail_notes', type: 'TEXT DEFAULT NULL' }
    ];
    
    for (const field of fieldsToAdd) {
      try {
        const query = `ALTER TABLE deliveries ADD COLUMN ${field.name} ${field.type}`;
        await pool.execute(query);
        console.log(`✅ ${field.name} 필드 추가 완료`);
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`⚠️  ${field.name} 필드가 이미 존재합니다`);
        } else {
          console.log(`❌ ${field.name} 필드 추가 실패:`, error.message);
        }
      }
    }
    
    // 현재 테이블 구조 확인
    console.log('🔍 현재 테이블 구조 확인...');
    const [columns] = await pool.execute('SHOW COLUMNS FROM deliveries');
    console.log('📋 deliveries 테이블 총 필드 수:', columns.length);
    
    // 새로 추가된 필드들 확인
    const newFields = fieldsToAdd.map(f => f.name);
    const existingFields = columns.map(col => col.Field);
    const addedFields = newFields.filter(field => existingFields.includes(field));
    
    console.log('✅ 존재하는 새 필드들:', addedFields);
    console.log('🎉 필드 추가 완료!');
    
  } catch (error) {
    console.error('❌ 필드 추가 중 오류:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  addDeliveryFields();
}

module.exports = addDeliveryFields;