import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import UserManagement from '../components/admin/UserManagement'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'

// Mock dependencies
vi.mock('../hooks/useAuth')
vi.mock('../services/api')

const mockUseAuth = vi.mocked(useAuth)
const mockApi = vi.mocked(api)

describe('UserManagement Component', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Admin User', role: 'admin' },
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
      isAuthenticated: true
    })

    mockApi.get.mockResolvedValue({
      data: {
        users: [
          {
            id: 1,
            username: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
            phone: '010-1234-5678',
            company: 'Test Company',
            role: 'user',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            username: 'driver1',
            name: 'Driver One',
            email: 'driver@example.com',
            phone: '010-9876-5432',
            company: 'Delivery Co',
            role: 'driver',
            is_active: true,
            created_at: '2024-01-02T00:00:00Z'
          }
        ],
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders user management interface', async () => {
    render(<UserManagement />)
    
    expect(screen.getByText('사용자 관리')).toBeInTheDocument()
    expect(screen.getByText('파트너사')).toBeInTheDocument()
    expect(screen.getByText('기사')).toBeInTheDocument()
  })

  test('displays users in table format', async () => {
    render(<UserManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('Test Company')).toBeInTheDocument()
    })
  })

  test('tab switching works correctly', async () => {
    const user = userEvent.setup()
    render(<UserManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    // Click on 기사 tab
    const driverTab = screen.getByText('기사')
    await user.click(driverTab)
    
    // Should filter to show only drivers
    await waitFor(() => {
      expect(screen.getByText('driver1')).toBeInTheDocument()
      expect(screen.getByText('Driver One')).toBeInTheDocument()
    })
  })

  test('search functionality works', async () => {
    const user = userEvent.setup()
    render(<UserManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('사용자명, 이름, 회사명으로 검색...')
    await user.type(searchInput, 'Test')
    
    const searchButton = screen.getByTitle('검색')
    await user.click(searchButton)

    // Should call API with search parameter
    expect(mockApi.get).toHaveBeenCalledWith(
      expect.stringContaining('search=Test')
    )
  })

  test('partner registration modal opens', async () => {
    const user = userEvent.setup()
    render(<UserManagement />)
    
    const registerButton = screen.getByText('파트너사 등록')
    await user.click(registerButton)
    
    expect(screen.getByText('파트너사 등록')).toBeInTheDocument()
    expect(screen.getByLabelText('사용자명 *')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호 *')).toBeInTheDocument()
    expect(screen.getByLabelText('이름 *')).toBeInTheDocument()
  })

  test('partner registration form validation', async () => {
    const user = userEvent.setup()
    render(<UserManagement />)
    
    const registerButton = screen.getByText('파트너사 등록')
    await user.click(registerButton)
    
    // Try to submit empty form
    const submitButton = screen.getByText('등록하기')
    await user.click(submitButton)
    
    // Should show validation errors
    expect(screen.getByText('사용자명을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('이름을 입력해주세요')).toBeInTheDocument()
  })

  test('partner registration form submission', async () => {
    const user = userEvent.setup()
    mockApi.post.mockResolvedValue({ data: { message: 'Success', userId: 123 } })
    
    render(<UserManagement />)
    
    const registerButton = screen.getByText('파트너사 등록')
    await user.click(registerButton)
    
    // Fill form
    await user.type(screen.getByLabelText('사용자명 *'), 'newuser')
    await user.type(screen.getByLabelText('비밀번호 *'), 'password123')
    await user.type(screen.getByLabelText('이름 *'), 'New User')
    await user.type(screen.getByLabelText('이메일'), 'new@example.com')
    await user.type(screen.getByLabelText('전화번호'), '010-1111-2222')
    await user.type(screen.getByLabelText('회사명'), 'New Company')
    
    const submitButton = screen.getByText('등록하기')
    await user.click(submitButton)
    
    expect(mockApi.post).toHaveBeenCalledWith('/api/users', {
      username: 'newuser',
      password: 'password123',
      name: 'New User',
      email: 'new@example.com',
      phone: '010-1111-2222',
      company: 'New Company',
      role: 'user',
      default_sender_name: '',
      default_sender_company: '',
      default_sender_phone: '',
      default_sender_address: '',
      default_sender_detail_address: '',
      default_sender_zipcode: ''
    })
  })

  test('address search functionality works', async () => {
    const user = userEvent.setup()
    render(<UserManagement />)
    
    const registerButton = screen.getByText('파트너사 등록')
    await user.click(registerButton)
    
    const addressSearchButton = screen.getByText('주소 검색')
    await user.click(addressSearchButton)
    
    // Should populate address fields (mocked in setup.ts)
    await waitFor(() => {
      const addressInput = screen.getByLabelText('기본 발송지 주소')
      const zipcodeInput = screen.getByLabelText('우편번호')
      
      expect(addressInput.value).toBe('서울 강남구 테헤란로 123')
      expect(zipcodeInput.value).toBe('12345')
    })
  })

  test('user edit modal opens and functions', async () => {
    const user = userEvent.setup()
    render(<UserManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    // Find and click edit button
    const editButtons = screen.getAllByText('수정')
    await user.click(editButtons[0])
    
    expect(screen.getByText('파트너사 편집')).toBeInTheDocument()
  })

  test('user deletion works', async () => {
    const user = userEvent.setup()
    mockApi.delete.mockResolvedValue({ data: { message: 'User deleted' } })
    // Mock window.confirm
    global.confirm = vi.fn(() => true)
    
    render(<UserManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    // Find and click delete button
    const deleteButtons = screen.getAllByText('삭제')
    await user.click(deleteButtons[0])
    
    expect(mockApi.delete).toHaveBeenCalledWith('/api/users/1')
  })

  test('pagination works correctly', async () => {
    const user = userEvent.setup()
    // Mock response with pagination
    mockApi.get.mockResolvedValueOnce({
      data: {
        users: [],
        pagination: { page: 1, limit: 10, total: 25, totalPages: 3 }
      }
    })
    
    render(<UserManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // Current page
      expect(screen.getByText('3')).toBeInTheDocument() // Total pages
    })
  })

  test('handles API errors gracefully', async () => {
    mockApi.get.mockRejectedValue(new Error('API Error'))
    
    render(<UserManagement />)
    
    // Should not crash and show empty state or error message
    await waitFor(() => {
      expect(screen.queryByText('testuser')).not.toBeInTheDocument()
    })
  })
})