import React from 'react';
import { Camera, X } from 'lucide-react';

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
  if (!isOpen) return null;

  const handleDummyExtraction = () => {
    onProductNameExtracted('샘플 상품명');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            라벨촬영
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="text-center py-8">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            라벨촬영 기능 준비 중
          </h3>
          <p className="text-gray-500 mb-4">
            OCR 기능은 현재 개발 중입니다.
          </p>
          <button
            onClick={handleDummyExtraction}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            테스트용 상품명 입력
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-400 text-center">
          LabelPhotographyModal.tsx
        </div>
      </div>
    </div>
  );
};

export default LabelPhotographyModal;