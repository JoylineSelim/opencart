// controllers/CheckoutController.js
import Cart from '../models/cart.model.js';
import Transaction from '../models/transaction.model.js';
import Product from '../models/product.model.js';

export const checkoutCart = async (req, res) => {
  console.log('--- checkoutCart function called ---');

  try {
    const { userId, shippingAddress, paymentMethod, currency, ipAddress, userAgent } = req.body;

    if (!userId || !shippingAddress || !paymentMethod || !userAgent) {
      return res.status(400).json({ success: false, message: 'Please input all required fields' });
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty. Cannot proceed to checkout.' });
    }

    let totalAmount = 0;
    const transactionItems = [];

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.productId._id);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${cartItem.productId.name || cartItem.productId._id} not found.` });
      }

      const itemPrice = product.price;
      totalAmount += itemPrice * cartItem.quantity;

      transactionItems.push({
        productId: product._id,
        quantity: cartItem.quantity,
        priceAtOrder: itemPrice
      });
    }

    const newTransaction = new Transaction({
      user: userId,
      items: transactionItems,
      totalPrice: totalAmount,
      currency,
      paymentMethod,
      shippingAddress,
      ipAddress,
      userAgent,
      status: 'pending' // Now waits for payment step
    });

    const savedTransaction = await newTransaction.save();

    // Optionally clear cart after transaction is created
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    return res.status(201).json({
      success: true,
      message: 'Transaction created. Proceed to payment.',
      data: {
        transactionId: savedTransaction._id,
        totalAmount: savedTransaction.totalPrice,
        paymentMethod
      }
    });

  } catch (error) {
    console.error('Checkout Error:', error);
    res.status(500).json({ success: false, message: 'Server error during checkout.', error: error.message });
  }
};
