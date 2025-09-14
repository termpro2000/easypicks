import React, { useState, useRef, useEffect } from 'react';
import { QrCode, X, Check, AlertTriangle, Camera } from 'lucide-react';
import QrScanner from 'qr-scanner';

interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQRCodeScanned: (code: string) => void;
}

const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({
  isOpen,
  onClose,
  onQRCodeScanned
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [hasCamera, setHasCamera] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // QR 스캐너 시작
  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setError('');
      setScannedCode('');

      // QR 스캐너 인스턴스 생성
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          // QR 코드가 인식되었을 때
          console.log('QR Code detected:', result.data);
          setScannedCode(result.data);
          stopScanning();
          
          // 부모 컴포넌트로 결과 전달
          onQRCodeScanned(result.data);
          onClose();
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment' // 후면 카메라 우선
        }
      );

      // 스캐닝 시작
      await qrScannerRef.current.start();
      
    } catch (error: any) {
      console.error('QR 스캐너 시작 오류:', error);
      setError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
      setIsScanning(false);
      setHasCamera(false);
    }
  };

  // QR 스캐너 중지
  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  // 모달 닫기
  const handleClose = () => {
    stopScanning();
    setScannedCode('');
    setError('');
    setHasCamera(true);
    onClose();
  };

  // 컴포넌트 언마운트 시 스캐너 정리
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  // 모달이 열릴 때 자동으로 스캐닝 시작
  useEffect(() => {
    if (isOpen && !isScanning && !scannedCode && !error) {
      const timer = setTimeout(() => {
        startScanning();
      }, 500); // 약간의 지연 후 시작
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-green-600" />
              QR코드 스캔
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-red-800">카메라 오류</h3>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={startScanning}
                className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 스캐닝 완료 메시지 */}
          {scannedCode && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-green-800">QR코드 인식 완료</h3>
              </div>
              <p className="text-green-700 font-medium break-all">{scannedCode}</p>
            </div>
          )}

          {/* QR 스캐너 화면 */}
          {!error && (
            <div className="mb-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-auto max-h-96 object-contain"
                  autoPlay
                  playsInline
                />
                
                {/* 스캐닝 오버레이 */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-green-400 rounded-lg relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                      
                      {/* 스캔 라인 애니메이션 */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-green-400 animate-pulse"></div>
                    </div>
                  </div>
                )}

                {/* 컨트롤 버튼 */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                  {isScanning ? (
                    <button
                      onClick={stopScanning}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      스캔 중지
                    </button>
                  ) : !scannedCode && !error && (
                    <button
                      onClick={startScanning}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      스캔 시작
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 안내 메시지 */}
          {isScanning && (
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                QR코드를 카메라 화면에 맞춰주세요
              </p>
              <p className="text-sm text-gray-500">
                QR코드가 인식되면 자동으로 상품코드 필드에 입력됩니다
              </p>
            </div>
          )}

          {/* 카메라 지원 안내 */}
          {!hasCamera && !error && (
            <div className="text-center py-8">
              <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">카메라 준비 중</h3>
              <p className="text-gray-500 mb-4">
                QR코드 스캔을 위해 카메라 권한이 필요합니다
              </p>
              <button
                onClick={startScanning}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                카메라 시작
              </button>
            </div>
          )}

          {/* 닫기 버튼 */}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScannerModal;