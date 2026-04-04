import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Star, ChevronRight, Minus,
  Plus, Shield, Truck, RefreshCw, Store,
  Heart, CheckCircle, Send, MessageSquare
} from 'lucide-react';
import { getProduct, getProducts } from '../../api/products.api';
import { getProductReviews, createReview } from '../../api/reviews.api';
import { addToCart } from '../../api/cart.api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import useAuthStore from '../../store/authStore';
import Spinner from '../../components/common/Spinner';
import WishlistButton from '../../components/common/WishlistButton';
import ProductCard from '../../components/products/ProductCard';

// STAR RATING DISPLAY
const StarRating = ({ rating, size = 16, showCount, count }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg key={star} width={size} height={size} viewBox="0 0 24 24"
        fill={star <= Math.round(rating) ? '#ffc70e' : 'none'}
        stroke={star <= Math.round(rating) ? '#ffc70e' : '#d1d5db'}
        strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02
                         12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))}
    {showCount && (
      <span className="text-sm text-gray-500 ml-1">
        ({count} {count === 1 ? 'review' : 'reviews'})
      </span>
    )}
  </div>
);

// INTERACTIVE STAR PICKER (for review form)
const StarPicker = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-125"
          >
            <svg width={32} height={32} viewBox="0 0 24 24"
              fill={(hovered || value) >= star ? '#ffc70e' : 'none'}
              stroke={(hovered || value) >= star ? '#ffc70e' : '#d1d5db'}
              strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02
                               12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
        {(hovered || value) > 0 && (
          <span className="ml-2 text-sm font-semibold" style={{ color: '#3c1a5b' }}>
            {labels[hovered || value]}
          </span>
        )}
      </div>
    </div>
  );
};

