import PaymentService from "../../Services/Payments/stripePayments.js";
import logger from "../../utils/logger.js";
import { validationResult } from 'express-validator';
import User from '../../models/user.model.js';
import EmailService from "../../Services/emailService.js";
const emailService = new EmailService({
  host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    email: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    secure: process.env.EMAIL_SECURE === 'true', 
    fromName: 'OpenCart Support',
    baseURL : process.env.BASE_URL || 'http://localhost:5000'
});

class PaymentController {
    static async createPaymentIntent(req, res) {
    try {
      const errors = validationResult(req);
      console.log("Searching for errors:", errors);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      console.log("No validation errors found, proceeding with payment intent creation");
      
      const { userId,amount, currency, metadata } = req.body;
      

      const result = await PaymentService.createPaymentIntent(
        userId,
        amount,
        currency,
        metadata
      );

      res.status(201).json({
        success: true,
        message: 'Payment intent created successfully',
        data: result
  
      });
    } catch (error) {
      logger.error('Create payment intent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment intent',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get transaction history
  static async getTransactionHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page, limit, status, dateFrom, dateTo } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const result = await PaymentService.getTransactionHistory(
        userId,
        parseInt(page) || 1,
        parseInt(limit) || 20,
        filters
      );

      res.json({
        success: true,
        message: 'Transaction history retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('Get transaction history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transaction history'
      });
    }
  }

  // Process refund
  static async processRefund(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { transactionId } = req.params;
      const { amount, reason } = req.body;

      const refund = await PaymentService.processRefund(
        transactionId,
        amount,
        reason
      );

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: refund
      });
    } catch (error) {
      logger.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
export default PaymentController