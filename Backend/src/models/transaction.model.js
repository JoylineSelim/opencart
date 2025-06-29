import mongoose  from "mongoose";

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stripePaymentIntentId: {
        type: String,
        required: true,
        unique: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD','KES', 'NGN', 'GHS', 'ZAR', 'INR', 'PKR', 'BDT', 'LKR', 'MUR', 'TND', 'MAD', 'EGP'],
        default: 'KES',
        uppercase: true
    },
    transactionDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled', 'processing', 'on_hold'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'paypal', 'bank_transfer', 'crypto'],
        required: true
    },
    last4:String,
    cardBrand: String,
    expMonth: Number,
    expYear:Number,
    billingAddress: {
        type: String,
        required: true
    },
    description: {
        type: String,
        trim: true,
    },
    metadata: {
        type: map,
        of: String
    },
    refunds:[{
        amount: {
            type: Number,
            default: 0
        },
        reason:String,
        stripeRefundId: String,
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    fees:{
        stripe: Number,
        default: 0
    },
    receiptUrl: String,
    failureReason: String,
    riskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    ipAddress: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v);
            },
            message: props => `${props.value} is not a valid IP address!`
        },

    },
    userAgent: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return v.length <= 255; // Example validation for user agent length
            },
            message: props => `${props.value} exceeds maximum length of 255 characters!`
        }

    },
    shippingAddress: {
        type: String,
        required: true
    },
    shippingMethod: {
        type: String,
        enum: ['standard', 'express', 'overnight'],
        default: 'standard'
    },
    trackingNumber: {
        type: String,
        validate: {
            validator: function(v) {
                return /^[A-Z0-9]{10,20}$/.test(v); // Example validation for tracking number format
            },
            message: props => `${props.value} is not a valid tracking number!`
        }
    },
    shippingCost: {
        type: Number,
        default: 0,
        min: 0
    },
    taxAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    taxRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    


}, { timestamps: true });

transactionSchema.index({ user: 1, productId: 1, transactionDate: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ paymentMethod: 1 });
transactionSchema.index({ stripePaymentIntentId: -1 });
transactionSchema.index({ createdAt: 1 });

export default mongoose.model('Transaction', transactionSchema);