const { 
  createShippingOrder, 
  getShippingOrders, 
  getShippingOrder, 
  updateShippingOrderStatus,
  trackShipment
} = require('../controllers/shippingController');

describe('ShippingController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      user: { id: 1 },
      session: { user: { id: 1 } },
      query: {},
      params: {},
      body: {}
    };
    
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    global.mockPool.execute.mockReset();
  });

  describe('createShippingOrder', () => {
    test('should create shipping order successfully', async () => {
      const mockResult = { insertId: 123 };
      global.mockPool.execute.mockResolvedValueOnce([mockResult]);

      // Mock generateTrackingNumber
      const { generateTrackingNumber } = require('../config/database');
      generateTrackingNumber.mockReturnValue('TEST1234567890');

      mockReq.body = {
        sender_name: 'John Doe',
        sender_phone: '010-1234-5678',
        sender_address: '서울시 강남구',
        sender_zipcode: '12345',
        receiver_name: 'Jane Doe',
        receiver_phone: '010-9876-5432',
        receiver_address: '서울시 서초구',
        receiver_zipcode: '54321'
      };

      await createShippingOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: '배송 접수가 완료되었습니다.',
        orderId: 123,
        trackingNumber: 'TEST1234567890',
        status: '접수완료'
      });
    });

    test('should validate required fields', async () => {
      mockReq.body = {
        sender_name: 'John Doe'
        // Missing required fields
      };

      await createShippingOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: expect.stringContaining('필수 필드가 누락되었습니다')
      });
    });

    test('should require authentication', async () => {
      mockReq.user = null;
      mockReq.session = null;

      await createShippingOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    });

    test('should handle database error', async () => {
      global.mockPool.execute.mockRejectedValueOnce(new Error('Database error'));

      mockReq.body = {
        sender_name: 'John Doe',
        sender_phone: '010-1234-5678',
        sender_address: '서울시 강남구',
        sender_zipcode: '12345',
        receiver_name: 'Jane Doe',
        receiver_phone: '010-9876-5432',
        receiver_address: '서울시 서초구',
        receiver_zipcode: '54321'
      };

      await createShippingOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: '배송 접수 처리 중 오류가 발생했습니다.'
      });
    });
  });

  describe('getShippingOrders', () => {
    test('should return paginated orders', async () => {
      const mockOrders = [
        {
          id: 1,
          tracking_number: 'TEST123',
          status: '접수완료',
          sender_name: 'John',
          receiver_name: 'Jane',
          created_at: new Date()
        }
      ];

      // Mock executeWithRetry
      const { executeWithRetry } = require('../config/database');
      executeWithRetry
        .mockResolvedValueOnce([[{ total: 1 }]]) // Count
        .mockResolvedValueOnce([mockOrders]); // Orders

      mockReq.query = { page: 1, limit: 10 };

      await getShippingOrders(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        orders: mockOrders,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      });
    });

    test('should require authentication', async () => {
      mockReq.user = null;
      mockReq.session = null;

      await getShippingOrders(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getShippingOrder', () => {
    test('should return single order', async () => {
      const mockOrder = {
        id: 1,
        tracking_number: 'TEST123',
        status: '접수완료',
        sender_name: 'John',
        receiver_name: 'Jane'
      };

      global.mockPool.execute.mockResolvedValueOnce([[mockOrder]]);
      mockReq.params.id = '1';

      await getShippingOrder(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ order: mockOrder });
    });

    test('should return 404 for non-existent order', async () => {
      global.mockPool.execute.mockResolvedValueOnce([[]]);
      mockReq.params.id = '999';

      await getShippingOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: '배송 접수를 찾을 수 없습니다.'
      });
    });
  });

  describe('updateShippingOrderStatus', () => {
    test('should update status successfully', async () => {
      const mockOrder = {
        id: 1,
        status: '창고입고',
        tracking_number: 'TEST123'
      };

      global.mockPool.execute
        .mockResolvedValueOnce([[{ id: 1 }]]) // Find order
        .mockResolvedValueOnce() // Update status
        .mockResolvedValueOnce([[mockOrder]]); // Get updated order

      mockReq.params.id = '1';
      mockReq.body.status = '창고입고';

      await updateShippingOrderStatus(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: '주문 상태가 성공적으로 업데이트되었습니다.',
        order: mockOrder
      });
    });

    test('should validate status values', async () => {
      mockReq.params.id = '1';
      mockReq.body.status = 'invalid_status';

      await updateShippingOrderStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: '유효하지 않은 상태값입니다.'
      });
    });

    test('should return 404 for non-existent order', async () => {
      global.mockPool.execute.mockResolvedValueOnce([[]]);
      mockReq.params.id = '999';
      mockReq.body.status = '접수완료';

      await updateShippingOrderStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('trackShipment', () => {
    test('should return tracking information', async () => {
      const mockOrder = {
        id: 1,
        tracking_number: 'TEST123',
        status: '배송완료',
        sender_name: 'John',
        receiver_name: 'Jane',
        recipient_address_full: '서울시 서초구',
        product_name: 'Test Product',
        created_at: new Date(),
        updated_at: new Date()
      };

      global.mockPool.execute.mockResolvedValueOnce([[mockOrder]]);
      mockReq.params.trackingNumber = 'TEST123';

      await trackShipment(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        trackingNumber: 'TEST123',
        currentStatus: '배송완료',
        trackingCompany: mockOrder.tracking_company,
        estimatedDelivery: mockOrder.estimated_delivery,
        orderInfo: {
          senderName: 'John',
          recipientName: 'Jane',
          recipientAddress: '서울시 서초구',
          productName: 'Test Product',
          quantity: mockOrder.product_quantity,
          sku: mockOrder.product_sku
        },
        statusHistory: expect.any(Array)
      });
    });

    test('should return 404 for invalid tracking number', async () => {
      global.mockPool.execute.mockResolvedValueOnce([[]]);
      mockReq.params.trackingNumber = 'INVALID123';

      await trackShipment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: '해당 운송장 번호를 찾을 수 없습니다.'
      });
    });

    test('should require tracking number', async () => {
      mockReq.params.trackingNumber = '';

      await trackShipment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: '운송장 번호가 필요합니다.'
      });
    });
  });
});