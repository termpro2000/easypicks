import React from 'react';

interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: any) => void;
}

const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({ 
  isOpen, 
  onClose, 
  onScan 
}) => {
  if (!isOpen) return null;

  const handleDummyScan = () => {
    console.log('QRCodeScannerModal: 더미 스캔 결과');
    onScan({ 
      success: true, 
      code: 'QR-' + Math.random().toString(36).substring(7).toUpperCase(),
      timestamp: new Date().toISOString() 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">QR 코드 스캔</h2>
        <p className="text-gray-600 mb-6">QR 코드 스캔 기능은 향후 구현 예정입니다.</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            취소
          </button>
          <button
            onClick={handleDummyScan}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            더미 스캔
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScannerModal;