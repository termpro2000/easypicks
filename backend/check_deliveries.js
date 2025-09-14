const { pool } = require('./config/database');

async function checkDeliveries() {
  try {
    console.log('deliveries 테이블 구조 및 데이터 확인...\n');
    
    // 테이블 구조 확인
    const [columns] = await pool.execute(`
      DESCRIBE deliveries
    `);
    
    console.log('deliveries 테이블 구조:');
    console.log('==================================================');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} | NULL: ${col.Null} | 기본값: ${col.Default}`);
    });
    console.log('==================================================\n');
    
    // driver 관련 필드만 필터링
    const driverFields = columns.filter(col => 
      col.Field.toLowerCase().includes('driver') || 
      col.Field.toLowerCase().includes('assigned')
    );
    
    console.log('기사 관련 필드들:');
    driverFields.forEach(field => {
      console.log(`- ${field.Field}: ${field.Type}`);
    });
    
    // 현재 배송 데이터에서 기사 관련 정보 확인
    const [deliveries] = await pool.execute(`
      SELECT id, tracking_number, status, assigned_driver, driver_id, driver_name
      FROM deliveries 
      ORDER BY id
    `);
    
    console.log('\n현재 배송 데이터의 기사 정보:');
    console.log('==================================================');
    deliveries.forEach(delivery => {
      console.log(`ID: ${delivery.id} | 운송장: ${delivery.tracking_number} | 상태: ${delivery.status}`);
      console.log(`  - assigned_driver: ${delivery.assigned_driver || 'null'}`);
      console.log(`  - driver_id: ${delivery.driver_id || 'null'}`);
      console.log(`  - driver_name: ${delivery.driver_name || 'null'}`);
      console.log('---');
    });
    console.log('==================================================\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('deliveries 확인 중 오류:', error);
    process.exit(1);
  }
}

checkDeliveries();