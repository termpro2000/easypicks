import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import { renderWithAdminUser } from '../../test/testUtils';
import { mockDeliveries, mockApiResponse } from '../../test/mockData';
import * as api from '../../services/api';

// Mock the API
vi.mock('../../services/api');
const mockApi = vi.mocked(api);

// Mock visibility API
Object.defineProperty(document, 'visibilityState', {
  writable: true,
  value: 'visible',
});

Object.defineProperty(document, 'hidden', {
  writable: true,
  value: false,
});

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    mockApi.deliveriesAPI.getDeliveries.mockResolvedValue({
      success: true,
      data: mockDeliveries,
      pagination: {
        total: mockDeliveries.length,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('초기 렌더링', () => {
    it('대시보드 제목이 표시되어야 함', async () => {
      renderWithAdminUser(<Dashboard />);
      
      expect(screen.getByText('배송 관리 대시보드')).toBeInTheDocument();
    });

    it('통계 카드들이 표시되어야 함', async () => {
      renderWithAdminUser(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('총 주문')).toBeInTheDocument();
        expect(screen.getByText('대기중')).toBeInTheDocument();
        expect(screen.getByText('창고')).toBeInTheDocument();
        expect(screen.getByText('완료')).toBeInTheDocument();
      });
    });

    it('배송 목록이 로드되어야 함', async () => {
      renderWithAdminUser(<Dashboard />);
      
      await waitFor(() => {
        expect(mockApi.deliveriesAPI.getDeliveries).toHaveBeenCalled();
      });
    });
  });

  describe('통계 카드', () => {
    it('올바른 통계 수치가 표시되어야 함', async () => {
      renderWithAdminUser(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // 총 주문 수
        expect(screen.getByText('1')).toBeInTheDocument(); // 대기중 주문 수
        expect(screen.getByText('1')).toBeInTheDocument(); // 운송중 주문 수
        expect(screen.getByText('1')).toBeInTheDocument(); // 완료 주문 수
      });
    });

    it('통계 카드 클릭 시 해당 상태로 필터링되어야 함', async () => {
      const user = userEvent.setup();
      renderWithAdminUser(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('대기중')).toBeInTheDocument();
      });
      
      const pendingCard = screen.getByText('대기중').closest('div');
      if (pendingCard) {
        await user.click(pendingCard);
        
        // 필터링된 결과 확인
        await waitFor(() => {
          expect(mockApi.deliveriesAPI.getDeliveries).toHaveBeenCalledWith(
            1, 10, 'pending'
          );
        });
      }
    });
  });

  describe('검색 기능', () => {
    it('검색 입력 필드가 작동해야 함', async () => {
      const user = userEvent.setup();
      renderWithAdminUser(<Dashboard />);
      
      const searchInput = await screen.findByPlaceholderText(/검색어를 입력하세요/i);
      await user.type(searchInput, '테스트 검색');
      
      expect(searchInput).toHaveValue('테스트 검색');
    });

    it('검색 실행이 작동해야 함', async () => {
      const user = userEvent.setup();
      renderWithAdminUser(<Dashboard />);
      
      const searchInput = await screen.findByPlaceholderText(/검색어를 입력하세요/i);
      const searchButton = screen.getByRole('button', { name: /검색/i });
      
      await user.type(searchInput, '테스트');
      await user.click(searchButton);
      
      await waitFor(() => {
        expect(mockApi.deliveriesAPI.getDeliveries).toHaveBeenCalledWith(
          1, 10, 'all', '테스트'
        );
      });
    });

    it('Enter 키로 검색이 실행되어야 함', async () => {
      const user = userEvent.setup();
      renderWithAdminUser(<Dashboard />);
      
      const searchInput = await screen.findByPlaceholderText(/검색어를 입력하세요/i);
      await user.type(searchInput, '테스트{enter}');
      
      await waitFor(() => {
        expect(mockApi.deliveriesAPI.getDeliveries).toHaveBeenCalledWith(
          1, 10, 'all', '테스트'
        );
      });
    });
  });

  describe('상태 필터링', () => {
    it('상태 선택이 작동해야 함', async () => {
      const user = userEvent.setup();
      renderWithAdminUser(<Dashboard />);
      
      const statusSelect = await screen.findByRole('combobox');
      await user.selectOptions(statusSelect, 'pending');
      
      await waitFor(() => {
        expect(mockApi.deliveriesAPI.getDeliveries).toHaveBeenCalledWith(
          1, 10, 'pending'
        );
      });
    });

    it('모든 상태 옵션이 표시되어야 함', async () => {
      renderWithAdminUser(<Dashboard />);
      
      const statusSelect = await screen.findByRole('combobox');
      
      expect(screen.getByRole('option', { name: /전체/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /대기/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /운송중/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /완료/i })).toBeInTheDocument();
    });
  });

  describe('배송 목록', () => {
    it('배송 항목들이 표시되어야 함', async () => {
      renderWithAdminUser(<Dashboard />);
      
      await waitFor(() => {
        mockDeliveries.forEach(delivery => {
          expect(screen.getByText(delivery.sender_name)).toBeInTheDocument();
          expect(screen.getByText(delivery.customer_name)).toBeInTheDocument();
          expect(screen.getByText(delivery.product_name)).toBeInTheDocument();
        });
      });
    });

    it('상태 배지가 올바르게 표시되어야 함', async () => {
      renderWithAdminUser(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('대기중')).toBeInTheDocument();
        expect(screen.getByText('운송중')).toBeInTheDocument();
        expect(screen.getByText('완료')).toBeInTheDocument();
      });
    });

    it('추적번호가 표시되어야 함', async () => {
      renderWithAdminUser(<Dashboard />);
      
      await waitFor(() => {
        mockDeliveries.forEach(delivery => {
          if (delivery.tracking_number) {
            expect(screen.getByText(delivery.tracking_number)).toBeInTheDocument();
          }
        });
      });
    });
  });

  describe('실시간 업데이트', () => {
    it('10초마다 자동 새로고침이 실행되어야 함', async () => {
      renderWithAdminUser(<Dashboard />);
      
      await waitFor(() => {
        expect(mockApi.deliveriesAPI.getDeliveries).toHaveBeenCalledTimes(1);
      });
      
      // 10초 경과
      vi.advanceTimersByTime(10000);
      
      await waitFor(() => {
        expect(mockApi.deliveriesAPI.getDeliveries).toHaveBeenCalledTimes(2);
      });
    });

    it('페이지가 숨겨진 상태에서는 자동 새로고침이 중단되어야 함', async () => {
      renderWithAdminUser(<Dashboard />);
      
      await waitFor(() => {
        expect(mockApi.deliveriesAPI.getDeliveries).toHaveBeenCalledTimes(1);
      });
      
      // 페이지를 숨김 상태로 변경
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
      });
      fireEvent(document, new Event('visibilitychange'));
      
      // 10초 경과
      vi.advanceTimersByTime(10000);
      
      // 추가 호출이 없어야 함
      expect(mockApi.deliveriesAPI.getDeliveries).toHaveBeenCalledTimes(1);
    });
  });

  describe('페이지네이션', () => {
    it('페이지 변경이 작동해야 함', async () => {
      const user = userEvent.setup();
      
      // 더 많은 데이터로 페이지네이션 테스트
      mockApi.deliveriesAPI.getDeliveries.mockResolvedValue({
        success: true,
        data: mockDeliveries,
        pagination: {
          total: 25,
          page: 1,
          limit: 10,
          totalPages: 3
        }
      });
      
      renderWithAdminUser(<Dashboard />);
      
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /다음/i });
        expect(nextButton).toBeInTheDocument();
      });
      
      const nextButton = screen.getByRole('button', { name: /다음/i });
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(mockApi.deliveriesAPI.getDeliveries).toHaveBeenCalledWith(
          2, 10, 'all'
        );
      });
    });
  });

  describe('데이터 내보내기', () => {
    it('Excel 내보내기 버튼이 표시되어야 함', async () => {
      renderWithAdminUser(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Excel 내보내기/i })).toBeInTheDocument();
      });
    });

    it('CSV 내보내기 버튼이 표시되어야 함', async () => {
      renderWithAdminUser(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /CSV 내보내기/i })).toBeInTheDocument();
      });
    });
  });

  describe('반응형 디자인', () => {
    it('모바일 뷰에서 카드 형태로 표시되어야 함', async () => {
      // 모바일 뷰포트 설정
      global.innerWidth = 640;
      global.dispatchEvent(new Event('resize'));
      
      renderWithAdminUser(<Dashboard />);
      
      await waitFor(() => {
        // 모바일 카드 레이아웃 확인
        const cards = screen.getAllByTestId('delivery-card');
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('에러 처리', () => {
    it('API 에러 시 에러 메시지가 표시되어야 함', async () => {
      mockApi.deliveriesAPI.getDeliveries.mockRejectedValue(new Error('API 에러'));
      
      renderWithAdminUser(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/데이터를 불러오는 중 오류가 발생했습니다/i)).toBeInTheDocument();
      });
    });

    it('네트워크 에러 시 재시도 버튼이 표시되어야 함', async () => {
      mockApi.deliveriesAPI.getDeliveries.mockRejectedValue(new Error('Network Error'));
      
      renderWithAdminUser(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /다시 시도/i })).toBeInTheDocument();
      });
    });
  });

  describe('로딩 상태', () => {
    it('데이터 로딩 중 스피너가 표시되어야 함', async () => {
      // 로딩 지연 mock
      mockApi.deliveriesAPI.getDeliveries.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: mockDeliveries,
          pagination: { total: 3, page: 1, limit: 10, totalPages: 1 }
        }), 1000))
      );
      
      renderWithAdminUser(<Dashboard />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});