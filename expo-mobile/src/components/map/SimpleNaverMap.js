import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const SimpleNaverMap = ({ 
  address = '서울시청',
  width = '100%',
  height = 300,
  zoom = 16,
  className = ''
}) => {

  const encodedAddress = encodeURIComponent(address || '서울시청');
  const naverMapUrl = `https://m.map.naver.com/search2/search.nhn?query=${encodedAddress}`;

  return (
    <View style={[styles.container, { height: Math.max(height, 300) }]}>
      <WebView
        source={{ uri: naverMapUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>🗺️ 네이버지도 로딩 중...</Text>
          </View>
        )}
        onLoadStart={() => {
          console.log('네이버지도 로딩 시작:', address);
        }}
        onLoadEnd={() => {
          console.log('네이버지도 로딩 완료:', address);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('네이버지도 오류:', nativeEvent);
        }}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
        originWhitelist={['*']}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        scalesPageToFit={true}
        bounces={false}
        scrollEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    minHeight: 300,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default SimpleNaverMap;