#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 현재 IP 주소 얻기
function getCurrentIP() {
  try {
    const ifconfigOutput = execSync('ifconfig', { encoding: 'utf8' });
    
    // 사설 IP 주소 패턴 찾기 (127.0.0.1 제외)
    const ipMatches = ifconfigOutput.match(/inet (\d+\.\d+\.\d+\.\d+)/g);
    
    if (ipMatches) {
      for (const match of ipMatches) {
        const ip = match.replace('inet ', '');
        
        // 로컬호스트와 VM 브리지 IP 제외
        if (ip !== '127.0.0.1' && !ip.startsWith('169.254')) {
          console.log(`현재 IP 주소: ${ip}`);
          return ip;
        }
      }
    }
    
    throw new Error('IP 주소를 찾을 수 없습니다');
  } catch (error) {
    console.error('IP 주소 감지 실패:', error.message);
    return null;
  }
}

// 파일 업데이트
function updateIPInFile(filePath, currentIP) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // IP 주소 패턴 찾기 및 교체
    const ipRegex = /http:\/\/\d+\.\d+\.\d+\.\d+:8080\/api/g;
    const newURL = `http://${currentIP}:8080/api`;
    
    if (ipRegex.test(content)) {
      content = content.replace(ipRegex, newURL);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 업데이트 완료: ${path.basename(filePath)} -> ${newURL}`);
      return true;
    } else {
      console.log(`⚠️  IP 패턴을 찾을 수 없음: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 파일 업데이트 실패: ${filePath}`, error.message);
    return false;
  }
}

// 메인 실행
function main() {
  console.log('🔄 동적 IP 주소 업데이트 시작...\n');
  
  const currentIP = getCurrentIP();
  if (!currentIP) {
    console.error('❌ IP 주소를 감지할 수 없어 종료합니다.');
    process.exit(1);
  }
  
  // 업데이트할 파일 목록
  const filesToUpdate = [
    path.join(__dirname, '../expo-mobile/src/config/api.js'),
    path.join(__dirname, '../expo-mobile/src/screens/DeliveryDetailScreen.js')
  ];
  
  let updateCount = 0;
  
  for (const filePath of filesToUpdate) {
    if (fs.existsSync(filePath)) {
      if (updateIPInFile(filePath, currentIP)) {
        updateCount++;
      }
    } else {
      console.log(`⚠️  파일이 존재하지 않음: ${filePath}`);
    }
  }
  
  console.log(`\n✨ 완료: ${updateCount}개 파일이 업데이트되었습니다.`);
  console.log(`📱 Expo 앱을 새로고침하면 새 IP 주소로 연결됩니다: ${currentIP}`);
}

if (require.main === module) {
  main();
}