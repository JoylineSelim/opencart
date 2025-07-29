import stripe from 'stripe';
import Transaction from '../../models/PaymentModels/stripe.model.js';
import User from '../../models/user.model.js';
import logger from '../../utils/logger.js';

class PaymentService {
  // Create payment intent
  static async createPaymentIntent(userId, amount, currency = 'USD', metadata = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Ensure user has Stripe customer
      if (!user.stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: { userId: user._id.toString() }
        });
        
        user.stripeCustomerId = customer.id;
        await user.save();
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        customer: user.stripeCustomerId,
        metadata: {
          userId: user._id.toString(),
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true
        }
      });

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        currency: currency.toUpperCase(),
        status: 'pending',
        metadata
      });

      await transaction.save();

      logger.info(`Payment intent created: ${paymentIntent.id} for user: ${userId}`);

      return {
        clientSecret: paymentIntent.client_secret,
        transactionId: transaction._id,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Confirm payment
  static async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      const transaction = await Transaction.findOne({
        stripePaymentIntentId: paymentIntentId
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Update transaction with payment method details
      if (paymentIntent.payment_method) {
        const paymentMethod = await stripe.paymentMethods.retrieve(
          paymentIntent.payment_method
        );

        transaction.paymentMethod = {
          type: paymentMethod.type,
          last4: paymentMethod.card?.last4,
          brand: paymentMethod.card?.brand,
          expiryMonth: paymentMethod.card?.exp_month,
          expiryYear: paymentMethod.card?.exp_year
        };
      }

      transaction.status = paymentIntent.status === 'succeeded' ? 'succeeded' : 'failed';
      transaction.receiptUrl = paymentIntent.charges?.data[0]?.receipt_url;
      
      if (paymentIntent.status === 'failed') {
        transaction.failureReason = paymentIntent.last_payment_error?.message;
      }

      await transaction.save();

      logger.info(`Payment confirmed: ${paymentIntentId} - Status: ${paymentIntent.status}`);

      return transaction;
    } catch (error) {
      logger.error('Error confirming payment:', error);
      throw error;
    }
  }

  // Process refund
  static async processRefund(transactionId, amount = null, reason = 'requested_by_customer') {
    try {
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'succeeded') {
        throw new Error('Can only refund successful transactions');
      }

      const refundAmount = amount ? Math.round(amount * 100) : undefined;

      const refund = await stripe.refunds.create({
        payment_intent: transaction.stripePaymentIntentId,
        amount: refundAmount,
        reason
      });

      // Update transaction
      transaction.refunds.push({
        amount: refund.amount / 100,
        reason,
        stripeRefundId: refund.id
      });

      const totalRefunded = transaction.refunds.reduce((sum, r) => sum + r.amount, 0);
      
      if (totalRefunded >= transaction.amount) {
        transaction.status = 'refunded';
      } else {
        transaction.status = 'partially_refunded';
      }

      await transaction.save();

      logger.info(`Refund processed: ${refund.id} for transaction: ${transactionId}`);

      return refund;
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  // Get transaction history
  static async getTransactionHistory(userId, page = 1, limit = 20, filters = {}) {
    try {
      const query = { user: userId };
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        Transaction.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Transaction.countDocuments(query)
      ]);

      return {
        transactions,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      logger.error('Error fetching transaction history:', error);
      throw error;
    }
  }
}
export default PaymentService;