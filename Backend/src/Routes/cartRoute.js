
import express from 'express';
import {
    getCart,
    addItemToCart,
    updateCartItem,
    removeItemFromCart,
    clearCart,
} from '../Controllers/cartController.js';

const router = express.Router();

// Get user's cart
router.get('/:userId', getCart);

// Add item to cart or update quantity if exists
router.post('/add', addItemToCart);

// Update item quantity in cart
router.put('/update', updateCartItem);

// Remove item from cart
router.delete('/remove', removeItemFromCart);

// Clear user's entire cart
router.delete('/clear/:userId', clearCart);

// Proceed to checkout (create order/transaction from cart)
//router.post('/checkout', checkoutCart);

export default router;