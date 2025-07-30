// __tests__/order.service.test.js
import { jest } from '@jest/globals';

// Set the SENDGRID_API_KEY directly in the test environment
// This ensures it's available when EmailService is instantiated in orderService.js
// This value is used by the *actual* EmailService constructor when orderService.js is first imported.
process.env.SENDGRID_API_KEY = 'SG.mock-api-key-for-tests'; // Use any dummy value for testing

// ---------------------------
// Helpers for fake req/DB API
// ---------------------------

// Create a doc object that still supports .populate() chaining.
const withPopulate = (doc) => {
  const d = { ...doc };
  d.populate = jest.fn().mockReturnValue(d);
  return d;
};

// Create a chainable "find" query returning `rows` when .lean() is called.
// Supports .sort().skip().limit().populate().populate().lean()
const makeFindChain = (rows) => {
  const chain = {
    sort: jest.fn(() => chain),
    skip: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    populate: jest.fn(() => chain),
    lean: jest.fn(() => rows),
  };
  return chain;
};

// ---------------------------
// Mocks of imported modules
// ---------------------------

// Mock for Order (constructor + static methods)
const OrderMock = jest.fn(function (data) {
  // behave like "new Order(data)"
  Object.assign(this, data);
  this.save = jest.fn(async () => {
    // simulate Mongo assigning _id and (optionally) a total if schema doesn't do it
    this._id = this._id || 'order-id-1'; // This is where _id is set
    if (this.items && this.items.length) {
      this.total =
        this.total ??
        this.items.reduce((s, i) => s + (i.total ?? i.price * i.quantity), 0);
    }
    return this; // Crucially, return 'this' (the modified instance)
  });
});

OrderMock.findById = jest.fn();
OrderMock.find = jest.fn();
OrderMock.countDocuments = jest.fn();
OrderMock.findOne = jest.fn();
OrderMock.findByIdAndUpdate = jest.fn();
OrderMock.aggregate = jest.fn();

// Mock logger to silence output and assert calls
const loggerMock = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock EmailService so the constructor returns an object with a spy method
const sendOrderConfirmationMock = jest.fn();

// Mock the logger module
await jest.unstable_mockModule(
  '../utils/logger.js', // 🎯 Ensure this path is correct
  () => ({ default: loggerMock, __esModule: true })
);

// Mock the Order model module
await jest.unstable_mockModule(
  '../models/order.model.js', // 🎯 Ensure this path is correct
  () => ({ default: OrderMock, __esModule: true })
);

// Mock the EmailService module - CORRECTED PATH HERE
await jest.unstable_mockModule(
  '../services/emailService.js', // CORRECTED PATH
  () => ({
    default: class EmailService {
      constructor() {
        // This constructor is part of the mock, it won't throw the API key error.
        // The actual EmailService instance in orderService.js will have already been created.
      }
      sendOrderConfirmation = sendOrderConfirmationMock;
      // Add other methods if they are called directly on the mocked EmailService instance in tests
      // e.g., sendTransactionNotification = jest.fn();
    },
    __esModule: true,
  })
);

// Make dotenv.config() a no-op to avoid FS lookups during tests
await jest.unstable_mockModule('dotenv', () => ({
  default: { config: () => ({}) },
  __esModule: true,
}));

// Import the service AFTER setting up all mocks
const svcModule = await import(
  '../services/orderService.js' // 🎯 Ensure this path is correct
);
const orderService = svcModule.default;

beforeEach(() => {
  jest.clearAllMocks();
});

