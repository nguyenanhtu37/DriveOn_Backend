import express from "express";
import { addSubscription, getSubscriptions, updateSubscription, deleteSubscription } from "../controller/subscriptionController.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post('/', adminMiddleware, addSubscription);          // create
router.get('/', getSubscriptions);                           // read all
router.put('/:id', adminMiddleware, updateSubscription);     // update by ID
router.delete('/:id', adminMiddleware, deleteSubscription);  // delete by ID

export default router;