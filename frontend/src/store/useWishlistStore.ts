import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CourseListDTO } from '../lib/types';

interface WishlistState {
  items: CourseListDTO[];
  addToWishlist: (course: CourseListDTO) => void;
  removeFromWishlist: (courseId: number) => void;
  toggleWishlist: (course: CourseListDTO) => void;
  isInWishlist: (courseId: number) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addToWishlist: (course) => {
        const items = get().items;
        if (!items.some((item) => item.id === course.id)) {
          set({ items: [...items, course] });
        }
      },
      
      removeFromWishlist: (courseId) => {
        set({ items: get().items.filter((item) => item.id !== courseId) });
      },
      
      toggleWishlist: (course) => {
        const isIn = get().isInWishlist(course.id);
        if (isIn) {
          get().removeFromWishlist(course.id);
        } else {
          get().addToWishlist(course);
        }
      },
      
      isInWishlist: (courseId) => {
        return get().items.some((item) => item.id === courseId);
      },
      
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'eduflow-wishlist',
    }
  )
);
