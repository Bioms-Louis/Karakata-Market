import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShoppingBag, ChevronDown } from 'lucide-react';
import { getVendorOrders, updateVendorOrderStatus } from '../../api/vendors.api';
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

// Next valid statuses a vendor can move an order to
const nextStatuses = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const VendorOrdersPage = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const queryClient = useQueryClient();

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-orders', activeFilter, page],
    queryFn: () => getVendorOrders({
      status: activeFilter === 'all' ? '' : activeFilter,
      page,
      limit: 15
    }),
    select: (res) => res.data.data
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) =>
        updateVendorOrderStatus(orderId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
      toast.success('Order status updated!');
    },
    onError: (error) => {
      toast.error(
          error.response?.data?.message || 'Failed to update status.'
      );
    }
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  return (
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and update your customer orders
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
              <button
                  key={f.key}
                  onClick={() => { setActiveFilter(f.key); setPage(1); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium
                        whitespace-nowrap transition-all flex-shrink-0
                        ${activeFilter === f.key
                      ? 'text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200'}`}
                  style={activeFilter === f.key
                      ? { backgroundColor: '#3c1a5b' }
                      : {}}
              >
                {f.label}
              </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm overflow-hidden">
          {isLoading ? (
              <Spinner center />
          ) : orders.length === 0 ? (
              <div className="py-16 text-center">
                <ShoppingBag size={40} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">No orders found</p>
              </div>
          ) : (
              <>
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50
                            border-b border-gray-100 text-xs font-semibold
                            text-gray-500 uppercase tracking-wider">
                  <div className="col-span-1"></div>
                  <div className="col-span-2">Order</div>
                  <div className="col-span-3">Customer</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-2 text-center">Status</div>
                  <div className="col-span-2 text-center">Update</div>
                </div>

                <div className="divide-y divide-gray-50">
                  {orders.map((order) => {
                    const config = statusConfig[order.status] ||
                        statusConfig.pending;
                    const next = nextStatuses[order.status] || [];

                    return (
                        <div key={order.id} className="border-b border-gray-50 last:border-0">
                          <div
                              className="grid grid-cols-12 gap-4 px-5 py-4 items-center
                                 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => toggleExpand(order.id)}
                          >
                            {/* Expand arrow */}
                            <div className="col-span-1 flex items-center justify-center">
                              <ChevronDown
                                  size={16}
                                  className="text-gray-400 transition-transform"
                                  style={{ transform: expandedOrders.has(order.id) ? 'rotate(180deg)' : 'rotate(0deg)' }}
                              />
                            </div>

                            {/* Order Number */}
                            <div className="col-span-2">
                              <p className="text-sm font-bold text-gray-900">
                                {order.order_number}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(order.created_at)}
                              </p>
                            </div>

                            {/* Customer */}
                            <div className="col-span-3" onClick={e => e.stopPropagation()}>
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {order.customer_name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {order.item_count}{' '}
                                {parseInt(order.item_count) === 1 ? 'item' : 'items'}
                              </p>
                            </div>

                            {/* Amount */}
                            <div className="col-span-2 text-right">
                              <p className="text-sm font-bold"
                                 style={{ color: '#3c1a5b' }}>
                                {formatCurrency(
                                    order.vendor_total || order.total_amount
                                )}
                              </p>
                            </div>

                            {/* Current Status */}
                            <div className="col-span-2 flex justify-center">
                      <span className="inline-flex items-center px-2.5 py-1
                                       rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: config.bg,
                              color: config.color
                            }}>
                        {config.label}
                      </span>
                            </div>

                            {/* Update Status */}
                            <div className="col-span-2 flex justify-center">
                              {next.length > 0 ? (
                                  <div className="relative">
                                    <select
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            updateStatusMutation.mutate({
                                              orderId: order.id,
                                              status: e.target.value
                                            });
                                            e.target.value = '';
                                          }
                                        }}
                                        className="text-xs font-semibold pl-3 pr-7 py-1.5
                                       rounded-lg border appearance-none
                                       cursor-pointer outline-none
                                       focus:ring-2 focus:ring-yellow-400"
                                        style={{
                                          borderColor: '#3c1a5b',
                                          color: '#3c1a5b'
                                        }}
                                    >
                                      <option value="">Update →</option>
                                      {next.map((s) => (
                                          <option key={s} value={s}>
                                            {statusConfig[s]?.label || s}
                                          </option>
                                      ))}
                                    </select>
                                  </div>
                              ) : (
                                  <span className="text-xs text-gray-400">—</span>
                              )}
                            </div>
                          </div>{/* end grid */}

                          {/* Expanded items */}
                          {expandedOrders.has(order.id) && (
                              <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-500 uppercase
                                     tracking-wider mb-3 pt-3">
                                  Items Ordered
                                </p>
                                {(order.items || []).length === 0 ? (
                                    <p className="text-sm text-gray-400">No items found.</p>
                                ) : (
                                    <div className="space-y-2">
                                      {(order.items || []).map((item) => (
                                          <div key={item.id}
                                               className="flex items-center gap-3 bg-white
                                              rounded-xl p-3 border border-gray-100">
                                            {item.primary_image ? (
                                                <img src={item.primary_image} alt={item.product_name}
                                                     className="w-12 h-12 rounded-lg object-cover
                                                  flex-shrink-0" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gray-100
                                                  flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-semibold text-gray-900 truncate">
                                                {item.product_name}
                                              </p>
                                              {item.variant_name && (
                                                  <p className="text-xs text-gray-400">{item.variant_name}</p>
                                              )}
                                              <p className="text-xs text-gray-500">
                                                Qty: {item.quantity}
                                              </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                              <p className="text-sm font-bold" style={{ color: '#3c1a5b' }}>
                                                {formatCurrency(item.total_price)}
                                              </p>
                                              <p className="text-xs text-gray-400">
                                                @ {formatCurrency(item.unit_price)} each
                                              </p>
                                            </div>
                                          </div>
                                      ))}
                                    </div>
                                )}
                              </div>
                          )}
                        </div>

                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination?.totalPages > 1 && (
                    <div className="flex justify-center gap-2 p-4 border-t
                              border-gray-100">
                      <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-4 py-2 text-sm rounded-xl border
                             disabled:opacity-40"
                      >
                        ← Prev
                      </button>
                      <span className="px-4 py-2 text-sm text-gray-600">
                  {page} / {pagination.totalPages}
                </span>
                      <button
                          onClick={() => setPage(p => p + 1)}
                          disabled={page === pagination.totalPages}
                          className="px-4 py-2 text-sm rounded-xl border
                             disabled:opacity-40"
                      >
                        Next →
                      </button>
                    </div>
                )}
              </>
          )}
        </div>
      </div>
  );
};

export default VendorOrdersPage;