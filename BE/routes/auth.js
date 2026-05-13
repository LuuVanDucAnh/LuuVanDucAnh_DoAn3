const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  register, login, getProfile,
  updateProfile, changePassword, refreshToken,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', authMiddleware(), refreshToken);
router.get('/profile', authMiddleware(), getProfile);
router.put('/profile', authMiddleware(), updateProfile);
router.put('/change-password', authMiddleware(), changePassword);

module.exports = router;
