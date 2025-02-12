import express from 'express';
import { authMiddleware, carOwnerMiddleware } from '../middleware/authMiddleware.js';
import { addVehicle, viewVehicles } from '../controller/vehicleController.js';

const router = express.Router();

router.use(authMiddleware);
router.use(carOwnerMiddleware);

router.post('/add', addVehicle);
router.get('/', viewVehicles);


export default router;