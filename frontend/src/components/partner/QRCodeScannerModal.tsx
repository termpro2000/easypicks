import React from 'react';
import { QrCode, X } from 'lucide-react';

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
  if (!isOpen) return null;

  const handleDummyScan = () => {
    onQRCodeScanned('SAMPLE_QR_CODE_12345');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-green-600" />
            QR코드 스캔
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="text-center py-8">
          <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            QR 스캔 기능 준비 중
          </h3>
          <p className="text-gray-500 mb-4">
            QR 스캐너 기능은 현재 개발 중입니다.
          </p>
          <button
            onClick={handleDummyScan}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            테스트용 QR 코드 입력
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-400 text-center">
          QRCodeScannerModal.tsx
        </div>
      </div>
    </div>
  );
};

export default QRCodeScannerModal;