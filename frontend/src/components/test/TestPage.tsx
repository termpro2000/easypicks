import React, { useState } from 'react';
import {
  Database,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import DbSchemaViewer from './DbSchemaViewer';

interface TestPageProps {
  onNavigateBack: () => void;
}

const TestPage: React.FC<TestPageProps> = ({ onNavigateBack }) => {
  const [currentView, setCurrentView] = useState<'main' | 'db-schema'>('main');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDbSchema = () => {
    setCurrentView('db-schema');
  };

  if (currentView === 'db-schema') {
    return <DbSchemaViewer onBack={() => setCurrentView('main')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            관리자화면으로 돌아가기
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">시스템 테스트 도구</h1>
            <p className="text-gray-600">
              시스템의 각종 기능을 테스트하고 데이터베이스를 관리할 수 있습니다.
            </p>
          </div>

          {/* 메시지 표시 */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <div className="whitespace-pre-line">{message.text}</div>
              <button
                onClick={() => setMessage(null)}
                className="ml-auto text-current hover:bg-current/10 rounded p-1"
              >
                ×
              </button>
            </div>
          )}

          {/* 테스트 도구 버튼들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* DB 구성도 보기 */}
            <button
              onClick={handleDbSchema}
              disabled={isLoading}
              className="flex flex-col items-center gap-4 p-6 bg-purple-50 hover:bg-purple-100 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-16 h-16 bg-purple-500 group-hover:bg-purple-600 rounded-full flex items-center justify-center transition-colors">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">DB 구성도</h3>
                <p className="text-sm text-gray-600">데이터베이스 스키마 보기</p>
              </div>
            </button>

          </div>

          {/* 경고 메시지 */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div className="text-yellow-800">
              <p className="font-medium">주의사항</p>
              <p className="text-sm">
                이 도구들은 테스트 목적으로만 사용해주세요. 
                운영 환경에서는 데이터 삭제 기능을 신중하게 사용하시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;