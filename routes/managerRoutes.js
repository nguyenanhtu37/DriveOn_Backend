<<<<<<< HEAD
import express from 'express';
import { authMiddleware, managerMiddleware } from '../middleware/authMiddleware.js';
import { registerGarage, viewGarages, updateGarage, deleteGarage, getGarageById } from '../controller/managerController.js';
=======
import express from "express";
import {
  authMiddleware,
  managerMiddleware,
} from "../middleware/authMiddleware.js";
import {
  registerGarage,
  viewGarages,
  updateGarage,
  deleteGarage,
  getGarageById,
} from "../controller/managerController.js";
>>>>>>> 889a6ac27c0ec17914663090716014cca0110ae7

const router = express.Router();

router.use(authMiddleware);
router.use(managerMiddleware);

<<<<<<< HEAD
router.post('/register-garage', authMiddleware, registerGarage);  
router.get('/garages', viewGarages);
router.get('/garages/:id', getGarageById);
router.put('/garages/:id', updateGarage);
router.delete('/garages/:id', deleteGarage);  
=======
router.post("/register-garage", authMiddleware, registerGarage);
router.get("/garages", viewGarages);
router.get("/garages/:id", getGarageById);
router.put("/garages/:id", updateGarage);
router.delete("/garages/:id", deleteGarage);
>>>>>>> 889a6ac27c0ec17914663090716014cca0110ae7

export default router;
