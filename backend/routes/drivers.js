const express = require('express');
const router = express.Router();
const driversController = require('../controllers/driversController');
const { authenticateToken } = require('../middleware/auth');

// 기사 관련 라우트
router.get('/', authenticateToken, driversController.getAllDrivers);
router.get('/search', authenticateToken, driversController.searchDrivers);
router.get('/:id', authenticateToken, driversController.getDriver);
router.post('/', authenticateToken, driversController.createDriver);
router.put('/:id', authenticateToken, driversController.updateDriver);
router.delete('/:id', authenticateToken, driversController.deleteDriver);

module.exports = router;