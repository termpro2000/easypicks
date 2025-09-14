const { pool } = require('./config/database');

async function updateStatusEnum() {
  try {
    console.log('Updating shipping_orders status ENUM values...');
    
    // 기존 상태값을 새로운 상태값으로 매핑
    const statusMapping = {
      '접수완료': '접수완료',
      '배송준비': '창고입고', 
      '배송중': '기사상차',
      '배송완료': '배송완료',  // 동일
      '취소': '주문취소',
      '반송': '수거완료'
    };
    
    console.log('Step 1: Adding new temporary column...');
    // 1. 새로운 임시 컬럼 추가
    await pool.execute(`
      ALTER TABLE shipping_orders 
      ADD COLUMN status_new ENUM('접수완료', '창고입고', '기사상차', '배송완료', '반품접수', '수거완료', '주문취소') DEFAULT '접수완료'
    `);
    
    console.log('Step 2: Copying data with mapping...');
    // 2. 기존 데이터를 새로운 형태로 복사
    for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
      await pool.execute(`
        UPDATE shipping_orders 
        SET status_new = ? 
        WHERE status = ?
      `, [newStatus, oldStatus]);
      console.log(`✓ Mapped ${oldStatus} -> ${newStatus}`);
    }
    
    console.log('Step 3: Dropping old column...');
    // 3. 기존 status 컬럼 삭제
    await pool.execute(`
      ALTER TABLE shipping_orders 
      DROP COLUMN status
    `);
    
    console.log('Step 4: Renaming new column...');
    // 4. 새 컬럼을 status로 이름 변경
    await pool.execute(`
      ALTER TABLE shipping_orders 
      CHANGE COLUMN status_new status ENUM('접수완료', '창고입고', '기사상차', '배송완료', '반품접수', '수거완료', '주문취소') DEFAULT '접수완료'
    `);
    
    console.log('✅ Successfully updated status ENUM values');
    console.log('New status values:');
    console.log('- 접수완료 (Order Pending)');
    console.log('- 창고입고 (Warehouse Received)');
    console.log('- 기사상차 (Driver Loaded)');
    console.log('- 배송완료 (Delivered)');
    console.log('- 반품접수 (Return Accepted)'); 
    console.log('- 수거완료 (Pickup Completed)');
    console.log('- 주문취소 (Order Cancelled)');
    
  } catch (error) {
    console.error('❌ Error updating status ENUM:', error);
  } finally {
    process.exit();
  }
}

updateStatusEnum();