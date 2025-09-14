/**
 * 의뢰타입 테이블 생성 및 초기 데이터 삽입
 * 테이블명: request_types
 */

const { pool } = require('../config/database');

async function createRequestTypeTable() {
  try {
    console.log('request_types 테이블 생성 시작...');

    // 테이블 생성
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS request_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE COMMENT '의뢰타입명',
        description VARCHAR(255) NULL COMMENT '설명',
        is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
        sort_order INT DEFAULT 0 COMMENT '정렬 순서',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='의뢰타입 테이블'
    `);

    console.log('request_types 테이블 생성 완료');

    // 기본 데이터 삽입
    const defaultRequestTypes = [
      { name: '일반', description: '일반 배송', sort_order: 1 },
      { name: '회수', description: '상품 회수', sort_order: 2 },
      { name: '조치', description: '조치 필요 배송', sort_order: 3 },
      { name: '쿠팡', description: '쿠팡 플랫폼 배송', sort_order: 4 },
      { name: '네이버', description: '네이버 플랫폼 배송', sort_order: 5 }
    ];

    console.log('기본 의뢰타입 데이터 삽입 시작...');

    for (const requestType of defaultRequestTypes) {
      try {
        await pool.execute(`
          INSERT INTO request_types (name, description, sort_order)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            description = VALUES(description),
            sort_order = VALUES(sort_order),
            updated_at = CURRENT_TIMESTAMP
        `, [requestType.name, requestType.description, requestType.sort_order]);

        console.log(`의뢰타입 '${requestType.name}' 삽입/업데이트 완료`);
      } catch (error) {
        console.error(`의뢰타입 '${requestType.name}' 삽입 오류:`, error.message);
      }
    }

    console.log('request_types 테이블 및 데이터 생성 완료');

    // 생성된 데이터 확인
    const [results] = await pool.execute(`
      SELECT id, name, description, is_active, sort_order, created_at 
      FROM request_types 
      ORDER BY sort_order ASC
    `);

    console.log('생성된 의뢰타입 목록:');
    results.forEach(row => {
      console.log(`- ID: ${row.id}, 이름: ${row.name}, 설명: ${row.description}, 활성: ${row.is_active ? 'Y' : 'N'}`);
    });

    return {
      success: true,
      message: 'request_types 테이블 생성 및 데이터 삽입 완료',
      data: results
    };

  } catch (error) {
    console.error('request_types 테이블 생성 오류:', error);
    throw error;
  }
}

// 직접 실행 시
if (require.main === module) {
  createRequestTypeTable()
    .then(result => {
      console.log('마이그레이션 성공:', result.message);
      process.exit(0);
    })
    .catch(error => {
      console.error('마이그레이션 실패:', error);
      process.exit(1);
    });
}

module.exports = { createRequestTypeTable };