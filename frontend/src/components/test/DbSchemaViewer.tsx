import React, { useState, useEffect } from 'react';
import {
  Database,
  Table,
  Key,
  Hash,
  ArrowLeft,
  RefreshCw,
  Search,
  Link,
  Eye,
  EyeOff
} from 'lucide-react';

interface Column {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  IS_NULLABLE: string;
  COLUMN_DEFAULT: string | null;
  COLUMN_COMMENT: string;
  COLUMN_KEY: string;
  EXTRA: string;
  CHARACTER_MAXIMUM_LENGTH: number | null;
  NUMERIC_PRECISION: number | null;
  NUMERIC_SCALE: number | null;
}

interface ForeignKey {
  COLUMN_NAME: string;
  REFERENCED_TABLE_NAME: string;
  REFERENCED_COLUMN_NAME: string;
}

interface TableInfo {
  table_name: string;
  table_comment: string;
  table_rows: number;
  auto_increment: number | null;
  create_time: string;
  update_time: string;
  columns: Column[];
  foreign_keys: ForeignKey[];
  indexes: any[];
}

interface SchemaInfo {
  database_name: string;
  tables: TableInfo[];
}

interface DbSchemaViewerProps {
  onBack: () => void;
}

const DbSchemaViewer: React.FC<DbSchemaViewerProps> = ({ onBack }) => {
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});

  const loadSchemaInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_BASE_URL = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001' 
        : 'https://efficient-abundance-production-d603.up.railway.app';
      
      const response = await fetch(`${API_BASE_URL}/api/schema/info`, {
        headers: {
          'Authorization': `Bearer test-token`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSchemaInfo(data);
    } catch (err: any) {
      console.error('스키마 정보 로드 실패:', err);
      setError('스키마 정보를 불러올 수 없습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchemaInfo();
  }, []);

  const toggleDetails = (tableName: string) => {
    setShowDetails(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  const filteredTables = schemaInfo?.tables?.filter(table =>
    table.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.table_comment.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getColumnIcon = (column: Column) => {
    if (column.COLUMN_KEY === 'PRI') return <Key className="w-4 h-4 text-yellow-500" />;
    if (column.COLUMN_KEY === 'MUL') return <Link className="w-4 h-4 text-blue-500" />;
    return <Hash className="w-4 h-4 text-gray-400" />;
  };

  const getDataTypeDisplay = (column: Column) => {
    let type = column.DATA_TYPE.toUpperCase();
    
    if (column.CHARACTER_MAXIMUM_LENGTH) {
      type += `(${column.CHARACTER_MAXIMUM_LENGTH})`;
    } else if (column.NUMERIC_PRECISION && column.NUMERIC_SCALE !== null) {
      type += `(${column.NUMERIC_PRECISION},${column.NUMERIC_SCALE})`;
    } else if (column.NUMERIC_PRECISION) {
      type += `(${column.NUMERIC_PRECISION})`;
    }
    
    return type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">스키마 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <Database className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">오류 발생</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadSchemaInfo}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              테스트 도구로 돌아가기
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900">데이터베이스 스키마</h1>
          </div>
          <button
            onClick={loadSchemaInfo}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>

        {/* 데이터베이스 요약 정보 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              데이터베이스: {schemaInfo?.database_name}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{schemaInfo?.tables?.length || 0}</div>
              <div className="text-sm text-gray-600">총 테이블 수</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {schemaInfo?.tables?.reduce((sum, table) => sum + table.columns.length, 0) || 0}
              </div>
              <div className="text-sm text-gray-600">총 컬럼 수</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {schemaInfo?.tables?.reduce((sum, table) => sum + table.foreign_keys.length, 0) || 0}
              </div>
              <div className="text-sm text-gray-600">총 외래키 수</div>
            </div>
          </div>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="테이블 이름이나 설명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 테이블 목록 */}
        <div className="space-y-4">
          {filteredTables.map((table) => (
            <div key={table.table_name} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleDetails(table.table_name)}
              >
                <div className="flex items-center gap-4">
                  <Table className="w-6 h-6 text-green-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{table.table_name}</h3>
                    <p className="text-sm text-gray-600">{table.table_comment || '설명 없음'}</p>
                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                      <span>컬럼: {table.columns.length}개</span>
                      <span>행: {table.table_rows.toLocaleString()}개</span>
                      {table.foreign_keys.length > 0 && (
                        <span>외래키: {table.foreign_keys.length}개</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {showDetails[table.table_name] ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {showDetails[table.table_name] && (
                <div className="border-t border-gray-200">
                  {/* 컬럼 목록 */}
                  <div className="p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      컬럼 정보
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 font-medium text-gray-600">컬럼명</th>
                            <th className="text-left py-2 font-medium text-gray-600">타입</th>
                            <th className="text-left py-2 font-medium text-gray-600">NULL</th>
                            <th className="text-left py-2 font-medium text-gray-600">기본값</th>
                            <th className="text-left py-2 font-medium text-gray-600">추가정보</th>
                            <th className="text-left py-2 font-medium text-gray-600">설명</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns.map((column) => (
                            <tr key={column.COLUMN_NAME} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 flex items-center gap-2">
                                {getColumnIcon(column)}
                                <span className={column.COLUMN_KEY === 'PRI' ? 'font-semibold text-yellow-700' : ''}>
                                  {column.COLUMN_NAME}
                                </span>
                              </td>
                              <td className="py-2 font-mono text-xs">
                                {getDataTypeDisplay(column)}
                              </td>
                              <td className="py-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  column.IS_NULLABLE === 'YES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {column.IS_NULLABLE === 'YES' ? 'YES' : 'NO'}
                                </span>
                              </td>
                              <td className="py-2 font-mono text-xs">
                                {column.COLUMN_DEFAULT || '-'}
                              </td>
                              <td className="py-2 text-xs">
                                {column.EXTRA && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {column.EXTRA}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 text-xs text-gray-600">
                                {column.COLUMN_COMMENT || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 외래키 정보 */}
                  {table.foreign_keys.length > 0 && (
                    <div className="border-t border-gray-200 p-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Link className="w-4 h-4" />
                        외래키 관계
                      </h4>
                      <div className="space-y-2">
                        {table.foreign_keys.map((fk, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm bg-blue-50 p-3 rounded">
                            <span className="font-semibold">{fk.COLUMN_NAME}</span>
                            <span className="text-gray-500">→</span>
                            <span className="font-semibold text-blue-600">
                              {fk.REFERENCED_TABLE_NAME}.{fk.REFERENCED_COLUMN_NAME}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredTables.length === 0 && searchTerm && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-600">'{searchTerm}'와 일치하는 테이블을 찾을 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DbSchemaViewer;