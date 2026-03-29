// Auth.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Auth from './Auth';

// 1. Mock the API Configuration
vi.mock('../config', () => ({
  API_URL: 'http://mock-api.com',
}));

// 2. Mock React Router's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// 3. Mock Zustand Store (useAuthStore)
const mockSetToken = vi.fn();
const mockFetchUser = vi.fn();
vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: any) => {
    const state = {
      setToken: mockSetToken,
      fetchUser: mockFetchUser,
    };
    return selector(state);
  },
}));

// 4. Mock the global fetch function
const mockFetch = vi.fn();

describe('Auth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ==========================================
  // UNIT TESTS (Low-Level UI Checks)
  // ==========================================
  describe('UI Rendering and Toggling', () => {
    it('renders the login form by default', () => {
      render(<Auth />);
      
      // Check for elements specific to the login form
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
      
      // The "Username" field should NOT exist on the login form
      expect(screen.queryByPlaceholderText('Your username')).not.toBeInTheDocument();
    });

    it('toggles to the signup form when the link is clicked', () => {
      render(<Auth />);
      
      // Click the toggle button
      const toggleBtn = screen.getByText("Don't have an account? Sign up");
      fireEvent.click(toggleBtn);

      // Now it should show the Signup UI
      expect(screen.getByText('Create account')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Your username')).toBeInTheDocument();
    });
  });

  // ==========================================
  // HIGHER-LEVEL TESTS (Integration & Behavior)
  // ==========================================
  describe('Form Submissions and API Integration', () => {
    it('handles a successful login flow', async () => {
      render(<Auth />);

      // 1. Mock a successful API response for login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'fake-jwt-token' }),
      });

      // 2. Simulate user typing in the fields
      fireEvent.change(screen.getByPlaceholderText('you@example.com (or username)'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'password123' },
      });

      // 3. Click the submit button
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      // 4. Wait for the async actions to finish and assert the results
      await waitFor(() => {
        // Check if fetch was called with the right URL and method
        expect(mockFetch).toHaveBeenCalledWith('http://mock-api.com/auth/token', expect.objectContaining({
          method: 'POST',
        }));
        
        // Check if Zustand store actions were triggered
        expect(mockSetToken).toHaveBeenCalledWith('fake-jwt-token');
        expect(mockFetchUser).toHaveBeenCalled();
        
        // Check if user was navigated to the home page
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    

    it('displays unexpected error message when a non-standard error is thrown', async () => {
      render(<Auth />);
      
      // Force fetch to completely crash (e.g., Network Error) 
      // instead of returning an HTTP Error response
      mockFetch.mockRejectedValueOnce(new Error("Network connection lost"));

      fireEvent.change(screen.getByPlaceholderText('you@example.com (or username)'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'password123' },
      });
      
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      await waitFor(() => {
        // It should catch the error and display its message
        expect(screen.getByText('Network connection lost')).toBeInTheDocument();
      });
      
      // Bonus: Test the absolute worst-case scenario (not an Error object)
      mockFetch.mockRejectedValueOnce("Just a weird string error");
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
      
      await waitFor(() => {
         // It should fallback to the generic message
         expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });

    

    it('displays an error message on login failure', async () => {
      render(<Auth />);

      // 1. Mock a failed API response (e.g., wrong password)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Incorrect email or password' }),
      });

      // 2. Submit the form
      fireEvent.change(screen.getByPlaceholderText('you@example.com (or username)'), {
        target: { value: 'wrong@user.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'wrongpass' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      // 3. Verify the error message appears on screen
      await waitFor(() => {
        expect(screen.getByText('Incorrect email or password')).toBeInTheDocument();
        expect(mockSetToken).not.toHaveBeenCalled(); // Ensure state wasn't updated
      });
    });

    it('handles a successful signup flow', async () => {
      render(<Auth />);

      // 1. Switch to Signup mode
      fireEvent.click(screen.getByText("Don't have an account? Sign up"));

      // 2. Mock a successful API response for signup
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, username: 'newuser', email: 'new@user.com' }),
      });

      // 3. Fill out the signup form
      fireEvent.change(screen.getByPlaceholderText('Your username'), {
        target: { value: 'newuser' },
      });
      fireEvent.change(screen.getByPlaceholderText('you@example.com (or username)'), {
        target: { value: 'new@user.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'securepassword' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

      // 4. Verify the success state
      await waitFor(() => {
        // Check the API call
        expect(mockFetch).toHaveBeenCalledWith('http://mock-api.com/auth/signup', expect.objectContaining({
          method: 'POST',
        }));
        
        // Check the success message
        expect(screen.getByText('Account created successfully! Please sign in.')).toBeInTheDocument();
        
        // Check that it automatically toggled back to the Sign In view
        expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
      });
    });

    
  });
});