import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useGuestCartStore from '../store/guestCartStore';
import { getCart } from '../api/cart.api';

const useCartSync = () => {
  const { isAuthenticated } = useAuthStore();
  const { setCartItemCount } = useCartStore();
  const guestItemCount = useGuestCartStore((s) => s.getItemCount());

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    select: (res) => res.data.data,
    enabled: isAuthenticated,
    staleTime: 0,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (isAuthenticated) {
      const count = cartData?.items?.reduce(
        (sum, item) => sum + (item.quantity || 0), 0
      ) ?? 0;
      setCartItemCount(count);
    } else {
      setCartItemCount(guestItemCount);
    }
  }, [isAuthenticated, cartData, guestItemCount, setCartItemCount]);
};

export default useCartSync;