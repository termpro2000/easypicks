// Jest setup file
const mysql = require('mysql2/promise');
require('dotenv').config();

// Mock database configuration for tests
process.env.NODE_ENV = 'test';

// Create a mock database pool for testing
const mockPool = {
  execute: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn()
};

// Mock the database module
jest.mock('../config/database', () => ({
  pool: mockPool,
  testConnection: jest.fn(() => Promise.resolve(true)),
  generateTrackingNumber: jest.fn(() => 'TEST' + Date.now()),
  executeWithRetry: jest.fn((fn) => fn())
}));

global.mockPool = mockPool;

// Setup and teardown
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterAll(async () => {
  // Clean up after all tests
  jest.clearAllMocks();
});