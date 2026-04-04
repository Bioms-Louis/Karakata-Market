import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Package, User,
  MapPin, CreditCard, Truck
} from 'lucide-react';
import { getAdminOrder, updateOrderStatus } from '../../api/admin.api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Spinner from '../../components/common/Spinner';

const statusConfig = {
  pending:    { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
  confirmed:  { bg: '#dbeafe', color: '#1e40af', label: 'Confirmed' },
  processing: { bg: '#ede9fe', color: '#5b21b6', label: 'Processing' },
  shipped:    { bg: '#dbeafe', color: '#1d4ed8', label: 'Shipped' },
  delivered:  { bg: '#dcfce7', color: '#166534', label: 'Delivered' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const paymentConfig = {
  paid:    { bg: '#dcfce7', color: '#166534', label: 'Paid' },
  pending: { bg: '#fef9c3', color: '#854d0e', label: 'Unpaid' },
  failed:  { bg: '#fee2e2', color: '#991b1b', label: 'Failed' },
  refunded:{ bg: '#f3f4f6', color: '#374151', label: 'Refunded' },
};

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => getAdminOrder(id),
    select: (res) => res.data.data
  });

  const statusMutation = useMutation({
    mutationFn: (status) => updateOrderStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated!');
    },
    onError: () => toast.error('Failed to update order.')
  });

  if (isLoading) return <Spinner center />;
  if (!data) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Order not found.</p>
    </div>
  );

  const { order, items } = data;
  const status = statusConfig[order.status] || statusConfig.pending;
  const payment = paymentConfig[order.payment_status] ||
                  paymentConfig.pending;
  const allStatuses = [
    'pending','confirmed','processing',
    'shipped','delivered','cancelled'
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/orders')}
          className="p-2 rounded-xl border border-gray-200
                     hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              {order.order_number}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: status.bg,
                    color: status.color
                  }}>
              {status.label}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: payment.bg,
                    color: payment.color
                  }}>
              {payment.label}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Items + Customer */}
        <div className="lg:col-span-2 space-y-5">

          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-gray-100
                          shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-700 uppercase
                             tracking-wider flex items-center gap-2">
                <Package size={15} style={{ color: '#3c1a5b' }} />
                Order Items ({items?.length || 0})
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {items?.map((item) => (
                <div key={item.id}
                     className="flex items-center gap-4 p-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-100
                                  shrink-0 overflow-hidden">
                    {item.product_image ? (
                      <img src={item.product_image}
                           alt={item.product_name}
                           className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center
                                      justify-center"
                           style={{ backgroundColor: '#f5f0fa' }}>
                        <Package size={20}
                                 style={{ color: '#3c1a5b' }}
                                 className="opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900
                                  truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.vendor_name} · Qty: {item.quantity}
                    </p>
                    {item.variant_info && (
                      <p className="text-xs text-gray-400">
                        {item.variant_info}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold"
                       style={{ color: '#3c1a5b' }}>
                      {formatCurrency(item.total_price)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatCurrency(item.unit_price)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-gray-100
                          shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase
                           tracking-wider mb-4 flex items-center gap-2">
              <User size={15} style={{ color: '#3c1a5b' }} />
              Customer
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center
                              justify-center text-white font-bold
                              shrink-0"
                   style={{ backgroundColor: '#3c1a5b' }}>
                {order.customer_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {order.customer_name}
                </p>
                <p className="text-xs text-gray-500">
                  {order.customer_email}
                </p>
                {order.customer_phone && (
                  <p className="text-xs text-gray-500">
                    {order.customer_phone}
                  </p>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            {order.shipping_address && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-600 mb-1
                              flex items-center gap-1">
                  <MapPin size={12} />
                  Shipping Address
                </p>
                <p className="text-sm text-gray-700">
                  {typeof order.shipping_address === 'string'
                    ? order.shipping_address
                    : `${order.shipping_address.address},
                       ${order.shipping_address.city},
                       ${order.shipping_address.state}`
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right — Summary + Actions */}
        <div className="space-y-4">

          {/* Payment Summary */}
          <div className="bg-white rounded-2xl border border-gray-100
                          shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase
                           tracking-wider mb-4 flex items-center gap-2">
              <CreditCard size={15} style={{ color: '#3c1a5b' }} />
              Payment Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(order.subtotal || order.total_amount)}
                </span>
              </div>
              {order.shipping_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium">
                    {formatCurrency(order.shipping_fee)}
                  </span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t
                              border-gray-100">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-extrabold text-lg"
                      style={{ color: '#3c1a5b' }}>
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>

            {order.paystack_reference && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">
                  Paystack Reference
                </p>
                <p className="text-xs font-mono text-gray-700 break-all">
                  {order.paystack_reference}
                </p>
              </div>
            )}
          </div>

          {/* Update Status */}
          <div className="bg-white rounded-2xl border border-gray-100
                          shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase
                           tracking-wider mb-4 flex items-center gap-2">
              <Truck size={15} style={{ color: '#3c1a5b' }} />
              Update Status
            </h2>
            <div className="space-y-2">
              {allStatuses
                .filter(s => s !== order.status)
                .map((s) => {
                  const cfg = statusConfig[s];
                  return (
                    <button
                      key={s}
                      onClick={() => statusMutation.mutate(s)}
                      disabled={statusMutation.isPending}
                      className="w-full px-4 py-2.5 rounded-xl text-sm
                                 font-semibold text-left flex items-center
                                 justify-between transition-colors
                                 hover:opacity-80 disabled:opacity-50"
                      style={{
                        backgroundColor: cfg.bg,
                        color: cfg.color
                      }}
                    >
                      <span>→ {cfg.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;