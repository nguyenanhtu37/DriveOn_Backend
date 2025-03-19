import express from 'express';
import { addFeedback, viewFeedbackByGarageId } from '../controller/feedbackController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/add', authMiddleware, addFeedback);
router.get('/garage/:id', viewFeedbackByGarageId);

export default router;