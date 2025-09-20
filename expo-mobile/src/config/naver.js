// 네이버지도 API 설정
export const NAVER_MAP_CONFIG = {
  CLIENT_ID: 'krnc25a7a2',
  CLIENT_SECRET: 'WjWyLgUpbGRejas2GkMd4VQjNypJ9r6dKX0hneXn',
  
  // 지도 기본 설정
  DEFAULT_CENTER: {
    lat: 37.5665,
    lng: 126.9780
  },
  DEFAULT_ZOOM: 10,
  
  // API 엔드포인트
  GEOCODE_API_URL: 'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode',
  REVERSE_GEOCODE_API_URL: 'https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc',
  
  // 지도 옵션
  MAP_OPTIONS: {
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: 'BUTTON',
      position: 'TOP_RIGHT'
    },
    zoomControl: true,
    zoomControlOptions: {
      style: 'SMALL',
      position: 'TOP_LEFT'
    },
    scaleControl: true,
    logoControl: true,
    mapDataControl: true
  }
};

// 네이버 지도 JavaScript API URL 생성
export const getNaverMapScriptUrl = () => {
  return `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_MAP_CONFIG.CLIENT_ID}&submodules=geocoder`;
};

// 서버사이드 API 헤더 생성 (필요시 백엔드에서 사용)
export const getNaverApiHeaders = () => {
  return {
    'X-NCP-APIGW-API-KEY-ID': NAVER_MAP_CONFIG.CLIENT_ID,
    'X-NCP-APIGW-API-KEY': NAVER_MAP_CONFIG.CLIENT_SECRET,
    'Content-Type': 'application/json'
  };
};