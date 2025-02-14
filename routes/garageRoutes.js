import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { registerGarage, viewGarages, updateGarage, deleteGarage, getGarageById, viewGarageRegistrations, approveGarageRegistration, rejectGarageRegistration, addStaff } from '../controller/garageController.js';
import {
    checkManagerRole
} from '../middleware/managerMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(checkManagerRole);

// garage manager routes
router.post("/register-garage", authMiddleware, registerGarage);
router.get("/garages", viewGarages);
router.get("/garages/:id", getGarageById); //sprint3/week6
router.put("/garages/:id", updateGarage);
router.post("/garages/:id/add-staff", addStaff);
// router.get("/garages/:id/staff", viewStaff);

// system administator routes
router.use(adminMiddleware);
router.get('/garage-registrations', viewGarageRegistrations);
router.post('/garage-registrations/:id/approve', approveGarageRegistration);
router.post('/garage-registrations/:id/reject', rejectGarageRegistration);
router.delete('/garage/:id', deleteGarage);

export default router;