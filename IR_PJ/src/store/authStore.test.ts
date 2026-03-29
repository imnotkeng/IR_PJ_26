// store/authStore.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from './authStore';

// สร้างฟังก์ชันปลอมเตรียมไว้
const mockFetch = vi.fn();

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 👈 แก้ตรงนี้: ใช้ vi.stubGlobal จำลอง fetch แทนการใช้ global.fetch
    vi.stubGlobal('fetch', mockFetch);
    
    // จำลอง localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    // รีเซ็ตค่าใน Store ให้เป็นค่าเริ่มต้นก่อนเริ่มเทสเสมอ
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    // ล้างการจำลองทั้งหมดคืนค่าเดิมหลังเทสเสร็จ
    vi.unstubAllGlobals();
  });

  it('setToken should save token to localStorage and update state', () => {
    useAuthStore.getState().setToken('fake-jwt-token');

    expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'fake-jwt-token');
    expect(useAuthStore.getState().token).toBe('fake-jwt-token');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('logout should clear localStorage and reset state', () => {
    useAuthStore.setState({ 
      user: { id: 1, username: 'test', email: 'test@test.com' }, 
      token: '123', 
      isAuthenticated: true 
    });

    useAuthStore.getState().logout();

    expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('fetchUser should successfully fetch and set user data', async () => {
    const mockUserData = { id: 1, username: 'Keng', email: 'keng@example.com' };
    
    useAuthStore.setState({ token: 'valid-token' });

    // กำหนดให้ mockFetch ตอบกลับมาว่า Success และคืนค่า mockUserData
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockUserData,
    });

    await useAuthStore.getState().fetchUser();

    expect(useAuthStore.getState().user).toEqual(mockUserData);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('fetchUser should logout if the fetch response is not ok', async () => {
    useAuthStore.setState({ token: 'expired-token', isAuthenticated: true });

    // กำหนดให้ mockFetch ตอบกลับมาว่า Fail (เช่น 401 Unauthorized)
    mockFetch.mockResolvedValue({
      ok: false,
    });

    await useAuthStore.getState().fetchUser();

    expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  
});