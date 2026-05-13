const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getDashboardStats, getTopFoods, getTopShippers, getRevenueStats,
  getAllOrders, assignShipper, cancelOrderByAdmin,
  getAllUsers, createUser, updateUser, resetPassword, deleteUser,
  getRestaurant, updateRestaurant,
  getCategories, createCategory, updateCategory, deleteCategory,
  getFoodsAdmin, createFood, updateFood, deleteFood,
} = require('../controllers/adminController');

router.get('/stats', authMiddleware(['Admin']), getDashboardStats);
router.get('/top-foods', authMiddleware(['Admin']), getTopFoods);
router.get('/top-shippers', authMiddleware(['Admin']), getTopShippers);
router.get('/revenue-stats', authMiddleware(['Admin']), getRevenueStats);

router.get('/orders', authMiddleware(['Admin']), getAllOrders);
router.put('/orders/:id/assign-shipper', authMiddleware(['Admin']), assignShipper);
router.put('/orders/:id/cancel', authMiddleware(['Admin']), cancelOrderByAdmin);

router.get('/users', authMiddleware(['Admin']), getAllUsers);
router.post('/users', authMiddleware(['Admin']), createUser);
router.put('/users/:id', authMiddleware(['Admin']), updateUser);
router.put('/users/:id/reset-password', authMiddleware(['Admin']), resetPassword);
router.delete('/users/:id', authMiddleware(['Admin']), deleteUser);

router.get('/restaurant', authMiddleware(['Admin']), getRestaurant);
router.put('/restaurant', authMiddleware(['Admin']), updateRestaurant);

router.get('/categories', authMiddleware(['Admin']), getCategories);
router.post('/categories', authMiddleware(['Admin']), createCategory);
router.put('/categories/:id', authMiddleware(['Admin']), updateCategory);
router.delete('/categories/:id', authMiddleware(['Admin']), deleteCategory);

router.get('/foods', authMiddleware(['Admin']), getFoodsAdmin);
router.post('/foods', authMiddleware(['Admin']), createFood);
router.put('/foods/:id', authMiddleware(['Admin']), updateFood);
router.delete('/foods/:id', authMiddleware(['Admin']), deleteFood);

module.exports = router;
