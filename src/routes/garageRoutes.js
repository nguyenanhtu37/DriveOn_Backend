import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { registerGarage, viewGarages, updateGarage, deleteGarage, getGarageById, viewGarageRegistrations, approveGarageRegistration, rejectGarageRegistration, getGarageRegistrationById, addStaff, viewStaff, disableStaff, enableStaff, getStaffById, enableGarage, disableGarage, viewGarageExisting } from '../controller/garageController.js';

const router = express.Router();

// garage staff - protected routes
router.post("/:id/add-staff", authMiddleware, addStaff);
router.get("/:id/staff", authMiddleware, viewStaff);
router.get("/:id/staff/:staffId", authMiddleware, getStaffById);
router.put("/:id/staff/disable", authMiddleware, disableStaff);
router.put("/:id/staff/enable", authMiddleware, enableStaff);

router.post("/register-garage", authMiddleware, registerGarage); // register new garage
router.get("/garages/:id", getGarageById); // view garage details  
router.get('/garage-registrations', adminMiddleware, viewGarageRegistrations); // view garage registration list
router.get('/garage-registrations/:id', adminMiddleware, getGarageRegistrationById); // view garage registration details
router.post('/garage-registrations/:id/approve', adminMiddleware, approveGarageRegistration); // approve garage registration
router.post('/garage-registrations/:id/reject', adminMiddleware, rejectGarageRegistration); // reject garage registration
router.get("/garages", authMiddleware, viewGarages); // view all garages that are managed by the garage manager
// router.put("/garages/:id", updateGarage);
// router.delete('/garage/:id', deleteGarage);

router.get('/existing', viewGarageExisting);
router.put('/:id/enable', enableGarage);
router.put('/:id/disable', disableGarage);

export default router;