// WRITE REVIEW FORM
const WriteReviewForm = ({ productId, onSuccess }) => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [rating, setRating]   = useState(0);
  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [open, setOpen]       = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => createReview({ productId, rating, title, body }),
    onSuccess: () => {
      toast.success('Review submitted! Thank you.');
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      setRating(0); setTitle(''); setBody(''); setOpen(false);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    },
  });

  const handleSubmit = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to leave a review.');
      return navigate('/login');
    }
    if (rating === 0) return toast.error('Please select a star rating.');
    if (!body.trim()) return toast.error('Please write your review.');
    mutate();
  };

  if (!open) {
    return (
      <button
        onClick={() => {
          if (!isAuthenticated) {
            toast.error('Please sign in to leave a review.');
            return navigate('/login');
          }
          setOpen(true);
        }}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold
                   text-sm transition-all hover:opacity-90 hover:scale-105"
        style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
      >
        <MessageSquare size={16} />
        Write a Review
      </button>
    );
  }

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 mt-4">
      <h3 className="text-base font-bold text-gray-900 mb-4">Your Review</h3>

      {/* Star picker */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Rating *</p>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Review Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarise your experience (optional)"
          maxLength={100}
          className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200
                     text-sm outline-none focus:border-purple-400
                     transition-colors bg-white"
        />
      </div>

      {/* Body */}
      <div className="mb-5">
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Review *
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share what you liked or didn't like about this product..."
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200
                     text-sm outline-none focus:border-purple-400
                     transition-colors bg-white resize-none"
        />
        <p className="text-xs text-gray-400 text-right mt-1">
          {body.length}/1000
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl
                     font-bold text-sm transition-all hover:opacity-90
                     disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#3c1a5b', color: 'white' }}
        >
          <Send size={14} />
          {isPending ? 'Submitting...' : 'Submit Review'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-6 py-2.5 rounded-xl font-bold text-sm border-2
                     border-gray-200 text-gray-600 hover:bg-gray-100
                     transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// IMAGE GALLERY
const ImageGallery = ({ images, productName }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const displayImages = images?.length > 0
    ? images : [{ image_url: null, alt_text: productName }];
  const selectedImage = displayImages[selectedIndex];

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
        {selectedImage?.image_url ? (
          <img src={selectedImage.image_url}
               alt={selectedImage.alt_text || productName}
               className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
               style={{ backgroundColor: '#f5f0fa' }}>
            <ShoppingCart size={64} style={{ color: '#3c1a5b' }} className="opacity-20" />
          </div>
        )}
      </div>
      {displayImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {displayImages.map((img, index) => (
            <button key={index} onClick={() => setSelectedIndex(index)}
              className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all
                ${selectedIndex === index ? 'scale-105' : 'border-gray-200 opacity-70 hover:opacity-100'}`}
              style={selectedIndex === index ? { borderColor: '#3c1a5b' } : {}}>
              {img.image_url
                ? <img src={img.image_url} alt={img.alt_text || `Image ${index + 1}`}
                       className="w-full h-full object-cover" />
                : <div className="w-full h-full" style={{ backgroundColor: '#f5f0fa' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// VARIANT SELECTOR
const COLOR_MAP = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
  black: '#111827', white: '#f9fafb', gray: '#9ca3af', grey: '#9ca3af',
  pink: '#ec4899', purple: '#a855f7', orange: '#f97316', brown: '#92400e',
  navy: '#1e3a5f', 'navy blue': '#1e3a5f', ivory: '#fffff0', beige: '#f5f0dc',
  cream: '#fffdd0', maroon: '#800000', gold: '#fbbf24', silver: '#c0c0c0',
  cyan: '#06b6d4', teal: '#14b8a6', indigo: '#6366f1', lime: '#84cc16',
  coral: '#ff6b6b', rose: '#f43f5e', violet: '#8b5cf6',
};
const getColorSwatch = (colorName) => COLOR_MAP[colorName?.toLowerCase()] || null;

const VariantSelector = ({ variants, selectedVariant, onSelect }) => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize]   = useState(null);
  if (!variants || variants.length === 0) return null;

  const hasColorAttr = variants.some(v => v.attributes?.Color);
  const hasSizeAttr  = variants.some(v => v.attributes?.Size);

  if (hasColorAttr || hasSizeAttr) {
    const allColors = [...new Set(variants.map(v => v.attributes?.Color).filter(Boolean))];
    const allSizes  = [...new Set(variants.map(v => v.attributes?.Size).filter(Boolean))];
    const findVariant = (color, size) =>
      variants.find(v => v.attributes?.Color === color && v.attributes?.Size === size);
    const sizesForColor = (color) => color
      ? [...new Set(variants.filter(v => v.attributes?.Color === color && v.attributes?.Size).map(v => v.attributes.Size))]
      : allSizes;
    const colorsForSize = (size) => size
      ? [...new Set(variants.filter(v => v.attributes?.Size === size && v.attributes?.Color).map(v => v.attributes.Color))]
      : allColors;

    const handleColorClick = (color) => {
      setSelectedColor(color);
      if (allSizes.length === 0) { onSelect(variants.find(v => v.attributes?.Color === color) || null); return; }
      const keepSize = sizesForColor(color).includes(selectedSize) ? selectedSize : null;
      setSelectedSize(keepSize);
      onSelect(keepSize ? findVariant(color, keepSize) || null : null);
    };
    const handleSizeClick = (size) => {
      setSelectedSize(size);
      const keepColor = colorsForSize(size).includes(selectedColor) ? selectedColor : null;
      setSelectedColor(keepColor);
      onSelect(keepColor ? findVariant(keepColor, size) || null : null);
    };

    const colorOutOfStock         = (c) => variants.filter(v => v.attributes?.Color === c).every(v => v.stock_quantity === 0);
    const sizeOutOfStock          = (s) => variants.filter(v => v.attributes?.Size === s).every(v => v.stock_quantity === 0);
    const sizeUnavailableForColor = (s) => !!selectedColor && !sizesForColor(selectedColor).includes(s);
    const colorUnavailableForSize = (c) => !!selectedSize && !colorsForSize(selectedSize).includes(c);
    const fullySelected = selectedColor && (allSizes.length === 0 || selectedSize);

    return (
      <div className="space-y-5">
        {allSizes.length > 0 && (
          <div>
            <p className="text-sm font-bold text-gray-800 mb-3">
              Size: {selectedSize && <span className="font-normal text-gray-500 ml-2">{selectedSize}</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {allSizes.map((size) => {
                const isSelected  = selectedSize === size;
                const outOfStock  = sizeOutOfStock(size);
                const unavailable = sizeUnavailableForColor(size);
                return (
                  <button key={size} onClick={() => !outOfStock && handleSizeClick(size)}
                    disabled={outOfStock}
                    className={`min-w-12 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all
                      ${isSelected ? 'text-white shadow-md scale-105'
                        : outOfStock ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                        : unavailable ? 'border-gray-200 text-gray-400 opacity-50'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400 hover:scale-105'}`}
                    style={isSelected ? { backgroundColor: '#3c1a5b', borderColor: '#3c1a5b' } : {}}>
                    {size}
                  </button>
                );
              })}
            </div>
            {!selectedSize && <p className="mt-2 text-xs text-orange-500 font-medium">Please select a size</p>}
          </div>
        )}
        {allColors.length > 0 && (
          <div>
            <p className="text-sm font-bold text-gray-800 mb-3">
              Color: {selectedColor && <span className="font-normal text-gray-500 ml-2">{selectedColor}</span>}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {allColors.map((color) => {
                const swatch      = getColorSwatch(color);
                const isSelected  = selectedColor === color;
                const outOfStock  = colorOutOfStock(color);
                const unavailable = colorUnavailableForSize(color);
                return (
                  <button key={color} onClick={() => !outOfStock && handleColorClick(color)}
                    disabled={outOfStock} title={color}
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all
                      ${isSelected ? 'text-white shadow-md scale-105'
                        : outOfStock ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : unavailable ? 'border-gray-200 text-gray-400 opacity-50'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400 hover:scale-105'}`}
                    style={isSelected ? { backgroundColor: '#3c1a5b', borderColor: '#3c1a5b' } : {}}>
                    {swatch && (
                      <span className={`w-4 h-4 rounded-full shrink-0 border border-black/10 ${outOfStock ? 'opacity-30' : ''}`}
                            style={{ backgroundColor: swatch }} />
                    )}
                    {color}
                    {outOfStock && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-xl">
                        <span className="w-full h-px bg-gray-300 rotate-[-15deg] absolute" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {!selectedColor && <p className="mt-2 text-xs text-orange-500 font-medium">Please select a color</p>}
          </div>
        )}
        {selectedVariant && fullySelected && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl w-fit">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-700">
              {selectedVariant.stock_quantity} in stock for this combination
            </span>
          </div>
        )}
      </div>
    );
  }

  // Fallback generic attributes
  const attributeGroups = {};
  variants.forEach(variant => {
    if (variant.attributes) {
      Object.entries(variant.attributes).forEach(([key, value]) => {
        if (!attributeGroups[key]) attributeGroups[key] = new Set();
        attributeGroups[key].add(value);
      });
    }
  });
  return (
    <div className="space-y-4">
      {Object.entries(attributeGroups).map(([attrKey, values]) => (
        <div key={attrKey}>
          <p className="text-sm font-semibold text-gray-700 mb-2 capitalize">
            {attrKey}: {selectedVariant?.attributes?.[attrKey] && (
              <span className="font-normal text-gray-500 ml-1">{selectedVariant.attributes[attrKey]}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {[...values].map((value) => {
              const matchingVariant = variants.find(v => v.attributes?.[attrKey] === value);
              const isSelected  = selectedVariant?.attributes?.[attrKey] === value;
              const outOfStock  = matchingVariant?.stock_quantity === 0;
              return (
                <button key={value} onClick={() => !outOfStock && onSelect(matchingVariant)}
                  disabled={outOfStock}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all
                    ${isSelected ? 'text-white'
                      : outOfStock ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                      : 'border-gray-200 text-gray-700 hover:border-purple-300'}`}
                  style={isSelected ? { backgroundColor: '#3c1a5b', borderColor: '#3c1a5b' } : {}}>
                  {value}{outOfStock && ' (Out)'}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// REVIEWS SECTION
const ReviewsSection = ({ productId, averageRating, reviewCount }) => {
  const { isAuthenticated } = useAuthStore();
  const [ratingFilter, setRatingFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', productId, ratingFilter],
    queryFn: () => getProductReviews(productId, { rating: ratingFilter }),
    select: (res) => res.data.data,
  });

  const reviews   = data?.reviews || [];
  const breakdown = data?.ratingBreakdown || {};

  return (
    <div className="mt-2">
      {/* Header row with Write Review button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
        <WriteReviewForm productId={productId} />
      </div>

      {/* Rating summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center justify-center text-center
                          sm:border-r sm:border-gray-100 sm:pr-6 sm:min-w-32">
            <p className="text-5xl font-extrabold" style={{ color: '#3c1a5b' }}>
              {parseFloat(averageRating || 0).toFixed(1)}
            </p>
            <StarRating rating={averageRating} size={20} />
            <p className="text-sm text-gray-500 mt-1">
              {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </p>
          </div>
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = breakdown[star] || 0;
              const pct   = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
              return (
                <button key={star} onClick={() => setRatingFilter(ratingFilter === String(star) ? '' : String(star))}
                  className="flex items-center gap-3 w-full group">
                  <span className="text-xs font-medium text-gray-600 w-6 text-right shrink-0">{star}★</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                         style={{ width: `${pct}%`, backgroundColor: ratingFilter === String(star) ? '#3c1a5b' : '#ffc70e' }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8 shrink-0">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
        {ratingFilter && (
          <button onClick={() => setRatingFilter('')}
                  className="mt-4 text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
            ✕ Clear filter
          </button>
        )}
      </div>

      {/* Reviews list */}
      {isLoading ? <Spinner center /> : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <p className="text-3xl mb-3">💬</p>
          <p className="text-gray-500 text-sm mb-4">
            {reviewCount === 0 ? 'No reviews yet. Be the first to review!' : 'No reviews match this filter.'}
          </p>
          {reviewCount === 0 && !isAuthenticated && (
            <p className="text-xs text-gray-400">Sign in to leave a review</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center
                                  text-white text-sm font-bold shrink-0"
                       style={{ backgroundColor: '#3c1a5b' }}>
                    {review.first_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {review.first_name} {review.last_name}
                      </p>
                      {review.is_verified && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle size={12} /> Verified Purchase
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                  </div>
                </div>
                <StarRating rating={review.rating} size={14} />
              </div>
              {review.title && <p className="font-semibold text-gray-800 mb-1 text-sm">{review.title}</p>}
              {review.body && <p className="text-gray-600 text-sm leading-relaxed">{review.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// MAIN PRODUCT DETAIL PAGE
const ProductDetailPage = () => {
  const { slug }     = useParams();
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const [quantity, setQuantity]               = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const { data: productData, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug),
    select: (res) => res.data.data.product,
  });

  const product = productData;

  // ── Track recently viewed ─────────────────
  useEffect(() => {
    if (!product?.id) return;
    try {
      const key = 'recently_viewed';
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      // Remove current product if already in list, then prepend
      const updated = [
        { id: product.id, slug: product.slug },
        ...stored.filter(p => p.id !== product.id)
      ].slice(0, 10); // keep last 10
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {}
  }, [product?.id]);

  // ── Fetch recently viewed products ────────
  const recentIds = (() => {
    try {
      return JSON.parse(localStorage.getItem('recently_viewed') || '[]')
        .filter(p => p.slug && p.slug !== slug)
        .slice(0, 5)
        .map(p => p.slug);
    } catch { return []; }
  })();

  const { data: recentProducts = [] } = useQuery({
    queryKey: ['recently-viewed', recentIds.join(',')],
    queryFn: async () => {
      if (recentIds.length === 0) return { data: { data: { products: [] } } };
      // Fetch each by slug in parallel
      const results = await Promise.all(
        recentIds.map(s => getProduct(s).catch(() => null))
      );
      return { data: { data: { products: results.filter(Boolean).map(r => r.data?.data?.product).filter(Boolean) } } };
    },
      select: (res) => res.data.data.products.map(p => ({
        ...p,
        primary_image: p.images?.find(img => img.is_primary)?.image_url
          || p.images?.[0]?.image_url
          || null
      })),
  });

  const { data: vendorProducts = [] } = useQuery({
    queryKey: ['vendor-products-preview', product?.vendor_id],
    queryFn: () => getProducts({ vendor: product.vendor_id, limit: 6 }),
    select: (res) => res.data.data.products.filter(p => p.id !== product?.id).slice(0, 5),
    enabled: !!product?.vendor_id,
  });

  const addToCartMutation = useMutation({
    mutationFn: () => addToCart({
      productId: product.id,
      variantId: selectedVariant?.id || null,
      quantity,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success(`${product.name} added to cart!`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add to cart.');
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (product.variants?.length > 0 && !selectedVariant) {
      const hasColors = product.variants.some(v => v.attributes?.Color);
      const hasSizes  = product.variants.some(v => v.attributes?.Size);
      if (hasColors && hasSizes) toast.error('Please select a color and size.');
      else if (hasColors)        toast.error('Please select a color.');
      else                       toast.error('Please select a variant.');
      return;
    }
    addToCartMutation.mutate();
  };

  const handleBuyNow = () => {
    handleAddToCart();
    if (isAuthenticated) navigate('/cart');
  };

  if (isLoading) return <Spinner center />;
  if (isError) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl mb-4">😕</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Product not found</h2>
        <Link to="/products" className="text-sm font-medium hover:underline" style={{ color: '#3c1a5b' }}>
          ← Back to products
        </Link>
      </div>
    </div>
  );

  if (!product) return null;

  const hasDiscount = product.discount_price &&
    parseFloat(product.discount_price) < parseFloat(product.base_price);
  const discountPercent = hasDiscount
    ? Math.round((1 - parseFloat(product.discount_price) / parseFloat(product.base_price)) * 100)
    : 0;
  const currentPrice   = selectedVariant?.price ?? (hasDiscount ? product.discount_price : product.base_price);
  const availableStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
  const isOutOfStock   = availableStock === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link to="/products" className="hover:text-gray-900 transition-colors">Products</Link>
          {product.category_name && (
            <>
              <ChevronRight size={14} />
              <Link to={`/products?category=${product.category_slug}`}
                    className="hover:text-gray-900 transition-colors">
                {product.category_name}
              </Link>
            </>
          )}
          <ChevronRight size={14} />
          <span className="text-gray-900 truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Main card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Image Gallery */}
            <ImageGallery images={product.images} productName={product.name} />

            {/* Product Info */}
            <div className="flex flex-col">

              {product.vendor_name && (
                <Link to={`/vendors/${product.vendor_id}`}
                      className="flex items-center gap-1.5 text-sm font-medium mb-3 hover:underline w-fit"
                      style={{ color: '#3c1a5b' }}>
                  <Store size={14} />
                  {product.vendor_name}
                </Link>
              )}

              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                {product.name}
              </h1>

              {product.review_count > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <StarRating rating={product.average_rating} size={18} showCount count={product.review_count} />
                  <span className="text-gray-300">|</span>
                  <span className="text-sm text-gray-500">{product.total_sold} sold</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-extrabold" style={{ color: '#3c1a5b' }}>
                  {formatCurrency(currentPrice)}
                </span>
                {hasDiscount && !selectedVariant && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      {formatCurrency(product.base_price)}
                    </span>
                    <span className="px-2 py-1 text-xs font-bold text-white rounded-lg"
                          style={{ backgroundColor: '#ef4444' }}>
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>
              {hasDiscount && !selectedVariant && (
                <p className="text-green-600 text-sm font-medium mb-4">
                  You save {formatCurrency(parseFloat(product.base_price) - parseFloat(product.discount_price))}!
                </p>
              )}

              {product.short_description && (
                <p className="text-gray-600 text-sm leading-relaxed mb-5">
                  {product.short_description}
                </p>
              )}

              {/* Variants */}
              {product.variants?.length > 0 && (
                <div className="mb-5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <VariantSelector variants={product.variants} selectedVariant={selectedVariant} onSelect={setSelectedVariant} />
                </div>
              )}

              {/* Stock */}
              <div className="flex items-center gap-2 mb-5">
                <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : availableStock < 10 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                <span className={`text-sm font-medium ${isOutOfStock ? 'text-red-600' : availableStock < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {isOutOfStock ? 'Out of Stock' : availableStock < 10 ? `Only ${availableStock} left in stock!` : 'In Stock'}
                </span>
              </div>

              {/* Quantity */}
              {!isOutOfStock && (
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="px-3 py-2 hover:bg-gray-50 transition-colors">
                      <Minus size={16} className="text-gray-600" />
                    </button>
                    <span className="px-4 py-2 text-sm font-bold text-gray-900 min-w-12 text-center border-x-2 border-gray-200">
                      {quantity}
                    </span>
                    <button onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                            className="px-3 py-2 hover:bg-gray-50 transition-colors">
                      <Plus size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons — WishlistButton directly */}
              <div className="flex gap-3 mb-6">
                <button onClick={handleAddToCart}
                  disabled={isOutOfStock || addToCartMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6
                             rounded-xl font-bold text-sm border-2 transition-all
                             hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: '#3c1a5b', color: '#3c1a5b' }}>
                  <ShoppingCart size={18} />
                  {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                </button>

                <button onClick={handleBuyNow} disabled={isOutOfStock}
                  className="flex-1 py-3.5 px-6 rounded-xl font-bold text-sm
                             transition-all hover:opacity-90
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}>
                  Buy Now
                </button>

                {/* WishlistButton button */}
                <WishlistButton productId={product.id} size="lg" />
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl">
                {[
                  { icon: <Shield size={16} />,    text: 'Secure Payment' },
                  { icon: <Truck size={16} />,     text: 'Fast Delivery' },
                  { icon: <RefreshCw size={16} />, text: 'Easy Returns' },
                ].map((badge) => (
                  <div key={badge.text} className="flex flex-col items-center gap-1 text-center">
                    <div style={{ color: '#3c1a5b' }}>{badge.icon}</div>
                    <span className="text-xs text-gray-600 font-medium">{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Product Description</h2>
            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8">
          <ReviewsSection
            productId={product.id}
            averageRating={product.average_rating}
            reviewCount={product.review_count}
          />
        </div>
      </div>

      {/* More from this Vendor*/}
      {vendorProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                More from {product.vendor_name}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Other products by this seller
              </p>
            </div>
            <Link
              to={`/products?vendor=${product.vendor_id}`}
              className="text-sm font-semibold flex items-center gap-1 hover:opacity-80"
              style={{ color: '#3c1a5b' }}
            >
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {vendorProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {recentProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Recently Viewed
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Products you've looked at
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {recentProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;