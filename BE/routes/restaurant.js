const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getRestaurantOrders, confirmOrder, readyOrder, rejectOrder } = require('../controllers/restaurantController');

router.get('/orders', authMiddleware(['NhanVien', 'Admin']), getRestaurantOrders);
router.put('/orders/:id/confirm', authMiddleware(['NhanVien', 'Admin']), confirmOrder);
router.put('/orders/:id/ready', authMiddleware(['NhanVien', 'Admin']), readyOrder);
router.put('/orders/:id/reject', authMiddleware(['NhanVien', 'Admin']), rejectOrder);

module.exports = router;
