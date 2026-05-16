import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Guest cart store — persisted to localStorage for unauthenticated users.
// Items include a product snapshot so the cart page can display them without
// hitting the server.
const useGuestCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        // item: { productId, variantId, quantity, productName, productSlug,
        //         productImage, vendorName, unitPrice, stockQuantity,
        //         variantName, variantStock }
        const items = get().items;
        const existing = items.find(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );
        if (existing) {
          const maxStock = item.variantId
            ? (item.variantStock ?? item.stockQuantity)
            : item.stockQuantity;
          const newQty = Math.min(existing.quantity + item.quantity, maxStock);
          set({
            items: items.map((i) =>
              i.productId === item.productId && i.variantId === item.variantId
                ? { ...i, quantity: newQty }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, guestItemId: `${item.productId}-${item.variantId ?? 'null'}-${Date.now()}` }] });
        }
      },

      updateQuantity: (guestItemId, quantity) => {
        set({
          items: get().items.map((i) =>
            i.guestItemId === guestItemId ? { ...i, quantity } : i
          ),
        });
      },

      removeItem: (guestItemId) => {
        set({ items: get().items.filter((i) => i.guestItemId !== guestItemId) });
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'guest-cart' }
  )
);

export default useGuestCartStore;
