import React, { useState } from 'react';
import { Database, ArrowLeft, Loader } from 'lucide-react';
import { schemaAPI } from '../../services/api';
import type { DatabaseSchema } from '../../types';

interface SystemTestPageProps {
  onBack: () => void;
}

const SystemTestPage: React.FC<SystemTestPageProps> = ({ onBack }) => {
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSchema, setShowSchema] = useState(false);

  const handleShowSchema = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await schemaAPI.getSchema();
      if (response.success) {
        setSchema(response.data);
        setShowSchema(true);
      } else {
        setError('스키마 정보를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('Schema fetch error:', err);
      setError('스키마 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToTest = () => {
    setShowSchema(false);
    setSchema(null);
    setError(null);
  };

  if (showSchema && schema) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-blue-500" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">DB 구성도 (스키마뷰어)</h1>
                  <p className="text-sm text-gray-500">데이터베이스 스키마 정보</p>
                </div>
              </div>
              <button
                onClick={handleBackToTest}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                뒤로가기
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 스키마 요약 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">데이터베이스 요약</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{schema.summary.totalTables}</div>
                <div className="text-sm text-gray-500">테이블</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{schema.summary.totalColumns}</div>
                <div className="text-sm text-gray-500">컬럼</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{schema.foreignKeys.length}</div>
                <div className="text-sm text-gray-500">외래키</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{schema.indexes.length}</div>
                <div className="text-sm text-gray-500">인덱스</div>
              </div>
            </div>
          </div>

          {/* 테이블 목록 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">테이블 목록</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {schema.tables.map((table) => (
                <div key={table.table_name} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{table.table_name}</h3>
                      {table.table_comment && (
                        <p className="text-sm text-gray-500 mt-1">{table.table_comment}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>행 수: {table.table_rows?.toLocaleString() || 'N/A'}</div>
                      <div>크기: {table.data_length ? `${(table.data_length / 1024).toFixed(1)} KB` : 'N/A'}</div>
                    </div>
                  </div>
                  
                  {/* 컬럼 목록 */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">컬럼명</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">타입</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NULL</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">키</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기본값</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {table.columns.map((column) => (
                          <tr key={column.column_name} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {column.column_name}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {column.data_type}
                              {column.max_length && `(${column.max_length})`}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {column.is_nullable === 'YES' ? 'O' : 'X'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {column.column_key && (
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  column.column_key === 'PRI' 
                                    ? 'bg-red-100 text-red-800' 
                                    : column.column_key === 'UNI'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {column.column_key}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {column.column_default || '-'}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-500">
                              {column.column_comment || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">시스템 테스트 도구</h1>
                <p className="text-sm text-gray-500">관리자용 테스트 및 진단 도구</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              메인으로
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">시스템 테스트 도구</h2>
          <p className="text-lg text-gray-600">
            시스템 상태를 확인하고 진단할 수 있는 도구들입니다
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          </div>
        )}

        <div className="max-w-lg mx-auto">
          <button
            onClick={handleShowSchema}
            disabled={loading}
            className="w-full bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 p-8 flex flex-col items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="w-16 h-16 bg-gray-300 rounded-2xl flex items-center justify-center">
                <Loader className="w-8 h-8 text-gray-600 animate-spin" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-blue-500 group-hover:bg-blue-600 rounded-2xl flex items-center justify-center transition-colors">
                <Database className="w-8 h-8 text-white" />
              </div>
            )}
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                DB 구성도 (스키마뷰어)
              </h3>
              <p className="text-sm text-gray-500">
                데이터베이스 스키마 정보를 확인합니다
              </p>
            </div>
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500">
            시스템 관리자용 진단 도구입니다.
            <br />
            데이터베이스 스키마 및 시스템 상태를 확인할 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
};

export default SystemTestPage;