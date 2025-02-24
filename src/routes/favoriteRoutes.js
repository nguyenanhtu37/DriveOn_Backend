import express from 'express';
import { addFavoriteGarage } from '../controller/favoriteController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/addFavorites/:garageId', authMiddleware, addFavoriteGarage);

export default router;