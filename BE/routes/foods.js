const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getRestaurant, getMenu, getFoods, getFoodsByCategory,
  getFoodDetail, searchFoods, validateOrder,
} = require('../controllers/foodController');

router.get('/restaurant', getRestaurant);
router.get('/menu', getMenu);
router.get('/menu/:maDanhMuc', getFoodsByCategory);
router.get('/foods', getFoods);
router.get('/foods/search', searchFoods);
router.get('/foods/:id', getFoodDetail);
router.post('/validate-order', authMiddleware(['KhachHang']), validateOrder);

module.exports = router;
