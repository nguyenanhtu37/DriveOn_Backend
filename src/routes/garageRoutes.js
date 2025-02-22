import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import  {checkManagerRole} from "../middleware/managerMiddleware.js";
import { registerGarage, viewGarages, updateGarage, deleteGarage, getGarageById, viewGarageRegistrations, approveGarageRegistration, rejectGarageRegistration, getGarageRegistrationById,addStaff, viewStaff, disableStaff, enableStaff, getStaffById, enableGarage, disableGarage } from '../controller/garageController.js';

const router = express.Router();

router.use(authMiddleware);
// garage staff - protected routes
router.post("/:id/add-staff",checkManagerRole, addStaff);
router.get("/:id/staff", viewStaff);
router.get("/:id/staff/:staffId", getStaffById);
router.put("/:id/staff/disable",checkManagerRole, disableStaff);
router.put("/:id/staff/enable",checkManagerRole, enableStaff);

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

router.post("/register-garage", authMiddleware, registerGarage); // register new garage
router.get("/garages/:id", getGarageById); // view garage details  
router.get('/garage-registrations', adminMiddleware, viewGarageRegistrations); // view garage registration list
router.get('/garage-registrations/:id', adminMiddleware, getGarageRegistrationById); // view garage registration details
router.post('/garage-registrations/:id/approve', adminMiddleware, approveGarageRegistration); // approve garage registration
router.post('/garage-registrations/:id/reject', adminMiddleware, rejectGarageRegistration); // reject garage registration
router.get("/garages", authMiddleware, viewGarages); // view all garages that are managed by the garage manager
// router.put("/garages/:id", updateGarage);
// router.delete('/garage/:id', deleteGarage);

router.put('/:id/enable', enableGarage);
router.put('/:id/disable', disableGarage);

export default router;