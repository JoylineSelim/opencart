// models/Transaction.js
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
    }],
    totalPrice: { type: Number, required: true, min: 0 },
    currency: {
        type: String,
        required: true,
        enum: ['KES', 'USD', 'EUR', 'GBP', 'NGN', 'INR', 'ZAR'],
        default: 'KES'
    },
    transactionDate: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled', 'processing', 'on_hold'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['stripe', 'mpesa'],
        required: true
    },
    paymentReferenceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'paymentMethodRef'
    },
    paymentMethodRef: {
        type: String,
        enum: ['StripePayment', 'MpesaPayment']
    },
    shippingAddress: { type: String, required: true },
    shippingMethod: {
        type: String,
        enum: ['standard', 'express', 'overnight'],
        default: 'standard'
    },
    trackingNumber: { type: String },
    shippingCost: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    ipAddress: { type: String },
    userAgent: { type: String }
}, { timestamps: true });

transactionSchema.index({ user: 1, productId: 1, transactionDate: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ paymentMethod: 1 });
transactionSchema.index({ createdAt: 1 });


export default mongoose.model("Transaction", transactionSchema);
