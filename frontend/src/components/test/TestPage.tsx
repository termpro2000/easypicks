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
import { deliveriesAPI } from '../../services/api';
import DbSchemaViewer from './DbSchemaViewer';
import PartnersListModal from './PartnersListModal';
import DriversListModal from './DriversListModal';
import DeliveriesListModal from './DeliveriesListModal';
import DeliveryCreateModal from './DeliveryCreateModal';

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
  const [deliveries] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
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
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({
        type: 'success',
        text: `파트너사 사용자가 성공적으로 생성되었습니다!\n사용자명: partner_${Date.now()}\n회사명: 테스트회사\n기본 비밀번호: test123`
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: '파트너사 사용자 생성에 실패했습니다.'
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({
        type: 'success',
        text: `파트너사가 성공적으로 삭제되었습니다.`
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: '파트너사 삭제에 실패했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDriver = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({
        type: 'success',
        text: `기사가 성공적으로 생성되었습니다!\n아이디: driver_${Date.now()}\n이름: 테스트기사\n차량유형: 1톤트럭\n배송지역: 서울\n기본 비밀번호: test123`
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: '기사 생성에 실패했습니다.'
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({
        type: 'success',
        text: `기사가 성공적으로 삭제되었습니다.`
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: '기사 삭제에 실패했습니다.'
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({
        type: 'success',
        text: `배송이 성공적으로 삭제되었습니다.`
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: '배송 삭제에 실패했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRandomDeliveries = () => {
    setShowDateInputModal(true);
  };

  const confirmCreateRandomDeliveries = async () => {
    setIsLoading(true);
    setMessage(null);
    setShowDateInputModal(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({
        type: 'success',
        text: `${visitDate} 날짜로 랜덤 배송이 생성되었습니다.`
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: '랜덤 배송 생성에 실패했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 새로운 배송 생성 함수
  const handleCreateDelivery = async (deliveryData: any) => {
    setIsCreating(true);
    setMessage(null);
    
    try {
      // deliveriesAPI를 사용해 실제 배송 생성
      const createData = {
        sender_name: deliveryData.sender_name,
        sender_address: deliveryData.sender_address,
        customer_name: deliveryData.customer_name,
        customer_phone: deliveryData.customer_phone,
        customer_address: deliveryData.customer_address,
        product_name: deliveryData.product_name,
        request_type: deliveryData.request_type,
        status: deliveryData.status,
        visit_date: deliveryData.visit_date,
        visit_time: deliveryData.visit_time,
        special_instructions: deliveryData.special_instructions,
        main_memo: deliveryData.main_memo,
        delivery_memo: `테스트 생성 - ${new Date().toLocaleString()}`,
        delivery_fee: deliveryData.delivery_fee,
        cod_amount: deliveryData.cod_amount,
        insurance_amount: deliveryData.insurance_value,
        is_fragile: deliveryData.fragile,
        driver_notes: deliveryData.driver_notes,
        detail_notes: deliveryData.detail_notes
      };

      const response = await deliveriesAPI.createDelivery ? 
        deliveriesAPI.createDelivery(createData) : 
        await fetch('/api/deliveries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          },
          body: JSON.stringify(createData)
        }).then(res => res.json());

      setShowDeliveryCreateModal(false);
      setMessage({
        type: 'success',
        text: `새 배송이 성공적으로 생성되었습니다!\n운송장번호: ${response.trackingNumber || deliveryData.tracking_number}\n고객명: ${deliveryData.customer_name}\n상품명: ${deliveryData.product_name}`
      });
    } catch (error: any) {
      console.error('배송 생성 오류:', error);
      setMessage({
        type: 'error',
        text: '배송 생성에 실패했습니다: ' + (error.message || '알 수 없는 오류')
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (currentView === 'db-schema') {
    return <DbSchemaViewer onBack={() => setCurrentView('main')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            관리자화면으로 돌아가기
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">시스템 테스트 도구</h1>
            <p className="text-gray-600">
              시스템의 각종 기능을 테스트하고 데이터베이스를 관리할 수 있습니다.
            </p>
          </div>

          {/* 메시지 표시 */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <div className="whitespace-pre-line">{message.text}</div>
              <button
                onClick={() => setMessage(null)}
                className="ml-auto text-current hover:bg-current/10 rounded p-1"
              >
                ×
              </button>
            </div>
          )}

          {/* 테스트 도구 버튼들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* DB 구성도 보기 */}
            <button
              onClick={handleDbSchema}
              disabled={isLoading}
              className="flex flex-col items-center gap-4 p-6 bg-purple-50 hover:bg-purple-100 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-16 h-16 bg-purple-500 group-hover:bg-purple-600 rounded-full flex items-center justify-center transition-colors">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">DB 구성도</h3>
                <p className="text-sm text-gray-600">데이터베이스 스키마 보기</p>
              </div>
            </button>

            {/* 파트너사 추가 */}
            <button
              onClick={handleAddPartner}
              disabled={isLoading}
              className="flex flex-col items-center gap-4 p-6 bg-blue-50 hover:bg-blue-100 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-16 h-16 bg-blue-500 group-hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">파트너사 추가</h3>
                <p className="text-sm text-gray-600">랜덤 파트너사 사용자 생성</p>
              </div>
            </button>

            {/* 파트너사 목록 */}
            <button
              onClick={() => setShowPartnersModal(true)}
              disabled={isLoading}
              className="flex flex-col items-center gap-4 p-6 bg-green-50 hover:bg-green-100 rounded-xl border-2 border-green-200 hover:border-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-16 h-16 bg-green-500 group-hover:bg-green-600 rounded-full flex items-center justify-center transition-colors">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">파트너사 목록</h3>
                <p className="text-sm text-gray-600">등록된 파트너사 조회</p>
              </div>
            </button>

            {/* 파트너사 삭제 */}
            <button
              onClick={handleDeleteAllPartners}
              disabled={isLoading}
              className="flex flex-col items-center gap-4 p-6 bg-red-50 hover:bg-red-100 rounded-xl border-2 border-red-200 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-16 h-16 bg-red-500 group-hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                <Trash2 className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">파트너사 삭제</h3>
                <p className="text-sm text-gray-600">모든 파트너사 삭제</p>
              </div>
            </button>

            {/* 기사 추가 */}
            <button
              onClick={handleAddDriver}
              disabled={isLoading}
              className="flex flex-col items-center gap-4 p-6 bg-orange-50 hover:bg-orange-100 rounded-xl border-2 border-orange-200 hover:border-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-16 h-16 bg-orange-500 group-hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">기사 추가</h3>
                <p className="text-sm text-gray-600">랜덤 배송기사 생성</p>
              </div>
            </button>

            {/* 기사 목록 */}
            <button
              onClick={() => setShowDriversModal(true)}
              disabled={isLoading}
              className="flex flex-col items-center gap-4 p-6 bg-indigo-50 hover:bg-indigo-100 rounded-xl border-2 border-indigo-200 hover:border-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-16 h-16 bg-indigo-500 group-hover:bg-indigo-600 rounded-full flex items-center justify-center transition-colors">
                <List className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">기사 목록</h3>
                <p className="text-sm text-gray-600">등록된 배송기사 조회</p>
              </div>
            </button>

            {/* 기사 삭제 */}
            <button
              onClick={handleDeleteAllDrivers}
              disabled={isLoading}
              className="flex flex-col items-center gap-4 p-6 bg-red-50 hover:bg-red-100 rounded-xl border-2 border-red-200 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-16 h-16 bg-red-500 group-hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                <Trash2 className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">기사 삭제</h3>
                <p className="text-sm text-gray-600">모든 기사 삭제</p>
              </div>
            </button>

            {/* 배송 목록 */}
            <button
              onClick={() => setShowDeliveriesModal(true)}
              disabled={isLoading}
              className="flex flex-col items-center gap-4 p-6 bg-teal-50 hover:bg-teal-100 rounded-xl border-2 border-teal-200 hover:border-teal-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-16 h-16 bg-teal-500 group-hover:bg-teal-600 rounded-full flex items-center justify-center transition-colors">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">배송 목록</h3>
                <p className="text-sm text-gray-600">배송 현황 조회</p>
              </div>
            </button>

            {/* 배송 생성 */}
            <button
              onClick={() => setShowDeliveryCreateModal(true)}
              disabled={isLoading}
              className="flex flex-col items-center gap-4 p-6 bg-pink-50 hover:bg-pink-100 rounded-xl border-2 border-pink-200 hover:border-pink-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-16 h-16 bg-pink-500 group-hover:bg-pink-600 rounded-full flex items-center justify-center transition-colors">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">배송 생성</h3>
                <p className="text-sm text-gray-600">테스트 배송 생성</p>
              </div>
            </button>

            {/* 랜덤 배송 생성 */}
            <button
              onClick={handleCreateRandomDeliveries}
              disabled={isLoading}
              className="flex flex-col items-center gap-4 p-6 bg-cyan-50 hover:bg-cyan-100 rounded-xl border-2 border-cyan-200 hover:border-cyan-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-16 h-16 bg-cyan-500 group-hover:bg-cyan-600 rounded-full flex items-center justify-center transition-colors">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">랜덤 배송</h3>
                <p className="text-sm text-gray-600">날짜별 랜덤 배송 생성</p>
              </div>
            </button>

            {/* 배송 삭제 */}
            <button
              onClick={handleDeleteAllDeliveries}
              disabled={isLoading}
              className="flex flex-col items-center gap-4 p-6 bg-red-50 hover:bg-red-100 rounded-xl border-2 border-red-200 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-16 h-16 bg-red-500 group-hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                <Trash2 className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">배송 삭제</h3>
                <p className="text-sm text-gray-600">모든 배송 삭제</p>
              </div>
            </button>

          </div>

          {/* 경고 메시지 */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div className="text-yellow-800">
              <p className="font-medium">주의사항</p>
              <p className="text-sm">
                이 도구들은 테스트 목적으로만 사용해주세요. 
                운영 환경에서는 데이터 삭제 기능을 신중하게 사용하시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      {showPartnersModal && (
        <PartnersListModal 
          isOpen={showPartnersModal}
          onClose={() => setShowPartnersModal(false)} 
        />
      )}

      {showDriversModal && (
        <DriversListModal 
          isOpen={showDriversModal}
          onClose={() => setShowDriversModal(false)} 
        />
      )}

      {showDeliveriesModal && (
        <DeliveriesListModal 
          isOpen={showDeliveriesModal}
          onClose={() => setShowDeliveriesModal(false)}
          deliveries={deliveries}
        />
      )}

      {showDeliveryCreateModal && (
        <DeliveryCreateModal 
          isOpen={showDeliveryCreateModal}
          onClose={() => setShowDeliveryCreateModal(false)}
          onSave={handleCreateDelivery}
          isLoading={isCreating}
        />
      )}

      {/* 확인 모달들 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">파트너사 삭제 확인</h3>
            <p className="text-gray-600 mb-6">정말로 모든 파트너사를 삭제하시겠습니까?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteAllPartners}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {showDriverDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">기사 삭제 확인</h3>
            <p className="text-gray-600 mb-6">정말로 모든 기사를 삭제하시겠습니까?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDriverDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteAllDrivers}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeliveriesDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">배송 삭제 확인</h3>
            <p className="text-gray-600 mb-6">정말로 모든 배송을 삭제하시겠습니까?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeliveriesDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteAllDeliveries}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {showDateInputModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">방문 날짜 입력</h3>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-6"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDateInputModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={confirmCreateRandomDeliveries}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPage;