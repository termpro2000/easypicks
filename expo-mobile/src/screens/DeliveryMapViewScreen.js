import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getNaverMapScriptUrl } from '../config/naver';

const DeliveryMapViewScreen = ({ navigation, route }) => {
  const { deliveries } = route.params;
  const [loading, setLoading] = useState(true);
  const [mapHtml, setMapHtml] = useState('');

  useEffect(() => {
    generateMapHtml();
  }, []);

  const generateMapHtml = () => {
    // 배송지 주소들을 기반으로 네이버지도 HTML 생성
    const markers = deliveries.map((delivery, index) => ({
      id: delivery.id,
      number: index + 1,
      address: delivery.customerAddress,
      name: delivery.customerName,
      trackingNumber: delivery.trackingNumber,
    }));

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>배송지 지도</title>
    <script type="text/javascript" src="${getNaverMapScriptUrl()}"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }
        #map {
            width: 100%;
            height: 100vh;
        }
        .marker-info {
            padding: 8px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            min-width: 200px;
            max-width: 250px;
        }
        .marker-number {
            background: #2196F3;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 11px;
            margin-right: 8px;
        }
        .marker-title {
            font-weight: bold;
            margin-bottom: 4px;
        }
        .marker-address {
            color: #666;
            font-size: 12px;
            line-height: 1.4;
        }
        .loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 1000;
        }
        .delivery-list {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            border-radius: 20px 20px 0 0;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
            transition: transform 0.3s ease-out;
            z-index: 100;
            max-height: 67vh;
            display: flex;
            flex-direction: column;
        }
        .delivery-list.collapsed {
            transform: translateY(calc(100% - 80px));
        }
        .delivery-list.expanded {
            transform: translateY(0);
        }
        .slider-handle {
            width: 40px;
            height: 4px;
            background: #ddd;
            border-radius: 2px;
            margin: 12px auto 8px;
            cursor: pointer;
            flex-shrink: 0;
        }
        .slider-header {
            padding: 8px 20px;
            border-bottom: 1px solid #f0f0f0;
            flex-shrink: 0;
            cursor: pointer;
        }
        .delivery-items-container {
            flex: 1;
            overflow-y: auto;
            padding: 10px 20px 20px;
        }
        .delivery-item {
            display: flex;
            align-items: center;
            padding: 5px;
            margin: 2px 0;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        .delivery-item:hover {
            background: #f0f0f0;
        }
        .delivery-number {
            background: #2196F3;
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 10px;
            margin-right: 8px;
            flex-shrink: 0;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <div id="loading" class="loading">
        <div>지도를 로딩 중입니다...</div>
    </div>
    
    <div class="delivery-list collapsed" id="delivery-list">
        <div class="slider-handle" id="slider-handle"></div>
        <div class="slider-header" id="slider-header">
            <div style="font-weight: bold; color: #2196F3; text-align: center;">
                배송 순서 (<span id="delivery-count">0</span>)
            </div>
        </div>
        <div class="delivery-items-container">
            <div id="delivery-items"></div>
        </div>
    </div>

    <script>
        // 마커 데이터
        const markersData = ${JSON.stringify(markers)};
        
        let map;
        const markers = [];
        const infoWindows = [];
        
        // 로딩 숨기기
        function hideLoading() {
            document.getElementById('loading').style.display = 'none';
        }
        
        // 슬라이더 상태 관리
        let isExpanded = false;
        
        // 슬라이더 토글
        function toggleSlider() {
            const deliveryList = document.getElementById('delivery-list');
            isExpanded = !isExpanded;
            
            if (isExpanded) {
                deliveryList.classList.remove('collapsed');
                deliveryList.classList.add('expanded');
            } else {
                deliveryList.classList.remove('expanded');
                deliveryList.classList.add('collapsed');
            }
        }
        
        // 배송 목록 렌더링
        function renderDeliveryList() {
            const container = document.getElementById('delivery-items');
            const countElement = document.getElementById('delivery-count');
            
            container.innerHTML = '';
            countElement.textContent = markersData.length;
            
            markersData.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'delivery-item';
                div.onclick = () => focusMarker(index);
                div.innerHTML = \`
                    <div class="delivery-number">\${item.number}</div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">\${item.name}</div>
                        <div style="color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">\${item.address}</div>
                    </div>
                \`;
                container.appendChild(div);
            });
        }
        
        // 슬라이더 이벤트 리스너 추가
        function setupSliderEvents() {
            const sliderHandle = document.getElementById('slider-handle');
            const sliderHeader = document.getElementById('slider-header');
            
            sliderHandle.onclick = toggleSlider;
            sliderHeader.onclick = toggleSlider;
            
            // 터치 이벤트도 지원
            let startY = 0;
            let startExpanded = false;
            
            const deliveryList = document.getElementById('delivery-list');
            
            function handleTouchStart(e) {
                startY = e.touches[0].clientY;
                startExpanded = isExpanded;
            }
            
            function handleTouchMove(e) {
                e.preventDefault();
                const currentY = e.touches[0].clientY;
                const diff = startY - currentY;
                
                // 위로 스와이프하면 확장, 아래로 스와이프하면 축소
                if (diff > 50 && !startExpanded) {
                    isExpanded = true;
                    deliveryList.classList.remove('collapsed');
                    deliveryList.classList.add('expanded');
                } else if (diff < -50 && startExpanded) {
                    isExpanded = false;
                    deliveryList.classList.remove('expanded');
                    deliveryList.classList.add('collapsed');
                }
            }
            
            sliderHandle.addEventListener('touchstart', handleTouchStart, {passive: false});
            sliderHandle.addEventListener('touchmove', handleTouchMove, {passive: false});
            sliderHeader.addEventListener('touchstart', handleTouchStart, {passive: false});
            sliderHeader.addEventListener('touchmove', handleTouchMove, {passive: false});
        }
        
        // 마커에 포커스 (데모용)
        function focusMarker(index) {
            if (markers[index]) {
                // 마커를 하이라이트
                markers.forEach(m => m.style.transform = 'scale(1)');
                markers[index].style.transform = 'scale(1.3)';
                
                // 마커 정보를 알림으로 표시
                const markerData = markersData[index];
                alert('배송지 ' + markerData.number + '\\n' + 
                      markerData.name + '\\n' + 
                      markerData.trackingNumber + '\\n' +
                      markerData.address);
            }
        }
    </script>
    <script>
        // 네이버지도 초기화
        function initNaverMap() {
            try {
                // 네이버 지도 생성
                const mapOptions = {
                    center: new naver.maps.LatLng(37.5665, 126.9780), // 서울 중심
                    zoom: 10,
                    mapTypeControl: true,
                    mapTypeControlOptions: {
                        style: naver.maps.MapTypeControlStyle.BUTTON,
                        position: naver.maps.Position.TOP_RIGHT
                    },
                    zoomControl: true,
                    zoomControlOptions: {
                        style: naver.maps.ZoomControlStyle.SMALL,
                        position: naver.maps.Position.TOP_LEFT
                    },
                    scaleControl: true,
                    logoControl: true,
                    mapDataControl: true
                };
                
                const map = new naver.maps.Map('map', mapOptions);
                
                // 주소를 좌표로 변환하고 마커 생성
                geocodeAndCreateMarkers(map);
                
            } catch (error) {
                console.error('네이버지도 로딩 실패, 데모 지도로 대체:', error);
                initDemoMap();
            }
        }
        
        // 지오코딩 및 마커 생성
        function geocodeAndCreateMarkers(map) {
            let geocodedCount = 0;
            const totalCount = markersData.length;
            const bounds = new naver.maps.LatLngBounds();
            
            if (totalCount === 0) {
                hideLoading();
                renderDeliveryList();
                setupSliderEvents();
                return;
            }
            
            markersData.forEach((markerData, index) => {
                // 네이버 지오코딩 서비스 사용
                naver.maps.Service.geocode({
                    query: markerData.address
                }, function(status, response) {
                    geocodedCount++;
                    
                    let position;
                    if (status === naver.maps.Service.Status.OK && response.v2.meta.totalCount > 0) {
                        const result = response.v2.addresses[0];
                        position = new naver.maps.LatLng(result.y, result.x);
                    } else {
                        // 지오코딩 실패 시 서울 중심 근처에 랜덤 배치
                        console.warn('주소 지오코딩 실패:', markerData.address);
                        position = new naver.maps.LatLng(
                            37.5665 + (Math.random() - 0.5) * 0.1,
                            126.9780 + (Math.random() - 0.5) * 0.1
                        );
                    }
                    
                    // 커스텀 마커 생성
                    const marker = new naver.maps.Marker({
                        position: position,
                        map: map,
                        title: markerData.name,
                        icon: {
                            content: '<div style="background: #2196F3; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;">' + markerData.number + '</div>',
                            anchor: new naver.maps.Point(16, 16)
                        }
                    });
                    
                    // 정보창 생성
                    const infoWindow = new naver.maps.InfoWindow({
                        content: '<div style="padding: 12px; min-width: 200px; max-width: 300px;">' +
                                '<div style="font-weight: bold; color: #2196F3; margin-bottom: 8px;">' +
                                '<span style="background: #2196F3; color: white; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; margin-right: 8px;">' + markerData.number + '</span>' +
                                markerData.name +
                                '</div>' +
                                '<div style="color: #666; font-size: 12px; margin-bottom: 4px;">' + markerData.trackingNumber + '</div>' +
                                '<div style="color: #444; font-size: 13px; line-height: 1.4;">' + markerData.address + '</div>' +
                                '</div>',
                        borderWidth: 0,
                        anchorSize: new naver.maps.Size(0, 0),
                        pixelOffset: new naver.maps.Point(0, -10)
                    });
                    
                    // 마커 클릭 이벤트
                    naver.maps.Event.addListener(marker, 'click', function() {
                        // 다른 정보창들 닫기
                        markers.forEach((m, i) => {
                            if (infoWindows[i]) {
                                infoWindows[i].close();
                            }
                        });
                        // 현재 정보창 열기
                        infoWindow.open(map, marker);
                    });
                    
                    markers.push(marker);
                    infoWindows.push(infoWindow);
                    bounds.extend(position);
                    
                    // 모든 지오코딩이 완료되면
                    if (geocodedCount === totalCount) {
                        hideLoading();
                        renderDeliveryList();
                        setupSliderEvents();
                        
                        // 모든 마커가 보이도록 지도 범위 조정
                        if (markers.length > 1) {
                            map.fitBounds(bounds, {
                                padding: {top: 50, right: 50, bottom: 100, left: 50}
                            });
                        } else if (markers.length === 1) {
                            map.setCenter(bounds.getCenter());
                            map.setZoom(15);
                        }
                    }
                });
            });
        }
        
        // 데모 지도 (네이버지도 로딩 실패 시)
        function initDemoMap() {
            const mapDiv = document.getElementById('map');
            mapDiv.style.background = 'linear-gradient(45deg, #e8f5e8, #f0f8ff)';
            mapDiv.style.position = 'relative';
            mapDiv.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #666; font-size: 14px; text-align: center;">🗺️ 배송지 지도<br><span style="font-size: 12px;">네이버지도 API 로드 실패 - 대체 모드</span></div>';
            
            // 마커들을 지도 영역에 랜덤하게 배치
            markersData.forEach((markerData, index) => {
                const markerDiv = document.createElement('div');
                markerDiv.style.position = 'absolute';
                markerDiv.style.left = (20 + Math.random() * 60) + '%';
                markerDiv.style.top = (20 + Math.random() * 60) + '%';
                markerDiv.style.width = '32px';
                markerDiv.style.height = '32px';
                markerDiv.style.backgroundColor = '#2196F3';
                markerDiv.style.color = 'white';
                markerDiv.style.borderRadius = '50%';
                markerDiv.style.display = 'flex';
                markerDiv.style.alignItems = 'center';
                markerDiv.style.justifyContent = 'center';
                markerDiv.style.fontWeight = 'bold';
                markerDiv.style.fontSize = '14px';
                markerDiv.style.border = '3px solid white';
                markerDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                markerDiv.style.cursor = 'pointer';
                markerDiv.style.zIndex = '10';
                markerDiv.textContent = markerData.number;
                markerDiv.title = markerData.name + ' - ' + markerData.address;
                
                markerDiv.onclick = function() {
                    alert('배송지 ' + markerData.number + '\\n' + 
                          markerData.name + '\\n' + 
                          markerData.trackingNumber + '\\n' +
                          markerData.address);
                };
                
                mapDiv.appendChild(markerDiv);
                markers.push(markerDiv);
            });
            
            hideLoading();
            renderDeliveryList();
            setupSliderEvents();
        }
        
        // 배송지 선택시 구글지도에서 해당 주소 표시
        function focusMarker(index) {
            const markerData = markersData[index];
            if (markerData) {
                // 구글지도 iframe의 주소를 선택된 배송지로 변경
                const iframe = document.querySelector('#map iframe');
                if (iframe) {
                    const encodedAddress = encodeURIComponent(markerData.address);
                    iframe.src = \`https://maps.google.com/maps?q=\${encodedAddress}&output=embed\`;
                }
                
                // 정보 표시
                alert('배송지 ' + markerData.number + '\\n' + 
                      markerData.name + '\\n' + 
                      markerData.trackingNumber + '\\n' +
                      markerData.address);
            }
        }
        
        // 지도 초기화 시작
        function startMapInit() {
            console.log('지도 초기화 시작 - 구글지도 사용');
            initGoogleMap();
        }
        
        // 구글지도 초기화
        function initGoogleMap() {
            const mapDiv = document.getElementById('map');
            
            // 구글지도 embed를 위한 iframe 생성
            if (markersData.length === 0) {
                mapDiv.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">배송지 정보가 없습니다.</div>';
                hideLoading();
                return;
            }
            
            // 첫 번째 배송지 주소로 기본 지도 표시
            const firstAddress = markersData[0].address;
            const encodedAddress = encodeURIComponent(firstAddress);
            
            // 구글지도 embed iframe 생성
            const iframe = document.createElement('iframe');
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.style.border = '0';
            iframe.loading = 'lazy';
            iframe.allowFullscreen = '';
            iframe.referrerPolicy = 'no-referrer-when-downgrade';
            // API 키 없이도 사용 가능한 구글지도 URL (검색 기반)
            iframe.src = \`https://maps.google.com/maps?q=\${encodedAddress}&output=embed\`;
            
            mapDiv.innerHTML = '';
            mapDiv.appendChild(iframe);
            
            hideLoading();
            renderDeliveryList();
            setupSliderEvents();
        }
        
        // 페이지 로드 후 실행
        document.addEventListener('DOMContentLoaded', startMapInit);
        window.onload = startMapInit;
    </script>
</body>
</html>
    `;

    setMapHtml(html);
    setLoading(false);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>지도를 준비하는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>지도로 보기</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 지도 영역 */}
      <WebView
        source={{ html: mapHtml }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        onError={(error) => {
          Alert.alert('오류', '지도를 불러올 수 없습니다.');
        }}
      />

      {/* 안내 텍스트 */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          📍 {deliveries.length}개 배송지가 번호순으로 표시됩니다
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1976D2',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  webView: {
    flex: 1,
  },
  infoContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default DeliveryMapViewScreen;