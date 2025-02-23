import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { addVehicle, viewVehicles, getVehicleById, updateVehicle, deleteVehicle } from '../controller/vehicleController.js';

const router = express.Router();

router.use(authMiddleware);
// router.use(carOwnerMiddleware);


router.post('/add', authMiddleware, addVehicle); // add new vehicle
router.get('/', authMiddleware, viewVehicles); // view all car owner vehicles
router.get('/:id', authMiddleware, getVehicleById); // view vehicle details
router.put('/:id', authMiddleware, updateVehicle); // car owner update vehicle profile
router.delete('/:id', authMiddleware, deleteVehicle); // car owner remove their vehicle from their vehicle list

export default router;