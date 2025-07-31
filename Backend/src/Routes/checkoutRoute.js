import { checkoutCart } from "../Controllers/checkoutController.js";
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to handle checkout process
router.post('/', protect, checkoutCart);

export default router;