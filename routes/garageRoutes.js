import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { registerGarage, viewGarages, updateGarage, deleteGarage, getGarageById, viewGarageRegistrations, approveGarageRegistration, rejectGarageRegistration } from '../controller/garageController.js';

const router = express.Router();

router.use(authMiddleware);

// garage manager routes
router.post("/register-garage", authMiddleware, registerGarage);
router.get("/garages", viewGarages);
router.get("/garages/:id", getGarageById); //sprint3/week6
router.put("/garages/:id", updateGarage);

// system administator routes
router.use(adminMiddleware);
router.get('/garage-registrations', viewGarageRegistrations);
router.post('/garage-registrations/:id/approve', approveGarageRegistration);
router.post('/garage-registrations/:id/reject', rejectGarageRegistration);
router.delete('/garage/:id', deleteGarage);

export default router;