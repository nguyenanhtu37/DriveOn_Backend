import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { registerGarage, viewGarages, updateGarage, deleteGarage, getGarageById, viewGarageRegistrations, approveGarageRegistration, rejectGarageRegistration, getGarageRegistrationById } from '../controller/garageController.js';

const router = express.Router();

router.post("/register-garage", authMiddleware, registerGarage); // register new garage
router.get("/garages/:id", getGarageById); // view garage details  
router.get('/garage-registrations', adminMiddleware, viewGarageRegistrations); // view garage registration list
router.get('/garage-registrations/:id', adminMiddleware, getGarageRegistrationById); // view garage registration details
router.post('/garage-registrations/:id/approve', adminMiddleware, approveGarageRegistration); // approve garage registration
router.post('/garage-registrations/:id/reject', adminMiddleware, rejectGarageRegistration); // reject garage registration
router.get("/garages", authMiddleware, viewGarages); // view all garages that are managed by the garage manager
// router.put("/garages/:id", updateGarage);
// router.delete('/garage/:id', deleteGarage);

export default router;