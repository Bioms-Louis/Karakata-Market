import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Trash2, Plus, Minus, ShoppingBag,
  ArrowRight, Tag, Shield, Truck
} from 'lucide-react';
import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from '../../api/cart.api';
import { getShippingFee } from '../../api/orders.api';
import { formatCurrency } from '../../utils/formatCurrency';
import Spinner from '../../components/common/Spinner';   

// SINGLE CART ITEM ROW
const CartItem = ({ item, onUpdateQuantity, onRemove, isUpdating }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const maxStock = item.variant_id ? (item.variant_stock ?? item.stock_quantity) : item.stock_quantity;

  const handleQuantityChange = (newQty) => {
    if (newQty < 1 || newQty > maxStock) return;
    setQuantity(newQty);
    onUpdateQuantity(item.id, newQty);
  };

  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl border
                    border-gray-100 shadow-sm">

      {/* Product Image */}
      <Link
        to={`/products/${item.product_slug}`}
        className="shrink-0 w-24 h-24 rounded-xl overflow-hidden
                   bg-gray-50 border border-gray-100"
      >
        {item.product_image ? (
          <img
            src={item.product_image}
            alt={item.product_name}
            className="w-full h-full object-cover hover:scale-105
                       transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
               style={{ backgroundColor: '#f5f0fa' }}>
            <ShoppingBag size={24} style={{ color: '#3c1a5b' }}
                         className="opacity-30" />
          </div>
        )}
      </Link>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-2">
          <div className="min-w-0">
            {/* Vendor */}
            <p className="text-xs font-medium mb-0.5 truncate"
               style={{ color: '#3c1a5b' }}>
              {item.vendor_name}
            </p>

            {/* Product Name */}
            <Link
              to={`/products/${item.product_slug}`}
              className="text-sm font-semibold text-gray-900 hover:underline
                         line-clamp-2 block"
            >
              {item.product_name}
            </Link>

            {/* Variant */}
            {item.variant_name && (
              <p className="text-xs text-gray-500 mt-0.5">
                Variant: {item.variant_name}
              </p>
            )}
          </div>

          {/* Remove Button */}
          <button
            onClick={() => onRemove(item.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500
                       hover:bg-red-50 transition-colors shrink-0"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Bottom Row — Price & Quantity */}
        <div className="flex items-center justify-between mt-3">

          {/* Quantity Controls */}
          <div className="flex items-center border border-gray-200
                          rounded-xl overflow-hidden">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1 || isUpdating}
              className="px-2.5 py-1.5 hover:bg-gray-50 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus size={14} className="text-gray-600" />
            </button>
            <span className="px-3 py-1.5 text-sm font-bold text-gray-900
                             border-x border-gray-200 min-w-10 text-center">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= maxStock || isUpdating}
              className="px-2.5 py-1.5 hover:bg-gray-50 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={14} className="text-gray-600" />
            </button>
          </div>

          {/* Item Total */}
          <div className="text-right">
            <p className="text-base font-bold" style={{ color: '#3c1a5b' }}>
              {formatCurrency(
                parseFloat(item.unit_price) * quantity
              )}
            </p>
            {quantity > 1 && (
              <p className="text-xs text-gray-400">
                {formatCurrency(item.unit_price)} each
              </p>
            )}
          </div>
        </div>

        {/* Stock Warning */}
        {maxStock < 10 && maxStock > 0 && (
          <p className="text-xs text-orange-500 font-medium mt-2">
            ⚠️ Only {maxStock} left in stock
          </p>
        )}
      </div>
    </div>
  );
};

// ORDER SUMMARY CARD
const OrderSummary = ({ summary, onCheckout, isCheckingOut, shippingFee = 0 }) => {
  const total = (summary?.subtotal || 0) + shippingFee;

  return (
    <div className="bg-white rounded-2xl border border-gray-100
                    shadow-sm p-5 sticky top-24">
      <h2 className="text-lg font-bold text-gray-900 mb-5">
        Order Summary
      </h2>

      {/* Line Items */}
      <div className="space-y-3 mb-5">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Subtotal ({summary?.totalQuantity || 0}{' '}
            {summary?.totalQuantity === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium">
            {formatCurrency(summary?.subtotal || 0)}
          </span>
        </div>

        <div className="flex justify-between text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Truck size={14} />
            Shipping fee
          </span>
          <span className="font-medium">
            {formatCurrency(shippingFee)}
          </span>
        </div>

        <div className="border-t border-gray-100 pt-3 flex justify-between">
          <span className="font-bold text-gray-900">Total</span>
          <span className="font-extrabold text-lg"
                style={{ color: '#3c1a5b' }}>
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        disabled={isCheckingOut || !summary?.itemCount}
        className="w-full py-4 rounded-xl font-bold text-sm
                   flex items-center justify-center gap-2
                   transition-all hover:opacity-90 hover:scale-105
                   disabled:opacity-50 disabled:cursor-not-allowed
                   disabled:scale-100"
        style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
      >
        Proceed to Checkout
        <ArrowRight size={18} />
      </button>

      {/* Trust Indicators */}
      <div className="mt-4 flex items-center justify-center gap-2
                      text-xs text-gray-400">
        <Shield size={12} />
        <span>Secured by Paystack</span>
      </div>

      {/* Continue Shopping */}
      <Link
        to="/products"
        className="mt-3 block text-center text-sm font-medium
                   hover:underline transition-colors"
        style={{ color: '#3c1a5b' }}
      >
        ← Continue Shopping
      </Link>
    </div>
  );
};

// EMPTY CART STATE
const EmptyCart = () => (
  <div className="flex flex-col items-center justify-center
                  py-20 text-center">
    <div className="w-24 h-24 rounded-full flex items-center
                    justify-center mb-6"
         style={{ backgroundColor: '#f5f0fa' }}>
      <ShoppingBag size={40} style={{ color: '#3c1a5b' }}
                   className="opacity-50" />
    </div>
    <h2 className="text-xl font-bold text-gray-900 mb-2">
      Your cart is empty
    </h2>
    <p className="text-gray-500 text-sm mb-8 max-w-xs">
      Looks like you haven't added anything yet.
      Start shopping and find great deals!
    </p>
    <Link
      to="/products"
      className="inline-flex items-center gap-2 px-8 py-3.5
                 rounded-xl font-bold text-sm transition-all
                 hover:opacity-90 hover:scale-105"
      style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
    >
      <ShoppingBag size={18} />
      Start Shopping
    </Link>
  </div>
);

// MAIN CART PAGE
const CartPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch cart data
  const { data: shippingFee = 1500 } = useQuery({
    queryKey: ['shipping-fee'],
    queryFn: getShippingFee,
    select: (res) => res.data.data.shippingFee,
    staleTime: 10 * 60 * 1000,
  });

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    select: (res) => res.data.data
  });

  // Update quantity mutation
  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }) => updateCartItem(itemId, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update quantity.');
    }
  });

  // Remove item mutation
  const removeMutation = useMutation({
    mutationFn: (itemId) => removeCartItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed from cart.');
    },
    onError: () => {
      toast.error('Failed to remove item.');
    }
  });

  // Clear cart mutation
  const clearMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart cleared.');
    }
  });

  const handleUpdateQuantity = (itemId, quantity) => {
    updateMutation.mutate({ itemId, quantity });
  };

  const handleRemoveItem = (itemId) => {
    removeMutation.mutate(itemId);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (isLoading) return <Spinner center />;

  const items = cartData?.items || [];
  const summary = cartData?.summary;
  const isEmpty = items.length === 0;

  const itemsByVendor = items.reduce((groups, item) => {
    const vendorName = item.vendor_name || 'Unknown Vendor';
    if (!groups[vendorName]) groups[vendorName] = [];
    groups[vendorName].push(item);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Shopping Cart
            </h1>
            {!isEmpty && (
              <p className="text-gray-500 text-sm mt-1">
                {summary?.totalQuantity}{' '}
                {summary?.totalQuantity === 1 ? 'item' : 'items'} in your cart
              </p>
            )}
          </div>

          {/* Clear Cart */}
          {!isEmpty && (
            <button
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
              className="text-sm text-red-500 hover:text-red-700
                         font-medium flex items-center gap-1.5
                         transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
              Clear Cart
            </button>
          )}
        </div>

        {isEmpty ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Cart Items (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(itemsByVendor).map(([vendorName, vendorItems]) => (
                <div key={vendorName}>

                  {/* Vendor Header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-6 h-6 rounded-full flex items-center
                                    justify-center text-white text-xs font-bold"
                         style={{ backgroundColor: '#3c1a5b' }}>
                      {vendorName[0]}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {vendorName}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({vendorItems.length}{' '}
                      {vendorItems.length === 1 ? 'item' : 'items'})
                    </span>
                  </div>

                  {/* Vendor Items */}
                  <div className="space-y-3">
                    {vendorItems.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveItem}
                        isUpdating={updateMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Promo Code */}
              <div className="bg-white rounded-2xl border border-gray-100
                              shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3
                               flex items-center gap-2">
                  <Tag size={16} style={{ color: '#3c1a5b' }} />
                  Have a promo code?
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    className="flex-1 px-3 py-2.5 text-sm border border-gray-200
                               rounded-xl outline-none focus:ring-2
                               focus:ring-yellow-400 focus:border-transparent"
                  />
                  <button
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold
                               transition-colors"
                    style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Order Summary (1/3 width) */}
            <div className="lg:col-span-1">
              <OrderSummary
                summary={summary}
                onCheckout={handleCheckout}
                isCheckingOut={false}
                shippingFee={shippingFee}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
