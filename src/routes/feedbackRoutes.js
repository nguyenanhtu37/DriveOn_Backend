import express from 'express';
import { addFeedback, viewFeedbackByGarageId, updateFeedback } from '../controller/feedbackController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/add', authMiddleware, addFeedback);
router.get('/garage/:id', viewFeedbackByGarageId);
router.put('/:id', authMiddleware, updateFeedback);

export default router;