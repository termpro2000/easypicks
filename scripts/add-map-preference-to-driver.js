const pool = require('../db/connection');

async function addMapPreferenceToDriver() {
  try {
    console.log('🗺️ 드라이버 테이블에 지도 앱 설정 필드 추가...\n');
    
    // drivers 테이블에 map_preference 필드 추가
    const addMapPreferenceQuery = `
      ALTER TABLE drivers 
      ADD COLUMN map_preference INT DEFAULT 0 
      COMMENT '지도 앱 설정: 0=네이버지도, 1=카카오지도, 2=티맵, 3=구글지도'
    `;
    
    try {
      await pool.execute(addMapPreferenceQuery);
      console.log('✅ map_preference 필드 추가 완료');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ map_preference 필드가 이미 존재합니다');
      } else {
        throw error;
      }
    }
    
    // 필드 추가 확인
    const [columns] = await pool.execute('SHOW COLUMNS FROM drivers');
    const mapPreferenceField = columns.find(col => col.Field === 'map_preference');
    
    if (mapPreferenceField) {
      console.log('📋 map_preference 필드 정보:');
      console.log(`   타입: ${mapPreferenceField.Type}`);
      console.log(`   NULL 허용: ${mapPreferenceField.Null}`);
      console.log(`   기본값: ${mapPreferenceField.Default}`);
      console.log(`   설명: ${mapPreferenceField.Comment || '없음'}`);
    }
    
    // 현재 드라이버들 확인
    const [drivers] = await pool.execute('SELECT user_id, name, map_preference FROM drivers LIMIT 5');
    
    console.log('\n🚚 기존 드라이버 지도 설정:');
    if (drivers.length > 0) {
      drivers.forEach(driver => {
        const mapNames = ['네이버지도', '카카오지도', '티맵', '구글지도'];
        const mapName = mapNames[driver.map_preference] || '미설정';
        console.log(`   ${driver.user_id} (${driver.name || '이름없음'}): ${mapName}`);
      });
    } else {
      console.log('   등록된 드라이버가 없습니다.');
    }
    
    console.log('\n🎉 드라이버 테이블 지도 앱 설정 필드 추가 완료!');
    
  } catch (error) {
    console.error('❌ 지도 설정 필드 추가 중 오류:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  addMapPreferenceToDriver();
}

module.exports = addMapPreferenceToDriver;