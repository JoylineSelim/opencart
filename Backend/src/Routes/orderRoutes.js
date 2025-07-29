import express from 'express';
import {protect}from '../middleware/authMiddleware.js';
import { createOrder, getAllOrders, getOrderById , getOrderByNumber , getOrdersByCustomer, updateOrderStatus, getOrderStats,} from '../Controllers/orderController.js';

const router = express.Router();
router.post('/create', protect, createOrder);
router.get('/all', protect, getAllOrders);
router.get('/:id', protect, getOrderById);
router.get('/number/:orderNumber', protect, getOrderByNumber);
router.get('/customer/:customerId', protect, getOrdersByCustomer);
router.put('/:id/status', protect, updateOrderStatus);
router.get('/stats', protect, getOrderStats);

export default router;
