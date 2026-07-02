import { create } from 'zustand';
import { api, setAccessToken } from '../lib/api';
import { User } from '../lib/types';
import { useCartStore } from '../store/useCartStore';

interface AuthState {
  user: User | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: String }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (userDetails: any) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', credentials);
      const { accessToken, user } = response.data;
      
      setAccessToken(accessToken);
      // Set the client cookie that middleware reads to authorize routing
      document.cookie = "eduflow_token=true; path=/; max-age=604800; SameSite=Strict";
      
      set({ user, loading: false });
      useCartStore.getState().fetchCart(); // Fetch cart items immediately
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Login failed', loading: false });
      throw err;
    }
  },

  loginWithGoogle: async (idToken: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/google', { token: idToken });
      const { accessToken, user } = response.data;
      
      setAccessToken(accessToken);
      document.cookie = "eduflow_token=true; path=/; max-age=604800; SameSite=Strict";
      
      set({ user, loading: false });
      useCartStore.getState().fetchCart();
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Google authentication failed', loading: false });
      throw err;
    }
  },

  register: async (userDetails) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/register', userDetails);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Registration failed', loading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      // Endpoint cleans refresh token cookie and logs out
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout, proceed with client cleanup
    } finally {
      setAccessToken(null);
      // Prune middleware cookie
      document.cookie = "eduflow_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      set({ user: null, loading: false });
      useCartStore.getState().clearCart();
    }
  },

  checkSession: async () => {
    try {
      // Hit silent refresh token endpoint
      const response = await api.post('/auth/refresh');
      const { accessToken, user } = response.data;
      
      setAccessToken(accessToken);
      document.cookie = "eduflow_token=true; path=/; max-age=604800; SameSite=Strict";
      
      set({ user, initialized: true });
      useCartStore.getState().fetchCart();
    } catch (err) {
      // Refresh token is expired or missing
      setAccessToken(null);
      document.cookie = "eduflow_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      set({ user: null, initialized: true });
    }
  }
}));
