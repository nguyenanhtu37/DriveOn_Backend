import express from 'express';
import { sendMutipleFirebaseNotifications } from '../controller/fcmController.js';

const router = express.Router();

router.post("/send-multiple-notifications", async (req, res) => {
    const result = await sendMutipleFirebaseNotifications(req, res);
    return res.send(result);
})

export default router;