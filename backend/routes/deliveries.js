const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  createDelivery, 
  getAllDeliveries, 
  getDeliveryById, 
  updateDeliveryStatus,
  cancelDelivery,
  getDatabaseSchema
} = require('../controllers/deliveriesController');

// 새 배송 생성 (JWT 인증 필요)
router.post('/', authenticateToken, createDelivery);

// 배송 목록 조회 (JWT 인증 필요)
router.get('/', authenticateToken, getAllDeliveries);

// 특정 배송 상세 조회 (JWT 인증 필요)
router.get('/:id', authenticateToken, getDeliveryById);

// 배송 상태만 업데이트 (JWT 인증 필요)
router.patch('/:trackingNumber/status', authenticateToken, updateDeliveryStatus);

// 배송 취소 처리 (JWT 인증 필요)
router.delete('/:deliveryId', authenticateToken, cancelDelivery);

// 데이터베이스 스키마 조회 (개발용)
router.get('/debug/schema', authenticateToken, getDatabaseSchema);

module.exports = router;