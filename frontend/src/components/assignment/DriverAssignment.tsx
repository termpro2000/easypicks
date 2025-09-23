import React, { useState, useEffect } from 'react';
import { Truck, User, Package, MapPin, Clock, CheckCircle, AlertCircle, Search, Filter, Bot, UserCheck, ArrowLeft } from 'lucide-react';
import { deliveriesAPI, driversAPI } from '../../services/api';

// 실제 기사 데이터 인터페이스
interface DriverData {
  driver_id: number;
  username: string;
  name: string;
  phone?: string;
  email?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  license_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // 계산된 추가 정보
  status: 'available' | 'busy' | 'offline';
  currentOrders: number;
  maxOrders: number;
  rating?: number;
  totalDeliveries?: number;
}

// 배송 데이터 인터페이스
interface DeliveryOrder {
  id: number;
  tracking_number: string;
  sender_name: string;
  receiver_name?: string;
  receiver_address?: string;
  customer_name?: string;
  customer_address?: string;
  product_name?: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
  assigned_driver?: string;
  driver_id?: string;
  driver_name?: string;
}

interface DriverAssignmentProps {
  onNavigateBack?: () => void;
}

const DriverAssignment: React.FC<DriverAssignmentProps> = ({ onNavigateBack }) => {
  const [drivers, setDrivers] = useState<DriverData[]>([]);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [driversLoading, setDriversLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [driverFilter, setDriverFilter] = useState('all'); // all, available, busy, offline
  const [orderFilter, setOrderFilter] = useState('all'); // all, unassigned, assigned
  const [searchTerm, setSearchTerm] = useState('');
  const [assignmentType, setAssignmentType] = useState<'auto' | 'manual'>('manual'); // 배차 방식 선택

  // 기사 데이터 로드
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setDriversLoading(true);
        console.log('Fetching drivers...');
        const response = await driversAPI.getAllDrivers();
        console.log('Drivers API response:', response);
        
        // API 응답을 DriverData 형태로 변환
        const driversArray = response.drivers || response.data || response || [];
        const driverUsers: DriverData[] = driversArray.map((driver: any) => {
          // 해당 기사가 담당하고 있는 현재 배송 수 계산
          // driver_id, driver_name, assigned_driver 중 하나라도 매칭되면 해당 기사의 배송으로 간주
          const currentOrders = orders.filter(order => 
            (order.driver_id === driver.driver_id?.toString() || 
             order.driver_name === driver.name || 
             order.assigned_driver === driver.name) &&
            ['pending', 'in_transit'].includes(order.status)
          ).length;
          
          return {
            driver_id: driver.driver_id || driver.id,
            username: driver.username || '',
            name: driver.name || '이름 없음',
            phone: driver.phone || '연락처 없음',
            email: driver.email || '',
            vehicle_type: driver.vehicle_type || '미등록',
            vehicle_number: driver.vehicle_number || '미등록',
            license_number: driver.license_number || '미등록',
            is_active: driver.is_active !== undefined ? driver.is_active : true,
            created_at: driver.created_at || new Date().toISOString(),
            updated_at: driver.updated_at || new Date().toISOString(),
            // 계산된 정보
            status: !driver.is_active ? 'offline' : 
                   currentOrders >= 8 ? 'busy' : 'available' as 'available' | 'busy' | 'offline',
            currentOrders,
            maxOrders: 10, // 기본값, 실제로는 기사별 설정 필요
            rating: 4.0 + Math.random(), // 4.0~5.0 사이의 임시값
            totalDeliveries: Math.floor(Math.random() * 1000) + 100 // 임시값, 실제로는 통계에서
          };
        });
        
        setDrivers(driverUsers);
      } catch (error: any) {
        console.error('기사 데이터 로드 실패:', error);
        
        // 에러 발생시 빈 배열로 설정
        setDrivers([]);
      } finally {
        setDriversLoading(false);
      }
    };

    fetchDrivers();
  }, [orders]); // orders가 변경될 때마다 기사의 currentOrders를 재계산

  // 배송 데이터 로드
  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        setLoading(true);
        console.log('🚚 배송 데이터 로딩 시작...');
        const response = await deliveriesAPI.getDeliveries(1, 1000); // 최대 1000개
        console.log('📦 배송 API 응답:', response);
        
        // API 응답을 DeliveryOrder 형태로 변환
        const deliveriesArray = response.deliveries || response.orders || response.data || [];
        const deliveryOrders: DeliveryOrder[] = deliveriesArray.map((delivery: any) => ({
          id: delivery.id,
          tracking_number: delivery.tracking_number || '',
          sender_name: delivery.sender_name || '발송자 미정',
          receiver_name: delivery.receiver_name,
          receiver_address: delivery.receiver_address,
          customer_name: delivery.customer_name,
          customer_address: delivery.customer_address,
          product_name: delivery.product_name || '상품명 미정',
          status: delivery.status || 'pending',
          created_at: delivery.created_at || new Date().toISOString(),
          assigned_driver: delivery.assigned_driver,
          driver_id: delivery.driver_id,
          driver_name: delivery.driver_name
        }));
        
        console.log('✅ 변환된 배송 주문:', deliveryOrders);
        
        // 임시 테스트 데이터 - API 응답이 없을 경우를 위한 백업
        if (deliveryOrders.length === 0) {
          console.log('⚠️ API에서 데이터가 없어서 테스트 데이터 사용');
          const testOrders: DeliveryOrder[] = [
            {
              id: 999,
              tracking_number: 'TEST001',
              sender_name: '테스트 발송자',
              customer_name: '테스트 고객',
              product_name: '테스트 상품',
              status: 'pending',
              created_at: new Date().toISOString()
            }
          ];
          setOrders(testOrders);
        } else {
          setOrders(deliveryOrders);
        }
      } catch (error) {
        console.error('❌ 배송 데이터 로드 실패:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
        // 에러가 발생해도 빈 배열로 설정하여 로딩 상태 해제
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, []);

  // 기사 상태별 색상 및 텍스트
  const getDriverStatusConfig = (status: string) => {
    const configs = {
      available: { color: 'bg-green-100 text-green-800', text: '대기중', icon: CheckCircle },
      busy: { color: 'bg-yellow-100 text-yellow-800', text: '배송중', icon: Clock },
      offline: { color: 'bg-gray-100 text-gray-800', text: '오프라인', icon: AlertCircle }
    };
    return configs[status as keyof typeof configs] || configs.available;
  };

  // 배송 상태별 색상 및 텍스트 (실제 DB 상태에 맞춤)
  const getDeliveryStatusConfig = (status: string) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: '접수대기' },
      in_transit: { color: 'bg-blue-100 text-blue-800', text: '배송중' },
      delivered: { color: 'bg-green-100 text-green-800', text: '배송완료' },
      cancelled: { color: 'bg-red-100 text-red-800', text: '취소' }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  // 우선순위 계산 (생성일 기준으로 자동 설정)
  const getPriorityConfig = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return { color: 'bg-red-100 text-red-800', text: '긴급' };
    } else if (hoursDiff > 12) {
      return { color: 'bg-orange-100 text-orange-800', text: '높음' };
    } else {
      return { color: 'bg-blue-100 text-blue-800', text: '보통' };
    }
  };

  // 기사 필터링
  const filteredDrivers = drivers.filter(driver => {
    const matchesStatus = driverFilter === 'all' || driver.status === driverFilter;
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.phone?.includes(searchTerm) ||
                         driver.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // 주문 필터링
  const filteredOrders = orders.filter(order => {
    const hasDriver = !!(order.assigned_driver || order.driver_id || order.driver_name);
    const matchesAssignment = orderFilter === 'all' || 
                             (orderFilter === 'unassigned' && !hasDriver) ||
                             (orderFilter === 'assigned' && hasDriver);
    const matchesSearch = order.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.receiver_name && order.receiver_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesAssignment && matchesSearch;
  });

  console.log('🔍 필터링 상태:', { 
    totalOrders: orders.length, 
    orderFilter, 
    searchTerm,
    filteredOrders: filteredOrders.length,
    orders: orders.slice(0, 2) // 처음 2개만 로그
  });

  // 주문 선택/해제
  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // 기사에게 주문 배정
  const assignOrdersToDriver = async () => {
    if (!selectedDriver || selectedOrders.length === 0) return;

    const selectedDriverInfo = drivers.find(d => d.driver_id === selectedDriver);
    if (!selectedDriverInfo) return;

    try {
      // 각 주문에 대해 배정 처리
      for (const orderId of selectedOrders) {
        await deliveriesAPI.updateDelivery(orderId, {
          driver_id: selectedDriver.toString(),
          driver_name: selectedDriverInfo.name,
          assigned_driver: selectedDriverInfo.name,
          status: 'in_transit'
        });
      }

      // 로컬 상태 업데이트
      setOrders(prev => prev.map(order => 
        selectedOrders.includes(order.id)
          ? { 
              ...order, 
              driver_id: selectedDriver.toString(),
              driver_name: selectedDriverInfo.name,
              assigned_driver: selectedDriverInfo.name,
              status: 'in_transit' as const
            }
          : order
      ));

      // 선택 해제
      setSelectedOrders([]);
      setSelectedDriver(null);
      
      alert(`${selectedOrders.length}개 주문이 성공적으로 배정되었습니다.`);
    } catch (error) {
      console.error('배정 실패:', error);
      alert('배정 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      {onNavigateBack && (
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>관리자화면으로 돌아가기</span>
        </button>
      )}

      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">기사 배정 관리</h2>
        <p className="text-blue-100">
          기사와 배송 주문을 효율적으로 배정하고 관리하세요.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 기사</p>
              <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
            </div>
            <Truck className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">대기중</p>
              <p className="text-2xl font-bold text-green-600">
                {drivers.filter(d => d.status === 'available').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">배송중</p>
              <p className="text-2xl font-bold text-yellow-600">
                {drivers.filter(d => d.status === 'busy').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">미배정 주문</p>
              <p className="text-2xl font-bold text-red-600">
                {orders.filter(o => !(o.assigned_driver || o.driver_id || o.driver_name)).length}
              </p>
            </div>
            <Package className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* 배차 방식 선택 */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-600" />
          배차 방식 선택
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            assignmentType === 'auto' 
              ? 'border-blue-500 bg-blue-100' 
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}>
            <input
              type="radio"
              name="assignmentType"
              value="auto"
              checked={assignmentType === 'auto'}
              onChange={(e) => setAssignmentType(e.target.value as 'auto' | 'manual')}
              className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="flex items-center gap-3">
              <Bot className={`w-6 h-6 ${assignmentType === 'auto' ? 'text-blue-600' : 'text-gray-500'}`} />
              <div>
                <div className={`font-semibold ${assignmentType === 'auto' ? 'text-blue-800' : 'text-gray-700'}`}>
                  AI 자동배차
                </div>
                <div className={`text-sm ${assignmentType === 'auto' ? 'text-blue-600' : 'text-gray-500'}`}>
                  AI가 거리, 기사 상태, 작업량을 분석하여 최적 배정
                </div>
              </div>
            </div>
          </label>

          <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            assignmentType === 'manual' 
              ? 'border-blue-500 bg-blue-100' 
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}>
            <input
              type="radio"
              name="assignmentType"
              value="manual"
              checked={assignmentType === 'manual'}
              onChange={(e) => setAssignmentType(e.target.value as 'auto' | 'manual')}
              className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="flex items-center gap-3">
              <UserCheck className={`w-6 h-6 ${assignmentType === 'manual' ? 'text-blue-600' : 'text-gray-500'}`} />
              <div>
                <div className={`font-semibold ${assignmentType === 'manual' ? 'text-blue-800' : 'text-gray-700'}`}>
                  수동배차
                </div>
                <div className={`text-sm ${assignmentType === 'manual' ? 'text-blue-600' : 'text-gray-500'}`}>
                  관리자가 직접 기사를 선택하여 배정
                </div>
              </div>
            </div>
          </label>
        </div>

        {/* 선택된 배차 방식에 대한 액션 버튼 */}
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
          {assignmentType === 'auto' ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <strong>AI 자동배차 모드:</strong>{' '}
                <span className="text-blue-600">
                  미배정 주문을 AI가 분석하여 자동으로 기사에게 배정합니다.
                </span>
              </div>
              <button
                onClick={() => {
                  // TODO: AI 자동배차 기능 구현
                  alert('AI 자동배차 기능은 아직 구현되지 않았습니다.');
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                🤖 AI 자동배차 실행
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <strong>수동배차 모드:</strong>{' '}
              <span className="text-orange-600">
                아래에서 기사를 선택한 후 주문을 선택하여 직접 배정하세요.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 기사 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">기사 목록</h3>
            
            <div className="flex flex-col gap-4">
              {/* 검색 */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="기사명, 전화번호, 지역 검색..."
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* 상태 필터 */}
              <div className="relative">
                <Filter className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <select
                  className="w-full pl-10 pr-8 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                >
                  <option value="all">모든 기사</option>
                  <option value="available">대기중</option>
                  <option value="busy">배송중</option>
                  <option value="offline">오프라인</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {driversLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">기사 데이터를 로딩 중...</div>
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <div className="text-gray-500">등록된 기사가 없습니다.</div>
                  <div className="text-sm text-gray-400 mt-1">관리자 메뉴에서 기사를 추가해주세요.</div>
                </div>
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      기사정보
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      차량정보
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      배송현황
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      선택
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDrivers.map((driver) => {
                    const statusConfig = getDriverStatusConfig(driver.status);
                    const StatusIcon = statusConfig.icon;
                    const isSelected = selectedDriver === driver.driver_id;
                    
                    return (
                      <tr
                        key={driver.driver_id}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => setSelectedDriver(selectedDriver === driver.driver_id ? null : driver.driver_id)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-500" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                              <div className="text-sm text-gray-500">{driver.phone || '연락처 없음'}</div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.text}
                          </span>
                        </td>
                        
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Truck className="w-4 h-4" />
                            <span>{driver.vehicle_type || '미등록'}</span>
                          </div>
                          <div className="text-xs text-gray-500">{driver.vehicle_number || '번호 없음'}</div>
                        </td>
                        
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center justify-between">
                            <span>배송: {driver.currentOrders}/{driver.maxOrders}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>⭐ {driver.rating?.toFixed(1)}</span>
                            <span>총 {driver.totalDeliveries}건</span>
                          </div>
                        </td>
                        
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDriver(selectedDriver === driver.driver_id ? null : driver.driver_id);
                            }}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                              isSelected 
                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {isSelected ? '선택됨' : '선택'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 배송 주문 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">배송 주문</h3>
            
            <div className="flex flex-col gap-4">
              {/* 주문 필터 */}
              <div className="relative">
                <Filter className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <select
                  className="w-full pl-10 pr-8 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                >
                  <option value="all">모든 주문</option>
                  <option value="unassigned">미배정 주문</option>
                  <option value="assigned">배정완료 주문</option>
                </select>
              </div>
              
              {selectedDriver && selectedOrders.length > 0 && (
                <button
                  onClick={assignOrdersToDriver}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {selectedOrders.length}개 주문 배정하기
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">배송 데이터를 로딩 중...</div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">조건에 맞는 주문이 없습니다.</div>
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      주문정보
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      고객정보
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상품/주소
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      선택
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const priorityConfig = getPriorityConfig(order.created_at);
                    const statusConfig = getDeliveryStatusConfig(order.status);
                    const isSelected = selectedOrders.includes(order.id);
                    const hasAssignedDriver = !!(order.assigned_driver || order.driver_id || order.driver_name);
                    const assignedDriverName = order.driver_name || order.assigned_driver || 
                                              (order.driver_id && drivers.find(d => d.driver_id?.toString() === order.driver_id)?.name);

                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-200' : ''
                        } ${hasAssignedDriver ? 'opacity-75' : ''}`}
                        onClick={() => !hasAssignedDriver && toggleOrderSelection(order.id)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Package className="w-4 h-4 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{order.tracking_number}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(order.created_at).toLocaleDateString('ko-KR')}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div>발송: {order.sender_name}</div>
                          <div>수취: {order.receiver_name || order.customer_name || '미정'}</div>
                        </td>
                        
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div>{order.product_name || '상품명 미정'}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {order.receiver_address || order.customer_address || '주소 미정'}
                          </div>
                        </td>
                        
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.text}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.color}`}>
                              {priorityConfig.text}
                            </span>
                          </div>
                          {hasAssignedDriver && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <User className="w-3 h-3" />
                              {assignedDriverName}
                            </div>
                          )}
                        </td>
                        
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          {!hasAssignedDriver && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleOrderSelection(order.id);
                              }}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
                          {hasAssignedDriver && (
                            <span className="text-xs text-green-600 font-medium">배정완료</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 사용법 안내 */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
          🚛 배정 방법
        </h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. 왼쪽에서 배정할 기사를 선택하세요</li>
          <li>2. 오른쪽에서 배정할 주문을 선택하세요 (여러 개 선택 가능)</li>
          <li>3. "주문 배정하기" 버튼을 클릭하여 배정을 완료하세요</li>
          <li>4. 배정된 주문은 자동으로 "배송준비" 상태로 변경됩니다</li>
        </ol>
      </div>
    </div>
  );
};

export default DriverAssignment;