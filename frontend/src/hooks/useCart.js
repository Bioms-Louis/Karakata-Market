import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import { getCart } from '../api/cart.api';

const useCartSync = () => {
  const { isAuthenticated } = useAuthStore();
  const { setCartItemCount } = useCartStore();

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    select: (res) => res.data.data,
    enabled: isAuthenticated, 
    staleTime: 0,   
    refetchInterval: 60000,  
  });

  useEffect(() => {
    const count = cartData?.items?.reduce(
      (sum, item) => sum + (item.quantity || 0), 0
    ) ?? 0;
    setCartItemCount(count);
  }, [cartData, setCartItemCount]);
};

export default useCartSync;