import { create } from 'zustand';
import { api } from '../lib/api';
import { CartItem } from '../lib/types';

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (courseId: number, courseData: any) => Promise<void>;
  removeFromCart: (courseId: number) => Promise<void>;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<CartItem[]>('/cart');
      set({ items: response.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load cart', loading: false });
    }
  },

  addToCart: async (courseId: number, courseData: any) => {
    const previousItems = get().items;
    
    // Optimistic Update: Add a temporary item to state
    const tempItem: CartItem = {
      id: Date.now(), // Temp unique ID
      user: {} as any,
      course: courseData,
      addedAt: new Date().toISOString()
    };
    
    set({ items: [...previousItems, tempItem] });

    try {
      const response = await api.post<CartItem>(`/cart?courseId=${courseId}`);
      // Replace temporary item with actual backend response
      set({
        items: get().items.map(item => item.course.id === courseId ? response.data : item)
      });
    } catch (err: any) {
      // Rollback on error
      set({ 
        items: previousItems, 
        error: err.response?.data?.message || 'Failed to add course to cart' 
      });
    }
  },

  removeFromCart: async (courseId: number) => {
    const previousItems = get().items;
    
    // Optimistic Update: Remove from list
    set({ items: previousItems.filter(item => item.course.id !== courseId) });

    try {
      await api.delete(`/cart/${courseId}`);
    } catch (err: any) {
      // Rollback on error
      set({ 
        items: previousItems, 
        error: err.response?.data?.message || 'Failed to remove item from cart' 
      });
    }
  },

  clearCart: () => set({ items: [] })
}));
