import { vi } from 'vitest'
import axios from 'axios'
import { api, deliveriesAPI, authAPI } from '../services/api'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Base API Configuration', () => {
    test('should have correct base configuration', () => {
      expect(api.defaults.baseURL).toBeDefined()
      expect(api.defaults.timeout).toBe(10000)
      expect(api.defaults.headers.common['Content-Type']).toBe('application/json')
    })

    test('should handle request interceptor', () => {
      // Test that request interceptor is configured
      expect(api.interceptors.request.handlers).toHaveLength(1)
    })

    test('should handle response interceptor', () => {
      // Test that response interceptor is configured
      expect(api.interceptors.response.handlers).toHaveLength(1)
    })
  })

  describe('Auth API', () => {
    test('login should make correct API call', async () => {
      const mockResponse = {
        data: {
          user: { id: 1, username: 'testuser', name: 'Test User', role: 'user' },
          message: 'Login successful'
        }
      }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const credentials = { username: 'testuser', password: 'password123' }
      const result = await authAPI.login(credentials)

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', credentials)
      expect(result).toEqual(mockResponse.data)
    })

    test('logout should make correct API call', async () => {
      const mockResponse = { data: { message: 'Logout successful' } }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await authAPI.logout()

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/logout')
      expect(result).toEqual(mockResponse.data)
    })

    test('getCurrentUser should make correct API call', async () => {
      const mockResponse = {
        data: { user: { id: 1, username: 'testuser', name: 'Test User', role: 'user' } }
      }
      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await authAPI.getCurrentUser()

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/auth/me')
      expect(result).toEqual(mockResponse.data)
    })

    test('should handle auth API errors', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: { error: 'Unauthorized', message: 'Invalid credentials' }
        }
      }
      mockedAxios.post.mockRejectedValue(errorResponse)

      await expect(authAPI.login({ username: 'wrong', password: 'wrong' }))
        .rejects.toEqual(errorResponse)
    })
  })

  describe('Deliveries API', () => {
    test('getDeliveries should make correct API call with pagination', async () => {
      const mockResponse = {
        data: {
          deliveries: [
            { id: 1, tracking_number: 'TEST123', status: '접수완료' }
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
        }
      }
      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await deliveriesAPI.getDeliveries(1, 10)

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/deliveries?page=1&limit=10')
      expect(result).toEqual(mockResponse.data)
    })

    test('getDelivery should make correct API call', async () => {
      const mockResponse = {
        data: { delivery: { id: 1, tracking_number: 'TEST123', status: '접수완료' } }
      }
      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await deliveriesAPI.getDelivery(1)

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/deliveries/1')
      expect(result).toEqual(mockResponse.data)
    })

    test('createDelivery should make correct API call', async () => {
      const mockResponse = {
        data: { message: 'Delivery created', orderId: 123, trackingNumber: 'TEST123' }
      }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const deliveryData = {
        sender_name: 'John Doe',
        sender_phone: '010-1234-5678',
        sender_address: '서울시 강남구',
        sender_zipcode: '12345',
        receiver_name: 'Jane Doe',
        receiver_phone: '010-9876-5432',
        receiver_address: '서울시 서초구',
        receiver_zipcode: '54321'
      }

      const result = await deliveriesAPI.createDelivery(deliveryData)

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/deliveries', deliveryData)
      expect(result).toEqual(mockResponse.data)
    })

    test('updateDelivery should make correct API call', async () => {
      const mockResponse = {
        data: { message: 'Delivery updated' }
      }
      mockedAxios.put.mockResolvedValue(mockResponse)

      const updateData = { status: '창고입고' }
      const result = await deliveriesAPI.updateDelivery(1, updateData)

      expect(mockedAxios.put).toHaveBeenCalledWith('/api/deliveries/1', updateData)
      expect(result).toEqual(mockResponse.data)
    })

    test('trackShipment should make correct API call', async () => {
      const mockResponse = {
        data: {
          trackingNumber: 'TEST123',
          currentStatus: '배송완료',
          statusHistory: [
            { status: '접수완료', timestamp: '2024-01-01T00:00:00Z' }
          ]
        }
      }
      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await deliveriesAPI.trackShipment('TEST123')

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/track/TEST123')
      expect(result).toEqual(mockResponse.data)
    })

    test('should handle delivery API errors', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: { error: 'Not Found', message: 'Delivery not found' }
        }
      }
      mockedAxios.get.mockRejectedValue(errorResponse)

      await expect(deliveriesAPI.getDelivery(999))
        .rejects.toEqual(errorResponse)
    })
  })

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      mockedAxios.get.mockRejectedValue(networkError)

      await expect(authAPI.getCurrentUser()).rejects.toThrow('Network Error')
    })

    test('should handle timeout errors', async () => {
      const timeoutError = { code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' }
      mockedAxios.get.mockRejectedValue(timeoutError)

      await expect(authAPI.getCurrentUser()).rejects.toEqual(timeoutError)
    })

    test('should handle server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { error: 'Internal Server Error', message: 'Something went wrong' }
        }
      }
      mockedAxios.get.mockRejectedValue(serverError)

      await expect(authAPI.getCurrentUser()).rejects.toEqual(serverError)
    })
  })

  describe('Request Configuration', () => {
    test('should include credentials in requests', () => {
      expect(api.defaults.withCredentials).toBe(true)
    })

    test('should have correct content type header', () => {
      expect(api.defaults.headers.common['Content-Type']).toBe('application/json')
    })

    test('should have correct timeout setting', () => {
      expect(api.defaults.timeout).toBe(10000)
    })
  })
})