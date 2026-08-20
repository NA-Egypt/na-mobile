import { create } from 'zustand';

export interface MeetingReminder {
  offsetHours: 1 | 2;
  notificationId: string;
}

interface AppState {
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
  bookmarks: Record<string, boolean>;
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  meetingReminders: Record<string, MeetingReminder>;
  setMeetingReminder: (meetingId: string, reminder: MeetingReminder) => void;
  removeMeetingReminder: (meetingId: string) => void;
  getMeetingReminder: (meetingId: string) => MeetingReminder | undefined;
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
  meetingReminders: {},
  setMeetingReminder: (meetingId: string, reminder: MeetingReminder) => {
    set((state) => ({
      meetingReminders: {
        ...state.meetingReminders,
        [meetingId]: reminder,
      },
    }));
  },
  removeMeetingReminder: (meetingId: string) => {
    set((state) => {
      const copy = { ...state.meetingReminders };
      delete copy[meetingId];
      return { meetingReminders: copy };
    });
  },
  getMeetingReminder: (meetingId: string) => {
    return get().meetingReminders[meetingId];
  },
}));
