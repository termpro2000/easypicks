import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Search, Filter, RefreshCw, Truck, Eye, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { deliveriesAPI } from '../../services/api';
import PartnerDeliveryDetail from './PartnerDeliveryDetail';

interface Delivery {
  id: number;
  tracking_number: string;
  status: string;
  sender_name: string;
  sender_address: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  product_name: string;
  visit_date: string;
  driver_id: number;
  driver_name: string;
  delivery_fee: number;
  special_instructions: string;
  created_at: string;
  updated_at: string;
}

interface PartnerDeliveryListProps {
  onNavigateBack: () => void;
}

const PartnerDeliveryList: React.FC<PartnerDeliveryListProps> = ({ onNavigateBack }) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);

  // 배송 목록 조회
  const fetchDeliveries = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setLoading(true);

      const params = {
        page: pageNum,
        limit: 20,
        ...(statusFilter !== 'all' && { status: statusFilter })
      };

      const response = await deliveriesAPI.getDeliveries(params);
      setDeliveries(response.deliveries || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setPage(pageNum);
    } catch (error) {
      console.error('배송 목록 조회 오류:', error);
      setDeliveries([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeliveries(1);
  }, [statusFilter]);

  // 상태 뱃지 컴포넌트
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      '접수완료': { color: 'bg-gray-100 text-gray-800', text: '접수완료', icon: Package },
      '배차완료': { color: 'bg-yellow-100 text-yellow-800', text: '배차완료', icon: Clock },
      '배송중': { color: 'bg-blue-100 text-blue-800', text: '배송중', icon: Truck },
      '배송완료': { color: 'bg-green-100 text-green-800', text: '배송완료', icon: CheckCircle },
      '배송취소': { color: 'bg-red-100 text-red-800', text: '배송취소', icon: AlertCircle },
      '수거중': { color: 'bg-purple-100 text-purple-800', text: '수거중', icon: Truck },
      '수거완료': { color: 'bg-indigo-100 text-indigo-800', text: '수거완료', icon: CheckCircle },
      '조처완료': { color: 'bg-teal-100 text-teal-800', text: '조처완료', icon: CheckCircle },
      '배송연기': { color: 'bg-orange-100 text-orange-800', text: '배송연기', icon: Clock },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status || '알 수 없음', icon: Package };
    const IconComponent = config.icon;

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        {config.text}
      </div>
    );
  };

  // 검색 필터링
  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = !searchTerm || 
      delivery.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // 상세보기 페이지 표시
  if (selectedDeliveryId) {
    return (
      <PartnerDeliveryDetail 
        deliveryId={selectedDeliveryId} 
        onNavigateBack={() => setSelectedDeliveryId(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 뒤로가기 버튼 */}
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">메인으로 돌아가기</span>
              <span className="sm:hidden">돌아가기</span>
            </button>
            
            {/* 중앙 제목 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">배송조회_업체용</h1>
                <p className="text-sm text-blue-600 font-medium">내 배송 현황을 확인하세요</p>
              </div>
            </div>
            
            {/* 새로고침 버튼 */}
            <button
              onClick={() => fetchDeliveries(page, true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">새로고침</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="운송장번호, 고객명, 상품명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* 상태 필터 */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">모든 상태</option>
                <option value="pending">접수대기</option>
                <option value="confirmed">접수완료</option>
                <option value="in_progress">배송중</option>
                <option value="delivered">배송완료</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
          </div>
        </div>

        {/* 배송 목록 */}
        <div className="bg-white rounded-xl shadow-lg border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              내 배송 목록 ({filteredDeliveries.length}건)
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center gap-2 text-gray-500">
                <RefreshCw className="w-5 h-5 animate-spin" />
                배송 목록을 불러오는 중...
              </div>
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {searchTerm || statusFilter !== 'all' ? '검색 조건에 맞는 배송이 없습니다.' : '등록된 배송이 없습니다.'}
            </div>
          ) : (
            <>
              {/* 데스크톱: 테이블 뷰 */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">운송장번호</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객정보</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">방문일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">접수일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDeliveries.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono text-sm font-medium text-blue-600">
                            {delivery.tracking_number || `#${delivery.id}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(delivery.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{delivery.customer_name}</div>
                          <div className="text-xs text-gray-500">{delivery.customer_phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={delivery.product_name}>
                            {delivery.product_name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {delivery.visit_date ? new Date(delivery.visit_date).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(delivery.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => setSelectedDeliveryId(delivery.id)}
                            className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs"
                          >
                            <Eye className="w-4 h-4" />
                            상세보기
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 모바일: 카드 뷰 */}
              <div className="lg:hidden p-6 space-y-4">
                {filteredDeliveries.map((delivery) => (
                  <div key={delivery.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-blue-500" />
                        <span className="font-mono text-sm font-medium text-blue-600">
                          {delivery.tracking_number || `#${delivery.id}`}
                        </span>
                      </div>
                      {getStatusBadge(delivery.status)}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">고객</span>
                        <span className="text-sm font-medium">{delivery.customer_name}</span>
                      </div>
                      {delivery.product_name && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">상품</span>
                          <span className="text-sm font-medium text-right max-w-48 truncate">
                            {delivery.product_name}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">접수일</span>
                        <span className="text-sm font-medium">
                          {new Date(delivery.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button 
                        onClick={() => setSelectedDeliveryId(delivery.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        상세보기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchDeliveries(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = Math.max(1, page - 2) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchDeliveries(pageNum)}
                    className={`px-4 py-2 text-sm rounded-lg ${
                      page === pageNum
                        ? 'bg-blue-500 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => fetchDeliveries(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 이지픽스 업체용 서비스. All rights reserved.</p>
            <p className="mt-1">안전하고 신뢰할 수 있는 배송 서비스를 제공합니다.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PartnerDeliveryList;