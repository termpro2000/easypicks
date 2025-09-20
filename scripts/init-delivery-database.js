const pool = require('../db/connection');
const fs = require('fs').promises;
const path = require('path');

async function initDeliveryDatabase() {
  try {

    console.log('✅ 데이터베이스 연결 성공');

    // 테이블 생성 SQL 실행
    console.log('📋 테이블 생성 중...');
    const createTableSQL = await fs.readFile(path.join(__dirname, 'create-delivery-tables.sql'), 'utf8');
    
    // SQL을 개별 문장으로 분리하여 실행
    const statements = createTableSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX')) {
        await pool.execute(statement);
        console.log('  ✅ SQL 실행 완료:', statement.substring(0, 50) + '...');
      }
    }

    // 샘플 데이터 삽입
    console.log('📦 샘플 데이터 삽입 중...');
    const insertDataSQL = await fs.readFile(path.join(__dirname, 'insert-sample-deliveries.sql'), 'utf8');
    
    const insertStatements = insertDataSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && stmt.includes('INSERT'));

    for (const statement of insertStatements) {
      try {
        await pool.execute(statement);
        console.log('  ✅ 데이터 삽입 완료');
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log('  ⚠️  중복 데이터 스킵');
        } else {
          throw error;
        }
      }
    }

    // 데이터 확인
    console.log('🔍 삽입된 데이터 확인...');
    const [deliveries] = await pool.execute('SELECT tracking_number, customer_name, status FROM deliveries');
    console.log('배송 데이터:', deliveries);

    const [details] = await pool.execute('SELECT delivery_id, delivery_fee, driver_name FROM delivery_details');
    console.log('상세 데이터:', details);

    console.log('🎉 데이터베이스 초기화 완료!');

  } catch (error) {
    console.error('❌ 데이터베이스 초기화 오류:', error.message);
    console.error('세부 정보:', error);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  initDeliveryDatabase();
}

module.exports = { initDeliveryDatabase };