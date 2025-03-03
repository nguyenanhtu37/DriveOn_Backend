import express from 'express';
import { viewFeedbackByGarageId } from '../controller/feedbackController.js';

const router = express.Router();
router.get('/garage/:id', viewFeedbackByGarageId);

export default router;