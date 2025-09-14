const { pool } = require('../config/database');

async function addProductCodes() {
  try {
    console.log('products 테이블에 maincode, subcode 필드 추가 중...');
    
    // maincode 컬럼 추가
    await pool.execute(`
      ALTER TABLE products 
      ADD COLUMN maincode VARCHAR(50) NULL AFTER user_id
    `);
    console.log('maincode 컬럼 추가 완료');
    
    // subcode 컬럼 추가  
    await pool.execute(`
      ALTER TABLE products 
      ADD COLUMN subcode VARCHAR(50) NULL AFTER maincode
    `);
    console.log('subcode 컬럼 추가 완료');
    
    console.log('products 테이블 업데이트 완료!');
    
  } catch (error) {
    console.error('마이그레이션 오류:', error);
  } finally {
    process.exit();
  }
}

addProductCodes();