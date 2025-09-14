import React, { useState, useEffect, useRef } from 'react';
import { Package, TrendingUp, Clock, CheckCircle, AlertCircle, Search, Filter, RefreshCw, Pause, Play, Truck, Download, FileSpreadsheet, FileText, Eye, User, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api, deliveriesAPI, userAPI } from '../../services/api';
import type { ShippingOrder } from '../../types';
import CompanySelectionModal from '../admin/CompanySelectionModal';
// OrderDetailModal import 제거됨

/**
 * 대시보드 통계 데이터 인터페이스
 */
interface DashboardStats {
  total: number;
  접수완료: number;
  창고입고: number;
  기사상차: number;
  배송완료: number;
  반품접수: number;
  수거완료: number;
  주문취소: number;
}

/**
 * 대시보드 컴포넌트 props 인터페이스
 */
interface DashboardProps {
  /** 주문 상태 변경 시 호출되는 콜백 함수 */
  onOrderStatusChange?: (orderInfo: {
    orderId: number;
    status: string;
    customerName?: string;
    trackingNumber?: string;
  }) => void;
}

interface UserOption {
  id: string;
  name: string;
  username: string;
  company?: string;
  phone?: string;
  default_sender_name?: string;
  default_sender_address?: string;
  default_sender_detail_address?: string;
  default_sender_company?: string;
  default_sender_phone?: string;
}

/**
 * 배송 관리 대시보드 컴포넌트
 * 주문 목록 조회, 통계 표시, 실시간 업데이트, 데이터 내보내기 기능 제공
 * 
 * @param props - 컴포넌트 props
 * @returns 대시보드 JSX 엘리먼트
 */
