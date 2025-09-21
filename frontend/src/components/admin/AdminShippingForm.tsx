import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface AdminShippingFormProps {
  onNavigateBack: () => void;
}

const AdminShippingForm: React.FC<AdminShippingFormProps> = ({ onNavigateBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-6">
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          관리자화면으로 돌아가기
        </button>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">새배송접수</h1>
          <p className="text-gray-600">새배송접수 기능은 향후 구현 예정입니다.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminShippingForm;