import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Store, Search, CheckCircle, XCircle,
  PauseCircle, Eye, X, Package,
  ShoppingBag, DollarSign, MapPin, Phone
} from 'lucide-react';
import {
  getAdminVendors, getAdminVendor, updateVendorStatus
} from '../../api/admin.api';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import Spinner from '../../components/common/Spinner';

// VENDOR DETAIL MODAL
const VendorDetailModal = ({ vendorId, onClose }) => {
  const { data: vendor, isLoading } = useQuery({
    queryKey: ['admin-vendor', vendorId],
    queryFn: () => getAdminVendor(vendorId),
    select: (res) => res.data.data.vendor
  });

  const statusStyles = {
    approved:  { bg: '#dcfce7', color: '#166534' },
    pending:   { bg: '#fef9c3', color: '#854d0e' },
    rejected:  { bg: '#fee2e2', color: '#991b1b' },
    suspended: { bg: '#f3f4f6', color: '#374151' },
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg
                      max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b
                        border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">
            Vendor Details
          </h2>
          <button onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {isLoading ? <div className="p-10"><Spinner center /></div> : (
          <div className="p-6 space-y-6">

            {/* Store Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center
                              justify-center text-white text-xl font-bold
                              shrink-0"
                   style={{ backgroundColor: '#3c1a5b' }}>
                {vendor?.store_name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-gray-900">
                    {vendor?.store_name}
                  </h3>
                  <span className="px-2.5 py-1 rounded-full text-xs
                                   font-bold capitalize"
                        style={{
                          backgroundColor:
                            statusStyles[vendor?.status]?.bg,
                          color: statusStyles[vendor?.status]?.color
                        }}>
                    {vendor?.status}
                  </span>
                </div>
                {vendor?.store_description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {vendor.store_description}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Joined {formatDate(vendor?.created_at)}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: <Package size={18} />,
                  label: 'Products',
                  value: vendor?.total_products || 0,
                  bg: '#ede9fe', color: '#5b21b6'
                },
                {
                  icon: <ShoppingBag size={18} />,
                  label: 'Orders',
                  value: vendor?.total_orders || 0,
                  bg: '#dbeafe', color: '#1e40af'
                },
                {
                  icon: <DollarSign size={18} />,
                  label: 'Revenue',
                  value: formatCurrency(vendor?.total_revenue || 0),
                  bg: '#dcfce7', color: '#166534'
                },
              ].map((stat) => (
                <div key={stat.label}
                     className="rounded-xl p-3 text-center"
                     style={{ backgroundColor: stat.bg }}>
                  <div className="flex justify-center mb-1"
                       style={{ color: stat.color }}>
                    {stat.icon}
                  </div>
                  <p className="text-sm font-extrabold"
                     style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                  <p className="text-xs font-medium"
                     style={{ color: stat.color, opacity: 0.7 }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Owner Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase
                            tracking-wider">
                Owner Information
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full flex items-center
                                  justify-center text-white text-xs
                                  font-bold shrink-0"
                       style={{ backgroundColor: '#3c1a5b' }}>
                    {vendor?.owner_name?.[0]?.toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">
                    {vendor?.owner_name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm
                                text-gray-500">
                  <span className="text-gray-400">✉</span>
                  {vendor?.owner_email}
                </div>
                {vendor?.owner_phone && (
                  <div className="flex items-center gap-2 text-sm
                                  text-gray-500">
                    <Phone size={13} className="text-gray-400" />
                    {vendor.owner_phone}
                  </div>
                )}
              </div>
            </div>

            {/* Store Address */}
            {(vendor?.city || vendor?.state) && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase
                              tracking-wider mb-2">
                  Location
                </p>
                <div className="flex items-center gap-2 text-sm
                                text-gray-600">
                  <MapPin size={14} className="text-gray-400" />
                  {[vendor.address, vendor.city, vendor.state]
                    .filter(Boolean).join(', ')}
                </div>
              </div>
            )}

            {/* Bank Details */}
            {vendor?.bank_name && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase
                              tracking-wider mb-2">
                  Bank Details
                </p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{vendor.bank_name}</p>
                  <p className="font-mono">{vendor.account_number}</p>
                  <p>{vendor.account_name}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// MAIN ADMIN VENDORS PAGE
const AdminVendorsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [viewVendorId, setViewVendorId] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vendors', search, statusFilter, page],
    queryFn: () => getAdminVendors({
      search,
      status: statusFilter === 'all' ? '' : statusFilter,
      page, limit: 15
    }),
    select: (res) => res.data.data
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateVendorStatus(id, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success(`Vendor ${vars.status}.`);
    },
    onError: () => toast.error('Failed to update vendor status.')
  });

  const vendors = data?.vendors || [];
  const pagination = data?.pagination;

  const statusStyles = {
    approved:  { bg: '#dcfce7', color: '#166534', label: 'Approved' },
    pending:   { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
    rejected:  { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
    suspended: { bg: '#f3f4f6', color: '#374151', label: 'Suspended' },
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage vendor applications and store statuses
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
            placeholder="Search vendors..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border
                       border-gray-200 text-sm outline-none
                       focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected', 'suspended']
            .map((s) => (
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
        {isLoading ? <Spinner center /> : vendors.length === 0 ? (
          <div className="py-16 text-center">
            <Store size={40} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No vendors found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50
                            border-b border-gray-100 text-xs font-semibold
                            text-gray-500 uppercase tracking-wider">
              <div className="col-span-4">Store</div>
              <div className="col-span-3">Owner</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-3 text-center">Actions</div>
            </div>

            <div className="divide-y divide-gray-50">
              {vendors.map((vendor) => {
                const style = statusStyles[vendor.status] ||
                              statusStyles.pending;
                return (
                  <div key={vendor.id}
                       className="grid grid-cols-12 gap-4 px-5 py-4
                                  items-center hover:bg-gray-50
                                  transition-colors">

                    {/* Store */}
                    <div className="col-span-4 flex items-center gap-3
                                    min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center
                                      justify-center text-white font-bold
                                      text-sm shrink-0"
                           style={{ backgroundColor: '#3c1a5b' }}>
                        {vendor.store_name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900
                                      truncate">
                          {vendor.store_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(vendor.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="col-span-3 min-w-0">
                      <p className="text-sm text-gray-700 truncate">
                        {vendor.owner_name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {vendor.owner_email}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex justify-center">
                      <span className="px-3 py-1 rounded-full text-xs
                                       font-semibold"
                            style={{
                              backgroundColor: style.bg,
                              color: style.color
                            }}>
                        {style.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 flex items-center
                                    justify-center gap-1.5 flex-wrap">

                      {/* View Details */}
                      <button
                        onClick={() => setViewVendorId(vendor.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5
                                   rounded-lg text-xs font-semibold
                                   bg-gray-100 text-gray-600
                                   hover:bg-gray-200 transition-colors"
                      >
                        <Eye size={12} />
                        View
                      </button>

                      {vendor.status !== 'approved' && (
                        <button
                          onClick={() => statusMutation.mutate({
                            id: vendor.id, status: 'approved'
                          })}
                          disabled={statusMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5
                                     rounded-lg text-xs font-semibold
                                     transition-colors disabled:opacity-50"
                          style={{
                            backgroundColor: '#dcfce7',
                            color: '#166534'
                          }}
                        >
                          <CheckCircle size={12} />
                          Approve
                        </button>
                      )}

                      {vendor.status === 'approved' && (
                        <button
                          onClick={() => statusMutation.mutate({
                            id: vendor.id, status: 'suspended'
                          })}
                          disabled={statusMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5
                                     rounded-lg text-xs font-semibold
                                     transition-colors disabled:opacity-50"
                          style={{
                            backgroundColor: '#f3f4f6',
                            color: '#374151'
                          }}
                        >
                          <PauseCircle size={12} />
                          Suspend
                        </button>
                      )}

                      {vendor.status !== 'rejected' &&
                       vendor.status !== 'suspended' && (
                        <button
                          onClick={() => statusMutation.mutate({
                            id: vendor.id, status: 'rejected'
                          })}
                          disabled={statusMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5
                                     rounded-lg text-xs font-semibold
                                     transition-colors disabled:opacity-50"
                          style={{
                            backgroundColor: '#fee2e2',
                            color: '#991b1b'
                          }}
                        >
                          <XCircle size={12} />
                          Reject
                        </button>
                      )}

                      {(vendor.status === 'suspended' ||
                        vendor.status === 'rejected') && (
                        <button
                          onClick={() => statusMutation.mutate({
                            id: vendor.id, status: 'approved'
                          })}
                          disabled={statusMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5
                                     rounded-lg text-xs font-semibold
                                     transition-colors disabled:opacity-50"
                          style={{
                            backgroundColor: '#dcfce7',
                            color: '#166534'
                          }}
                        >
                          <CheckCircle size={12} />
                          Reinstate
                        </button>
                      )}
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

      {viewVendorId && (
        <VendorDetailModal
          vendorId={viewVendorId}
          onClose={() => setViewVendorId(null)}
        />
      )}
    </div>
  );
};

export default AdminVendorsPage;