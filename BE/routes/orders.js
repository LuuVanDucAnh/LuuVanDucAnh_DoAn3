const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createOrder, getMyOrders, cancelOrder, getOrderById, confirmPayment } = require('../controllers/orderController');

router.post('/', authMiddleware(['KhachHang']), createOrder);
router.get('/', authMiddleware(['KhachHang']), getMyOrders);
router.get('/:id', authMiddleware(), getOrderById);
router.put('/:id/cancel', authMiddleware(['KhachHang']), cancelOrder);
router.put('/:id/confirm-payment', authMiddleware(['Admin', 'NhanVien']), confirmPayment);

module.exports = router;
