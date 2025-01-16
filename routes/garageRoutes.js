const express = require('express');
const router = express.Router();
const garageController = require('../controller/garageController');
const { verifyToken, restrict } = require('../middleware/authMiddleware');

router.post('/create', verifyToken, restrict(['garageManager']), garageController.createGarage);

module.exports = router;