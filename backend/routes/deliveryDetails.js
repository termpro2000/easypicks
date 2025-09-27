const express = require('express');
const router = express.Router();
const { 
  getDeliveryDetails, 
  getDeliveryProducts, 
  createDeliveryDetail 
} = require('../controllers/deliveryDetailsController');

/**
 * 특정 배송의 모든 상세 정보 조회
 * GET /api/delivery-details/:deliveryId
 */
router.get('/:deliveryId', getDeliveryDetails);

/**
 * 특정 배송의 제품 정보만 조회
 * GET /api/delivery-details/:deliveryId/products
 */
router.get('/:deliveryId/products', getDeliveryProducts);

/**
 * 배송 상세 정보 생성
 * POST /api/delivery-details
 */
router.post('/', createDeliveryDetail);

module.exports = router;