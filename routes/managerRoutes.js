import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { registerGarage, viewGarages, updateGarage, deleteGarage, getGarageById, addStaff, viewStaff} from '../controller/garageController.js';
import {
    checkManagerRole
} from "../middleware/managerMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(checkManagerRole);

router.post("/register-garage", authMiddleware, registerGarage);
router.get("/garages", viewGarages);
router.get("/garages/:id", getGarageById); //sprint3/week6
router.put("/garages/:id", updateGarage);
router.delete("/garages/:id", deleteGarage);
router.post("/garages/:id/add-staff", addStaff);
router.get("/garages/:id/staff", viewStaff);
export default router;
