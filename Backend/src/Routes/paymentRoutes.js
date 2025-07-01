import express from 'express';
import PaymentController from '../Controllers/paymentController.js';
const router = express.Router();


router.post('/',PaymentController.createPaymentIntent);
router.get('/', PaymentController.getPayments);
router.get('/stats', PaymentController.getPaymentStats);
router.get('/myorders', PaymentController.getUserPayments);
router.get('/:id',PaymentController.getPaymentById);
router.put('/:id/status', PaymentController.updatePaymentStatus);
router.post('/:id/refund', PaymentController.processRefund);
router.delete('/:id', PaymentController.deletePayment);
export default router;