const Dashboard: React.FC<DashboardProps> = ({ onOrderStatusChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 파트너사 선택 상태
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    접수완료: 0,
    창고입고: 0,
    기사상차: 0,
    배송완료: 0,
    반품접수: 0,
    수거완료: 0,
    주문취소: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // selectedOrder 상태 제거됨
  // isModalOpen 상태 제거됨
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const visibilityRef = useRef<boolean>(true);

  /**
   * 페이지 가시성 변화를 감지하여 비활성 상태에서 자동 새로고침을 중지하고,
   * 다시 활성화될 때 즉시 데이터를 업데이트
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      visibilityRef.current = !document.hidden;
      
      // 페이지가 보이게 되면 즉시 새로고침
      if (!document.hidden && isAutoRefreshEnabled) {
        fetchOrders(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAutoRefreshEnabled]);

  /**
   * 자동 새로고침 기능 설정 - 10초마다 데이터 업데이트
   * 페이지가 보이는 상태에서만 실행
   */
  useEffect(() => {
    if (isAutoRefreshEnabled) {
      intervalRef.current = setInterval(() => {
        // 페이지가 보일 때만 새로고침
        if (visibilityRef.current) {
          fetchOrders(true); // 새로고침 인디케이터 표시
        }
      }, 10000); // 10초마다
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRefreshEnabled]);

  /**
   * 컴포넌트 마운트 시 초기 데이터 로드
   */
  useEffect(() => {
    fetchOrders();
  }, []);

  /**
   * 서버에서 주문 데이터를 가져와서 로컬 상태와 통계를 업데이트
   * @param showRefreshIndicator - 새로고침 인디케이터 표시 여부
   */
  const fetchOrders = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await deliveriesAPI.getDeliveries(1, 1000); // 최대 1000개 데이터 조회
      const ordersData = response.deliveries || [];
      
      setOrders(ordersData);
      setLastUpdated(new Date());
      
      // 통계 계산
      const newStats = {
        total: ordersData.length,
        접수완료: ordersData.filter((o: any) => o.status === '접수완료').length,
        배차완료: ordersData.filter((o: any) => o.status === '배차완료').length,
        배송중: ordersData.filter((o: any) => o.status === '배송중').length,
        배송완료: ordersData.filter((o: any) => o.status === '배송완료').length,
        배송취소: ordersData.filter((o: any) => o.status === '배송취소').length,
        수거중: ordersData.filter((o: any) => o.status === '수거중').length,
        수거완료: ordersData.filter((o: any) => o.status === '수거완료').length,
        조처완료: ordersData.filter((o: any) => o.status === '조처완료').length,
        배송연기: ordersData.filter((o: any) => o.status === '배송연기').length
      };
      setStats(newStats);
    } catch (error: any) {
      console.error('주문 목록을 가져오는 중 오류 발생:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * 주문 상태에 따른 배지 스타일과 아이콘을 반환
   * @param status - 주문 상태 (접수완료, 창고입고, 기사상차, 배송완료, 반품접수, 수거완료, 주문취소)
   * @returns JSX 요소
   */
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      '접수완료': { color: 'bg-yellow-100 text-yellow-800', text: '접수완료', icon: Clock },
      '창고입고': { color: 'bg-blue-100 text-blue-800', text: '창고입고', icon: Package },
      '기사상차': { color: 'bg-purple-100 text-purple-800', text: '기사상차', icon: Truck },
      '배송완룼': { color: 'bg-green-100 text-green-800', text: '배송완룼', icon: CheckCircle },
      '반품접수': { color: 'bg-orange-100 text-orange-800', text: '반품접수', icon: TrendingUp },
      '수거완룼': { color: 'bg-indigo-100 text-indigo-800', text: '수거완룼', icon: CheckCircle },
      '주문취소': { color: 'bg-red-100 text-red-800', text: '주문취소', icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['접수완료'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = 
      order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleOrderClick = (order: ShippingOrder) => {
    console.log('상세보기 클릭:', order.id);
    navigate(`/delivery/${order.id}`);
  };

  const handleManualRefresh = () => {
    fetchOrders(true);
  };

  const toggleAutoRefresh = () => {
    setIsAutoRefreshEnabled(!isAutoRefreshEnabled);
  };

  const formatLastUpdated = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      await deliveriesAPI.updateDeliveryStatus(orderId, newStatus);
      
      // 주문 목록 새로고침
      await fetchOrders(true);
      
      // selectedOrder 관련 코드 제거됨
      
    } catch (error: any) {
      console.error('상태 업데이트 실패:', error);
    }
  };

  /**
   * 데이터를 지정된 형식으로 내보내기
   * @param format - 내보내기 형식 (xlsx 또는 csv)
   * @param type - 내보내기 데이터 유형 (orders: 주문 데이터, statistics: 통계 데이터)
   */
  const handleExport = async (format: 'xlsx' | 'csv', type: 'orders' | 'statistics') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const endpoint = type === 'orders' ? 'orders' : 'statistics';
      const url = `/api/exports/${endpoint}?${params.toString()}`;
      
      // 파일 다운로드
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 
                     `export_${type}_${new Date().toISOString().split('T')[0]}.${format}`;
      
      // 파일 다운로드 트리거
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = decodeURIComponent(filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('데이터 내보내기 중 오류가 발생했습니다.');
    }
  };

  // 파트너사 선택 함수
  const handleCompanySelect = (company: UserOption) => {
    setSelectedUser(company);
    setIsCompanyModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드를 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 파트너사 선택 섹션 */}
      <div className="bg-red-50 rounded-xl shadow-lg border-2 border-red-200 p-6">
        <h2 className="text-xl font-bold text-red-800 mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-red-600" />
          파트너사 선택 (관리자 전용)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">
                발송 업체 선택
                <span className="text-red-500 ml-1">*</span>
              </h3>
            </div>
            <div className="space-y-2">
              <div className="space-y-3">
                {/* 회사 선택 버튼 */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCompanyModalOpen(true)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-between"
                  >
                    <span className="text-gray-700">
                      {selectedUser ? 
                        `${selectedUser.default_sender_company || selectedUser.company || '업체명 없음'} (${selectedUser.name})` 
                        : '발송업체를 선택하세요'}
                    </span>
                    <Search className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCompanyModalOpen(true)}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    조회
                  </button>
                </div>
                
                {/* 선택된 파트너사 정보 표시 */}
                {selectedUser && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      선택된 발송업체
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-blue-700 font-medium">업체명:</span>
                        <span className="ml-2 text-blue-800">
                          {selectedUser.default_sender_company || selectedUser.company || '업체명 없음'}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">담당자:</span>
                        <span className="ml-2 text-blue-800">{selectedUser.name}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">전화번호:</span>
                        <span className="ml-2 text-blue-800">{selectedUser.phone || '없음'}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">전체 주소:</span>
                        <span className="ml-2 text-blue-800">
                          {selectedUser.default_sender_address || '주소 없음'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 주문</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">접수완료</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.접수완료}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">배차완료</p>
              <p className="text-3xl font-bold text-blue-600">{stats.배차완료}</p>
            </div>
            <Package className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">배송완료</p>
              <p className="text-3xl font-bold text-green-600">{stats.배송완료}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>
      </div>

      {/* 주문 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">이지픽스 배송정보</h3>
              
              {/* 새로고침 상태 표시 */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {isRefreshing && (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                )}
                <span>마지막 업데이트: {formatLastUpdated(lastUpdated)}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {/* 모바일: 상단 컨트롤 행 */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* 새로고침 컨트롤 */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors touch-manipulation"
                    title="수동 새로고침"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden xs:inline">새로고침</span>
                  </button>
                  
                  <button
                    onClick={toggleAutoRefresh}
                    className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors touch-manipulation ${
                      isAutoRefreshEnabled 
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                    title={isAutoRefreshEnabled ? '자동 새로고침 끄기' : '자동 새로고침 켜기'}
                  >
                    {isAutoRefreshEnabled ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span className="hidden xs:inline">자동 ON</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span className="hidden xs:inline">자동 OFF</span>
                      </>
                    )}
                  </button>
                  
                  {/* 데이터 내보내기 버튼 */}
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors touch-manipulation"
                    title="데이터 내보내기"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden xs:inline">내보내기</span>
                  </button>
                </div>
              </div>
              
              {/* 모바일: 검색 및 필터 행 */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* 검색 */}
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="운송장번호, 고객명, 상품명 검색..."
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* 상태 필터 */}
                <div className="relative sm:w-48">
                  <Filter className="w-5 h-5 absolute left-3 top-3 text-gray-400 pointer-events-none" />
                  <select
                    className="w-full pl-10 pr-8 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-base"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">모든 상태</option>
                    <option value="접수완료">접수완료</option>
                    <option value="창고입고">창고입고</option>
                    <option value="기사상차">기사상차</option>
                    <option value="배송완료">배송완료</option>
                    <option value="반품접수">반품접수</option>
                    <option value="수거완료">수거완료</option>
                    <option value="주문취소">주문취소</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 데스크톱: 테이블 뷰 */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  운송장번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  고객이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상품명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  접수일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' ? '검색 결과가 없습니다.' : '배송 주문이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.tracking_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customer_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.product_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1 touch-manipulation"
                        onClick={() => handleOrderClick(order)}
                      >
                        <Eye className="w-4 h-4" />
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 모바일/태블릿: 카드 뷰 */}
        <div className="lg:hidden space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              {searchTerm || statusFilter !== 'all' ? '검색 결과가 없습니다.' : '배송 주문이 없습니다.'}
            </div>
          ) : (
            filteredOrders.map((order: any) => (
              <div key={order.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-4">
                  {/* 카드 헤더 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-900">
                        {order.tracking_number || `주문 #${order.id}`}
                      </span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  {/* 카드 내용 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">고객이름</span>
                      <span className="text-sm font-medium text-gray-900">{order.customer_name || '-'}</span>
                    </div>
                    {order.product_name && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">상품명</span>
                        <span className="text-sm font-medium text-gray-900 text-right">
                          {order.product_name}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">접수일</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(order.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                  
                  {/* 카드 액션 */}
                  <div className="flex justify-end">
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors touch-manipulation"
                      onClick={() => handleOrderClick(order)}
                    >
                      <Eye className="w-4 h-4" />
                      상세보기
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 데이터 내보내기 모달 */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">데이터 내보내기</h3>
              
              {/* 날짜 범위 설정 */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작 날짜</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료 날짜</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 내보내기 옵션 */}
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-medium text-gray-700">주문 데이터 내보내기</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleExport('xlsx', 'orders')}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Excel 파일</span>
                  </button>
                  <button
                    onClick={() => handleExport('csv', 'orders')}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">CSV 파일</span>
                  </button>
                </div>
                
                {/* 매니저/관리자만 통계 리포트 내보내기 가능 */}
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <>
                    <h4 className="text-sm font-medium text-gray-700 mt-4">통계 리포트 내보내기</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleExport('xlsx', 'statistics')}
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        <span className="text-sm">Excel 리포트</span>
                      </button>
                      <button
                        onClick={() => handleExport('csv', 'statistics')}
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm">CSV 리포트</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 파트너사 선택 모달 */}
      {isCompanyModalOpen && (
        <CompanySelectionModal
          isOpen={isCompanyModalOpen}
          onClose={() => setIsCompanyModalOpen(false)}
          onSelectCompany={handleCompanySelect}
        />
      )}

      {/* 주문 상세 모달 제거됨 */}
    </div>
  );
};

export default Dashboard;