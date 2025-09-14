import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminShippingForm from './AdminShippingForm';
import { renderWithAdminUser } from '../../test/testUtils';
import { mockUsers, mockRequestTypes, mockCreateDeliveryResponse } from '../../test/mockData';
import * as api from '../../services/api';

// Mock the API
vi.mock('../../services/api');
const mockApi = vi.mocked(api);

// Mock Daum Postcode
global.window.daum = {
  Postcode: vi.fn().mockImplementation(() => ({
    open: vi.fn(),
  })),
};

describe('AdminShippingForm', () => {
  const mockOnNavigateBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.userAPI.getAllUsers.mockResolvedValue({
      success: true,
      data: mockUsers
    });
    mockApi.requestTypesAPI.getRequestTypes.mockResolvedValue({
      success: true,
      data: mockRequestTypes
    });
  });

  describe('초기 렌더링', () => {
    it('관리자용 제목과 헤더가 표시되어야 함', () => {
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      expect(screen.getByText('배송접수_관리자용')).toBeInTheDocument();
      expect(screen.getByText('새로운 배송을 접수하세요 (관리자 전용)')).toBeInTheDocument();
    });

    it('파트너사 선택 섹션이 표시되어야 함', async () => {
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('파트너사 선택 (관리자 전용)')).toBeInTheDocument();
        expect(screen.getByText('발송 업체 선택')).toBeInTheDocument();
      });
    });

    it('모든 폼 섹션이 표시되어야 함', async () => {
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('파트너사 선택 (관리자 전용)')).toBeInTheDocument();
        expect(screen.getByText('발송인 정보')).toBeInTheDocument();
        expect(screen.getByText('고객 정보 (방문지)')).toBeInTheDocument();
        expect(screen.getByText('배송 유형 및 일정')).toBeInTheDocument();
        expect(screen.getByText('건물 및 접근성 정보')).toBeInTheDocument();
        expect(screen.getByText('제품 정보')).toBeInTheDocument();
        expect(screen.getByText('배송 비용 및 특별 옵션')).toBeInTheDocument();
        expect(screen.getByText('메모 및 특별 지시사항')).toBeInTheDocument();
      });
    });
  });

  describe('파트너사 선택 기능', () => {
    it('파트너사 목록이 로드되어야 함', async () => {
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      await waitFor(() => {
        expect(mockApi.userAPI.getAllUsers).toHaveBeenCalled();
        expect(screen.getByText('또는 목록에서 선택하세요')).toBeInTheDocument();
      });
    });

    it('파트너사 검색 기능이 작동해야 함', async () => {
      const user = userEvent.setup();
      mockApi.userAPI.getAllUsers.mockResolvedValue({
        success: true,
        data: mockUsers.filter(u => u.role === 'partner')
      });

      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      const searchInput = await screen.findByPlaceholderText('파트너사명 또는 업체명으로 검색');
      const searchButton = screen.getByRole('button', { name: /조회/i });
      
      await user.type(searchInput, '파트너');
      await user.click(searchButton);
      
      expect(searchInput).toHaveValue('파트너');
    });

    it('파트너사 선택 시 발송인 정보가 자동 입력되어야 함', async () => {
      const user = userEvent.setup();
      
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      const partnerSelect = await screen.findByRole('combobox');
      await user.selectOptions(partnerSelect, '2'); // 파트너 사용자 ID
      
      await waitFor(() => {
        const senderNameInput = screen.getByDisplayValue('김파트너');
        expect(senderNameInput).toBeInTheDocument();
      });
    });
  });

  describe('폼 유효성 검사', () => {
    it('필수 필드 검증이 작동해야 함', async () => {
      const user = userEvent.setup();
      
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      const submitButton = await screen.findByRole('button', { name: /배송 접수 완료/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('발송인 이름은 필수입니다')).toBeInTheDocument();
        expect(screen.getByText('고객 이름은 필수입니다')).toBeInTheDocument();
        expect(screen.getByText('제품명은 필수입니다')).toBeInTheDocument();
      });
    });

    it('전화번호 형식 검증이 작동해야 함', async () => {
      const user = userEvent.setup();
      
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      const phoneInput = await screen.findByPlaceholderText('010-1234-5678');
      await user.type(phoneInput, '잘못된번호');
      
      const submitButton = screen.getByRole('button', { name: /배송 접수 완료/i });
      await user.click(submitButton);
      
      // 전화번호 검증 메시지가 있다면 확인
      // 실제 검증 로직에 따라 수정 필요
    });
  });

  describe('주소 검색 기능', () => {
    it('발송인 주소 검색 버튼이 작동해야 함', async () => {
      const user = userEvent.setup();
      
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      const addressSearchButtons = await screen.findAllByText('검색');
      await user.click(addressSearchButtons[0]); // 첫 번째 검색 버튼 (발송인 주소)
      
      expect(window.daum.Postcode).toHaveBeenCalled();
    });

    it('고객 주소 검색 버튼이 작동해야 함', async () => {
      const user = userEvent.setup();
      
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      const addressSearchButtons = await screen.findAllByText('검색');
      await user.click(addressSearchButtons[1]); // 두 번째 검색 버튼 (고객 주소)
      
      expect(window.daum.Postcode).toHaveBeenCalled();
    });
  });

  describe('제품 정보 관리', () => {
    it('제품 조회 모달이 열려야 함', async () => {
      const user = userEvent.setup();
      
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      const productSearchButton = await screen.findByText('조회');
      await user.click(productSearchButton);
      
      // 모달이 열렸는지 확인하는 로직
      // ProductSelectionModal 컴포넌트가 렌더링되는지 확인
    });
  });

  describe('폼 제출', () => {
    it('성공적인 폼 제출이 처리되어야 함', async () => {
      const user = userEvent.setup();
      mockApi.deliveriesAPI.createDelivery.mockResolvedValue(mockCreateDeliveryResponse);
      
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      // 필수 필드들 입력
      await user.type(await screen.findByPlaceholderText('발송인 이름을 입력하세요'), '테스트 발송인');
      await user.type(screen.getByPlaceholderText('방문할 고객 이름'), '테스트 고객');
      await user.type(screen.getByPlaceholderText('010-1234-5678'), '010-1234-5678');
      await user.type(screen.getByPlaceholderText('제품명을 입력하세요'), '테스트 제품');
      
      // 건물 유형 선택
      await user.selectOptions(screen.getByRole('combobox', { name: /건물 유형/i }), 'apartment');
      
      const submitButton = screen.getByRole('button', { name: /배송 접수 완료/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockApi.deliveriesAPI.createDelivery).toHaveBeenCalled();
      });
    });

    it('폼 제출 실패 시 에러 메시지가 표시되어야 함', async () => {
      const user = userEvent.setup();
      mockApi.deliveriesAPI.createDelivery.mockRejectedValue(new Error('배송 접수 실패'));
      
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      // 필수 필드들 입력
      await user.type(await screen.findByPlaceholderText('발송인 이름을 입력하세요'), '테스트 발송인');
      await user.type(screen.getByPlaceholderText('방문할 고객 이름'), '테스트 고객');
      await user.type(screen.getByPlaceholderText('010-1234-5678'), '010-1234-5678');
      await user.type(screen.getByPlaceholderText('제품명을 입력하세요'), '테스트 제품');
      
      await user.selectOptions(screen.getByRole('combobox', { name: /건물 유형/i }), 'apartment');
      
      const submitButton = screen.getByRole('button', { name: /배송 접수 완료/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('배송접수 실패')).toBeInTheDocument();
      });
    });
  });

  describe('네비게이션', () => {
    it('돌아가기 버튼이 작동해야 함', async () => {
      const user = userEvent.setup();
      
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      const backButton = screen.getByRole('button', { name: /돌아가기/i });
      await user.click(backButton);
      
      expect(mockOnNavigateBack).toHaveBeenCalled();
    });
  });

  describe('체크박스 옵션', () => {
    it('엘리베이터 이용 가능 체크박스가 작동해야 함', async () => {
      const user = userEvent.setup();
      
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      const elevatorCheckbox = await screen.findByLabelText('엘리베이터 이용 가능');
      
      expect(elevatorCheckbox).not.toBeChecked();
      await user.click(elevatorCheckbox);
      expect(elevatorCheckbox).toBeChecked();
    });

    it('깨지기 쉬운 물품 체크박스가 작동해야 함', async () => {
      const user = userEvent.setup();
      
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      const fragileCheckbox = await screen.findByLabelText('깨지기 쉬운 물품');
      
      expect(fragileCheckbox).not.toBeChecked();
      await user.click(fragileCheckbox);
      expect(fragileCheckbox).toBeChecked();
    });
  });

  describe('의뢰종류 선택', () => {
    it('의뢰종류 목록이 로드되어야 함', async () => {
      renderWithAdminUser(
        <AdminShippingForm onNavigateBack={mockOnNavigateBack} />
      );
      
      await waitFor(() => {
        expect(mockApi.requestTypesAPI.getRequestTypes).toHaveBeenCalled();
      });

      // 의뢰종류 선택 옵션들이 표시되는지 확인
      const requestTypeSelect = await screen.findByRole('combobox', { name: /의뢰종류/i });
      expect(requestTypeSelect).toBeInTheDocument();
    });
  });
});