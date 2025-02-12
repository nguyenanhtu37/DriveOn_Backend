import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { addVehicle, viewVehicles, getVehicleById, updateVehicle } from '../controller/vehicleController.js';

const router = express.Router();

router.use(authMiddleware);
// router.use(carOwnerMiddleware);

router.post('/add', addVehicle);
router.get('/', viewVehicles);
router.get('/:id', getVehicleById); // Tất cả các role đều có thể xem chi tiết một vehicle
router.put('/:id', updateVehicle); 

export default router;