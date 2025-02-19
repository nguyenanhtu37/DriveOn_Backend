import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { registerGarage, viewGarages, updateGarage, deleteGarage, getGarageById, viewGarageRegistrations, approveGarageRegistration, rejectGarageRegistration, getGarageRegistrationById } from '../controller/garageController.js';

const router = express.Router();

router.use(authMiddleware);

// garage manager - protected routes
router.post("/register-garage", authMiddleware, registerGarage);
router.get("/garages", viewGarages);
router.get("/garages/:id", getGarageById);
router.put("/garages/:id", updateGarage);

// system administrator - protected routes
router.use(adminMiddleware);
router.get('/garage-registrations', viewGarageRegistrations);
router.get('/garage-registrations/:id', getGarageRegistrationById);
router.post('/garage-registrations/:id/approve', approveGarageRegistration);
router.post('/garage-registrations/:id/reject', rejectGarageRegistration);
router.delete('/garage/:id', deleteGarage);

export default router;