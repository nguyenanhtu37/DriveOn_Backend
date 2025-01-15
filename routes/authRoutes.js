const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { authenticateGarageOwner } = require('../middleware/authMiddleware');

router.post('/register/carOwner', authController.registerCarOwner);
router.post('/register/garageOwner', authController.registerGarageOwner);
router.post('/register/garageStaff', authenticateGarageOwner, authController.registerGarageStaff);
router.post('/login', authController.login);
router.get('/verify-email', authController.verifyEmail);

module.exports = router;