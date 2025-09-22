import React from 'react';

interface LabelPhotographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (result: any) => void;
}

const LabelPhotographyModal: React.FC<LabelPhotographyModalProps> = ({ 
  isOpen, 
  onClose, 
  onCapture 
}) => {
  if (!isOpen) return null;

  const handleDummyCapture = () => {
    console.log('LabelPhotographyModal: 더미 촬영 결과');
    onCapture({ 
      success: true, 
      imageUrl: 'https://via.placeholder.com/300x200?text=Label+Photo',
      timestamp: new Date().toISOString() 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">라벨 촬영</h2>
        <p className="text-gray-600 mb-6">라벨 촬영 기능은 향후 구현 예정입니다.</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            취소
          </button>
          <button
            onClick={handleDummyCapture}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            더미 촬영
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabelPhotographyModal;