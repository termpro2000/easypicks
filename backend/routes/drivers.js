const express = require('express');
const router = express.Router();
const {
  getAllDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  searchDrivers
} = require('../controllers/driversController');

// 기사 검색
router.get('/search', searchDrivers);

// 모든 기사 조회
router.get('/', getAllDrivers);

// 특정 기사 조회
router.get('/:id', getDriver);

// 새 기사 생성
router.post('/', createDriver);

// 기사 수정
router.put('/:id', updateDriver);

// 기사 삭제
router.delete('/:id', deleteDriver);

module.exports = router;