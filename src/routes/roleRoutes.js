import express from 'express';
import { addRole } from '../controller/roleController.js';

const router = express.Router();

router.post('/add', addRole);

export default router;