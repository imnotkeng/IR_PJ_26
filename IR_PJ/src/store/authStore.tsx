import { create } from 'zustand';


interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setToken: (token: string) => void;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),

  setToken: (token: string) => {
    localStorage.setItem('access_token', token);
    set({ token, isAuthenticated: true });
  },

  fetchUser: async () => {
    const { token, logout } = get();
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5001/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const userData = await res.json();
        set({ user: userData, isAuthenticated: true });
      } else {
        // ถ้า Token หมดอายุหรือไม่ถูกต้อง
        logout();
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      logout();
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));