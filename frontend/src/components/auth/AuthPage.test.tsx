import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthPage from './AuthPage';
import { render, renderWithoutUser } from '../../test/testUtils';
import * as api from '../../services/api';

// Mock the API
vi.mock('../../services/api');
const mockApi = vi.mocked(api);

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('초기 렌더링', () => {
    it('로그인 폼이 기본으로 표시되어야 함', () => {
      renderWithoutUser(<AuthPage />);
      
      expect(screen.getByRole('heading', { name: /로그인/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/아이디를 입력하세요/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/비밀번호를 입력하세요/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /로그인/i })).toBeInTheDocument();
    });

    it('회원가입 모드로 전환할 수 있어야 함', async () => {
      const user = userEvent.setup();
      renderWithoutUser(<AuthPage />);
      
      const signupToggle = screen.getByText(/회원가입/i);
      await user.click(signupToggle);
      
      expect(screen.getByRole('heading', { name: /회원가입/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/이름을 입력하세요/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/전화번호를 입력하세요/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/회사명을 입력하세요/i)).toBeInTheDocument();
    });
  });

  describe('로그인 기능', () => {
    it('성공적인 로그인이 처리되어야 함', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockResolvedValue({ success: true });
      
      renderWithoutUser(<AuthPage />);
      
      const usernameInput = screen.getByPlaceholderText(/아이디를 입력하세요/i);
      const passwordInput = screen.getByPlaceholderText(/비밀번호를 입력하세요/i);
      const loginButton = screen.getByRole('button', { name: /로그인/i });
      
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);
      
      expect(usernameInput).toHaveValue('testuser');
      expect(passwordInput).toHaveValue('password123');
    });

    it('로그인 실패 시 에러 메시지가 표시되어야 함', async () => {
      const user = userEvent.setup();
      mockApi.authAPI.login.mockRejectedValue(new Error('로그인 실패'));
      
      renderWithoutUser(<AuthPage />);
      
      await user.type(screen.getByPlaceholderText(/아이디를 입력하세요/i), 'wronguser');
      await user.type(screen.getByPlaceholderText(/비밀번호를 입력하세요/i), 'wrongpass');
      await user.click(screen.getByRole('button', { name: /로그인/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/로그인에 실패했습니다/i)).toBeInTheDocument();
      });
    });

    it('비밀번호 표시/숨김 토글이 작동해야 함', async () => {
      const user = userEvent.setup();
      renderWithoutUser(<AuthPage />);
      
      const passwordInput = screen.getByPlaceholderText(/비밀번호를 입력하세요/i);
      const toggleButton = screen.getByRole('button', { name: /비밀번호 표시/i });
      
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('회원가입 기능', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithoutUser(<AuthPage />);
      
      const signupToggle = screen.getByText(/회원가입/i);
      await user.click(signupToggle);
    });

    it('필수 필드 검증이 작동해야 함', async () => {
      const user = userEvent.setup();
      const signupButton = screen.getByRole('button', { name: /회원가입/i });
      
      await user.click(signupButton);
      
      await waitFor(() => {
        expect(screen.getByText(/아이디는 필수입니다/i)).toBeInTheDocument();
        expect(screen.getByText(/비밀번호는 필수입니다/i)).toBeInTheDocument();
        expect(screen.getByText(/이름은 필수입니다/i)).toBeInTheDocument();
      });
    });

    it('아이디 중복 확인이 작동해야 함', async () => {
      const user = userEvent.setup();
      mockApi.authAPI.checkUsername.mockResolvedValue({ 
        success: true, 
        available: false,
        message: '이미 사용중인 아이디입니다' 
      });
      
      const usernameInput = screen.getByPlaceholderText(/아이디를 입력하세요/i);
      await user.type(usernameInput, 'existinguser');
      await user.tab(); // blur event
      
      await waitFor(() => {
        expect(mockApi.authAPI.checkUsername).toHaveBeenCalledWith('existinguser');
        expect(screen.getByText(/이미 사용중인 아이디입니다/i)).toBeInTheDocument();
      });
    });

    it('성공적인 회원가입이 처리되어야 함', async () => {
      const user = userEvent.setup();
      mockApi.authAPI.checkUsername.mockResolvedValue({ 
        success: true, 
        available: true 
      });
      mockApi.authAPI.register.mockResolvedValue({ 
        success: true,
        message: '회원가입이 완료되었습니다'
      });
      
      await user.type(screen.getByPlaceholderText(/아이디를 입력하세요/i), 'newuser');
      await user.type(screen.getByPlaceholderText(/비밀번호를 입력하세요/i), 'password123');
      await user.type(screen.getByPlaceholderText(/이름을 입력하세요/i), '테스트유저');
      await user.type(screen.getByPlaceholderText(/전화번호를 입력하세요/i), '010-1234-5678');
      await user.type(screen.getByPlaceholderText(/회사명을 입력하세요/i), '테스트회사');
      
      await user.click(screen.getByRole('button', { name: /회원가입/i }));
      
      await waitFor(() => {
        expect(mockApi.authAPI.register).toHaveBeenCalledWith({
          username: 'newuser',
          password: 'password123',
          name: '테스트유저',
          phone: '010-1234-5678',
          company: '테스트회사'
        });
      });
    });
  });

  describe('폼 전환', () => {
    it('로그인과 회원가입 모드 간 전환이 올바르게 작동해야 함', async () => {
      const user = userEvent.setup();
      renderWithoutUser(<AuthPage />);
      
      // 기본값: 로그인 모드
      expect(screen.getByRole('heading', { name: /로그인/i })).toBeInTheDocument();
      
      // 회원가입으로 전환
      await user.click(screen.getByText(/회원가입/i));
      expect(screen.getByRole('heading', { name: /회원가입/i })).toBeInTheDocument();
      
      // 다시 로그인으로 전환
      await user.click(screen.getByText(/로그인/i));
      expect(screen.getByRole('heading', { name: /로그인/i })).toBeInTheDocument();
    });

    it('모드 전환 시 폼 데이터가 초기화되어야 함', async () => {
      const user = userEvent.setup();
      renderWithoutUser(<AuthPage />);
      
      // 로그인 폼에 데이터 입력
      await user.type(screen.getByPlaceholderText(/아이디를 입력하세요/i), 'testuser');
      await user.type(screen.getByPlaceholderText(/비밀번호를 입력하세요/i), 'password');
      
      // 회원가입으로 전환
      await user.click(screen.getByText(/회원가입/i));
      
      // 다시 로그인으로 전환
      await user.click(screen.getByText(/로그인/i));
      
      // 폼이 초기화되었는지 확인
      expect(screen.getByPlaceholderText(/아이디를 입력하세요/i)).toHaveValue('');
      expect(screen.getByPlaceholderText(/비밀번호를 입력하세요/i)).toHaveValue('');
    });
  });

  describe('접근성', () => {
    it('키보드 네비게이션이 작동해야 함', async () => {
      const user = userEvent.setup();
      renderWithoutUser(<AuthPage />);
      
      const usernameInput = screen.getByPlaceholderText(/아이디를 입력하세요/i);
      const passwordInput = screen.getByPlaceholderText(/비밀번호를 입력하세요/i);
      const loginButton = screen.getByRole('button', { name: /로그인/i });
      
      // Tab 키로 포커스 이동 확인
      await user.tab();
      expect(usernameInput).toHaveFocus();
      
      await user.tab();
      expect(passwordInput).toHaveFocus();
      
      await user.tab();
      expect(loginButton).toHaveFocus();
    });

    it('스크린 리더를 위한 라벨이 올바르게 설정되어야 함', () => {
      renderWithoutUser(<AuthPage />);
      
      expect(screen.getByLabelText(/아이디/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();
    });
  });
});