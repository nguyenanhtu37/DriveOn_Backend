import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import { viewGarageRegistrations } from '../controller/adminController.js';

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/garage-registrations', viewGarageRegistrations);

export default router;