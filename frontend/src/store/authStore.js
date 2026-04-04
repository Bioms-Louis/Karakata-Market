import { create } from 'zustand';

// Zustand store for authentication state
// This is accessible from ANY component without prop drilling
const useAuthStore = create((set) => ({
  // Initial state — read from localStorage so state persists on refresh
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: localStorage.getItem('accessToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),

  // Actions
  login: (user, accessToken, refreshToken) => {
    // Save to localStorage for persistence across page refreshes
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    set({ user, accessToken, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  updateUser: (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  }
}));

export default useAuthStore;