import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { registerGarage } from '../controller/managerController.js';

const router = express.Router();
router.post('/register-garage', authMiddleware, registerGarage);    

export default router;