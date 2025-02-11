import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { registerGarage, viewGarages, updateGarage, deleteGarage, getGarageById } from '../controller/managerController.js';

const router = express.Router();

router.use(authMiddleware);

router.post("/register-garage", authMiddleware, registerGarage);
router.get("/garages", viewGarages);
router.get("/garages/:id", getGarageById); //sprint3/week6
router.put("/garages/:id", updateGarage);
router.delete("/garages/:id", deleteGarage);

export default router;
