import express from 'express';
import EmailService from '../Services/emailService.js';
import orderServiceInstance from '../Services/orderService.js';
import logger from '../utils/logger.js';




export const createOrder = async (req, res) => {
    try{
        const order = await orderServiceInstance.createOrder(req.body);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        }
        ); 
        logger.info(`Order created successfully: ${order._id}`);
    }catch (error) {
        console.error('Server Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
        });
        logger.error('Error creating order:', error);
    }
}
export const getAllOrders = async (req, res) => {
    try {
        const orders = await orderServiceInstance.getAllOrders();
        res.status(200).json({
            success: true,      
            data: orders,
            pagination: {
                total: orders.length,   
            }
        });
        logger.info(`All orders retrieved successfully`);       
    }catch (error) {
        console.error('Server Error retrieving orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve orders',
        });
        logger.error('Error retrieving orders:', error);
    }
}

export const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await orderServiceInstance.getOrderById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
        logger.info(`Order retrieved successfully: ${order._id}`);
    } catch (error) {
        console.error('Server Error retrieving order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve order',
        });
        logger.error('Error retrieving order:', error);
    }
}

export const getOrderByNumber = async (req, res) => {
    try {
        const orderNumber = req.params.number;
        const order = await orderServiceInstance.getOrderByNumber(orderNumber);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
        logger.info(`Order retrieved successfully: ${order._id}`);
    } catch (error) {
        console.error('Server Error retrieving order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve order',
        });
        logger.error('Error retrieving order:', error);
    }
}
export const getOrdersByCustomer = async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const orders = await orderServiceInstance.getOrdersByCustomer(customerId);
        
        if (!orders || orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No orders found for this customer'
            });
        }

        res.status(200).json({
            success: true,
            data: orders
        });
        logger.info(`Orders retrieved successfully for customer: ${customerId}`);
    } catch (error) {
        console.error('Server Error retrieving orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve orders',
        });
        logger.error('Error retrieving orders:', error);
    }
}
export const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const updatedOrder = await orderServiceInstance.updateOrderStatus(orderId, status);
        
        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: updatedOrder
        });
        logger.info(`Order status updated successfully: ${orderId}`);
    } catch (error) {
        console.error('Server Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status',
        });
        logger.error('Error updating order status:', error);
    }
}

export const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const deletedOrder = await orderServiceInstance.cancelOrder(orderId);
        
        if (!deletedOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order deleted successfully',
            data: deletedOrder
        });
        logger.info(`Order deleted successfully: ${orderId}`);
    } catch (error) {
        console.error('Server Error deleting order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete order',
        });
        logger.error('Error deleting order:', error);
    }

}

export const getOrderStats = async (req, res) => {
    try {
        const {dateFrom, dateTo} = req.query;
        const stats = await orderServiceInstance.getOrderStats(dateFrom, dateTo);
        if (!stats) {
            return res.status(404).json({
                success: false,
                message: 'No order statistics found'
            });
        }
        res.status(200).json({
            success: true,
            data: stats
        });
        logger.info('Order statistics retrieved successfully');
    } catch (error) {
        console.error('Server Error retrieving order stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve order statistics',
        });
        logger.error('Error retrieving order stats:', error);
    }
}