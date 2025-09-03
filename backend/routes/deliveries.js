const express = require('express');
const router = express.Router();
const { 
  createDelivery, 
  getDeliveries, 
  getDelivery, 
  trackDelivery,
  updateDeliveryStatus,
  updateDelivery 
} = require('../controllers/deliveriesController');

// 새 배송 생성
router.post('/', createDelivery);

// 배송 목록 조회 (페이지네이션, 상태 필터링)
router.get('/', getDeliveries);

// 특정 배송 상세 조회
router.get('/:id', getDelivery);

// 배송 정보 전체 업데이트
router.put('/:id', updateDelivery);

// 배송 상태만 업데이트
router.patch('/:id/status', updateDeliveryStatus);

// 공개 배송 추적 API (인증 불필요)
router.get('/track/:trackingNumber', trackDelivery);

module.exports = router;