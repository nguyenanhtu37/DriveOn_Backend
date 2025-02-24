import express from 'express';
import { addFavoriteGarage,viewFavoriteGarages } from '../controller/favoriteController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/addFavorites/:garageId', authMiddleware, addFavoriteGarage);
router.get('/viewFavorites', authMiddleware, viewFavoriteGarages);


export default router;