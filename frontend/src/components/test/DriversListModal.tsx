import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Truck, 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  Search,
  RefreshCw,
  XCircle,
  MapPin,
  Package
} from 'lucide-react';
import { testAPI } from '../../services/api';

interface Driver {
  id: number;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  vehicle_type: string;
  vehicle_number: string;
  cargo_capacity: string;
  delivery_area: string;
  created_at: string;
}

interface DriversListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DriversListModal: React.FC<DriversListModalProps> = ({ isOpen, onClose }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadDrivers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await testAPI.getDriversList();
      setDrivers(result.drivers || []);
    } catch (error: any) {
      setError(error.response?.data?.message || '기사 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDrivers();
    }
  }, [isOpen]);

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.delivery_area.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-gray-900">기사 목록</h2>
            {!isLoading && (
              <span className="text-sm text-gray-500">({filteredDrivers.length}명)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadDrivers}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              title="새로고침"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="px-6 py-4 border-b bg-white">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="이름, 아이디, 차량종류, 배송지역, 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
              <span className="ml-2 text-gray-600">기사 목록을 불러오는 중...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={loadDrivers}
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? '검색 결과가 없습니다.' : '등록된 기사가 없습니다.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredDrivers.map((driver) => (
                <div key={driver.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-purple-500" />
                      <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                      기사
                    </span>
                  </div>

                  {/* 정보 */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>@{driver.user_id}</span>
                    </div>

                    {driver.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-xs">{driver.email}</span>
                      </div>
                    )}

                    {driver.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{driver.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{driver.vehicle_type}</span>
                        {driver.vehicle_number && (
                          <span className="text-xs text-gray-500">{driver.vehicle_number}</span>
                        )}
                      </div>
                    </div>

                    {driver.cargo_capacity && (
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <span>{driver.cargo_capacity}</span>
                      </div>
                    )}

                    {driver.delivery_area && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs">{driver.delivery_area}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">{formatDate(driver.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriversListModal;