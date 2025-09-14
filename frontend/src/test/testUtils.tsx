import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { mockAdminUser, mockPartnerUser, mockDriverUser } from './mockData';

// Mock AuthContext
const MockAuthContext = React.createContext({
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
  isAuthenticated: false,
  isLoading: false
});

// Mock AuthProvider
interface MockAuthProviderProps {
  children: React.ReactNode;
  mockUser?: any;
}

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({ 
  children, 
  mockUser = mockAdminUser 
}) => {
  const mockAuthValue = {
    user: mockUser,
    login: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn().mockResolvedValue({ success: true }),
    register: vi.fn().mockResolvedValue({ success: true }),
    updateProfile: vi.fn().mockResolvedValue({ success: true }),
    isAuthenticated: !!mockUser,
    isLoading: false
  };

  return (
    <MockAuthContext.Provider value={mockAuthValue}>
      {children}
    </MockAuthContext.Provider>
  );
};

// All the providers wrapper
interface AllTheProvidersProps {
  children: React.ReactNode;
  mockUser?: any;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ 
  children, 
  mockUser = mockAdminUser 
}) => {
  return (
    <BrowserRouter>
      <MockAuthProvider mockUser={mockUser}>
        {children}
      </MockAuthProvider>
    </BrowserRouter>
  );
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  mockUser?: any;
}

const customRender = (
  ui: ReactElement,
  { mockUser = mockAdminUser, ...options }: CustomRenderOptions = {}
) =>
  render(ui, { 
    wrapper: ({ children }) => (
      <AllTheProviders mockUser={mockUser}>
        {children}
      </AllTheProviders>
    ), 
    ...options 
  });

// re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Helper functions for different user types
export const renderWithAdminUser = (ui: ReactElement, options?: RenderOptions) =>
  customRender(ui, { ...options, mockUser: mockAdminUser });

export const renderWithPartnerUser = (ui: ReactElement, options?: RenderOptions) =>
  customRender(ui, { ...options, mockUser: mockPartnerUser });

export const renderWithDriverUser = (ui: ReactElement, options?: RenderOptions) =>
  customRender(ui, { ...options, mockUser: mockDriverUser });

export const renderWithoutUser = (ui: ReactElement, options?: RenderOptions) =>
  customRender(ui, { ...options, mockUser: null });

// Mock API functions
export const createMockApiResponse = (data: any, success = true, message = 'Success') => ({
  success,
  message,
  data
});

// Mock axios response
export const createMockAxiosResponse = (data: any, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {} as any
});

// Mock form data for testing
export const createMockFormData = (data: Record<string, any>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  return formData;
};

// Mock event objects
export const createMockChangeEvent = (value: string, name?: string) => ({
  target: {
    value,
    name: name || 'test-input'
  }
} as React.ChangeEvent<HTMLInputElement>);

export const createMockSelectEvent = (value: string, name?: string) => ({
  target: {
    value,
    name: name || 'test-select'
  }
} as React.ChangeEvent<HTMLSelectElement>);

export const createMockSubmitEvent = () => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn()
} as any);

// Mock localStorage helpers
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get store() {
      return { ...store };
    }
  };
};

// Mock axios module
export const createMockAxios = () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  create: vi.fn(() => createMockAxios()),
  interceptors: {
    request: {
      use: vi.fn(),
    },
    response: {
      use: vi.fn(),
    },
  },
});

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock window methods
export const mockWindow = {
  alert: vi.fn(),
  confirm: vi.fn(() => true),
  prompt: vi.fn(() => 'test'),
  location: {
    href: 'http://localhost:3000',
    reload: vi.fn(),
  },
  open: vi.fn(),
};