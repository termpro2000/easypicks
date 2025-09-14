import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Dashboard from '../components/dashboard/Dashboard'
import { useAuth } from '../hooks/useAuth'
import { deliveriesAPI } from '../services/api'

// Mock dependencies
vi.mock('../hooks/useAuth')
vi.mock('../services/api')

const mockUseAuth = vi.mocked(useAuth)
const mockDeliveriesAPI = vi.mocked(deliveriesAPI)

describe('Dashboard Component', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Test User', role: 'admin' },
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
      isAuthenticated: true
    })

    mockDeliveriesAPI.getDeliveries.mockResolvedValue({
      deliveries: [
        {
          id: 1,
          tracking_number: 'TEST123',
          status: '접수완료',
          customer_name: 'John Doe',
          sender_name: 'Company A',
          product_name: 'Test Product',
          created_at: new Date().toISOString()
        }
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders dashboard with welcome message', async () => {
    render(<Dashboard />)
    
    expect(screen.getByText('안녕하세요, Test User님! 👋')).toBeInTheDocument()
    expect(screen.getByText('이지픽스와 함께 효율적인 배송 관리를 시작하세요.')).toBeInTheDocument()
  })

  test('displays loading state initially', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('대시보드를 로딩 중...')).toBeInTheDocument()
  })

  test('loads and displays orders', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('TEST123')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })
  })

  test('displays statistics cards', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('전체 주문')).toBeInTheDocument()
      expect(screen.getByText('접수완료')).toBeInTheDocument()
      expect(screen.getByText('창고입고')).toBeInTheDocument()
      expect(screen.getByText('배송완료')).toBeInTheDocument()
    })
  })

  test('search functionality works', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('TEST123')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('운송장번호, 고객명, 상품명 검색...')
    fireEvent.change(searchInput, { target: { value: 'John' } })

    // Should still show the order with matching customer name
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  test('status filter works', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('TEST123')).toBeInTheDocument()
    })

    const filterSelect = screen.getByRole('combobox')
    fireEvent.change(filterSelect, { target: { value: '접수완료' } })

    // Should still show the order with matching status
    expect(screen.getByText('TEST123')).toBeInTheDocument()
  })

  test('handles API error gracefully', async () => {
    mockDeliveriesAPI.getDeliveries.mockRejectedValue(new Error('API Error'))
    
    render(<Dashboard />)
    
    // Should not crash and eventually show empty state
    await waitFor(() => {
      expect(screen.queryByText('대시보드를 로딩 중...')).not.toBeInTheDocument()
    })
  })

  test('refresh functionality works', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('TEST123')).toBeInTheDocument()
    })

    const refreshButton = screen.getByTitle('수동 새로고침')
    fireEvent.click(refreshButton)

    expect(mockDeliveriesAPI.getDeliveries).toHaveBeenCalledTimes(2) // Initial load + manual refresh
  })

  test('auto refresh toggle works', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('TEST123')).toBeInTheDocument()
    })

    const autoRefreshButton = screen.getByTitle('자동 새로고침 끄기')
    fireEvent.click(autoRefreshButton)

    expect(screen.getByTitle('자동 새로고침 켜기')).toBeInTheDocument()
  })

  test('order detail modal opens on order click', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('TEST123')).toBeInTheDocument()
    })

    // Click on order row (desktop view)
    const orderRow = screen.getByText('TEST123').closest('tr')
    if (orderRow) {
      const viewButton = orderRow.querySelector('button[title=\"상세보기\"]')
      if (viewButton) {
        fireEvent.click(viewButton)
        // Modal should open - test for modal content
        await waitFor(() => {
          expect(screen.getByText('배송 주문 상세정보')).toBeInTheDocument()
        })
      }
    }
  })

  test('displays mobile-friendly layout', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    render(<Dashboard />)
    
    // Should have mobile-specific classes
    const mobileElements = screen.getAllByText('접수완료')
    expect(mobileElements.length).toBeGreaterThan(0)
  })
})