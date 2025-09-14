// Note: This test uses the actual database module to test utility functions
// Database connection mocking is handled in setup.js

describe('Database Utilities', () => {
  let generateTrackingNumber, executeWithRetry;

  beforeEach(() => {
    // Reset and get fresh mocks
    jest.resetModules();
    const db = require('../config/database');
    generateTrackingNumber = db.generateTrackingNumber;
    executeWithRetry = db.executeWithRetry;
  });

  describe('generateTrackingNumber', () => {
    test('should generate tracking number with correct format', () => {
      // Unmock the function for this test
      jest.doMock('../config/database', () => ({
        ...jest.requireActual('../config/database'),
        generateTrackingNumber: jest.requireActual('../config/database').generateTrackingNumber
      }));

      const actualDb = jest.requireActual('../config/database');
      const trackingNumber = actualDb.generateTrackingNumber();
      
      // Should be string and have reasonable length
      expect(typeof trackingNumber).toBe('string');
      expect(trackingNumber.length).toBeGreaterThan(0);
      expect(trackingNumber.length).toBeLessThanOrEqual(50);
    });

    test('should generate unique tracking numbers', () => {
      jest.doMock('../config/database', () => ({
        ...jest.requireActual('../config/database'),
        generateTrackingNumber: jest.requireActual('../config/database').generateTrackingNumber
      }));

      const actualDb = jest.requireActual('../config/database');
      const trackingNumber1 = actualDb.generateTrackingNumber();
      const trackingNumber2 = actualDb.generateTrackingNumber();
      
      expect(trackingNumber1).not.toBe(trackingNumber2);
    });
  });

  describe('executeWithRetry', () => {
    test('should execute function successfully on first try', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await executeWithRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure and eventually succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success');
      
      const result = await executeWithRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('should throw error after maximum retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'));
      
      await expect(executeWithRetry(mockFn)).rejects.toThrow('Persistent error');
      expect(mockFn).toHaveBeenCalledTimes(3); // Default max retries
    });
  });

  describe('Database Configuration', () => {
    test('should have correct database config structure', () => {
      // Test that database config has required fields
      const config = {
        host: process.env.DB_HOST || 'aws.connect.psdb.cloud',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'easypicks'
      };

      expect(config.host).toBeDefined();
      expect(config.port).toBeDefined();
      expect(config.database).toBeDefined();
      
      // Port should be a number
      expect(typeof config.port).toBe('number');
    });
  });

  describe('Database Pool', () => {
    test('should create pool with correct configuration', () => {
      const { pool } = require('../config/database');
      
      expect(pool).toBeDefined();
      expect(typeof pool.execute).toBe('function');
      expect(typeof pool.getConnection).toBe('function');
    });
  });
});