const express = require('express');
const router = express.Router();
const { getDbSchema, getTableRelationships, getPartnersList, deleteAllPartners, getDriversList, deleteAllDrivers, createRandomDriver, createRandomPartner, createRandomDelivery, createCustomDelivery, deleteAllDeliveries, addDriverIdColumn, getDeliveriesList, create3Partners } = require('../controllers/testController');

// GET /api/test/db-schema - DB 스키마 정보 조회 (관리자만)
router.get('/db-schema', getDbSchema);

// GET /api/test/table-relationships - 테이블 관계 정보 조회 (관리자만)
router.get('/table-relationships', getTableRelationships);

// GET /api/test/partners - 파트너사 목록 조회 (관리자만)
router.get('/partners', getPartnersList);

// DELETE /api/test/partners - 모든 파트너사 삭제 (관리자만)
router.delete('/partners', deleteAllPartners);

// GET /api/test/drivers - 기사 목록 조회 (관리자만)
router.get('/drivers', getDriversList);

// DELETE /api/test/drivers - 모든 기사 삭제 (관리자만)
router.delete('/drivers', deleteAllDrivers);

// POST /api/test/create-driver - 랜덤 기사 생성 (관리자만)
router.post('/create-driver', createRandomDriver);

// POST /api/test/create-partner - 랜덤 파트너사 사용자 생성 (관리자만)
router.post('/create-partner', createRandomPartner);

// POST /api/test/create-3-partners - 3명의 특정 파트너사 생성 (관리자만)
router.post('/create-3-partners', create3Partners);

// POST /api/test/create-delivery - 랜덤 배송 생성 (관리자만)
router.post('/create-delivery', (req, res, next) => {
  console.log('[라우트] /create-delivery 요청 수신');
  next();
}, createRandomDelivery);

// POST /api/test/create-custom-delivery - 커스텀 배송 생성 (관리자만)
router.post('/create-custom-delivery', (req, res, next) => {
  console.log('[라우트] /create-custom-delivery 요청 수신');
  next();
}, createCustomDelivery);

// DELETE /api/test/deliveries - 모든 배송 삭제 (관리자만)
router.delete('/deliveries', deleteAllDeliveries);

// POST /api/test/add-driver-column - deliveries 테이블에 driver_id 컬럼 추가 (관리자만)
router.post('/add-driver-column', addDriverIdColumn);

// GET /api/test/deliveries - 배송 목록 조회 (관리자만)
router.get('/deliveries', getDeliveriesList);

module.exports = router;