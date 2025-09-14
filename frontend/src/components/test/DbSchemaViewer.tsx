import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Table, 
  Key, 
  Hash, 
  ArrowLeft, 
  RefreshCw, 
  Search,
  Info,
  Link,
  Eye,
  EyeOff
} from 'lucide-react';
import { testAPI } from '../../services/api';

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
  CONSTRAINT_NAME: string;
}

interface Index {
  INDEX_NAME: string;
  COLUMN_NAME: string;
  NON_UNIQUE: number;
  INDEX_TYPE: string;
  SEQ_IN_INDEX: number;
}

interface TableInfo {
  TABLE_NAME: string;
  TABLE_COMMENT: string;
  ENGINE: string;
  TABLE_ROWS: number;
  CREATE_TIME: string;
  columns: Column[];
  foreignKeys: ForeignKey[];
  indexes: Index[];
}

interface DbSchemaData {
  database: {
    database_name: string;
    charset: string;
    collation: string;
  };
  statistics: {
    totalTables: number;
    totalRows: number;
  };
  tables: TableInfo[];
}

interface Relationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  relationshipName: string;
}

interface DbSchemaViewerProps {
  onNavigateBack: () => void;
}

const DbSchemaViewer: React.FC<DbSchemaViewerProps> = ({ onNavigateBack }) => {
  const [schemaData, setSchemaData] = useState<DbSchemaData | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showRelationships, setShowRelationships] = useState(false);

  const loadSchemaData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [schemaResponse, relationshipResponse] = await Promise.all([
        testAPI.getDbSchema(),
        testAPI.getTableRelationships()
      ]);
      setSchemaData(schemaResponse);
      setRelationships(relationshipResponse.relationships || []);
    } catch (error: any) {
      setError(error.response?.data?.message || '스키마 정보를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchemaData();
  }, []);

  const filteredTables = schemaData?.tables.filter(table =>
    table.TABLE_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.TABLE_COMMENT.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getColumnTypeDisplay = (column: Column) => {
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

  const getKeyIcon = (columnKey: string, extra: string) => {
    if (columnKey === 'PRI') return <Key className="w-4 h-4 text-yellow-500" title="Primary Key" />;
    if (columnKey === 'UNI') return <Hash className="w-4 h-4 text-blue-500" title="Unique Key" />;
    if (columnKey === 'MUL') return <Link className="w-4 h-4 text-green-500" title="Index" />;
    return null;
  };

  const getRelationshipsForTable = (tableName: string) => {
    return relationships.filter(rel => 
      rel.fromTable === tableName || rel.toTable === tableName
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">DB 스키마 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <p className="font-medium">오류 발생</p>
            <p>{error}</p>
            <button 
              onClick={loadSchemaData}
              className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>뒤로 가기</span>
            </button>
            
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Database className="w-6 h-6 text-blue-500" />
                DB 스키마 구성도
              </h1>
              
              <button
                onClick={loadSchemaData}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="새로고침"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            
            <div className="w-24"></div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 데이터베이스 정보 요약 */}
        {schemaData && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">데이터베이스 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">데이터베이스</p>
                <p className="font-semibold text-blue-900">{schemaData.database.database_name || 'N/A'}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">총 테이블 수</p>
                <p className="font-semibold text-green-900">{schemaData.statistics.totalTables}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600">총 레코드 수</p>
                <p className="font-semibold text-purple-900">{schemaData.statistics.totalRows.toLocaleString()}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600">문자 인코딩</p>
                <p className="font-semibold text-orange-900">{schemaData.database.charset || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="테이블명 또는 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowRelationships(!showRelationships)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showRelationships 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {showRelationships ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              관계도 {showRelationships ? '숨기기' : '표시'}
            </button>
          </div>
        </div>

        {/* 테이블 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTables.map((table) => (
            <div key={table.TABLE_NAME} className="bg-white rounded-lg shadow-sm border">
              {/* 테이블 헤더 */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Table className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900">{table.TABLE_NAME}</h3>
                  </div>
                  <span className="text-sm text-gray-500">{table.TABLE_ROWS} rows</span>
                </div>
                {table.TABLE_COMMENT && (
                  <p className="text-sm text-gray-600 mt-1">{table.TABLE_COMMENT}</p>
                )}
              </div>

              {/* 컬럼 목록 */}
              <div className="p-4">
                <div className="space-y-2">
                  {table.columns.map((column, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getKeyIcon(column.COLUMN_KEY, column.EXTRA)}
                        <span className="font-medium text-gray-900 truncate">
                          {column.COLUMN_NAME}
                        </span>
                        {column.IS_NULLABLE === 'NO' && (
                          <span className="text-red-500 text-xs">*</span>
                        )}
                      </div>
                      <span className="text-gray-500 text-xs ml-2">
                        {getColumnTypeDisplay(column)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 관계 정보 */}
                {showRelationships && (
                  <div className="mt-4 pt-4 border-t">
                    {getRelationshipsForTable(table.TABLE_NAME).length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <Link className="w-4 h-4" />
                          관계
                        </h4>
                        <div className="space-y-1">
                          {getRelationshipsForTable(table.TABLE_NAME).map((rel, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              {rel.fromTable === table.TABLE_NAME ? (
                                <span>
                                  <span className="font-medium">{rel.fromColumn}</span> → {rel.toTable}.{rel.toColumn}
                                </span>
                              ) : (
                                <span>
                                  <span className="font-medium">{rel.toColumn}</span> ← {rel.fromTable}.{rel.fromColumn}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">관계 없음</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredTables.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DbSchemaViewer;