import express from 'express';
import { getCheckoutSession } from "../controllers/bookingController.js";
import { protect } from '../controllers/authController.js';

const router = express.Router();

// route for client toget a checkout session
router.get('/checkout-session/:tourId', protect, getCheckoutSession)

export default router;