import express from 'express';
import { addFavoriteGarage,viewFavoriteGarages,removeFavoriteGarage } from '../controller/favoriteController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/addFavorites/:garageId', addFavoriteGarage);
router.get('/viewFavorites', viewFavoriteGarages);
router.delete('/removeFavorite/:garageId', removeFavoriteGarage);


export default router;