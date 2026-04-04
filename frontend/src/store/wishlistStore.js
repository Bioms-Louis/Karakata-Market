import { create } from 'zustand';

const useWishlistStore = create((set) => ({
  wishlistCount: 0,
  setWishlistCount:   (count) => set({ wishlistCount: count }),
  incrementWishlist:  ()      => set((s) => ({ wishlistCount: s.wishlistCount + 1 })),
  decrementWishlist:  ()      => set((s) => ({ wishlistCount: Math.max(0, s.wishlistCount - 1) })),
}));

export default useWishlistStore;