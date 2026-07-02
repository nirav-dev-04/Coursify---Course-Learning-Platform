import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CourseListDTO } from '../lib/types';

interface SavedForLaterState {
  items: CourseListDTO[];
  addToSaved: (course: CourseListDTO) => void;
  removeFromSaved: (courseId: number) => void;
  clearSaved: () => void;
}

export const useSavedForLaterStore = create<SavedForLaterState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addToSaved: (course) => {
        const items = get().items;
        if (!items.some((item) => item.id === course.id)) {
          set({ items: [...items, course] });
        }
      },
      
      removeFromSaved: (courseId) => {
        set({ items: get().items.filter((item) => item.id !== courseId) });
      },
      
      clearSaved: () => set({ items: [] }),
    }),
    {
      name: 'eduflow-saved-for-later',
    }
  )
);
