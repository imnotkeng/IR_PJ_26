// service/apiClient.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from './apiClient';

describe('apiClient Interceptor', () => {
  beforeEach(() => {
    // Mock the global localStorage object before each test
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
    });
  });

  afterEach(() => {
    // Clean up globals after tests
    vi.unstubAllGlobals();
  });

  it('should add Authorization header when token exists in localStorage', () => {
    // Access the registered interceptor function directly
    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;

    // Simulate localStorage having a token
    vi.mocked(localStorage.getItem).mockReturnValue('fake-token-123');

    const mockConfig = { headers: {} };
    const result = interceptor(mockConfig);

    expect(localStorage.getItem).toHaveBeenCalledWith('access_token');
    expect(result.headers.Authorization).toBe('Bearer fake-token-123');
  });

  it('should NOT add Authorization header when token is missing', () => {
    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;

    // Simulate localStorage being empty
    vi.mocked(localStorage.getItem).mockReturnValue(null);

    const mockConfig = { headers: {} };
    const result = interceptor(mockConfig);

    // Header should remain unmodified
    expect(result.headers.Authorization).toBeUndefined();
  });
});