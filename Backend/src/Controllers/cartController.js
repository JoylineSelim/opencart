import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';

// @desc    Get user's cart
// @route   GET /api/cart/:userId
// @access  Public (for now, ideally Private/Authenticated)
export const getCart = async (req, res) => {
    console.log('--- getCart function called ---');
    try {
        const { userId } = req.params;

        const cart = await Cart.findOne({ user: userId })
            .populate('items.productId', 'name price image'); // Populate product details

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found for this user.' });
        }

        res.status(200).json({ success: true, data: cart });

    } catch (error) {
        console.error('Error in getCart:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching cart.', error: error.message });
    }
};

// @desc    Add item to cart or update quantity
// @route   POST /api/cart/add
// @access  Public (for now, ideally Private/Authenticated)
export const addItemToCart = async (req, res) => {
    console.log('--- addItemToCart function called ---');
    try {
        const { userId, productId, quantity,price } = req.body;

        if (!userId || !productId || !quantity || price) {
            return res.status(400).json({ success: false, message: 'Please provide correct fields' });

        }
        if (quantity <= 0) return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            // If no cart exists for the user, create a new one
            cart = new Cart({
                user: userId,
                items: [{ productId, quantity, priceAtTime: product.price }]
            });
        } else {
            // If cart exists, check if item is already in cart
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

            if (itemIndex > -1) {
                // Item exists, update quantity
                cart.items[itemIndex].quantity += quantity;
                cart.items[itemIndex].priceAtTime = product.price; // Update price in case it changed
            } else {
                // Item does not exist, add new item
                cart.items.push({ productId, quantity, priceAtTime: product.price });
            }
        }

        const updatedCart = await cart.save(); // Save the cart (pre-save hook calculates total)
        res.status(200).json({ success: true, message: 'Item added/updated in cart.', data: updatedCart });

    } catch (error) {
        console.error('Error in addItemToCart:', error);
        res.status(500).json({ success: false, message: 'Server error while adding item to cart.', error: error.message });
    }
};

// @desc    Update item quantity in cart
// @route   PUT /api/cart/update
// @access  Public (for now, ideally Private/Authenticated)
export const updateCartItem = async (req, res) => {
    console.log('--- updateCartItem function called ---');
    try {
        const { userId, productId, quantity } = req.body;

        if (!userId || !productId || quantity === undefined || quantity < 0) {
            return res.status(400).json({ success: false, message: 'User ID, Product ID, and a valid quantity are required.' });
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found for this user.' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not found in cart.' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found in database.' });
        }

        if (quantity === 0) {
            // Remove item if quantity is 0
            cart.items.splice(itemIndex, 1);
        } else {
            // Update quantity
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].priceAtTime = product.price; // Update price in case it changed
        }

        const updatedCart = await cart.save();
        res.status(200).json({ success: true, message: 'Cart item quantity updated.', data: updatedCart });

    } catch (error) {
        console.error('Error in updateCartItem:', error);
        res.status(500).json({ success: false, message: 'Server error while updating cart item.', error: error.message });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove
// @access  Public (for now, ideally Private/Authenticated)
export const removeItemFromCart = async (req, res) => {
    console.log('--- removeItemFromCart function called ---');
    try {
        const { userId, productId } = req.body; // Or use req.params if sending via URL

        if (!userId || !productId) {
            return res.status(400).json({ success: false, message: 'User ID and Product ID are required.' });
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found for this user.' });
        }

        const initialLength = cart.items.length;
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        if (cart.items.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Product not found in cart to remove.' });
        }

        const updatedCart = await cart.save();
        res.status(200).json({ success: true, message: 'Item removed from cart.', data: updatedCart });

    } catch (error) {
        console.error('Error in removeItemFromCart:', error);
        res.status(500).json({ success: false, message: 'Server error while removing item from cart.', error: error.message });
    }
};

// @desc    Clear user's entire cart
// @route   DELETE /api/cart/clear/:userId
// @access  Public (for now, ideally Private/Authenticated)
export const clearCart = async (req, res) => {
    console.log('--- clearCart function called ---');
    try {
        const { userId } = req.params;

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found for this user.' });
        }

        cart.items = []; // Empty the items array
        const clearedCart = await cart.save(); // Save to update totalPrice to 0

        res.status(200).json({ success: true, message: 'Cart cleared successfully.', data: clearedCart });

    } catch (error) {
        console.error('Error in clearCart:', error);
        res.status(500).json({ success: false, message: 'Server error while clearing cart.', error: error.message });
    }
};

