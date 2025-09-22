import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Package, Weight, Ruler, DollarSign, FileText, 
  ArrowLeft, Check, AlertTriangle, Tag, Camera, X, Upload, QrCode
} from 'lucide-react';
import { productsAPI, productPhotosAPI } from '../../services/api';
// import { useAuth } from '../../hooks/useAuth';
import LabelPhotographyModal from './LabelPhotographyModal';
import QRCodeScannerModal from './QRCodeScannerModal';

interface ProductData {
  maincode?: string;
  subcode?: string;
  name: string;
  weight?: number;
  size?: string;
  cost1?: number;
  cost2?: number;
  memo?: string;
}

interface PartnerProductFormProps {
  onNavigateBack: () => void;
}

interface InfoCellProps {
  label: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  description?: string;
}

const InfoCell: React.FC<InfoCellProps> = ({ label, icon: Icon, children, required = false, error, description }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {children}
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  );
};

const PartnerProductForm: React.FC<PartnerProductFormProps> = ({ onNavigateBack }) => {
  // const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; productId?: number } | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ProductData>();

  // 폼 제출
  const onSubmit = async (data: ProductData) => {
    setIsSubmitting(true);
    try {
      console.log('상품등록 폼 제출 데이터:', data);
      
      const response = await productsAPI.createProduct(data);
      
      console.log('상품등록 응답:', response);
      
      setSubmitResult({
        success: true,
        message: response.message || '상품이 성공적으로 등록되었습니다.',
        productId: response.productId
      });

      // 선택된 사진이 있으면 자동 업로드
      if (selectedPhotos.length > 0 && response.productId) {
        try {
          console.log(`선택된 사진 ${selectedPhotos.length}장을 자동 업로드 중...`);
          const uploadPromises = selectedPhotos.map(photo => 
            productPhotosAPI.uploadPhoto(response.productId, photo)
          );
          
          const uploadResults = await Promise.all(uploadPromises);
          const newUploadedPhotos = uploadResults.map(result => result.photo);
          
          setUploadedPhotos(newUploadedPhotos);
          setSelectedPhotos([]);
          console.log(`${newUploadedPhotos.length}장의 사진이 자동 업로드되었습니다.`);
        } catch (uploadError) {
          console.error('사진 자동 업로드 오류:', uploadError);
          // 사진 업로드 실패해도 상품 등록은 성공한 상태로 유지
        }
      }

      // 폼 리셋
      reset();
    } catch (error: any) {
      setSubmitResult({
        success: false,
        message: error.response?.data?.message || error.message || '상품 등록 중 오류가 발생했습니다.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 새로운 등록하기
  const handleNewProduct = () => {
    setSubmitResult(null);
    setSelectedPhotos([]);
    setUploadedPhotos([]);
    reset();
  };

  // 라벨촬영에서 상품명 추출 완료
  const handleProductNameExtracted = (productName: string) => {
    setValue('name', productName);
  };

  // QR코드 스캔 완료
  const handleQRCodeScanned = (code: string) => {
    setValue('maincode', code);
  };

  // 사진 선택 핸들러
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos = Array.from(files);
      setSelectedPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  // 선택된 사진 제거
  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // 업로드된 사진 제거
  const handleRemoveUploadedPhoto = async (photoId: number) => {
    try {
      await productPhotosAPI.deletePhoto(photoId);
      setUploadedPhotos(prev => prev.filter(photo => photo.id !== photoId));
    } catch (error) {
      console.error('사진 삭제 오류:', error);
      alert('사진 삭제 중 오류가 발생했습니다.');
    }
  };

  // 사진 업로드
  const handleUploadPhotos = async () => {
    if (selectedPhotos.length === 0) {
      alert('업로드할 사진을 선택해주세요.');
      return;
    }

    // 상품이 등록되지 않은 경우 임시저장 (실제로는 아무것도 하지 않음)
    if (!submitResult?.productId) {
      alert('사진이 임시저장되었습니다. 상품 등록 후 자동으로 업로드됩니다.');
      return;
    }

    // 상품이 등록된 경우 실제 업로드
    setIsUploadingPhotos(true);
    try {
      const uploadPromises = selectedPhotos.map(photo => 
        productPhotosAPI.uploadPhoto(submitResult.productId!, photo)
      );
      
      const results = await Promise.all(uploadPromises);
      const newUploadedPhotos = results.map(result => result.photo);
      
      setUploadedPhotos(prev => [...prev, ...newUploadedPhotos]);
      setSelectedPhotos([]);
      alert(`${selectedPhotos.length}장의 사진이 성공적으로 업로드되었습니다.`);
    } catch (error) {
      console.error('사진 업로드 오류:', error);
      alert('사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  if (submitResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={onNavigateBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>돌아가기</span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900">상품등록_업체용</h1>
                  <p className="text-sm text-green-600 font-medium">상품 등록 결과</p>
                </div>
              </div>
              
              <div className="w-24"></div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="max-w-md mx-auto">
            <div className={`p-6 rounded-lg ${submitResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-3">
                {submitResult.success ? (
                  <Check className="w-8 h-8 text-green-500" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                )}
                <div>
                  <h3 className={`text-lg font-semibold ${submitResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {submitResult.success ? '상품등록 완료' : '상품등록 실패'}
                  </h3>
                  <p className={submitResult.success ? 'text-green-700' : 'text-red-700'}>
                    {submitResult.message}
                  </p>
                  {submitResult.productId && (
                    <p className="text-green-700 mt-2">
                      <strong>상품 ID: {submitResult.productId}</strong>
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex gap-3">
                {submitResult.success ? (
                  <button
                    onClick={handleNewProduct}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    새 상품 등록
                  </button>
                ) : (
                  <button
                    onClick={() => setSubmitResult(null)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    다시 시도
                  </button>
                )}
                <button
                  onClick={onNavigateBack}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  메인으로
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>돌아가기</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">상품등록_업체용</h1>
                <p className="text-sm text-green-600 font-medium">새로운 상품을 등록하세요</p>
              </div>
            </div>
            
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 카메라등록 섹션 */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Camera className="w-6 h-6 text-purple-600" />
              카메라등록
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              <InfoCell 
                label="상품 촬영" 
                icon={Camera}
                description="라벨 촬영 또는 QR코드를 이용하여 상품 정보를 자동으로 입력하세요"
              >
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsLabelModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    라벨촬영
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setIsQRModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <QrCode className="w-5 h-5" />
                    QR코드
                  </button>
                </div>
              </InfoCell>
            </div>
          </div>

          {/* 기본 상품 정보 섹션 */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              기본 상품 정보
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCell 
                label="상품코드" 
                icon={Tag} 
                description="상품의 메인 분류 코드를 입력하세요"
              >
                <input
                  type="text"
                  {...register('maincode')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: FUR001"
                />
              </InfoCell>

              <InfoCell 
                label="내부코드" 
                icon={Tag} 
                description="상품의 세부 분류 코드를 입력하세요"
              >
                <input
                  type="text"
                  {...register('subcode')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: SOFA-L"
                />
              </InfoCell>

              <InfoCell 
                label="상품명" 
                icon={Tag} 
                required 
                error={errors.name?.message}
                description="고객이 쉽게 알아볼 수 있는 상품명을 입력하세요"
              >
                <input
                  type="text"
                  {...register('name', { required: '상품명은 필수입니다' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 침실 3인용 소파"
                />
              </InfoCell>

              <InfoCell 
                label="상품 무게" 
                icon={Weight}
                description="배송비 계산에 사용됩니다 (kg 단위)"
              >
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    {...register('weight')}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">kg</span>
                  </div>
                </div>
              </InfoCell>

              <InfoCell 
                label="상품 크기" 
                icon={Ruler}
                description="포장 크기 또는 실제 크기를 입력하세요"
              >
                <input
                  type="text"
                  {...register('size')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 200x80x75cm 또는 대형"
                />
              </InfoCell>
            </div>
          </div>

          {/* 가격 정보 섹션 */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              가격 정보
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCell 
                label="배송비 (기본)" 
                icon={DollarSign}
                description="일반 배송시 적용되는 기본 배송비"
              >
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    {...register('cost1')}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">원</span>
                  </div>
                </div>
              </InfoCell>

              <InfoCell 
                label="배송비 (특수)" 
                icon={DollarSign}
                description="특수 배송시 적용되는 추가 배송비 (사다리차, 크레인 등)"
              >
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    {...register('cost2')}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">원</span>
                  </div>
                </div>
              </InfoCell>
            </div>
          </div>

          {/* 상품 메모 섹션 */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-yellow-600" />
              상품 설명 및 특이사항
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              <InfoCell 
                label="상품 메모" 
                icon={FileText}
                description="배송시 주의사항, 조립 방법, 특별 요구사항 등을 상세히 기록하세요"
              >
                <textarea
                  {...register('memo')}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예시:
• 깨지기 쉬운 유리 부품이 포함되어 있음
• 2인 이상 작업 필요 (무게: 50kg 이상)
• 엘리베이터 없는 건물은 추가비용 발생
• 조립 도구 포함 (드라이버, 육각렌치)
• 포장재 회수 필요"
                />
              </InfoCell>
            </div>
          </div>

          {/* 상품사진첨부 섹션 */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Camera className="w-6 h-6 text-purple-600" />
              상품사진첨부
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              <InfoCell 
                label="상품 사진" 
                icon={Camera}
                description="상품의 실제 모습을 보여주는 사진을 첨부하세요 (최대 5MB, jpg/png/gif)"
              >
                <div className="space-y-4">
                  {/* 사진 추가 버튼 */}
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                      <Camera className="w-4 h-4" />
                      사진 추가
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                    
                    {selectedPhotos.length > 0 && (
                      <button
                        type="button"
                        onClick={handleUploadPhotos}
                        disabled={isUploadingPhotos}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          !submitResult?.productId 
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                            : 'bg-green-500 text-white hover:bg-green-600'
                        } ${isUploadingPhotos ? 'opacity-50' : ''}`}
                      >
                        <Upload className="w-4 h-4" />
                        {isUploadingPhotos ? '업로드 중...' : 
                         !submitResult?.productId ? `임시저장 (${selectedPhotos.length}장)` : 
                         `사진올리기 (${selectedPhotos.length}장)`}
                      </button>
                    )}
                  </div>

                  {/* 선택된 사진 미리보기 */}
                  {selectedPhotos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">선택된 사진 ({selectedPhotos.length}장)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedPhotos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`선택된 사진 ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <p className="text-xs text-gray-500 mt-1 truncate">{photo.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 업로드된 사진 */}
                  {uploadedPhotos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">업로드된 사진 ({uploadedPhotos.length}장)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {uploadedPhotos.map((photo) => (
                          <div key={photo.id} className="relative">
                            <img
                              src={`http://localhost:3000/${photo.file_path}`}
                              alt={photo.original_name}
                              className="w-full h-24 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveUploadedPhoto(photo.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <p className="text-xs text-gray-500 mt-1 truncate">{photo.original_name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 안내 메시지 */}
                  {selectedPhotos.length === 0 && uploadedPhotos.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        사진 추가 버튼을 클릭해서 상품 사진을 첨부하세요
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        JPG, PNG, GIF 파일을 지원합니다 (최대 5MB)
                      </p>
                    </div>
                  )}

                  {!submitResult?.productId && selectedPhotos.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-700">
                        💡 상품 등록 시 선택된 사진들이 자동으로 업로드됩니다.
                      </p>
                    </div>
                  )}
                </div>
              </InfoCell>
            </div>
          </div>

          {/* 등록 완료 섹션 */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">상품 등록 준비 완료</h3>
              <p className="text-gray-600 mb-6">
                입력하신 정보를 확인하시고 아래 버튼을 눌러 상품을 등록하세요.
              </p>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium text-lg rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    등록 처리 중...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    상품 등록 완료
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* 도움말 섹션 */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            상품 등록 도움말
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">📝 상품명 작성 팁</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• 구체적이고 명확한 이름 사용</li>
                <li>• 브랜드명, 모델명 포함 권장</li>
                <li>• 색상, 재질 등 주요 특징 포함</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">💰 가격 설정 가이드</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• 기본 배송비: 일반적인 배송 상황</li>
                <li>• 특수 배송비: 크레인, 사다리차 등</li>
                <li>• 지역별 차등 적용 가능</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">📏 크기/무게 정보</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• 포장 상태 기준으로 측정</li>
                <li>• 배송비 계산의 중요 요소</li>
                <li>• 정확한 정보 입력 필수</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">📋 메모 활용법</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• 배송시 주의사항 상세 기록</li>
                <li>• 고객 안내 사항 포함</li>
                <li>• 기사님을 위한 특별 지시사항</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 라벨촬영 모달 */}
      <LabelPhotographyModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        onProductNameExtracted={handleProductNameExtracted}
      />

      {/* QR코드 스캐너 모달 */}
      <QRCodeScannerModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onQRCodeScanned={handleQRCodeScanned}
      />
      
      <div className="mt-4 text-xs text-gray-400 text-center">PartnerProductForm.tsx</div>
    </div>
  );
};

export default PartnerProductForm;