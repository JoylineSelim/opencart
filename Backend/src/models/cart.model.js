import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to the Product model
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    // You might want to store priceAtTimeOfAdding to cart for historical accuracy
    priceAtTime: {
        type: Number,
        required: true
    }
}, { _id: false }); // Do not create an _id for subdocuments if not needed

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
        unique: true // Each user should have only one cart
    },
    items: [cartItemSchema], // Array of cart items
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true }); // Add createdAt and updatedAt timestamps

// Pre-save hook to calculate total price before saving the cart
cartSchema.pre('save', async function(next) {
    let total = 0;
    for (const item of this.items) {
        total += item.quantity * item.priceAtTime;
    }
    this.totalPrice = total;
    next();
});

export default mongoose.model('Cart', cartSchema);