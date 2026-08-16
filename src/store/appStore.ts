import { create } from 'zustand';

interface AppState {
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
  bookmarks: Record<string, boolean>;
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  recentSearches: ['القاهرة', 'المعادي', 'English', 'Open Meeting'],
  addRecentSearch: (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    set((state) => {
      const filtered = state.recentSearches.filter(
        (t) => t.toLowerCase() !== trimmed.toLowerCase()
      );
      return {
        recentSearches: [trimmed, ...filtered].slice(0, 10),
      };
    });
  },
  removeRecentSearch: (term: string) => {
    set((state) => ({
      recentSearches: state.recentSearches.filter((t) => t !== term),
    }));
  },
  clearRecentSearches: () => {
    set({ recentSearches: [] });
  },
  bookmarks: {},
  toggleBookmark: (id: string) => {
    set((state) => ({
      bookmarks: {
        ...state.bookmarks,
        [id]: !state.bookmarks[id],
      },
    }));
  },
  isBookmarked: (id: string) => {
    return !!get().bookmarks[id];
  },
}));