// -------------
// createOrder()
// -------------
describe('createOrder', () => {
  test('throws when items are missing or empty', async () => {
    await expect(orderService.createOrder({})).rejects.toThrow('Failed to create order');
  });

  test('throws when an item has invalid quantity/price', async () => {
    await expect(
      orderService.createOrder({
        customerEmail: 'a@b.com',
        items: [{ productId: 'p1', quantity: 0, price: 100 }],
      })
    ).rejects.toThrow('Failed to create order');

    await expect(
      orderService.createOrder({
        customerEmail: 'a@b.com',
        items: [{ productId: 'p1', quantity: 1, price: 0 }],
      })
    ).rejects.toThrow('Failed to create order');
  });

  test('creates order, saves, sends email, logs', async () => {
    const payload = {
      customerName: 'Jane',
      customerEmail: 'jane@example.com',
      items: [
        { productId: 'p1', quantity: 2, price: 100 },
        { productId: 'p2', quantity: 1, price: 50 },
      ],
    };

    // Create a mock order instance
    const mockOrderInstance = new OrderMock(payload);
    // Explicitly assign an _id to the mock instance for the test
    mockOrderInstance._id = 'order-id-test-123'; // Assign a dummy ID

    // Ensure that when `new Order()` is called in orderService, it returns our mock.
    OrderMock.mockImplementationOnce(() => mockOrderInstance);

    // No need to mock save.mockResolvedValue(mockOrderInstance) here,
    // as the save method on mockOrderInstance (defined in OrderMock constructor)
    // already returns `this` which will be the instance with the _id.

    const createdOrder = await orderService.createOrder(payload);

    // constructor called with full payload
    expect(OrderMock).toHaveBeenCalledWith({
      ...payload,
      items: [
        { productId: 'p1', quantity: 2, price: 100, total: 200 },
        { productId: 'p2', quantity: 1, price: 50, total: 50 },
      ],
    });

    // saved, id assigned, total computed
    expect(mockOrderInstance.save).toHaveBeenCalledTimes(1); // Check the save method on the mock instance
    expect(createdOrder._id).toBeDefined(); // This should now pass because _id is explicitly set
    expect(createdOrder.total).toBe(250);

    // email sent
    expect(sendOrderConfirmationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
        subject: 'Order Confrimation',
        orderID: createdOrder._id, // Use createdOrder._id here
        items: expect.any(Array),
        total: 250,
        customerName: 'Jane',
      })
    );

    // logged
    expect(loggerMock.info).toHaveBeenCalledWith(
      `Order created successfully: ${createdOrder._id}`
    );
  });

  test('wraps unexpected errors in "Failed to create order"', async () => {
    // Force constructor to throw
    OrderMock.mockImplementationOnce(() => {
      throw new Error('constructor failed');
    });
    await expect(
      orderService.createOrder({
        customerEmail: 'x@y.com',
        items: [{ productId: 'p1', quantity: 1, price: 10 }],
      })
    ).rejects.toThrow('Failed to create order');
    expect(loggerMock.error).toHaveBeenCalled();
  });
});

// -------------
// getOrderById()
// -------------
describe('getOrderById', () => {
  test('returns populated order', async () => {
    const doc = withPopulate({ _id: 'o1', customerId: 'c1', items: [] });
    OrderMock.findById.mockReturnValue(withPopulate(doc));

    const res = await orderService.getOrderById('o1');
    expect(OrderMock.findById).toHaveBeenCalledWith('o1');
    expect(res._id).toBe('o1');
  });

  test('throws when not found', async () => {
    // simulate populate chain returns null
    const chain = { populate: jest.fn(() => null) }; // Changed to return null to simulate not found
    OrderMock.findById.mockReturnValue(chain);
    await expect(orderService.getOrderById('missing')).rejects.toThrow('Failed to fetch order');
  });
});

// -------------
// getAllOrders()
// -------------
describe('getAllOrders', () => {
  test('returns paginated list', async () => {
    const rows = [{ _id: 'o1' }, { _id: 'o2' }];
    OrderMock.find.mockReturnValue(makeFindChain(rows));
    OrderMock.countDocuments.mockResolvedValue(12);

    const res = await orderService.getAllOrders({ page: 2, limit: 2, sort: 'createdAt' });

    expect(OrderMock.find).toHaveBeenCalledWith(expect.any(Object));
    expect(res.orders).toHaveLength(2);
    expect(res.pagination).toEqual({ current: 2, pages: 6, total: 12 });
  });

  test('returns empty structure when no orders', async () => {
    OrderMock.find.mockReturnValue(makeFindChain([]));
    OrderMock.countDocuments.mockResolvedValue(0);

    const res = await orderService.getAllOrders({});
    expect(res.orders).toEqual([]);
    expect(res.pagination).toEqual({ current: 1, pages: 0, total: 0 });
    expect(loggerMock.warn).toHaveBeenCalledWith('No orders found with the given criteria');
  });
});

// ------------------
// getOrderByNumber()
// ------------------
describe('getOrderByNumber', () => {
  test('returns order', async () => {
    const doc = withPopulate({ _id: 'o9', orderNumber: 'ABC123' });
    OrderMock.findOne.mockReturnValue(withPopulate(doc));

    const res = await orderService.getOrderByNumber('ABC123');
    expect(OrderMock.findOne).toHaveBeenCalledWith({ orderNumber: 'ABC123' });
    expect(res._id).toBe('o9');
  });

  test('throws when not found', async () => {
    const chain = { populate: jest.fn(() => null) }; // Changed to return null
    OrderMock.findOne.mockReturnValue(chain);
    await expect(orderService.getOrderByNumber('NOPE')).rejects.toThrow(
      'Failed to fetch order by number'
    );
  });
});

// -----------
// updateOrder
// -----------
describe('updateOrder', () => {
  test('updates and populates', async () => {
    const updated = withPopulate({ _id: 'o1', status: 'processing' });
    OrderMock.findByIdAndUpdate.mockReturnValue(withPopulate(updated));

    const res = await orderService.updateOrder('o1', { status: 'processing' });

    expect(OrderMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'o1',
      { status: 'processing' },
      { new: true, runValidators: true }
    );
    expect(res.status).toBe('processing');
    expect(loggerMock.info).toHaveBeenCalled();
  });

  test('throws when not found', async () => {
    const chain = { populate: jest.fn(() => null) }; // Changed to return null
    OrderMock.findByIdAndUpdate.mockReturnValue(chain);
    await expect(orderService.updateOrder('x', {})).rejects.toThrow('Failed to update order');
  });
});

