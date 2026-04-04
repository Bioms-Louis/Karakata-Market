import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Package, MapPin, CreditCard, ChevronLeft,
  Clock, CheckCircle, Truck, XCircle,
  RefreshCw, Star, AlertTriangle
} from 'lucide-react';
import { getOrder, cancelOrder } from '../../api/orders.api';
import { createReview } from '../../api/reviews.api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Spinner from '../../components/common/Spinner';
import { useForm } from 'react-hook-form';

// Reuse StatusBadge from OrdersPage
const statusConfig = {
  pending: { label: 'Pending', icon: <Clock size={14} />, bg: '#fef9c3', color: '#854d0e' },
  confirmed: { label: 'Confirmed', icon: <CheckCircle size={14} />, bg: '#dbeafe', color: '#1e40af' },
  processing: { label: 'Processing', icon: <RefreshCw size={14} />, bg: '#ede9fe', color: '#5b21b6' },
  shipped: { label: 'Shipped', icon: <Truck size={14} />, bg: '#dbeafe', color: '#1d4ed8' },
  delivered: { label: 'Delivered', icon: <CheckCircle size={14} />, bg: '#dcfce7', color: '#166534' },
  cancelled: { label: 'Cancelled', icon: <XCircle size={14} />, bg: '#fee2e2', color: '#991b1b' },
  refunded: { label: 'Refunded', icon: <RefreshCw size={14} />, bg: '#f3f4f6', color: '#374151' }
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5
                     rounded-full text-xs font-semibold"
          style={{ backgroundColor: config.bg, color: config.color }}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ─────────────────────────────────────────────
// ORDER TIMELINE
// ─────────────────────────────────────────────
const OrderTimeline = ({ status }) => {
  const steps = [
    { key: 'pending', label: 'Order Placed', desc: 'Your order has been received' },
    { key: 'confirmed', label: 'Confirmed', desc: 'Vendor confirmed your order' },
    { key: 'processing', label: 'Processing', desc: 'Your order is being prepared' },
    { key: 'shipped', label: 'Shipped', desc: 'Your order is on the way' },
    { key: 'delivered', label: 'Delivered', desc: 'Order delivered successfully' },
  ];

  const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentIndex = statusOrder.indexOf(status);

  if (['cancelled', 'refunded'].includes(status)) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
        <XCircle size={20} className="text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-800">
            Order {status === 'cancelled' ? 'Cancelled' : 'Refunded'}
          </p>
          <p className="text-xs text-red-600">
            This order has been {status}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="flex items-start gap-4">
            {/* Icon & Line */}
            <div className="flex flex-col items-center">
              <div
                className="w-9 h-9 rounded-full flex items-center
                           justify-center flex-shrink-0 transition-all"
                style={{
                  backgroundColor: isCompleted ? '#3c1a5b' : '#f3f4f6',
                  color: isCompleted ? '#fff' : '#9ca3af'
                }}
              >
                {isCompleted
                  ? <CheckCircle size={18} />
                  : <div className="w-2.5 h-2.5 rounded-full bg-current" />}
              </div>
              {index < steps.length - 1 && (
                <div
                  className="w-0.5 h-8 mt-1 transition-all"
                  style={{
                    backgroundColor: index < currentIndex
                      ? '#3c1a5b' : '#e5e7eb'
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-2 pt-1">
              <p className={`text-sm font-semibold ${
                isCompleted ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {step.label}
                {isCurrent && (
                  <span className="ml-2 text-xs font-medium px-2 py-0.5
                                   rounded-full text-white"
                        style={{ backgroundColor: '#3c1a5b' }}>
                    Current
                  </span>
                )}
              </p>
              <p className={`text-xs mt-0.5 ${
                isCompleted ? 'text-gray-500' : 'text-gray-300'
              }`}>
                {step.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
// REVIEW FORM
// ─────────────────────────────────────────────
const ReviewForm = ({ item, orderId, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm();

  const reviewMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      toast.success('Review submitted! Thank you.');
      queryClient.invalidateQueries({ queryKey: ['order'] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit review.');
    }
  });

  const onSubmit = (data) => {
    if (rating === 0) {
      toast.error('Please select a star rating.');
      return;
    }
    reviewMutation.mutate({
      productId: item.product_id,
      orderId,
      rating,
      title: data.title,
      body: data.body
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Review Product
        </h3>
        <p className="text-sm text-gray-500 mb-5 truncate">
          {item.product_name}
        </p>

        {/* Star Rating */}
        <div className="flex items-center gap-1 mb-5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={32}
                fill={(hovered || rating) >= star ? '#ffc70e' : 'none'}
                stroke={(hovered || rating) >= star ? '#ffc70e' : '#d1d5db'}
              />
            </button>
          ))}
          <span className="text-sm text-gray-500 ml-2">
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hovered || rating]}
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Review Title (optional)
            </label>
            <input
              type="text"
              placeholder="Summarize your experience"
              className="w-full px-4 py-3 rounded-xl border border-gray-200
                         bg-gray-50 text-sm outline-none focus:ring-2
                         focus:ring-yellow-400"
              {...register('title')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Your Review (optional)
            </label>
            <textarea
              rows={4}
              placeholder="Share your experience with this product..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200
                         bg-gray-50 text-sm outline-none focus:ring-2
                         focus:ring-yellow-400 resize-none"
              {...register('body')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium
                         border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reviewMutation.isPending}
              className="flex-1 py-3 rounded-xl text-sm font-bold
                         text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#3c1a5b' }}
            >
              {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN ORDER DETAIL PAGE
// ─────────────────────────────────────────────
const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reviewItem, setReviewItem] = useState(null);

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
    select: (res) => res.data.data.order
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled successfully.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel order.');
    }
  });

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelMutation.mutate();
    }
  };

  if (isLoading) return <Spinner center />;

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">📦</p>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Order not found
          </h2>
          <Link to="/orders"
                className="text-sm font-medium hover:underline"
                style={{ color: '#3c1a5b' }}>
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const order = orderData;
  const canCancel = order.status === 'pending';
  const canReview = order.status === 'delivered';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {order.order_number}
            </h1>
            <p className="text-xs text-gray-400">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
          <div className="ml-auto">
            <StatusBadge status={order.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column (2/3) ─────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Order Items */}
            <div className="bg-white rounded-2xl border border-gray-100
                            shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4
                             flex items-center gap-2">
                <Package size={18} style={{ color: '#3c1a5b' }} />
                Order Items
              </h2>

              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id}
                       className="flex items-center gap-4 pb-4 border-b
                                  border-gray-50 last:border-0 last:pb-0">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden
                                    bg-gray-100 flex-shrink-0">
                      {item.product_image ? (
                        <img src={item.product_image}
                             alt={item.product_name}
                             className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full"
                             style={{ backgroundColor: '#f5f0fa' }} />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900
                                    truncate">
                        {item.product_name}
                      </p>
                      {item.variant_name && (
                        <p className="text-xs text-gray-500">
                          {item.variant_name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {item.vendor_name} · Qty: {item.quantity}
                      </p>
                    </div>

                    {/* Price & Review */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold mb-2"
                         style={{ color: '#3c1a5b' }}>
                        {formatCurrency(item.total_price)}
                      </p>
                      {canReview && (
                        <button
                          onClick={() => setReviewItem(item)}
                          className="text-xs font-medium px-3 py-1 rounded-lg
                                     transition-colors flex items-center gap-1"
                          style={{
                            backgroundColor: '#fef9c3',
                            color: '#854d0e'
                          }}
                        >
                          <Star size={10} />
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl border border-gray-100
                            shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4
                             flex items-center gap-2">
                <MapPin size={18} style={{ color: '#3c1a5b' }} />
                Delivery Address
              </h2>
              <div className="bg-gray-50 rounded-xl p-4 text-sm
                              text-gray-700 space-y-1">
                <p className="font-semibold">{order.shipping_name}</p>
                <p className="text-gray-500">{order.shipping_phone}</p>
                <p>{order.shipping_address}</p>
                <p>{order.shipping_city}, {order.shipping_state}</p>
                <p>{order.shipping_country}</p>
                {order.notes && (
                  <p className="text-gray-500 italic mt-2 pt-2
                                border-t border-gray-200">
                    Note: {order.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100
                            shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">
                Order Timeline
              </h2>
              <OrderTimeline status={order.status} />
            </div>

            {/* Cancel Button */}
            {canCancel && (
              <div className="bg-red-50 rounded-2xl border border-red-100
                              p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18}
                                 className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800 mb-1">
                      Cancel This Order
                    </p>
                    <p className="text-xs text-red-600 mb-3">
                      You can only cancel orders that haven't been confirmed
                      yet. Once cancelled, this action cannot be undone.
                    </p>
                    <button
                      onClick={handleCancel}
                      disabled={cancelMutation.isPending}
                      className="px-5 py-2 rounded-xl text-sm font-bold
                                 text-white bg-red-500 hover:bg-red-600
                                 transition-colors disabled:opacity-50"
                    >
                      {cancelMutation.isPending
                        ? 'Cancelling...'
                        : 'Cancel Order'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column (1/3) ─────────── */}
          <div className="space-y-5">

            {/* Payment Summary */}
            <div className="bg-white rounded-2xl border border-gray-100
                            shadow-sm p-5">
              <h3 className="text-base font-bold text-gray-900 mb-4
                             flex items-center gap-2">
                <CreditCard size={18} style={{ color: '#3c1a5b' }} />
                Payment Summary
              </h3>

              <div className="space-y-2.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shipping_fee)}</span>
                </div>
                {parseFloat(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2.5
                                border-t border-gray-100">
                  <span>Total</span>
                  <span style={{ color: '#3c1a5b' }}>
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>

              {/* Payment Status */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Payment Status</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full
                    ${order.payment_status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.payment_status === 'paid' ? '✓ Paid' : 'Unpaid'}
                  </span>
                </div>
                {order.paystack_reference && (
                  <p className="text-xs text-gray-400 mt-2">
                    Ref: {order.paystack_reference}
                  </p>
                )}
              </div>
            </div>

            {/* Tracking */}
            {order.speedaf_tracking_no && (
              <div className="bg-white rounded-2xl border border-gray-100
                              shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-2
                               flex items-center gap-2">
                  <Truck size={16} style={{ color: '#3c1a5b' }} />
                  Tracking Number
                </h3>
                <p className="text-sm font-mono text-gray-700 bg-gray-50
                               px-3 py-2 rounded-lg">
                  {order.speedaf_tracking_no}
                </p>
              </div>
            )}

            {/* Need Help */}
            <div className="bg-white rounded-2xl border border-gray-100
                            shadow-sm p-5 text-center">
              <p className="text-sm font-semibold text-gray-800 mb-1">
                Need Help?
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Having issues with your order?
              </p>
              <a href="mailto:contact@karakata.market"
                 className="text-sm font-medium hover:underline"
                 style={{ color: '#3c1a5b' }}>
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewItem && (
        <ReviewForm
          item={reviewItem}
          orderId={order.id}
          onClose={() => setReviewItem(null)}
        />
      )}
    </div>
  );
};

export default OrderDetailPage;