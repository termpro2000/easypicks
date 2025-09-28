import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowLeft, Package, Calendar, MapPin, User, Truck, Eye } from 'lucide-react';
import { deliveriesAPI } from '../../services/api';

interface Delivery {
  id: number;
  tracking_number: string;
  product_name?: string;
  product_code?: string;
  request_type?: string;
  request_category?: string;
  status: string;
  visit_date?: string;
  sender_name?: string;
  receiver_name?: string;
  receiver_address?: string;
  driver_id?: number;
  driver_name?: string;
  created_at: string;
  updated_at: string;
}

interface DeliveryStatusProps {
  onNavigateBack: () => void;
  onViewDetail?: (delivery: Delivery) => void;
}

const DeliveryStatus: React.FC<DeliveryStatusProps> = ({ onNavigateBack, onViewDetail }) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 배송 상태 옵션
  const statusOptions = [
    { value: '', label: '전체 상태' },
    { value: 'pending', label: '대기 중' },
    { value: 'assigned', label: '배정됨' },
    { value: 'picked_up', label: '픽업 완료' },
    { value: 'in_transit', label: '배송 중' },
    { value: 'delivered', label: '배송 완료' },
    { value: 'cancelled', label: '취소됨' },
    { value: 'delayed', label: '지연됨' }
  ];

  // 배송 목록 조회
  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await deliveriesAPI.getDeliveries(page, 20);
      setDeliveries(response.deliveries || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('배송 목록 조회 실패:', error);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 배송 목록 조회
  useEffect(() => {
    fetchDeliveries();
  }, [page]);

  // 검색 및 필터링
  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = !searchTerm || (
      delivery.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.receiver_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesStatus = !statusFilter || delivery.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 상태별 색상 반환
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-purple-100 text-purple-800';
      case 'in_transit': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'delayed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 상태 한글 변환
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '대기 중',
      'assigned': '배정됨',
      'picked_up': '픽업 완료',
      'in_transit': '배송 중',
      'delivered': '배송 완료',
      'cancelled': '취소됨',
      'delayed': '지연됨'
    };
    return statusMap[status] || status;
  };

  // 배송 상세보기
  const handleViewDetail = (delivery: Delivery) => {
    if (onViewDetail) {
      onViewDetail(delivery);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>돌아가기</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  배송현황
                </h1>
                <p className="text-sm text-blue-600 font-medium">전체 배송 현황을 확인하고 관리합니다</p>
              </div>
            </div>
            
            <div className="w-48"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 검색 및 필터 */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 검색창 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="트래킹번호, 상품명, 상품코드, 발송인, 수취인으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-white/30 bg-white/50 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/80 transition-all"
              />
            </div>

            {/* 필터 버튼 */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-white/50 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white/80 transition-all shadow-lg border border-white/30"
            >
              <Filter className="w-5 h-5" />
              필터
            </button>
          </div>

          {/* 필터 옵션 */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-white/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    배송 상태
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-white/30 bg-white/50 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/80 transition-all"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 배송 목록 */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/30 bg-gradient-to-r from-white/20 to-white/10">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent text-center">
              배송 목록 ({filteredDeliveries.length}건)
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-500">배송 목록을 불러오는 중...</p>
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {searchTerm || statusFilter ? '검색 결과가 없습니다.' : '등록된 배송이 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/30 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      트래킹번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      상품정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      의뢰정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      방문예정일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      배송정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/20 backdrop-blur-sm divide-y divide-white/20">
                  {filteredDeliveries.map((delivery) => (
                    <tr 
                      key={delivery.id} 
                      className="hover:bg-white/40 cursor-pointer transition-all duration-200 backdrop-blur-sm"
                      onClick={() => handleViewDetail(delivery)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-mono text-blue-600">
                            {delivery.tracking_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {delivery.product_name || '-'}
                          </div>
                          <div className="text-sm text-gray-500 font-mono">
                            {delivery.product_code || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-900">
                            {delivery.request_type || '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {delivery.request_category || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                          {getStatusText(delivery.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(delivery.visit_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <User className="w-3 h-3" />
                            {delivery.sender_name} → {delivery.receiver_name}
                          </div>
                          {delivery.driver_name && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Truck className="w-3 h-3" />
                              {delivery.driver_name}
                            </div>
                          )}
                          {delivery.receiver_address && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin className="w-3 h-3" />
                              {delivery.receiver_address.length > 20 
                                ? `${delivery.receiver_address.substring(0, 20)}...` 
                                : delivery.receiver_address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(delivery);
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50/50 p-2 rounded-xl transition-all backdrop-blur-sm"
                          title="상세보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-between">
              <div className="text-sm text-gray-700">
                페이지 {page} / {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-white/30 bg-white/50 backdrop-blur-sm rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/80 transition-all"
                >
                  이전
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-white/30 bg-white/50 backdrop-blur-sm rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/80 transition-all"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 통계 정보 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          <div className="group bg-gradient-to-br from-blue-50 to-blue-100 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/30 hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700 mb-2">{deliveries.length}</div>
              <div className="text-sm text-blue-600 font-medium">전체 배송</div>
            </div>
          </div>
          <div className="group bg-gradient-to-br from-yellow-50 to-yellow-100 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/30 hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-700 mb-2">
                {deliveries.filter(d => d.status === 'pending').length}
              </div>
              <div className="text-sm text-yellow-600 font-medium">대기 중</div>
            </div>
          </div>
          <div className="group bg-gradient-to-br from-orange-50 to-orange-100 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/30 hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-700 mb-2">
                {deliveries.filter(d => d.status === 'in_transit').length}
              </div>
              <div className="text-sm text-orange-600 font-medium">배송 중</div>
            </div>
          </div>
          <div className="group bg-gradient-to-br from-green-50 to-green-100 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/30 hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-700 mb-2">
                {deliveries.filter(d => d.status === 'delivered').length}
              </div>
              <div className="text-sm text-green-600 font-medium">배송 완료</div>
            </div>
          </div>
        </div>

      </main>

      {/* 푸터 */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-white/20 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>배송현황 관리 - 이지픽스 배송 서비스</p>
          </div>
        </div>
      </footer>

      {/* 파일명 표시 */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
        DeliveryStatus.tsx
      </div>
    </div>
  );
};

export default DeliveryStatus;