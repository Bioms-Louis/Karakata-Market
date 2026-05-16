import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Package, ShoppingBag, TrendingUp, DollarSign,
  ArrowRight, Clock, CheckCircle, Truck,
  AlertCircle, Plus, Eye
} from 'lucide-react';
import { getVendorDashboard } from '../../api/vendors.api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Spinner from '../../components/common/Spinner';

// ─────────────────────────────────────────────
// STATS CARD
// ─────────────────────────────────────────────
const StatsCard = ({ title, value, icon, color, bg, suffix }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-extrabold text-gray-900">
          {value}
          {suffix && (
            <span className="text-sm font-medium text-gray-400 ml-1">
              {suffix}
            </span>
          )}
        </p>
      </div>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center
                      shrink-0"
           style={{ backgroundColor: bg }}>
        <span style={{ color }}>{icon}</span>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// ORDER STATUS BADGE
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const config = {
    pending:    { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
    confirmed:  { bg: '#dbeafe', color: '#1e40af', label: 'Confirmed' },
    processing: { bg: '#ede9fe', color: '#5b21b6', label: 'Processing' },
    shipped:    { bg: '#dbeafe', color: '#1d4ed8', label: 'Shipped' },
    delivered:  { bg: '#dcfce7', color: '#166534', label: 'Delivered' },
    cancelled:  { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
  }[status] || { bg: '#f3f4f6', color: '#374151', label: status };

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full
                     text-xs font-semibold"
          style={{ backgroundColor: config.bg, color: config.color }}>
      {config.label}
    </span>
  );
};

// ─────────────────────────────────────────────
// MAIN VENDOR DASHBOARD
// ─────────────────────────────────────────────
const VendorDashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['vendor-dashboard'],
    queryFn: getVendorDashboard,
    select: (res) => res.data.data
  });

  if (isLoading) return <Spinner center />;

  const stats = data?.stats;
  const recentOrders = data?.recentOrders || [];

  return (
    <div className="space-y-6">

      {/* ── Page Header ──────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back! Here's what's happening in your store.
          </p>
        </div>
        <Link
          to="/vendor/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                     font-bold text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
        >
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      {/* ── Stats Grid ───────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={<DollarSign size={22} />}
          color="#166534"
          bg="#dcfce7"
        />
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          suffix="orders"
          icon={<ShoppingBag size={22} />}
          color="#1e40af"
          bg="#dbeafe"
        />
        <StatsCard
          title="Active Products"
          value={stats?.totalProducts || 0}
          suffix="products"
          icon={<Package size={22} />}
          color="#5b21b6"
          bg="#ede9fe"
        />
        <StatsCard
          title="Pending Orders"
          value={stats?.pendingOrders || 0}
          suffix="pending"
          icon={<Clock size={22} />}
          color="#854d0e"
          bg="#fef9c3"
        />
      </div>

      {/* ── Quick Actions ────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'View Products',
            to: '/vendor/products',
            icon: <Package size={20} />,
            desc: 'Manage your listings'
          },
          {
            label: 'Manage Orders',
            to: '/vendor/orders',
            icon: <ShoppingBag size={20} />,
            desc: 'Process customer orders'
          },
          {
            label: 'Add Product',
            to: '/vendor/products/new',
            icon: <Plus size={20} />,
            desc: 'List a new item'
          }
        ].map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm
                       p-4 flex items-center gap-3 hover:border-purple-200
                       hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center
                            justify-center flex-shrink-0 transition-colors"
                 style={{ backgroundColor: '#f5f0fa' }}>
              <span style={{ color: '#3c1a5b' }}>{action.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {action.label}
              </p>
              <p className="text-xs text-gray-400 truncate">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Recent Orders ────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b
                        border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
          <Link
            to="/vendor/orders"
            className="text-sm font-medium flex items-center gap-1
                       hover:underline"
            style={{ color: '#3c1a5b' }}
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingBag size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No orders yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Orders will appear here when customers buy your products
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <div key={order.id}
                   className="flex items-center gap-4 p-4 hover:bg-gray-50
                              transition-colors">
                {/* Order Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-gray-900">
                      {order.order_number}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-gray-400">
                    {order.customer_name} · {formatDate(order.created_at)}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold"
                     style={{ color: '#3c1a5b' }}>
                    {formatCurrency(order.vendor_total || order.total_amount)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {order.item_count}{' '}
                    {parseInt(order.item_count) === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Store Status ─────────────────── */}
      {data?.vendorStatus !== 'approved' && (
        <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-5
                        flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-500 flex-shrink-0
                                             mt-0.5" />
          <div>
            <p className="text-sm font-bold text-yellow-800">
              Store Pending Approval
            </p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Your store is under review. You'll be notified once approved
              and can start selling immediately.
            </p>
          </div>
        </div>
      )}
    </div>
    
  );
};
export default VendorDashboardPage;