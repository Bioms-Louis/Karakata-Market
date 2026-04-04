import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Heart, ShoppingCart, Trash2, ShoppingBag,
  ArrowRight, Store, AlertCircle
} from 'lucide-react';
import {
  getWishlist,
  removeFromWishlist} from '../../api/wishlist.api';
import { addToCart } from '../../api/cart.api';
import { formatCurrency } from '../../utils/formatCurrency';
import Spinner from '../../components/common/Spinner';
import useWishlistStore from '../../store/wishlistStore';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';

// ─────────────────────────────────────────────────────────────────────────────
// WISHLIST ITEM CARD
// ─────────────────────────────────────────────────────────────────────────────
const WishlistItem = ({ item, onRemove, onMoveToCart, isMoving }) => {
  const hasDiscount = item.discount_price &&
    parseFloat(item.discount_price) > 0 &&
    parseFloat(item.discount_price) < parseFloat(item.base_price);
  const displayPrice = hasDiscount
    ? parseFloat(item.discount_price)
    : parseFloat(item.base_price);
  const originalPrice = parseFloat(item.base_price);
  const isOutOfStock = item.stock_quantity === 0;
  const isInactive = item.is_active === false;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100
                    shadow-sm hover:shadow-md transition-all duration-200
                    overflow-hidden flex flex-col">

      {/* Product Image */}
      <Link
        to={`/products/${item.product_slug}`}
        className="relative block shrink-0 aspect-square
                   bg-gray-50 overflow-hidden"
      >
        {item.product_image ? (
          <img
            src={item.product_image}
            alt={item.product_name}
            className="w-full h-full object-cover group-hover:scale-105
                       transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
               style={{ backgroundColor: '#f5f0fa' }}>
            <ShoppingBag size={32} style={{ color: '#3c1a5b' }}
                         className="opacity-30" />
          </div>
        )}

        {/* Out of Stock / Inactive overlay */}
        {(isOutOfStock || isInactive) && (
          <div className="absolute inset-0 bg-black/40 flex items-center
                          justify-center">
            <span className="bg-white text-gray-800 text-xs font-bold
                             px-3 py-1.5 rounded-full">
              {isInactive ? 'Unavailable' : 'Out of Stock'}
            </span>
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && !isOutOfStock && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg
                          text-xs font-bold text-white"
               style={{ backgroundColor: '#3c1a5b' }}>
            {Math.round((1 - displayPrice / originalPrice) * 100)}% OFF
          </div>
        )}

        {/* Remove button (top-right) */}
        <button
          onClick={(e) => { e.preventDefault(); onRemove(item.product_id); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full
                     bg-white/90 flex items-center justify-center
                     text-gray-400 hover:text-red-500 hover:bg-white
                     transition-all shadow-sm opacity-0 group-hover:opacity-100"
          title="Remove from wishlist"
        >
          <Trash2 size={14} />
        </button>
      </Link>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1">

        {/* Vendor */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <Store size={11} style={{ color: '#3c1a5b' }} />
          <p className="text-xs font-medium truncate"
             style={{ color: '#3c1a5b' }}>
            {item.vendor_name}
          </p>
        </div>

        {/* Product name */}
        <Link
          to={`/products/${item.product_slug}`}
          className="text-sm font-semibold text-gray-900 hover:underline
                     line-clamp-2 mb-2 flex-1"
        >
          {item.product_name}
        </Link>

        {/* Short description */}
        {item.short_description && (
          <p className="text-xs text-gray-400 line-clamp-1 mb-3">
            {item.short_description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-base font-extrabold"
                style={{ color: '#3c1a5b' }}>
            {formatCurrency(displayPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {formatCurrency(originalPrice)}
            </span>
          )}
        </div>

        {/* Add to Cart / Out of Stock */}
        {isOutOfStock || isInactive ? (
          <div className="flex items-center gap-2 text-xs text-orange-500
                          font-medium bg-orange-50 px-3 py-2 rounded-xl">
            <AlertCircle size={13} />
            {isInactive ? 'Product unavailable' : 'Currently out of stock'}
          </div>
        ) : (
          <button
            onClick={() => onMoveToCart(item)}
            disabled={isMoving}
            className="w-full py-2.5 rounded-xl text-sm font-bold
                       flex items-center justify-center gap-2
                       transition-all hover:opacity-90 hover:scale-105
                       disabled:opacity-50 disabled:cursor-not-allowed
                       disabled:scale-100"
            style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
          >
            <ShoppingCart size={15} />
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
const EmptyWishlist = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
         style={{ backgroundColor: '#f5f0fa' }}>
      <Heart size={40} style={{ color: '#3c1a5b' }} className="opacity-40" />
    </div>
    <h2 className="text-xl font-bold text-gray-900 mb-2">
      Your wishlist is empty
    </h2>
    <p className="text-gray-500 text-sm mb-8 max-w-xs">
      Save items you love and come back to them later.
      Start exploring and tap the heart on any product!
    </p>
    <Link
      to="/products"
      className="inline-flex items-center gap-2 px-8 py-3.5
                 rounded-xl font-bold text-sm transition-all
                 hover:opacity-90 hover:scale-105"
      style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
    >
      <ShoppingBag size={18} />
      Discover Products
    </Link>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN WISHLIST PAGE
// ─────────────────────────────────────────────────────────────────────────────
const WishlistPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { setWishlistCount } = useWishlistStore();
  const { setCartItemCount } = useCartStore();

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/wishlist' } });
    }
  }, [isAuthenticated, navigate]);

  // ── Fetch wishlist ──────────────────────────────────────────────────────────
  const { data: wishlistData, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    select: (res) => res.data.data,
    enabled: isAuthenticated,
  });

  // Sync navbar badge to actual list length
  useEffect(() => {
    if (wishlistData?.items) {
      setWishlistCount(wishlistData.items.length);
    }
  }, [wishlistData, setWishlistCount]);

  // ── Remove from wishlist ────────────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: (productId) => removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-check'] });
      toast.success('Removed from wishlist.');
    },
    onError: () => toast.error('Failed to remove item.'),
  });

  // ── Add to cart (without removing from wishlist) ────────────────────────────
  const addToCartMutation = useMutation({
    mutationFn: ({ productId }) =>
      addToCart({ productId, quantity: 1 }),
    onSuccess: (res) => {
      // Invalidate cart to refresh badge
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const cartCount = res.data?.data?.summary?.totalQuantity;
      if (cartCount !== undefined) setCartItemCount(cartCount);
      toast.success('Added to cart!');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to add to cart.';
      // If product has variants, guide customer to product page
      if (msg.toLowerCase().includes('variant') || msg.toLowerCase().includes('select')) {
        toast.error('Please select a variant on the product page.');
      } else {
        toast.error(msg);
      }
    },
  });

  const handleMoveToCart = (item) => {
    addToCartMutation.mutate({ productId: item.product_id });
  };

  const handleRemove = (productId) => {
    removeMutation.mutate(productId);
  };

  if (!isAuthenticated) return null;
  if (isLoading) return <Spinner center />;

  const items = wishlistData?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Heart size={26} style={{ color: '#3c1a5b' }} />
              My Wishlist
            </h1>
            {!isEmpty && (
              <p className="text-gray-500 text-sm mt-1">
                {items.length} {items.length === 1 ? 'item' : 'items'} saved
              </p>
            )}
          </div>

          {!isEmpty && (
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5
                         rounded-xl text-sm font-semibold border-2
                         transition-all hover:scale-105"
              style={{ borderColor: '#3c1a5b', color: '#3c1a5b' }}
            >
              Continue Shopping
              <ArrowRight size={15} />
            </Link>
          )}
        </div>

        {/* ── Content ── */}
        {isEmpty ? (
          <EmptyWishlist />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
                          xl:grid-cols-5 gap-4">
            {items.map((item) => (
              <WishlistItem
                key={item.wishlist_id}
                item={item}
                onRemove={handleRemove}
                onMoveToCart={handleMoveToCart}
                isMoving={addToCartMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