// -------------------
// updateOrderStatus()
// -------------------
describe('updateOrderStatus', () => {
  test('rejects invalid status', async () => {
    await expect(orderService.updateOrderStatus('o1', 'weird')).rejects.toThrow(
      'Failed to update order status'
    );
  });

  test('updates valid status', async () => {
    const updated = { _id: 'o1', status: 'completed' };
    OrderMock.findByIdAndUpdate.mockResolvedValue(updated);

    const res = await orderService.updateOrderStatus('o1', 'completed');
    expect(OrderMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'o1',
      { status: 'completed' },
      { new: true, runValidators: true }
    );
    expect(res.status).toBe('completed');
  });
});

// ----------------------
// updatePaymentStatus()
// ----------------------
describe('updatePaymentStatus', () => {
  test('rejects invalid payment status', async () => {
    await expect(orderService.updatePaymentStatus('o1', 'x')).rejects.toThrow(
      'Failed to update payment status'
    );
  });

  test('updates valid payment status', async () => {
    const updated = { _id: 'o1', paymentStatus: 'completed' };
    OrderMock.findByIdAndUpdate.mockResolvedValue(updated);

    const res = await orderService.updatePaymentStatus('o1', 'completed');
    expect(res.paymentStatus).toBe('completed');
  });
});

// -----------------
// addTrackingInfo()
// -----------------
describe('addTrackingInfo', () => {
  test('adds tracking and estimatedDelivery', async () => {
    const updated = { _id: 'o1', trackingNumber: 'T123', estimatedDelivery: new Date('2025-08-01') };
    OrderMock.findByIdAndUpdate.mockResolvedValue(updated);

    const res = await orderService.addTrackingInfo('o1', 'T123', '2025-08-01');

    expect(OrderMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'o1',
      expect.objectContaining({ trackingNumber: 'T123', estimatedDelivery: new Date('2025-08-01') }),
      { new: true, runValidators: true }
    );
    expect(res.trackingNumber).toBe('T123');
  });
});

// -------------
// cancelOrder()
// -------------
describe('cancelOrder', () => {
  test('cancels order and appends reason', async () => {
    const save = jest.fn().mockResolvedValue(true);
    OrderMock.findById.mockResolvedValue({
      _id: 'o1',
      status: 'processing',
      notes: '',
      save,
    });

    const res = await orderService.cancelOrder('o1', 'Customer request');

    expect(res.status).toBe('cancelled');
    expect(res.notes).toContain('Cancelled: Customer request');
    expect(save).toHaveBeenCalled();
    expect(loggerMock.info).toHaveBeenCalledWith('Order cancelled successfully: o1');
  });

  test('throws when already cancelled', async () => {
    OrderMock.findById.mockResolvedValue({ _id: 'o1', status: 'cancelled' });
    await expect(orderService.cancelOrder('o1')).rejects.toThrow('Failed to cancel order');
  });
});

// ---------------
// getOrderStats()
// ---------------
describe('getOrderStats', () => {
  test('returns zeros when no data', async () => {
    OrderMock.aggregate.mockResolvedValue([]);
    const res = await orderService.getOrderStats();
    expect(res).toEqual({
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      statusBreakdown: {},
    });
  });

  test('returns aggregated stats', async () => {
    OrderMock.aggregate.mockResolvedValue([
      {
        totalOrders: 3,
        totalRevenue: 600,
        averageOrderValue: 200,
        statusBreakdown: ['pending', 'completed', 'completed'],
      },
    ]);

    const res = await orderService.getOrderStats('2025-07-01', '2025-07-31');
    expect(OrderMock.aggregate).toHaveBeenCalled();
    expect(res.totalOrders).toBe(3);
    expect(res.totalRevenue).toBe(600);
    expect(res.averageOrderValue).toBe(200);
    expect(res.statusBreakdown).toEqual({ pending: 1, completed: 2 });
  });
});

// ----------------------
// getOrdersByCustomer()
// ----------------------
describe('getOrdersByCustomer', () => {
  test('paginates and returns hasMore', async () => {
    OrderMock.find.mockReturnValue(makeFindChain([{ _id: 'o1' }, { _id: 'o2' }]));
    OrderMock.countDocuments.mockResolvedValue(5);

    const res = await orderService.getOrdersByCustomer('cust-1', {
      page: 2,
      limit: 2,
      sort: 'createdAt',
      sortOrder: 'desc',
    });

    expect(OrderMock.find).toHaveBeenCalledWith({ customerId: 'cust-1' });
    expect(res.orders).toHaveLength(2);
    expect(res.pagination).toEqual({ current: 2, pages: 3, total: 5, hasMore: true });
  });
});
