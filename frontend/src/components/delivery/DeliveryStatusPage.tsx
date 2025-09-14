import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package2, MapPin, User, Calendar, Truck, Filter, RotateCcw } from 'lucide-react';
import { deliveriesAPI } from '../../services/api';

interface DeliveryStatusPageProps {
  onNavigateBack: () => void;
}

interface Delivery {
  id: number;
  tracking_number: string;
  sender_name: string;
  sender_address: string;
  customer_name: string;
  customer_address: string;
  status: string;
  created_at: string;
}

const DeliveryStatusPage: React.FC<DeliveryStatusPageProps> = ({ onNavigateBack }) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 필터 상태
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('전체');

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await deliveriesAPI.getDeliveries(1, 100);
      const deliveriesData = response.deliveries || [];
      setDeliveries(deliveriesData);
      setFilteredDeliveries(deliveriesData);
    } catch (error: any) {
      console.error('배송 목록 조회 실패:', error);
      setError('배송 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터링 로직
  useEffect(() => {
    let filtered = [...deliveries];

    // 날짜 필터링
    if (startDate && endDate) {
      filtered = filtered.filter(delivery => {
        const deliveryDate = new Date(delivery.created_at);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // 종료일은 하루 종일 포함
        return deliveryDate >= start && deliveryDate <= end;
      });
    }

    // 상태 필터링
    if (selectedStatus !== '전체') {
      filtered = filtered.filter(delivery => delivery.status === selectedStatus);
    }

    setFilteredDeliveries(filtered);
  }, [deliveries, startDate, endDate, selectedStatus]);

  // 필터 초기화
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedStatus('전체');
  };

  // status 옵션 목록
  const statusOptions = [
    '전체',
    '접수완료',
    '배차완료',
    '배송중',
    '배송완료',
    '배송취소',
    '수거중',
    '수거완료',
    '조처완료',
    '배송연기'
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      '접수완료': { color: 'bg-gray-100 text-gray-800', text: '접수완료' },
      '배차완료': { color: 'bg-yellow-100 text-yellow-800', text: '배차완료' },
      '배송중': { color: 'bg-blue-100 text-blue-800', text: '배송중' },
      '배송완료': { color: 'bg-green-100 text-green-800', text: '배송완료' },
      '배송취소': { color: 'bg-red-100 text-red-800', text: '배송취소' },
      '수거중': { color: 'bg-purple-100 text-purple-800', text: '수거중' },
      '수거완료': { color: 'bg-indigo-100 text-indigo-800', text: '수거완료' },
      '조처완료': { color: 'bg-teal-100 text-teal-800', text: '조처완료' },
      '배송연기': { color: 'bg-orange-100 text-orange-800', text: '배송연기' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status || '알 수 없음' };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">배송 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              돌아가기
            </button>
            <div className="flex items-center gap-3">
              <Truck className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">배송현황</h1>
                <p className="text-sm text-gray-500">전체 배송 현황을 확인합니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 필터링 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">필터링</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 시작날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                시작날짜
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 완료날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                완료날짜
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 상태 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package2 className="w-4 h-4 inline mr-1" />
                상태
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* 초기화 버튼 */}
            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                초기화
              </button>
            </div>
          </div>

          {/* 필터링 결과 요약 */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                {startDate && endDate && (
                  <span className="mr-4">
                    📅 {startDate} ~ {endDate}
                  </span>
                )}
                {selectedStatus !== '전체' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {selectedStatus}
                  </span>
                )}
              </div>
              <div className="text-gray-900 font-medium">
                총 <span className="text-blue-600">{filteredDeliveries.length}</span>건 조회됨
              </div>
            </div>
          </div>
        </div>

        {filteredDeliveries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {deliveries.length === 0 ? '배송 건이 없습니다' : '조건에 맞는 배송이 없습니다'}
            </h3>
            <p className="text-gray-500">
              {deliveries.length === 0 ? '아직 등록된 배송이 없습니다.' : '필터 조건을 변경해 보세요.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDeliveries.map((delivery) => (
              <div key={delivery.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                
                {/* 배송번호 헤더 */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b">
                  <div className="flex items-center gap-2">
                    <Package2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-600">배송번호</p>
                      <p className="text-lg font-bold text-blue-900">{delivery.tracking_number || `#${delivery.id}`}</p>
                    </div>
                  </div>
                </div>

                {/* 배송 정보 */}
                <div className="p-6 space-y-4">
                  
                  {/* 발송인 */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">발송인</p>
                      <p className="text-base font-semibold text-gray-900">{delivery.sender_name}</p>
                    </div>
                  </div>

                  {/* 발송인 주소 */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">발송인 주소</p>
                      <p className="text-sm text-gray-900 leading-relaxed">{delivery.sender_address}</p>
                    </div>
                  </div>

                  {/* 고객주소 */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">고객주소</p>
                      <p className="text-sm text-gray-900 leading-relaxed">{delivery.customer_address}</p>
                    </div>
                  </div>

                  {/* 접수일자 */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">접수일자</p>
                      <p className="text-base font-semibold text-gray-900">{formatDate(delivery.created_at)}</p>
                    </div>
                  </div>

                  {/* 상태 */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-600">상태</p>
                      {getStatusBadge(delivery.status)}
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        {/* 총 건수 표시 */}
        {deliveries.length > 0 && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border">
              <Package2 className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                표시: <span className="font-semibold text-blue-600">{filteredDeliveries.length}</span>건 
                / 전체: <span className="font-semibold text-gray-900">{deliveries.length}</span>건
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryStatusPage;