const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getPendingOrders, getMyTasks, receiveOrder, completeOrder, cancelDelivery, getMyProfile } = require('../controllers/shippingController');

router.get('/pending', authMiddleware(['Shipper']), getPendingOrders);
router.get('/my-tasks', authMiddleware(['Shipper']), getMyTasks);
router.get('/profile', authMiddleware(['Shipper']), getMyProfile);
router.put('/:id/receive', authMiddleware(['Shipper']), receiveOrder);
router.put('/:id/complete', authMiddleware(['Shipper']), completeOrder);
router.put('/:id/cancel-delivery', authMiddleware(['Shipper']), cancelDelivery);

module.exports = router;
