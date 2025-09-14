import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    naver: any;
  }
}

interface SimpleNaverMapProps {
  address?: string;
  width?: string;
  height?: string;
  zoom?: number;
  className?: string;
}

const SimpleNaverMap: React.FC<SimpleNaverMapProps> = ({
  address,
  width = '100%',
  height = '300px',
  zoom = 15,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const loadNaverMapScript = () => {
      if (window.naver && window.naver.maps) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${import.meta.env.VITE_NAVER_MAP_CLIENT_ID}`;
      script.async = true;
      script.onload = () => {
        initMap();
      };
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || !window.naver) return;

      const mapOptions = {
        center: new window.naver.maps.LatLng(37.5665, 126.9780), // 서울시청
        zoom: zoom,
        mapTypeControl: false,
        scaleControl: false,
        logoControl: true,
        mapDataControl: false,
        zoomControl: true,
        zoomControlOptions: {
          style: window.naver.maps.ZoomControlStyle.SMALL,
          position: window.naver.maps.Position.TOP_RIGHT
        }
      };

      mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, mapOptions);
    };

    loadNaverMapScript();

    return () => {
      const existingScript = document.querySelector('script[src*="openapi.map.naver.com"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [zoom]);

  useEffect(() => {
    if (address && mapInstanceRef.current && window.naver) {
      searchAddress(address);
    }
  }, [address]);

  const searchAddress = (searchAddress: string) => {
    if (!window.naver || !mapInstanceRef.current) return;

    // 네이버 지도 Geocoder 사용
    window.naver.maps.Service.geocode({
      query: searchAddress
    }, (status: any, response: any) => {
      if (status === window.naver.maps.Service.Status.ERROR) {
        console.error('주소 검색 실패');
        return;
      }

      if (response.v2.meta.totalCount === 0) {
        console.log('검색 결과가 없습니다');
        return;
      }

      const item = response.v2.addresses[0];
      const point = new window.naver.maps.Point(item.x, item.y);
      const position = new window.naver.maps.LatLng(point.y, point.x);

      // 지도 중심 이동
      mapInstanceRef.current.setCenter(position);
      mapInstanceRef.current.setZoom(zoom);

      // 기존 마커 제거
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // 새 마커 추가
      markerRef.current = new window.naver.maps.Marker({
        position: position,
        map: mapInstanceRef.current
      });
    });
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      <div 
        ref={mapRef}
        style={{ width, height }}
        className="w-full"
      />
    </div>
  );
};

export default SimpleNaverMap;