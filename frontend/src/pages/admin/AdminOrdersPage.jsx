import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShoppingBag, Search, Eye, X, Package } from 'lucide-react';
import {
  getAdminOrders, getAdminOrder, updateOrderStatus
} from '../../api/admin.api';
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

// ORDER DETAIL MODAL
const OrderDetailModal = ({ orderId, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: () => getAdminOrder(orderId),
    select: (res) => res.data.data
  });

  const order = data?.order;
  const items = data?.items || [];
  const config = statusConfig[order?.status] || statusConfig.pending;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl
                      max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b
                        border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Order Details
            </h2>
            {order && (
              <p className="text-xs text-gray-500 mt-0.5">
                {order.order_number} ·{' '}
                {formatDate(order.created_at)}
              </p>
            )}
          </div>
          <button onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-10"><Spinner center /></div>
        ) : (
          <div className="p-6 space-y-5">

            {/* Status + Payment */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: config.bg,
                      color: config.color
                    }}>
                {config.label}
              </span>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold
                                ${order?.payment_status === 'paid'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'}`}>
                Payment: {order?.payment_status}
              </span>
              {order?.paystack_reference && (
                <span className="text-xs text-gray-500 font-mono">
                  Ref: {order.paystack_reference}
                </span>
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase
                            tracking-wider mb-2">
                Customer
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {order?.customer_name}
              </p>
              <p className="text-xs text-gray-500">{order?.customer_email}</p>
              {order?.customer_phone && (
                <p className="text-xs text-gray-500">
                  {order.customer_phone}
                </p>
              )}
            </div>

            {/* Shipping Address */}
            {order?.shipping_address && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase
                              tracking-wider mb-2">
                  Shipping Address
                </p>
                <div className="text-sm text-gray-600 space-y-0.5">
                  {(() => {
                    try {
                      const addr = typeof order.shipping_address === 'string'
                        ? JSON.parse(order.shipping_address)
                        : order.shipping_address;
                      return (
                        <>
                          <p className="font-medium">{addr.fullName}</p>
                          <p>{addr.address}</p>
                          <p>{addr.city}, {addr.state}</p>
                          <p>{addr.phone}</p>
                        </>
                      );
                    } catch {
                      return <p>{order.shipping_address}</p>;
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase
                            tracking-wider mb-3">
                Items ({items.length})
              </p>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id}
                       className="flex items-center gap-3 p-3
                                  bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-gray-200
                                    shrink-0 overflow-hidden">
                      {item.product_image ? (
                        <img src={item.product_image}
                             alt={item.product_name}
                             className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center
                                        justify-center">
                          <Package size={16} className="text-gray-400" />
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
                    </div>
                    <p className="text-sm font-bold shrink-0"
                       style={{ color: '#3c1a5b' }}>
                      {formatCurrency(item.total_price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order?.subtotal ||
                  order?.total_amount)}</span>
              </div>
              {order?.shipping_fee > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>{formatCurrency(order?.shipping_fee)}</span>
                </div>
              )}
              {order?.discount_amount > 0 && (
                <div className="flex justify-between text-sm
                                text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order?.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold
                              text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span style={{ color: '#3c1a5b' }}>
                  {formatCurrency(order?.total_amount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// MAIN ADMIN ORDERS PAGE
const AdminOrdersPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [viewOrderId, setViewOrderId] = useState(null);
  const queryClient = useQueryClient();

  const allStatuses = [
    'pending', 'confirmed', 'processing',
    'shipped', 'delivered', 'cancelled'
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', search, statusFilter, page],
    queryFn: () => getAdminOrders({
      search,
      status: statusFilter === 'all' ? '' : statusFilter,
      page, limit: 15
    }),
    select: (res) => res.data.data
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Order status updated.');
    },
    onError: () => toast.error('Failed to update order.')
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">
          View and manage all platform orders
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2
                             text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order number..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border
                       border-gray-200 text-sm outline-none
                       focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', ...allStatuses].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold
                          capitalize transition-all ${
                statusFilter === s
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={statusFilter === s
                ? { backgroundColor: '#3c1a5b' } : {}}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm overflow-hidden">
        {isLoading ? <Spinner center /> : orders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag size={40}
                         className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50
                            border-b border-gray-100 text-xs font-semibold
                            text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Order</div>
              <div className="col-span-2">Customer</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-1 text-center">Payment</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>

            <div className="divide-y divide-gray-50">
              {orders.map((order) => {
                const config = statusConfig[order.status] ||
                               statusConfig.pending;
                return (
                  <div key={order.id}
                       className="grid grid-cols-12 gap-4 px-5 py-4
                                  items-center hover:bg-gray-50
                                  transition-colors">

                    <div className="col-span-3">
                      <p className="text-sm font-bold text-gray-900">
                        {order.order_number}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(order.created_at)}
                      </p>
                    </div>

                    <div className="col-span-2 min-w-0">
                      <p className="text-xs text-gray-700 truncate">
                        {order.customer_name}
                      </p>
                    </div>

                    <div className="col-span-2 text-right">
                      <p className="text-sm font-bold"
                         style={{ color: '#3c1a5b' }}>
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <span className="px-2.5 py-1 rounded-full text-xs
                                       font-semibold"
                            style={{
                              backgroundColor: config.bg,
                              color: config.color
                            }}>
                        {config.label}
                      </span>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <span className={`text-xs font-bold capitalize ${
                        order.payment_status === 'paid'
                          ? 'text-green-600'
                          : 'text-red-500'
                      }`}>
                        {order.payment_status}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center
                                    justify-center gap-1.5">
                      <button
                        onClick={() => setViewOrderId(order.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5
                                   rounded-lg text-xs font-semibold
                                   bg-gray-100 text-gray-600
                                   hover:bg-gray-200 transition-colors"
                      >
                        <Eye size={12} />
                        View
                      </button>

                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            statusMutation.mutate({
                              id: order.id,
                              status: e.target.value
                            });
                            e.target.value = '';
                          }
                        }}
                        className="text-xs font-semibold pl-2 pr-6 py-1.5
                                   rounded-lg border appearance-none
                                   cursor-pointer outline-none"
                        style={{
                          borderColor: '#3c1a5b',
                          color: '#3c1a5b'
                        }}
                      >
                        <option value="">Move →</option>
                        {allStatuses
                          .filter(s => s !== order.status)
                          .map(s => (
                            <option key={s} value={s}>
                              {statusConfig[s]?.label || s}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {pagination?.totalPages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t
                              border-gray-100">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm rounded-xl border
                             disabled:opacity-40">
                  ← Prev
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 text-sm rounded-xl border
                             disabled:opacity-40">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {viewOrderId && (
        <OrderDetailModal
          orderId={viewOrderId}
          onClose={() => setViewOrderId(null)}
        />
      )}
    </div>
  );
};

export default AdminOrdersPage;