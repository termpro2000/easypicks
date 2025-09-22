import React, { useState, useRef, useCallback } from 'react';
import { Camera, Image, X, Loader, Check, AlertTriangle } from 'lucide-react';
import Tesseract from 'tesseract.js';

interface LabelPhotographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductNameExtracted: (productName: string) => void;
}

const LabelPhotographyModal: React.FC<LabelPhotographyModalProps> = ({
  isOpen,
  onClose,
  onProductNameExtracted
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [extractedProductName, setExtractedProductName] = useState<string>('');
  const [ocrProgress, setOcrProgress] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true);
      
      // 먼저 미디어 디바이스 지원 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('이 브라우저는 카메라를 지원하지 않습니다.');
      }

      console.log('카메라 접근 시도 중...');
      
      // 카메라 스트림 요청
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: { ideal: 'environment', fallback: 'user' }
        },
        audio: false
      });
      
      console.log('카메라 스트림 획득 성공:', stream);
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        
        // 비디오 속성 설정
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        
        // 비디오 로드 이벤트 리스너
        video.onloadedmetadata = () => {
          console.log('비디오 메타데이터 로드됨');
          
          // 즉시 재생 시도
          const playPromise = video.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('비디오 재생 시작');
                setIsCameraOpen(true);
                setIsCapturing(false);
              })
              .catch((playError) => {
                console.error('비디오 재생 오류:', playError);
                // 사용자 상호작용이 필요한 경우를 위한 대안
                setIsCameraOpen(true);
                setIsCapturing(false);
              });
          } else {
            // play() 메서드가 Promise를 반환하지 않는 경우
            setIsCameraOpen(true);
            setIsCapturing(false);
          }
        };

        // 오류 이벤트 리스너
        video.onerror = (error) => {
          console.error('비디오 오류:', error);
          setIsCapturing(false);
        };
      }
    } catch (error: any) {
      console.error('카메라 접근 오류:', error);
      let errorMessage = '카메라에 접근할 수 없습니다.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = '카메라 접근 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '카메라를 사용할 수 없습니다. 다른 앱에서 카메라를 사용중인지 확인해주세요.';
      }
      
      alert(errorMessage);
      setIsCapturing(false);
    }
  }, []);

  // 카메라 중지
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsCapturing(false);
  }, []);

  // 사진 촬영
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // 캔버스 크기를 비디오 크기에 맞춤
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 비디오 프레임을 캔버스에 그리기
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 이미지 데이터 추출
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);

    // 카메라 중지
    stopCamera();

    // OCR 처리 시작
    processImageWithOCR(imageDataUrl);
  }, [stopCamera]);

  // 갤러리에서 이미지 선택
  const handleGallerySelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setCapturedImage(imageDataUrl);
      processImageWithOCR(imageDataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  // OCR로 텍스트 추출
  const processImageWithOCR = useCallback(async (imageDataUrl: string) => {
    setIsProcessing(true);
    setOcrProgress(0);
    setExtractedText('');
    setExtractedProductName('');

    try {
      const { data: { text } } = await Tesseract.recognize(
        imageDataUrl,
        'kor+eng', // 한국어 + 영어 인식
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      setExtractedText(text);
      
      // 상품명 추출
      const productName = extractProductName(text);
      if (productName) {
        setExtractedProductName(productName);
      }

    } catch (error) {
      console.error('OCR 처리 오류:', error);
      alert('텍스트 인식 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
    }
  }, []);

  // 텍스트에서 상품명 추출
  const extractProductName = useCallback((text: string): string => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // 상품명 관련 키워드들
    const productKeywords = [
      '상품명', '제품명', '상품이름', '제품이름', '품명',
      'Product Name', 'Product', 'Name', '상품', '제품'
    ];

    for (const line of lines) {
      for (const keyword of productKeywords) {
        // 키워드가 포함된 라인 찾기
        if (line.includes(keyword)) {
          // 키워드 이후의 텍스트 추출
          const keywordIndex = line.indexOf(keyword);
          const afterKeyword = line.substring(keywordIndex + keyword.length).trim();
          
          // 콜론(:), 하이픈(-), 등호(=) 제거 후 텍스트 추출
          const cleanText = afterKeyword.replace(/^[:\-=\s]+/, '').trim();
          
          if (cleanText.length > 0 && cleanText.length < 100) { // 너무 긴 텍스트 제외
            return cleanText;
          }
        }
      }
    }

    return '';
  }, []);

  // 상품명 적용
  const applyProductName = useCallback(() => {
    if (extractedProductName) {
      onProductNameExtracted(extractedProductName);
      onClose();
    }
  }, [extractedProductName, onProductNameExtracted, onClose]);

  // 모달 닫기
  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setExtractedText('');
    setExtractedProductName('');
    setIsProcessing(false);
    onClose();
  }, [stopCamera, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Camera className="w-6 h-6 text-blue-600" />
              라벨촬영
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* 촬영 옵션 */}
          {!capturedImage && !isCameraOpen && !isProcessing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={startCamera}
                disabled={true}
                className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl opacity-50 cursor-not-allowed"
              >
                {isCapturing ? (
                  <div className="w-12 h-12 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <Camera className="w-12 h-12 text-gray-400" />
                )}
                <div className="text-center">
                  <h3 className="font-semibold text-gray-500">직접촬영 (준비 중)</h3>
                  <p className="text-sm text-gray-400">
                    현재 개발 중인 기능입니다
                  </p>
                </div>
              </button>

              <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-green-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer">
                <Image className="w-12 h-12 text-green-500" />
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900">갤러리선택</h3>
                  <p className="text-sm text-gray-600">갤러리에서 이미지를 선택합니다</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGallerySelect}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* 카메라 준비 중 상태 표시 */}
          {isCapturing && !isCameraOpen && (
            <div className="text-center py-8 mb-6">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">카메라 준비 중</h3>
              <p className="text-gray-500 mb-4">
                카메라 스트림을 로드하고 있습니다...
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    // 수동으로 비디오 재생 시도
                    if (videoRef.current) {
                      videoRef.current.play()
                        .then(() => {
                          console.log('수동 비디오 재생 성공');
                          setIsCameraOpen(true);
                          setIsCapturing(false);
                        })
                        .catch((error) => {
                          console.error('수동 비디오 재생 실패:', error);
                        });
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  수동 시작
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {/* 카메라 화면 */}
          {isCameraOpen && (
            <div className="mb-6">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-auto max-h-96 object-contain"
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-gray-700" />
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 캡처된 이미지 */}
          {capturedImage && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">촬영된 이미지</h3>
              <div className="bg-gray-100 rounded-lg p-4">
                <img
                  src={capturedImage}
                  alt="촬영된 라벨"
                  className="w-full h-auto max-h-64 object-contain rounded-lg"
                />
              </div>
            </div>
          )}

          {/* OCR 처리 중 */}
          {isProcessing && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Loader className="w-5 h-5 animate-spin text-blue-500" />
                <h3 className="text-lg font-semibold">텍스트 인식 중...</h3>
              </div>
              <div className="bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">{ocrProgress}% 완료</p>
            </div>
          )}

          {/* 추출된 텍스트 결과 */}
          {extractedText && !isProcessing && (
            <div className="space-y-4">
              {/* 추출된 상품명 */}
              {extractedProductName && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold text-green-800">상품명 추출 완료</h3>
                  </div>
                  <p className="text-green-700 font-medium mb-3">{extractedProductName}</p>
                  <button
                    onClick={applyProductName}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    상품명 적용하기
                  </button>
                </div>
              )}

              {/* 상품명이 추출되지 않은 경우 */}
              {!extractedProductName && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold text-yellow-800">상품명을 찾을 수 없음</h3>
                  </div>
                  <p className="text-yellow-700 mb-3">
                    라벨에서 상품명을 자동으로 찾을 수 없습니다. 아래 전체 텍스트에서 직접 찾아보세요.
                  </p>
                </div>
              )}

              {/* 전체 추출된 텍스트 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">추출된 전체 텍스트</h3>
                <div className="bg-white border rounded p-3 max-h-40 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{extractedText}</pre>
                </div>
              </div>

              {/* 다시 촬영 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setExtractedText('');
                    setExtractedProductName('');
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  다시 촬영
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          {/* 숨겨진 캔버스 */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* 파일명 표시 */}
          <div className="mt-4 text-xs text-gray-400 text-center">
            LabelPhotographyModal.tsx
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelPhotographyModal;