/**
 * 거리 계산 유틸리티
 * 두 주소 간의 거리를 계산합니다
 */

/**
 * 두 좌표 간의 거리를 하버사인 공식으로 계산 (단위: km)
 * @param {number} lat1 - 첫 번째 지점의 위도
 * @param {number} lon1 - 첫 번째 지점의 경도  
 * @param {number} lat2 - 두 번째 지점의 위도
 * @param {number} lon2 - 두 번째 지점의 경도
 * @returns {number} 거리 (km)
 */
function calculateDistanceByCoordinates(lat1, lon1, lat2, lon2) {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // 소수점 2자리로 반올림
}

/**
 * 주소를 좌표로 변환하는 함수 (Google Geocoding API 또는 Kakao API 사용)
 * 현재는 간단한 더미 함수로 구현 - 실제로는 지오코딩 API를 사용해야 함
 * @param {string} address - 주소
 * @returns {Promise<{lat: number, lng: number}>} 좌표
 */
async function geocodeAddress(address) {
  // TODO: 실제 지오코딩 API 구현
  // 현재는 주소 기반으로 대략적인 좌표 반환
  
  // 주요 지역별 대략적인 좌표 (데모용)
  const locationMap = {
    // 서울
    '서울': { lat: 37.5665, lng: 126.9780 },
    '강남': { lat: 37.5173, lng: 127.0473 },
    '강서': { lat: 37.5509, lng: 126.8495 },
    '종로': { lat: 37.5735, lng: 126.9788 },
    
    // 경기도
    '광주': { lat: 37.4138, lng: 127.2557 },
    '초월': { lat: 37.4138, lng: 127.2557 },
    '성남': { lat: 37.4449, lng: 127.1388 },
    '수원': { lat: 37.2636, lng: 127.0286 },
    '안양': { lat: 37.3943, lng: 126.9568 },
    
    // 인천
    '인천': { lat: 37.4563, lng: 126.7052 },
    
    // 기타
    '부천': { lat: 37.5035, lng: 126.7660 },
    '의정부': { lat: 37.7381, lng: 127.0334 }
  };
  
  // 주소에서 지역명 추출
  for (const [region, coords] of Object.entries(locationMap)) {
    if (address.includes(region)) {
      return coords;
    }
  }
  
  // 기본값 (서울시청)
  return { lat: 37.5665, lng: 126.9780 };
}

/**
 * 두 주소 간의 거리 계산
 * @param {string} senderAddress - 출발지 주소
 * @param {string} customerAddress - 목적지 주소
 * @returns {Promise<number>} 거리 (km)
 */
async function calculateDistance(senderAddress, customerAddress) {
  try {
    console.log(`[거리 계산] 출발지: ${senderAddress}`);
    console.log(`[거리 계산] 목적지: ${customerAddress}`);
    
    // 두 주소를 좌표로 변환
    const senderCoords = await geocodeAddress(senderAddress);
    const customerCoords = await geocodeAddress(customerAddress);
    
    console.log(`[거리 계산] 출발지 좌표: ${senderCoords.lat}, ${senderCoords.lng}`);
    console.log(`[거리 계산] 목적지 좌표: ${customerCoords.lat}, ${customerCoords.lng}`);
    
    // 거리 계산
    const distance = calculateDistanceByCoordinates(
      senderCoords.lat, senderCoords.lng,
      customerCoords.lat, customerCoords.lng
    );
    
    console.log(`[거리 계산] 계산된 거리: ${distance}km`);
    return distance;
    
  } catch (error) {
    console.error('[거리 계산] 오류:', error);
    return 0; // 오류 발생 시 0km 반환
  }
}

module.exports = {
  calculateDistance,
  calculateDistanceByCoordinates,
  geocodeAddress
};