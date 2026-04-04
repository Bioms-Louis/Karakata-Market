import { create } from 'zustand';

// Lightweight store just for cart UI state
// Actual cart data comes from the server via TanStack Query
const useCartStore = create((set) => ({
  isCartOpen: false,        // Controls cart drawer open/close
  cartItemCount: 0,         // Badge count on cart icon

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  setCartItemCount: (count) => set({ cartItemCount: count })
}));

export default useCartStore;