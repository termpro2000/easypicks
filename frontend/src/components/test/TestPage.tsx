import React, { useState } from 'react';
import { 
  Database, 
  Plus, 
  Trash2, 
  UserPlus, 
  Users, 
  Package, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  List,
  AlertTriangle
} from 'lucide-react';
import DbSchemaViewer from './DbSchemaViewer';
import PartnersListModal from './PartnersListModal';
import DriversListModal from './DriversListModal';
import DeliveriesListModal from './DeliveriesListModal';
import DeliveryCreateModal from './DeliveryCreateModal';
import { testAPI } from '../../services/api';

interface TestPageProps {
  onNavigateBack: () => void;
}

const TestPage: React.FC<TestPageProps> = ({ onNavigateBack }) => {
  const [currentView, setCurrentView] = useState<'main' | 'db-schema'>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPartnersModal, setShowPartnersModal] = useState(false);
  const [showDriversModal, setShowDriversModal] = useState(false);
  const [showDeliveriesModal, setShowDeliveriesModal] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDriverDeleteConfirm, setShowDriverDeleteConfirm] = useState(false);
  const [showDeliveriesDeleteConfirm, setShowDeliveriesDeleteConfirm] = useState(false);
  const [showDateInputModal, setShowDateInputModal] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [showDeliveryCreateModal, setShowDeliveryCreateModal] = useState(false);

  const handleDbSchema = () => {
    setCurrentView('db-schema');
  };

  const handleAddPartner = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const result = await testAPI.createRandomPartner();
      setMessage({ 
        type: 'success', 
        text: `파트너사 사용자가 성공적으로 생성되었습니다!\n사용자명: ${result.user.username}\n회사명: ${result.user.company}\n기본 비밀번호: ${result.user.defaultPassword}` 
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || '파트너사 사용자 생성에 실패했습니다.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate3Partners = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const result = await testAPI.create3Partners();
      setMessage({ 
        type: 'success', 
        text: `3명의 파트너사가 성공적으로 생성되었습니다!\n${result.users.map((user: any) => `• ${user.username} (${user.name})`).join('\n')}\n모든 계정의 기본 비밀번호: 123456` 
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || '파트너사 생성에 실패했습니다.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllPartners = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAllPartners = async () => {
    setIsLoading(true);
    setMessage(null);
    setShowDeleteConfirm(false);
    
    try {
      const result = await testAPI.deleteAllPartners();
      setMessage({ 
        type: 'success', 
        text: `${result.deletedCount}개의 파트너사가 성공적으로 삭제되었습니다.` 
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || '파트너사 삭제에 실패했습니다.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDriver = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const result = await testAPI.createRandomDriver();
      setMessage({ 
        type: 'success', 
        text: `기사가 성공적으로 생성되었습니다!\n아이디: ${result.driver.user_id}\n이름: ${result.driver.name}\n차량유형: ${result.driver.vehicle_type}\n배송지역: ${result.driver.delivery_area}\n기본 비밀번호: ${result.driver.defaultPassword}` 
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || '기사 생성에 실패했습니다.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllDrivers = () => {
    setShowDriverDeleteConfirm(true);
  };

  const confirmDeleteAllDrivers = async () => {
    setIsLoading(true);
    setMessage(null);
    setShowDriverDeleteConfirm(false);
    
    try {
      const result = await testAPI.deleteAllDrivers();
      setMessage({ 
        type: 'success', 
        text: `${result.deletedCount}개의 기사가 성공적으로 삭제되었습니다.` 
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || '기사 삭제에 실패했습니다.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewDelivery = () => {
    setShowDeliveryCreateModal(true);
  };

  const handleCreateCustomDelivery = async (deliveryData: any) => {
    setIsLoading(true);
    setMessage(null);
    setShowDeliveryCreateModal(false);
    
    try {
      const result = await testAPI.createCustomDelivery(deliveryData);
      setMessage({ 
        type: 'success', 
        text: `배송이 성공적으로 생성되었습니다!\n운송장번호: ${result.delivery.tracking_number}\n발송자: ${deliveryData.sender_name}\n고객: ${deliveryData.customer_name}\n기사: ${deliveryData.driver_name}\n방문일: ${deliveryData.visit_date}` 
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || '배송 생성에 실패했습니다.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRandomDelivery = () => {
    // 오늘 날짜를 기본값으로 설정 (YYYY-MM-DD 형식)
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setVisitDate(formattedDate);
    setShowDateInputModal(true);
  };

  const confirmAddDelivery = async () => {
    setIsLoading(true);
    setMessage(null);
    setShowDateInputModal(false);
    
    try {
      const result = await testAPI.createRandomDelivery(visitDate);
      setMessage({ 
        type: 'success', 
        text: `배송이 성공적으로 생성되었습니다!\n운송장번호: ${result.delivery.tracking_number}\n발송자: ${result.delivery.sender.name}\n고객: ${result.delivery.customer.name}\n기사: ${result.delivery.driver.name}\n배송유형: ${result.delivery.delivery_type}\n방문일: ${visitDate}` 
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || '배송 생성에 실패했습니다.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllDeliveries = () => {
    setShowDeliveriesDeleteConfirm(true);
  };

  const confirmDeleteAllDeliveries = async () => {
    setIsLoading(true);
    setMessage(null);
    setShowDeliveriesDeleteConfirm(false);
    
    try {
      const result = await testAPI.deleteAllDeliveries();
      setMessage({ 
        type: 'success', 
        text: `${result.deletedCount}개의 배송이 성공적으로 삭제되었습니다.` 
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || '배송 삭제에 실패했습니다.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowDeliveries = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const result = await testAPI.getDeliveriesList();
      setDeliveries(result.deliveries || []);
      setShowDeliveriesModal(true);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || '배송 목록 조회에 실패했습니다.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // DB 스키마 뷰어 렌더링
  if (currentView === 'db-schema') {
    return <DbSchemaViewer onNavigateBack={() => setCurrentView('main')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>뒤로 가기</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">관리자 테스트 페이지</h1>
            <div className="w-24"></div> {/* 가운데 정렬을 위한 spacer */}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">시스템 테스트 도구</h2>
            <p className="text-gray-600">
              관리자 전용 테스트 기능들입니다. 주의해서 사용하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* DB 구성도 */}
            <button
              onClick={handleDbSchema}
              className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900">DB 구성도 (스키마뷰어)</h3>
                <p className="text-sm text-gray-500 mt-1">데이터베이스 스키마 확인</p>
              </div>
            </button>

            {/* 파트너사 추가 */}
            <button
              onClick={handleAddPartner}
              disabled={isLoading}
              className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200">
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-6 h-6 text-green-600" />
                )}
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900">파트너사 추가 (랜덤생성)</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {isLoading ? '생성 중...' : '새로운 파트너사 등록'}
                </p>
              </div>
            </button>

            {/* 파트너사생성(3) */}
            <button
              onClick={handleCreate3Partners}
              disabled={isLoading}
              className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-lg hover:border-cyan-300 hover:bg-cyan-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center group-hover:bg-cyan-200">
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-6 h-6 text-cyan-600" />
                )}
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900">파트너사생성(3)</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {isLoading ? '생성 중...' : '3명의 특정 파트너사 생성'}
                </p>
              </div>
            </button>

            {/* 파트너사 목록 */}
            <button
              onClick={() => setShowPartnersModal(true)}
              className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                <List className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900">파트너사 목록 (조회모달)</h3>
                <p className="text-sm text-gray-500 mt-1">등록된 파트너사 조회</p>
              </div>
            </button>

            {/* 파트너사 전부삭제 */}
            <button
              onClick={handleDeleteAllPartners}
              disabled={isLoading}
              className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200">
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900">파트너사 전부삭제 (일괄삭제)</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {isLoading ? '삭제 중...' : '모든 파트너사 데이터 삭제'}
                </p>
              </div>
            </button>

            {/* 기사 추가 */}
            <button
              onClick={handleAddDriver}
              disabled={isLoading}
              className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-6 h-6 text-purple-600" />
                )}
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900">기사 추가 (랜덤생성)</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {isLoading ? '생성 중...' : '새로운 배송 기사 등록'}
                </p>
              </div>
            </button>

            {/* 기사 목록 */}
            <button
              onClick={() => setShowDriversModal(true)}
              className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200">
                <List className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900">기사 목록 (조회모달)</h3>
                <p className="text-sm text-gray-500 mt-1">등록된 기사 조회</p>
              </div>
            </button>

            {/* 기사 전부삭제 */}
            <button
              onClick={handleDeleteAllDrivers}
              disabled={isLoading}
              className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200">
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Users className="w-6 h-6 text-orange-600" />
                )}
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900">기사 전부삭제 (일괄삭제)</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {isLoading ? '삭제 중...' : '모든 기사 데이터 삭제'}
                </p>
              </div>
            </button>

            {/* 신규배송 추가 */}
            <button
              onClick={handleAddNewDelivery}
              className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900">신규배송 추가 (커스텀폼)</h3>
                <p className="text-sm text-gray-500 mt-1">커스텀 배송 데이터 생성</p>
              </div>
            </button>

            {/* 랜덤배송 추가 */}
            <button
              onClick={handleAddRandomDelivery}
              disabled={isLoading}
              className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200">
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-6 h-6 text-emerald-600" />
                )}
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900">랜덤배송 추가 (자동생성)</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {isLoading ? '생성 중...' : '테스트용 랜덤 배송 생성'}
                </p>
              </div>
            </button>

            {/* 배송목록 */}
            <button
              onClick={handleShowDeliveries}
              disabled={isLoading}
              className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200">
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <List className="w-6 h-6 text-teal-600" />
                )}
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900">배송목록 (조회모달)</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {isLoading ? '조회 중...' : '전체 배송 데이터 조회'}
                </p>
              </div>
            </button>

            {/* 배송목록 전부삭제 */}
            <button
              onClick={handleDeleteAllDeliveries}
              className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900">배송목록 전부삭제 (일괄삭제)</h3>
                <p className="text-sm text-gray-500 mt-1">모든 배송 데이터 삭제</p>
              </div>
            </button>
          </div>

          {/* 메시지 표시 */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  } mb-1`}>
                    {message.type === 'success' ? '성공' : '오류'}
                  </h4>
                  <div className={`text-sm ${
                    message.type === 'success' ? 'text-green-700' : 'text-red-700'
                  } whitespace-pre-line`}>
                    {message.text}
                  </div>
                </div>
                <button
                  onClick={() => setMessage(null)}
                  className={`text-sm font-medium ${
                    message.type === 'success' 
                      ? 'text-green-600 hover:text-green-800' 
                      : 'text-red-600 hover:text-red-800'
                  }`}
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          {/* 주의사항 */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ 주의사항</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 삭제 기능들은 복구가 불가능합니다.</li>
              <li>• 테스트 환경에서만 사용하세요.</li>
              <li>• 운영 환경에서는 신중하게 사용하세요.</li>
              <li>• 모든 기능은 관리자 권한이 필요합니다.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 파트너사 목록 모달 */}
      <PartnersListModal 
        isOpen={showPartnersModal}
        onClose={() => setShowPartnersModal(false)}
      />

      {/* 기사 목록 모달 */}
      <DriversListModal 
        isOpen={showDriversModal}
        onClose={() => setShowDriversModal(false)}
      />

      {/* 배송 목록 모달 */}
      <DeliveriesListModal 
        isOpen={showDeliveriesModal}
        onClose={() => setShowDeliveriesModal(false)}
        deliveries={deliveries}
      />

      {/* 배송 생성 모달 */}
      <DeliveryCreateModal
        isOpen={showDeliveryCreateModal}
        onClose={() => setShowDeliveryCreateModal(false)}
        onSave={handleCreateCustomDelivery}
        isLoading={isLoading}
      />

      {/* 파트너사 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">파트너사 전체 삭제</h3>
                  <p className="text-sm text-gray-600 mt-1">이 작업은 되돌릴 수 없습니다.</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">⚠️ 경고</p>
                    <ul className="space-y-1">
                      <li>• 관리자(admin)를 제외한 모든 파트너사가 삭제됩니다.</li>
                      <li>• 삭제된 데이터는 복구할 수 없습니다.</li>
                      <li>• 연관된 배송 데이터에 영향을 줄 수 있습니다.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  취소
                </button>
                <button
                  onClick={confirmDeleteAllPartners}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '삭제 중...' : '삭제 확인'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 기사 삭제 확인 모달 */}
      {showDriverDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">기사 전체 삭제</h3>
                  <p className="text-sm text-gray-600 mt-1">이 작업은 되돌릴 수 없습니다.</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">⚠️ 경고</p>
                    <ul className="space-y-1">
                      <li>• driver_id 테이블의 모든 기사가 삭제됩니다.</li>
                      <li>• 삭제된 데이터는 복구할 수 없습니다.</li>
                      <li>• 연관된 배송 데이터에 영향을 줄 수 있습니다.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDriverDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  취소
                </button>
                <button
                  onClick={confirmDeleteAllDrivers}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '삭제 중...' : '삭제 확인'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 배송 삭제 확인 모달 */}
      {showDeliveriesDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">배송 전체 삭제</h3>
                  <p className="text-sm text-gray-600 mt-1">이 작업은 되돌릴 수 없습니다.</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">⚠️ 경고</p>
                    <ul className="space-y-1">
                      <li>• deliveries 테이블의 모든 배송이 삭제됩니다.</li>
                      <li>• 삭제된 데이터는 복구할 수 없습니다.</li>
                      <li>• 연관된 추적 정보도 함께 삭제됩니다.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeliveriesDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  취소
                </button>
                <button
                  onClick={confirmDeleteAllDeliveries}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '삭제 중...' : '삭제 확인'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 날짜 입력 모달 */}
      {showDateInputModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">신규 배송 추가</h3>
              
              <div className="mb-6">
                <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700 mb-2">
                  방문일 선택
                </label>
                <input
                  type="date"
                  id="visitDate"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  입력된 날짜가 deliveries 테이블의 visit_date 컬럼에 저장됩니다.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDateInputModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  취소
                </button>
                <button
                  onClick={confirmAddDelivery}
                  disabled={isLoading || !visitDate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '생성 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPage;