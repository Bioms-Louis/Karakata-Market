import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Store, ShoppingBag, DollarSign,
  Clock, CheckCircle, XCircle, ArrowRight,
  TrendingUp, Package
} from 'lucide-react';
import { getAdminDashboard } from '../../api/admin.api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Spinner from '../../components/common/Spinner';

// STATS CARD
const StatsCard = ({ title, value, icon, color, bg, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center
                      shrink-0"
           style={{ backgroundColor: bg }}>
        <span style={{ color }}>{icon}</span>
      </div>
    </div>
  </div>
);

// STATUS BADGE
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

// MAIN ADMIN DASHBOARD
const AdminDashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
    select: (res) => {
      const d = res.data.data;
      return {
        // Remap backend field names to frontend expectations
        stats: d.stats || d.overview || {},
        vendorBreakdown: d.vendorBreakdown || d.vendorStats || {},
        orderBreakdown: d.orderBreakdown || d.orderStats || {},
        recentOrders: (d.recentOrders || []).map(o => ({
          ...o,
          customer_name: o.customer_name ||
            `${o.first_name || ''} ${o.last_name || ''}`.trim()
        })),
        pendingVendors: (d.pendingVendors || []).map(v => ({
          ...v,
          owner_name: v.owner_name ||
            `${v.first_name || ''} ${v.last_name || ''}`.trim()
        })),
      };
    }
  });

  if (isLoading) return <Spinner center />;

  const stats = data?.stats;
  const recentOrders = data?.recentOrders || [];
  const pendingVendors = data?.pendingVendors || [];
  const orderBreakdown = data?.orderBreakdown || {};
  const vendorBreakdown = data?.vendorBreakdown || {};

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Platform overview and key metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={<DollarSign size={22} />}
          color="#166534" bg="#dcfce7"
          sub="From paid orders"
        />
        <StatsCard
          title="Total Customers"
          value={(stats?.totalCustomers || 0).toLocaleString()}
          icon={<Users size={22} />}
          color="#1e40af" bg="#dbeafe"
          sub="Registered users"
        />
        <StatsCard
          title="Total Orders"
          value={(stats?.totalOrders || 0).toLocaleString()}
          icon={<ShoppingBag size={22} />}
          color="#5b21b6" bg="#ede9fe"
          sub="All time"
        />
        <StatsCard
          title="Total Products"
          value={(stats?.totalProducts || 0).toLocaleString()}
          icon={<Package size={22} />}
          color="#854d0e" bg="#fef9c3"
          sub="Active listings"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Vendor Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100
                        shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900 flex items-center
                           gap-2">
              <Store size={18} style={{ color: '#3c1a5b' }} />
              Vendor Overview
            </h2>
            <Link to="/admin/vendors"
                  className="text-xs font-medium hover:underline flex
                             items-center gap-1"
                  style={{ color: '#3c1a5b' }}>
              Manage <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              {
                label: 'Approved',
                value: vendorBreakdown.approved || 0,
                color: '#166534', bg: '#dcfce7'
              },
              {
                label: 'Pending',
                value: vendorBreakdown.pending || 0,
                color: '#854d0e', bg: '#fef9c3'
              },
              {
                label: 'Suspended',
                value: vendorBreakdown.suspended || 0,
                color: '#991b1b', bg: '#fee2e2'
              },
            ].map((item) => (
              <div key={item.label}
                   className="flex items-center justify-between p-3
                              rounded-xl"
                   style={{ backgroundColor: item.bg }}>
                <span className="text-sm font-medium"
                      style={{ color: item.color }}>
                  {item.label} Vendors
                </span>
                <span className="text-lg font-extrabold"
                      style={{ color: item.color }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100
                        shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900 flex items-center
                           gap-2">
              <TrendingUp size={18} style={{ color: '#3c1a5b' }} />
              Order Breakdown
            </h2>
            <Link to="/admin/orders"
                  className="text-xs font-medium hover:underline flex
                             items-center gap-1"
                  style={{ color: '#3c1a5b' }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-2">
            {[
              'pending', 'confirmed', 'processing',
              'shipped', 'delivered', 'cancelled'
            ].map((status) => {
              const count = orderBreakdown[status] || 0;
              const total = stats?.totalOrders || 1;
              const pct = Math.round((count / total) * 100);
              const colors = {
                pending: '#854d0e', confirmed: '#1e40af',
                processing: '#5b21b6', shipped: '#1d4ed8',
                delivered: '#166534', cancelled: '#991b1b'
              };

              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 capitalize
                                   shrink-0">
                    {status}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2
                                  overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                         style={{
                           width: `${pct}%`,
                           backgroundColor: colors[status]
                         }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700
                                   w-8 text-right shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pending Vendor Applications */}
      {pendingVendors.length > 0 && (
        <div className="bg-white rounded-2xl border border-yellow-200
                        shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b
                          border-yellow-100 bg-yellow-50">
            <h2 className="text-base font-bold text-yellow-800 flex items-center
                           gap-2">
              <Clock size={18} className="text-yellow-500" />
              Pending Vendor Applications
              <span className="ml-1 px-2 py-0.5 bg-yellow-200 text-yellow-800
                               text-xs font-bold rounded-full">
                {pendingVendors.length}
              </span>
            </h2>
            <Link to="/admin/vendors"
                  className="text-xs font-medium text-yellow-700
                             hover:underline flex items-center gap-1">
              Review all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-gray-50">
            {pendingVendors.slice(0, 5).map((vendor) => (
              <div key={vendor.id}
                   className="flex items-center justify-between p-4
                              hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center
                                  justify-center text-white font-bold
                                  text-sm shrink-0"
                       style={{ backgroundColor: '#3c1a5b' }}>
                    {vendor.store_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {vendor.store_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {vendor.owner_name} · Applied {formatDate(vendor.created_at)}
                    </p>
                  </div>
                </div>
                <Link
                  to="/admin/vendors"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg
                             transition-colors"
                  style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b
                        border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
          <Link to="/admin/orders"
                className="text-xs font-medium hover:underline flex
                           items-center gap-1"
                style={{ color: '#3c1a5b' }}>
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingBag size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <div key={order.id}
                   className="flex items-center gap-4 px-5 py-3.5
                              hover:bg-gray-50 transition-colors">
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
                <p className="text-sm font-bold shrink-0"
                   style={{ color: '#3c1a5b' }}>
                  {formatCurrency(order.total_amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;