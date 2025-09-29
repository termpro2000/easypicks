const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

/**
 * f_price 테이블 생성 및 데이터 삽입 스크립트
 */

async function createFPriceTable() {
  try {
    console.log('🏗️ f_price 테이블 생성 중...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS f_price (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(255) NOT NULL COMMENT '상품 카테고리',
        size VARCHAR(50) NOT NULL COMMENT '사이즈',
        narim_cost INT DEFAULT NULL COMMENT '내림비',
        stair_2f INT DEFAULT NULL COMMENT '계단(2층)',
        stair_3f INT DEFAULT NULL COMMENT '계단(3층)',
        stair_4f INT DEFAULT NULL COMMENT '계단(4층)',
        driver_10_increase INT DEFAULT NULL COMMENT '기사(10%인상)',
        future_cost INT DEFAULT NULL COMMENT '미래',
        profit_39 INT DEFAULT NULL COMMENT '수익률(39)',
        jeju_jeonla INT DEFAULT NULL COMMENT '제주도/전라도',
        profit_62 INT DEFAULT NULL COMMENT '수익률(62)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category_size (category, size)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='설치기사 10% 인상 배송단가표'
    `;
    
    await pool.execute(createTableSQL);
    console.log('✅ f_price 테이블 생성 완료');
    
  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error);
    throw error;
  }
}

async function insertFPriceData() {
  try {
    console.log('📊 f_price 데이터 삽입 중...');
    
    // JSON 파일 읽기
    const dataPath = path.join(__dirname, '..', 'f_price_data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const priceData = JSON.parse(rawData);
    
    console.log(`💾 ${priceData.length}개 레코드 삽입 예정`);
    
    // 기존 데이터 삭제
    await pool.execute('DELETE FROM f_price');
    console.log('🗑️ 기존 데이터 삭제 완료');
    
    // 일괄 삽입을 위한 SQL 준비
    const insertSQL = `
      INSERT INTO f_price (
        category, size, narim_cost, stair_2f, stair_3f, stair_4f,
        driver_10_increase, future_cost, profit_39, jeju_jeonla, profit_62
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // 데이터 삽입
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of priceData) {
      try {
        const values = [
          record.category,
          record.size,
          record.narim_cost,
          record.stair_2f,
          record.stair_3f,
          record.stair_4f,
          record.driver_10_increase,
          record.future_cost,
          record.profit_39,
          record.jeju_jeonla,
          record.profit_62
        ];
        
        await pool.execute(insertSQL, values);
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`📈 ${successCount}개 레코드 삽입 완료...`);
        }
        
      } catch (error) {
        console.error(`❌ 레코드 삽입 실패:`, record, error.message);
        errorCount++;
      }
    }
    
    console.log('✅ 데이터 삽입 완료');
    console.log(`📊 성공: ${successCount}개, 실패: ${errorCount}개`);
    
    // 삽입된 데이터 확인
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM f_price');
    console.log(`🔍 최종 데이터 개수: ${rows[0].total}개`);
    
    // 샘플 데이터 출력
    const [sampleRows] = await pool.execute('SELECT * FROM f_price LIMIT 5');
    console.log('📋 샘플 데이터:');
    sampleRows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.category} - ${row.size}: 기사비 ${row.driver_10_increase}원`);
    });
    
  } catch (error) {
    console.error('❌ 데이터 삽입 실패:', error);
    throw error;
  }
}

async function setupFPrice() {
  try {
    console.log('🚀 f_price 테이블 설정 시작');
    
    await createFPriceTable();
    await insertFPriceData();
    
    console.log('🎉 f_price 테이블 설정 완료!');
    
  } catch (error) {
    console.error('💥 설정 실패:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// 직접 실행시에만 동작
if (require.main === module) {
  setupFPrice();
}

module.exports = {
  createFPriceTable,
  insertFPriceData,
  setupFPrice
};