import Order from '../models/order.model.js';
import logger from '../utils/logger.js';
import EmailService from './emailService.js';
import dotenv from 'dotenv';
import path from 'path';
import user from '../models/user.model.js'
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
const emailService = new EmailService({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  email: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,         
    secure: process.env.EMAIL_SECURE === 'true',
    fromName: 'OpenCart ',
    baseURL: process.env.BASE_URL || 'http://localhost:5000'
});
class OrderService {

async createOrder(orderData) {
    try{
        if (!orderData || !orderData.items || orderData.items.length === 0) {
            throw new Error('Order must have at least one item');
        }
        orderData.items.forEach(item => {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                throw new Error('Each order item must have a valid productId and quantity greater than zero');
            }
            if (!item.price || item.price <= 0) {
                throw new Error('Each order item must have a valid price greater than zero');
            }
            item.total = item.price * item.quantity;

        })
       
        // Create a new order instance
        const order = new Order(orderData);
        await order.save();
        await emailService.sendOrderConfirmation({
            to:orderData.customerEmail,
            subject: `Order Confrimation`,
            orderID: order._id,
            items: orderData.items,
            total:order.total,
            customerName:orderData.customerName || 'customer'
        }
        )
        logger.info(`Order created successfully: ${order._id}`);
        return order;

    }
    catch (error) {
      logger.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
}
async getOrderById(orderId) {
    try {
        const order = await Order.findById(orderId).populate('customerId','name email').populate('items.productId', 'name description');
        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    } catch (error) {
        logger.error('Error fetching order:', error);
        throw new Error('Failed to fetch order');
    }
}
async getAllOrders(options = {}) {
    try{
        const{
            page = 1,
            limit = 10,
            sort = 'createdAt',
            filter = {},
            status,
            paymentStatus,
            customerId,
            dateFrom,
            dateTo,
            sortOrder = 'asc'
        } = options;
        const query = {};
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (customerId) query.customerId = customerId;
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }
        const skip = (page - 1) * limit;
        const sortOptions = {};
        sortOptions[sort] = sortOrder === 'asc' ? 1 : -1

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .populate('customerId', 'name email')
                .populate('items.productId', 'name description')
                .lean(),
            Order.countDocuments(query)
        ]);
        if (orders.length === 0) {
            logger.warn('No orders found with the given criteria');
            return {
                orders: [],
                pagination: {
                    current: page,
                    pages: 0,
                    total: 0
                }
            };
        }
        return {
            orders,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        };
    } catch (error) {
        logger.error('Error fetching orders:', error);
        throw new Error('Failed to fetch orders');
    }


}
async getOrderByNumber(orderNumber) {
    try {
        const order = await Order.findOne({ orderNumber }).populate('customerId', 'name email').populate('items.productId', 'name description');
        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    } catch (error) {
        logger.error('Error fetching order by number:', error);
        throw new Error('Failed to fetch order by number');
    }
}
async updateOrder(orderId, updateData) {
    try {
        const order = await Order.findByIdAndUpdate(orderId, updateData, { new: true, runValidators: true })
            .populate('customerId', 'name email')
            .populate('items.productId', 'name description');
        if (!order) {
            throw new Error('Order not found');
        }
        logger.info(`Order updated successfully: ${order._id}`);
        return order;
    } catch (error) {
        logger.error('Error updating order:', error);
        throw new Error('Failed to update order');
    }   
}
async updateOrderStatus(orderId, status) {
    try {
        const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid order status');
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true, runValidators: true }
        )
        

        if (!order) {
            throw new Error('Order not found');
        }
        logger.info(`Order status updated successfully: ${order._id}`);
        return order;
    } catch (error) {
        logger.error('Error updating order status:', error);
        throw new Error('Failed to update order status');
    }
}
async updatePaymentStatus(orderId, paymentStatus) {
    try {
        const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
        if (!validStatuses.includes(paymentStatus)) {
            throw new Error('Invalid payment status');
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { paymentStatus },
            { new: true, runValidators: true }
        )
        
        if (!order) {
            throw new Error('Order not found');
        }
        logger.info(`Payment status updated successfully for order: ${order._id}`);
        return order;
    } catch (error) {
        logger.error('Error updating payment status:', error);
        throw new Error('Failed to update payment status');
    }
}
async addTrackingInfo(orderId, trackingNumber, estimatedDelivery) {
    try{
        const updateData = {trackingNumber}
        if (estimatedDelivery) {
            updateData.estimatedDelivery = new Date(estimatedDelivery);
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true, runValidators: true }
        )
        if (!order) {
            throw new Error('Order not found');
        }
        logger.info(`Tracking info added successfully for order: ${order._id}`);
        return order;       
    } catch (error) {
        logger.error('Error adding tracking info:', error); 
        throw new Error('Failed to add tracking info');
    }
    }
    async cancelOrder(orderId , reason) {
        try {
            const order = await Order.findById(orderId);
            if (!order) {
                throw new Error('Order not found');
            }
            if (order.status === 'cancelled') {
                throw new Error('Order is already cancelled');
            }
            if (order.status === 'delivered') {
                throw new Error('Cannot cancel a delivered order');
            }
            order.status = 'cancelled';
            if (reason) {
                order.notes = order.notes ? `${order.notes} | Cancelled: ${reason}` : `Cancelled: ${reason}`;
            }
            await order.save();
            logger.info(`Order cancelled successfully: ${order._id}`);
            return order;
        } catch (error) {
            logger.error('Error cancelling order:', error);
            throw new Error('Failed to cancel order');
        }
    }

    async getOrderStats(dateFrom, dateTo) {
    try {
      const matchStage = {};
      if (dateFrom || dateTo) {
        matchStage.createdAt = {};
        if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
        if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
      }

      const stats = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' },
            statusBreakdown: {
              $push: '$status'
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          statusBreakdown: {}
        };
      }

      const result = stats[0];
      const statusCount = result.statusBreakdown.reduce((acc, status) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      return {
        totalOrders: result.totalOrders,
        totalRevenue: result.totalRevenue,
        averageOrderValue: result.averageOrderValue,
        statusBreakdown: statusCount
      };
    } catch (error) {
      throw new Error(`Failed to get order statistics: ${error.message}`);
    }
  }
//order by customer
async getOrdersByCustomer(customerId, options = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      sortOrder = 'asc',
      status
    } = options;

    const parsedPage = Math.max(parseInt(page), 1);
    const parsedLimit = Math.max(parseInt(limit), 1);
    const skip = (parsedPage - 1) * parsedLimit;
    const query = { customerId };
    if (status) query.status = status;

    const sortOptions = {
      [sort]: sortOrder === 'desc' ? -1 : 1
    };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parsedLimit)
        .populate('customerId', 'name email')
        .populate('items.productId', 'name description')
        .lean(),
      Order.countDocuments(query)
    ]);

    return {
      orders,
      pagination: {
        current: parsedPage,
        pages: Math.ceil(total / parsedLimit),
        total,
        hasMore: skip + orders.length < total
      }
    };
  } catch (error) {
    logger.error('Error fetching orders by customer:', error);
    throw new Error('Failed to fetch orders by customer');
  }
}

}

export default new OrderService();
// This service handles order-related operations such as creating, updating, and retrieving orders.
