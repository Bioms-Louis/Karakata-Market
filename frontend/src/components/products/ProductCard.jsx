import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { addToCart } from '../../api/cart.api';
import { addToWishlist, removeFromWishlist, checkWishlisted } from '../../api/wishlist.api';
import { formatCurrency } from '../../utils/formatCurrency';
import useAuthStore from '../../store/authStore';
import useWishlistStore from '../../store/wishlistStore';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const { isAuthenticated } = useAuthStore();
  const { incrementWishlist, decrementWishlist } = useWishlistStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Cart
  const addToCartMutation = useMutation({
    mutationFn: () => addToCart({ productId: product.id, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add to cart.');
    }
  });

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    addToCartMutation.mutate();
  };

  // Wishlist
  const { data: wishlisted = false } = useQuery({
    queryKey: ['wishlist-check', product.id],
    queryFn: async () => {
      const res = await checkWishlisted(product.id);
      return res.data?.data?.wishlisted ?? false;
    },
    enabled: isAuthenticated && !!product.id,
    staleTime: 60_000,
  });

  const addWishlistMutation = useMutation({
    mutationFn: () => addToWishlist(product.id),
    onMutate: () => {
      queryClient.setQueryData(['wishlist-check', product.id], true);
      incrementWishlist();
    },
    onSuccess: () => {
      toast.success('Added to wishlist');
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: () => {
      queryClient.setQueryData(['wishlist-check', product.id], false);
      decrementWishlist();
      toast.error('Failed to add to wishlist');
    },
  });

  const removeWishlistMutation = useMutation({
    mutationFn: () => removeFromWishlist(product.id),
    onMutate: () => {
      queryClient.setQueryData(['wishlist-check', product.id], false);
      decrementWishlist();
    },
    onSuccess: () => {
      toast.success('Removed from wishlist');
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-check', product.id] });
    },
    onError: () => {
      queryClient.setQueryData(['wishlist-check', product.id], true);
      incrementWishlist();
      toast.error('Failed to remove from wishlist');
    },
  });

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please sign in to save items');
      navigate('/login');
      return;
    }
    if (wishlisted) {
      removeWishlistMutation.mutate();
    } else {
      addWishlistMutation.mutate();
    }
  };

  // Discount
  const hasDiscount = product.discount_price &&
    parseFloat(product.discount_price) < parseFloat(product.base_price);

  const discountPercent = hasDiscount
    ? Math.round(
        (1 - parseFloat(product.discount_price) /
             parseFloat(product.base_price)) * 100
      )
    : 0;

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group bg-white rounded-2xl border border-gray-100
                 shadow-sm hover:shadow-md transition-all duration-200
                 overflow-hidden flex flex-col"
    >
      {/* Image area */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105
                       transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
               style={{ backgroundColor: '#f5f0fa' }}>
            <ShoppingCart size={32} style={{ color: '#3c1a5b' }} className="opacity-30" />
          </div>
        )}

        {/* Discount badge — top left */}
        {hasDiscount && (
          <span className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded-lg"
                style={{ backgroundColor: '#ef4444' }}>
            -{discountPercent}%
          </span>
        )}

        {/* Wishlist heart — top right, ALWAYS visible */}
        <button
          onClick={handleWishlist}
          disabled={addWishlistMutation.isPending || removeWishlistMutation.isPending}
          title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2 right-2 p-1.5 rounded-full
                     transition-all duration-200 hover:scale-110
                     disabled:opacity-50"
          style={{
            backgroundColor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Heart
            size={18}
            fill={wishlisted ? '#ff4d4d' : 'none'}
            stroke={wishlisted ? '#ff4d4d' : '#aaa'}
            style={{ transition: 'all 0.2s ease' }}
          />
        </button>

        {/* Add to Cart — full-width bar, slides up on hover */}
        <div className="absolute bottom-0 left-0 right-0
                        translate-y-full group-hover:translate-y-0
                        transition-transform duration-200 ease-out">
          <button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
            className="w-full flex items-center justify-center gap-2
                       py-2.5 text-sm font-bold text-white
                       disabled:opacity-70 transition-opacity"
            style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
          >
            <ShoppingCart size={15} />
            {addToCartMutation.isPending ? 'Adding...' : 'Add to cart'}
          </button>
        </div>
      </div>

      {/* Product info */}
      <div className="p-3 flex flex-col flex-1">

        {/* Vendor name */}
        {product.vendor_name && (
          <p className="text-xs text-gray-400 mb-1 truncate uppercase tracking-wide">
            {product.vendor_name}
          </p>
        )}

        {/* Product name */}
        <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 flex-1">
          {product.name}
        </p>

        {/* Price row */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-bold text-sm" style={{ color: '#3c1a5b' }}>
            {formatCurrency(hasDiscount ? product.discount_price : product.base_price)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(product.base_price)}
              </span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: '#fff3e0', color: '#e65100' }}>
                -{discountPercent}%
              </span>
            </>
          )}
        </div>

        {/* Rating */}
        {product.review_count > 0 && (
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(star => (
              <Star
                key={star}
                size={11}
                fill={star <= Math.round(parseFloat(product.average_rating)) ? '#ffc70e' : '#e5e7eb'}
                stroke="none"
              />
            ))}
            <span className="text-xs text-gray-400 ml-1">
              ({product.review_count})
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;