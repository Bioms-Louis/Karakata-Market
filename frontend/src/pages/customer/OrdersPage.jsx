import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Package, ChevronRight, Clock, CheckCircle,
  Truck, XCircle, RefreshCw, ShoppingBag
} from 'lucide-react';
import { getUserOrders } from '../../api/orders.api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Spinner from '../../components/common/Spinner';

// ─────────────────────────────────────────────
// ORDER STATUS CONFIG
// Centralizes all status styles & labels
// ─────────────────────────────────────────────
const statusConfig = {
  pending: {
    label: 'Pending',
    icon: <Clock size={14} />,
    bg: '#fef9c3',
    color: '#854d0e'
  },
  confirmed: {
    label: 'Confirmed',
    icon: <CheckCircle size={14} />,
    bg: '#dbeafe',
    color: '#1e40af'
  },
  processing: {
    label: 'Processing',
    icon: <RefreshCw size={14} />,
    bg: '#ede9fe',
    color: '#5b21b6'
  },
  shipped: {
    label: 'Shipped',
    icon: <Truck size={14} />,
    bg: '#dbeafe',
    color: '#1d4ed8'
  },
  delivered: {
    label: 'Delivered',
    icon: <CheckCircle size={14} />,
    bg: '#dcfce7',
    color: '#166534'
  },
  cancelled: {
    label: 'Cancelled',
    icon: <XCircle size={14} />,
    bg: '#fee2e2',
    color: '#991b1b'
  },
  refunded: {
    label: 'Refunded',
    icon: <RefreshCw size={14} />,
    bg: '#f3f4f6',
    color: '#374151'
  }
};

// ─────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                 text-xs font-semibold"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

// ─────────────────────────────────────────────
// PAYMENT STATUS BADGE
// ─────────────────────────────────────────────
const PaymentBadge = ({ status }) => {
  const styles = {
    paid: { bg: '#dcfce7', color: '#166534', label: 'Paid' },
    pending: { bg: '#fef9c3', color: '#854d0e', label: 'Unpaid' },
    failed: { bg: '#fee2e2', color: '#991b1b', label: 'Failed' },
    refunded: { bg: '#f3f4f6', color: '#374151', label: 'Refunded' }
  };
  const style = styles[status] || styles.pending;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full
                 text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
};

// ─────────────────────────────────────────────
// SINGLE ORDER CARD
// ─────────────────────────────────────────────
const OrderCard = ({ order }) => {
  return (
    <Link
      to={`/orders/${order.id}`}
      className="block bg-white rounded-2xl border border-gray-100
                 shadow-sm hover:shadow-md transition-all duration-200
                 hover:border-purple-100 group"
    >
      <div className="p-5">

        {/* Top Row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-bold text-gray-900">
                {order.order_number}
              </p>
              <PaymentBadge status={order.payment_status} />
            </div>
            <p className="text-xs text-gray-400">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <ChevronRight
              size={18}
              className="text-gray-300 group-hover:text-purple-600
                         transition-colors flex-shrink-0"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-50 mb-4" />

        {/* Bottom Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Package size={16} className="text-gray-400" />
            <span>
              {order.item_count}{' '}
              {parseInt(order.item_count) === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-0.5">Total</p>
            <p className="text-base font-extrabold"
               style={{ color: '#3c1a5b' }}>
              {formatCurrency(order.total_amount)}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar for active orders */}
      {!['cancelled', 'refunded', 'delivered'].includes(order.status) && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-1">
            {['pending', 'confirmed', 'processing', 'shipped', 'delivered']
              .map((s, i, arr) => {
                const currentIndex = arr.indexOf(order.status);
                const isCompleted = i <= currentIndex;
                const isLast = i === arr.length - 1;

                return (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0
                                 transition-all"
                      style={{
                        backgroundColor: isCompleted ? '#3c1a5b' : '#e5e7eb'
                      }}
                    />
                    {!isLast && (
                      <div
                        className="flex-1 h-0.5 transition-all"
                        style={{
                          backgroundColor: i < currentIndex
                            ? '#3c1a5b' : '#e5e7eb'
                        }}
                      />
                    )}
                  </div>
                );
              })}
          </div>
          <div className="flex justify-between mt-1">
            {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered']
              .map((label, i) => (
                <span key={label}
                      className="text-xs"
                      style={{
                        color: i <= ['pending', 'confirmed', 'processing',
                          'shipped', 'delivered'].indexOf(order.status)
                          ? '#3c1a5b' : '#9ca3af'
                      }}>
                  {i === 0 || i === 4 ? label : ''}
                </span>
              ))}
          </div>
        </div>
      )}
    </Link>
  );
};

// ─────────────────────────────────────────────
// EMPTY ORDERS STATE
// ─────────────────────────────────────────────
const EmptyOrders = ({ activeFilter }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
         style={{ backgroundColor: '#f5f0fa' }}>
      <ShoppingBag size={40} style={{ color: '#3c1a5b' }} className="opacity-40" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">
      {activeFilter === 'all' ? 'No orders yet' : `No ${activeFilter} orders`}
    </h3>
    <p className="text-gray-500 text-sm mb-8 max-w-xs">
      {activeFilter === 'all'
        ? "You haven't placed any orders yet. Start shopping!"
        : `You don't have any ${activeFilter} orders at the moment.`}
    </p>
    <Link
      to="/products"
      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                 font-bold text-sm transition-all hover:opacity-90"
      style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
    >
      <ShoppingBag size={18} />
      Start Shopping
    </Link>
  </div>
);

// ─────────────────────────────────────────────
// MAIN ORDERS PAGE
// ─────────────────────────────────────────────
const OrdersPage = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filters = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['orders', activeFilter, page],
    queryFn: () => getUserOrders({
      status: activeFilter === 'all' ? '' : activeFilter,
      page,
      limit: 10
    }),
    select: (res) => res.data.data
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track and manage all your orders
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => {
                setActiveFilter(filter.key);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium
                          whitespace-nowrap transition-all flex-shrink-0
                          ${activeFilter === filter.key
                            ? 'text-white shadow-sm'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-200'}`}
              style={activeFilter === filter.key
                ? { backgroundColor: '#3c1a5b' }
                : {}}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}
                   className="h-36 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyOrders activeFilter={activeFilter} />
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>

            {/* Pagination */}
            {pagination?.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium rounded-xl
                             border transition-colors disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 text-sm font-medium rounded-xl
                             border transition-colors disabled:opacity-40"
                >
                  Next {'>'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;