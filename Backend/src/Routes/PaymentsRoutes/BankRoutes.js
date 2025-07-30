import {
    sendMoney_Credit,
    collectMoney_Debit,
    reverseTransaction,
    banks,
    timeout,
    resultCallback,
    queryTransactionStatus
} from '../../Controllers/PaymentControllers/BankController.js'
import {protect} from '../../middleware/authMiddleware.js'
import express from 'express'
const router = express.Router()
router.post('/send', protect, sendMoney_Credit);
router.post('/collect', protect, collectMoney_Debit);
router.post('/query', protect, queryTransactionStatus);
router.post('/reverse', protect, reverseTransaction);
router.post('/callback/result', resultCallback);
router.post('/callback/timeout', timeout);
router.get('/banks', protect, banks);

export default router