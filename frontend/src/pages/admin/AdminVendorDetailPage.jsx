import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Store, ArrowLeft, CheckCircle,
  XCircle, PauseCircle, Package,
  ShoppingBag, DollarSign, User,
  MapPin, Phone, Mail, Calendar
} from 'lucide-react';
import { getAdminVendor, updateVendorStatus } from '../../api/admin.api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Spinner from '../../components/common/Spinner';

const statusStyles = {
  approved:  { bg: '#dcfce7', color: '#166534', label: 'Approved' },
  pending:   { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
  rejected:  { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
  suspended: { bg: '#f3f4f6', color: '#374151', label: 'Suspended' },
};

const StatCard = ({ icon, label, value, color, bg }) => (
  <div className="bg-white rounded-2xl border border-gray-100
                  shadow-sm p-5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center
                    shrink-0"
         style={{ backgroundColor: bg }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-extrabold text-gray-900">{value}</p>
    </div>
  </div>
);

const AdminVendorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['admin-vendor', id],
    queryFn: () => getAdminVendor(id),
    select: (res) => res.data.data.vendor
  });

  const statusMutation = useMutation({
    mutationFn: (status) => updateVendorStatus(id, { status }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendor', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast.success(`Vendor ${status} successfully.`);
    },
    onError: () => toast.error('Failed to update vendor status.')
  });

  if (isLoading) return <Spinner center />;
  if (!vendor) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Vendor not found.</p>
    </div>
  );

  const style = statusStyles[vendor.status] || statusStyles.pending;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/vendors')}
          className="p-2 rounded-xl border border-gray-200
                     hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              {vendor.store_name}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: style.bg,
                    color: style.color
                  }}>
              {style.label}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Vendor since {formatDate(vendor.created_at)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Package size={22} />}
          label="Total Products"
          value={vendor.total_products || 0}
          color="#5b21b6" bg="#ede9fe"
        />
        <StatCard
          icon={<ShoppingBag size={22} />}
          label="Total Orders"
          value={vendor.total_orders || 0}
          color="#1e40af" bg="#dbeafe"
        />
        <StatCard
          icon={<DollarSign size={22} />}
          label="Total Revenue"
          value={formatCurrency(vendor.total_revenue || 0)}
          color="#166534" bg="#dcfce7"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Store + Owner Info */}
        <div className="lg:col-span-2 space-y-5">

          {/* Store Info */}
          <div className="bg-white rounded-2xl border border-gray-100
                          shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase
                           tracking-wider mb-4 flex items-center gap-2">
              <Store size={16} style={{ color: '#3c1a5b' }} />
              Store Details
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Store Description
                </p>
                <p className="text-sm text-gray-700">
                  {vendor.store_description || 'No description provided.'}
                </p>
              </div>
              {vendor.address && (
                <div className="flex items-start gap-2">
                  <MapPin size={15} className="text-gray-400 mt-0.5
                                               shrink-0" />
                  <p className="text-sm text-gray-700">
                    {vendor.address}
                    {vendor.city && `, ${vendor.city}`}
                    {vendor.state && `, ${vendor.state}`}
                  </p>
                </div>
              )}
              {vendor.bank_name && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    Bank Details
                  </p>
                  <p className="text-sm text-gray-700">
                    {vendor.bank_name} · {vendor.account_number}
                  </p>
                  <p className="text-xs text-gray-500">
                    {vendor.account_name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Owner Info */}
          <div className="bg-white rounded-2xl border border-gray-100
                          shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase
                           tracking-wider mb-4 flex items-center gap-2">
              <User size={16} style={{ color: '#3c1a5b' }} />
              Owner Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center
                                justify-center text-white font-bold
                                text-lg shrink-0"
                     style={{ backgroundColor: '#3c1a5b' }}>
                  {vendor.owner_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {vendor.owner_name}
                  </p>
                  <p className="text-xs text-gray-500">Store Owner</p>
                </div>
              </div>
              {[
                { icon: <Mail size={14} />, value: vendor.owner_email },
                { icon: <Phone size={14} />, value: vendor.owner_phone },
                {
                  icon: <Calendar size={14} />,
                  value: `Joined ${formatDate(vendor.owner_joined)}`
                },
              ].filter(i => i.value).map((item, i) => (
                <div key={i}
                     className="flex items-center gap-2 text-sm
                                text-gray-600">
                  <span className="text-gray-400 shrink-0">
                    {item.icon}
                  </span>
                  {item.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100
                          shadow-sm p-5 sticky top-24">
            <h2 className="text-sm font-bold text-gray-700 uppercase
                           tracking-wider mb-4">
              Vendor Actions
            </h2>

            <div className="space-y-3">
              {vendor.status !== 'approved' && (
                <button
                  onClick={() => statusMutation.mutate('approved')}
                  disabled={statusMutation.isPending}
                  className="w-full flex items-center gap-2 px-4 py-3
                             rounded-xl text-sm font-bold transition-colors
                             disabled:opacity-50"
                  style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                >
                  <CheckCircle size={16} />
                  Approve Vendor
                </button>
              )}

              {vendor.status === 'approved' && (
                <button
                  onClick={() => statusMutation.mutate('suspended')}
                  disabled={statusMutation.isPending}
                  className="w-full flex items-center gap-2 px-4 py-3
                             rounded-xl text-sm font-bold transition-colors
                             disabled:opacity-50"
                  style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                >
                  <PauseCircle size={16} />
                  Suspend Vendor
                </button>
              )}

              {vendor.status !== 'rejected' && (
                <button
                  onClick={() => {
                    if (window.confirm(
                      `Reject ${vendor.store_name}? This will prevent them from selling.`
                    )) {
                      statusMutation.mutate('rejected');
                    }
                  }}
                  disabled={statusMutation.isPending}
                  className="w-full flex items-center gap-2 px-4 py-3
                             rounded-xl text-sm font-bold transition-colors
                             disabled:opacity-50"
                  style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                >
                  <XCircle size={16} />
                  Reject Vendor
                </button>
              )}

              {(vendor.status === 'rejected' ||
                vendor.status === 'suspended') && (
                <button
                  onClick={() => statusMutation.mutate('approved')}
                  disabled={statusMutation.isPending}
                  className="w-full flex items-center gap-2 px-4 py-3
                             rounded-xl text-sm font-bold transition-colors
                             disabled:opacity-50"
                  style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                >
                  <CheckCircle size={16} />
                  Reinstate Vendor
                </button>
              )}

              <Link
                to={`/admin/products?vendorId=${vendor.id}`}
                className="w-full flex items-center gap-2 px-4 py-3
                           rounded-xl text-sm font-bold transition-colors
                           border border-gray-200 hover:bg-gray-50
                           text-gray-700"
              >
                <Package size={16} />
                View Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminVendorDetailPage;