const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  createDelivery, 
  getDeliveries, 
  getDelivery, 
  trackDelivery,
  updateDeliveryStatus,
  updateDelivery,
  completeDelivery,
  postponeDelivery,
  delayDelivery,
  cancelDelivery,
  createTestData,
  runMigration,
  forceCreateColumns,
  checkColumns,
  deleteAllDeliveries
} = require('../controllers/deliveriesController');

// 새 배송 생성 (JWT 인증 필요)
router.post('/', authenticateToken, createDelivery);

// 배송 목록 조회 (JWT 인증 필요)
router.get('/', authenticateToken, getDeliveries);

// 특정 배송 상세 조회 (JWT 인증 필요)
router.get('/:id', authenticateToken, getDelivery);

// 배송 정보 전체 업데이트 (JWT 인증 필요)
router.put('/:id', authenticateToken, updateDelivery);

// 배송 상태만 업데이트 (JWT 인증 필요)
router.patch('/:id/status', authenticateToken, updateDeliveryStatus);

// 공개 배송 추적 API (인증 불필요)
router.get('/track/:trackingNumber', trackDelivery);

// 배송 완료 처리 (JWT 인증 필요)
router.post('/complete/:id', authenticateToken, completeDelivery);

// 배송 연기 처리 (JWT 인증 필요)
router.post('/postpone/:id', authenticateToken, postponeDelivery);

// 배송 연기 처리 - tracking number로 (JWT 인증 필요)
router.post('/delay/:trackingNumber', authenticateToken, delayDelivery);

// 배송 취소 처리 (JWT 인증 필요)
router.post('/cancel/:id', authenticateToken, cancelDelivery);

// 테스트 배송 데이터 생성 (개발용)
router.post('/create-test-data', authenticateToken, createTestData);

// 수동 마이그레이션 실행 (개발용)
router.post('/run-migration', authenticateToken, runMigration);

// 강제 컬럼 생성 (production용)
router.post('/force-create-columns', authenticateToken, forceCreateColumns);

// 컬럼 상태 확인 (개발용)
router.get('/debug/columns', authenticateToken, checkColumns);

// 모든 배송 데이터 삭제 (테스트용 - 관리자 권한 필요)
router.delete('/all', authenticateToken, deleteAllDeliveries);

module.exports = router;