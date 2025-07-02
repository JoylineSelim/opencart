import express from 'express';
import PaymentController from '../Controllers/paymentController.js';
const router = express.Router();


router.post('/newTransaction',PaymentController.createPaymentIntent);
router.get('/history', PaymentController.getTransactionHistory);
router.post('/:id/refund', PaymentController.processRefund);

export default router;