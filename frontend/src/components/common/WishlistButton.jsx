import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import useWishlistStore from '../../store/wishlistStore';
import { checkWishlisted, addToWishlist, removeFromWishlist } from '../../api/wishlist.api';
import toast from 'react-hot-toast';

const WishlistButton = ({ productId, size = 'md' }) => {
  const { isAuthenticated } = useAuthStore();
  const { incrementWishlist, decrementWishlist } = useWishlistStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  const btnSize  = size === 'sm' ? 32 : size === 'lg' ? 44 : 38;

  const { data: wishlisted = false, isLoading } = useQuery({
    queryKey: ['wishlist-check', productId],
    queryFn: async () => {
      const res = await checkWishlisted(productId);
      return res.data?.data?.wishlisted ?? false;
    },
    enabled: isAuthenticated && !!productId,
    staleTime: 60_000,
  });

  const addMutation = useMutation({
    mutationFn: () => addToWishlist(productId),
    onMutate: () => {
      queryClient.setQueryData(['wishlist-check', productId], true);
      incrementWishlist();
    },
    onSuccess: () => {
      toast.success('Added to wishlist');
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: () => {
      queryClient.setQueryData(['wishlist-check', productId], false);
      decrementWishlist();
      toast.error('Failed to add to wishlist');
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeFromWishlist(productId),
    onMutate: () => {
      queryClient.setQueryData(['wishlist-check', productId], false);
      decrementWishlist();
    },
    onSuccess: () => {
      toast.success('Removed from wishlist');
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-check', productId] });
    },
    onError: () => {
      queryClient.setQueryData(['wishlist-check', productId], true);
      incrementWishlist();
      toast.error('Failed to remove from wishlist');
    },
  });

  const isPending = addMutation.isPending || removeMutation.isPending;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please sign in to save items');
      return navigate('/login');
    }
    if (isPending) return;

    if (wishlisted) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isPending}
      title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      style={{
        background:    wishlisted ? '#fff0f0' : 'rgba(255,255,255,0.9)',
        border:        `1.5px solid ${wishlisted ? '#ff4d4d' : '#e0d6f0'}`,
        color:         wishlisted ? '#ff4d4d' : '#9a7dc0',
        borderRadius:  '50%',
        width:         btnSize,
        height:        btnSize,
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
        cursor:        isPending ? 'wait' : 'pointer',
        transition:    'all 0.2s ease',
        flexShrink:    0,
      }}
      onMouseEnter={(e) => {
        if (!wishlisted && !isPending) {
          e.currentTarget.style.background    = '#fff0f0';
          e.currentTarget.style.borderColor   = '#ff4d4d';
          e.currentTarget.style.color         = '#ff4d4d';
        }
      }}
      onMouseLeave={(e) => {
        if (!wishlisted) {
          e.currentTarget.style.background    = 'rgba(255,255,255,0.9)';
          e.currentTarget.style.borderColor   = '#e0d6f0';
          e.currentTarget.style.color         = '#9a7dc0';
        }
      }}
    >
      <Heart
        size={iconSize}
        fill={wishlisted ? '#ff4d4d' : 'none'}
        stroke="currentColor"
        style={{ transition: 'all 0.2s ease' }}
      />
    </button>
  );
};

export default WishlistButton;