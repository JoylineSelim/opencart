import express from 'express'
import {protect} from '../../middleware/authMiddleware.js'
import {
    initiateSTK,
    paymentStatus,
    mpesaCallback
} from '../../Controllers/PaymentControllers/MPESAController.js'

const router = express.Router()
//Routes
router.post('/stk/initiate',initiateSTK);
router.post('/stk/status', protect, paymentStatus);
router.post('/stk/callback', mpesaCallback);

export default router