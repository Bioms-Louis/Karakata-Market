import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Bell, Send, Trash2, Users,
  User, Shield, X, Search
} from 'lucide-react';
import {
  getAdminNotifications, sendNotification,
  deleteAdminNotification, getAdminUsers
} from '../../api/admin.api';
import { formatDate } from '../../utils/formatDate';
import Spinner from '../../components/common/Spinner';

const inputClass = `
  w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50
  text-sm outline-none focus:ring-2 focus:ring-yellow-400
  focus:border-transparent transition-all
`;

// SEND NOTIFICATION PANEL
const SendNotificationPanel = () => {
  const queryClient = useQueryClient();
  const [type, setType] = useState('broadcast');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserList, setShowUserList] = useState(false);

  const { register, handleSubmit, reset,
          formState: { errors } } = useForm();

  // Search users for single-user type
  const { data: usersData } = useQuery({
    queryKey: ['user-search', userSearch],
    queryFn: () => getAdminUsers({ search: userSearch, limit: 8 }),
    select: (res) => res.data.data.users,
    enabled: userSearch.length > 1
  });

  const sendMutation = useMutation({
    mutationFn: sendNotification,
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ['admin-notifications']
      });
      const count = res.data.data?.sentTo;
      toast.success(count
        ? `Sent to ${count} users!`
        : 'Notification sent!');
      reset();
      setSelectedUser(null);
      setUserSearch('');
    },
    onError: (err) => toast.error(
      err.response?.data?.message || 'Failed to send notification.'
    )
  });

  const onSubmit = (data) => {
    if (type === 'user' && !selectedUser) {
      toast.error('Please select a user.');
      return;
    }

    sendMutation.mutate({
      type,
      title: data.title,
      message: data.message,
      userId: type === 'user' ? selectedUser?.id : undefined,
      role: type === 'role' ? data.role : undefined
    });
  };

  const typeOptions = [
    {
      key: 'broadcast',
      label: 'All Users',
      icon: <Users size={16} />,
      desc: 'Send to every active user'
    },
    {
      key: 'role',
      label: 'By Role',
      icon: <Shield size={16} />,
      desc: 'Target a specific role'
    },
    {
      key: 'user',
      label: 'Single User',
      icon: <User size={16} />,
      desc: 'Send to one person'
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100
                    shadow-sm p-6">
      <h2 className="text-base font-bold text-gray-900 mb-5
                     flex items-center gap-2">
        <Send size={18} style={{ color: '#3c1a5b' }} />
        Send Notification
      </h2>

      <div className="space-y-5">

        {/* Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Target Audience
          </label>
          <div className="grid grid-cols-3 gap-2">
            {typeOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setType(opt.key);
                  setSelectedUser(null);
                  setUserSearch('');
                }}
                className={`p-3 rounded-xl border-2 text-left
                            transition-all ${
                  type === opt.key
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1"
                     style={{
                       color: type === opt.key ? '#3c1a5b' : '#6b7280'
                     }}>
                  {opt.icon}
                  <span className="text-xs font-bold">{opt.label}</span>
                </div>
                <p className="text-xs text-gray-400">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Role Picker */}
        {type === 'role' && (
          <div>
            <label className="block text-xs font-semibold
                              text-gray-700 mb-1.5">
              Select Role <span className="text-red-400">*</span>
            </label>
            <select className={inputClass}
                    {...register('role', {
                      required: type === 'role'
                    })}>
              <option value="">Choose role...</option>
              <option value="customer">👤 All Customers</option>
              <option value="vendor">🏪 All Vendors</option>
              <option value="admin">🛡️ All Admins</option>
            </select>
          </div>
        )}

        {/* User Picker */}
        {type === 'user' && (
          <div>
            <label className="block text-xs font-semibold
                              text-gray-700 mb-1.5">
              Select User <span className="text-red-400">*</span>
            </label>

            {selectedUser ? (
              <div className="flex items-center gap-3 p-3 rounded-xl
                              border-2 border-purple-200 bg-purple-50">
                <div className="w-8 h-8 rounded-full flex items-center
                                justify-center text-white text-xs font-bold"
                     style={{ backgroundColor: '#3c1a5b' }}>
                  {selectedUser.first_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedUser.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded-lg hover:bg-purple-100"
                >
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={15}
                        className="absolute left-3 top-1/2
                                   -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setShowUserList(true);
                  }}
                  onFocus={() => setShowUserList(true)}
                  placeholder="Search by name or email..."
                  className="w-full pl-9 pr-4 py-3 rounded-xl border
                             border-gray-200 bg-gray-50 text-sm
                             outline-none focus:ring-2
                             focus:ring-yellow-400"
                />

                {showUserList && usersData?.length > 0 && (
                  <div className="absolute top-full left-0 right-0
                                  bg-white border border-gray-200
                                  rounded-xl shadow-lg z-20 mt-1
                                  overflow-hidden max-h-48 overflow-y-auto">
                    {usersData.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserList(false);
                          setUserSearch('');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3
                                   hover:bg-gray-50 transition-colors
                                   text-left"
                      >
                        <div className="w-7 h-7 rounded-full flex items-center
                                        justify-center text-white text-xs
                                        font-bold shrink-0"
                             style={{ backgroundColor: '#3c1a5b' }}>
                          {user.first_name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900
                                        truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        <span className="text-xs capitalize text-gray-400
                                         shrink-0">
                          {user.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold
                            text-gray-700 mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. New Sale Alert!"
            className={inputClass}
            {...register('title', { required: 'Title is required' })}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold
                            text-gray-700 mb-1.5">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Write your notification message here..."
            className={inputClass}
            {...register('message', { required: 'Message is required' })}
          />
          {errors.message && (
            <p className="mt-1 text-xs text-red-500">
              {errors.message.message}
            </p>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={sendMutation.isPending}
          className="w-full py-4 rounded-xl font-bold text-sm
                     flex items-center justify-center gap-2
                     transition-all hover:opacity-90
                     disabled:opacity-50"
          style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
        >
          {sendMutation.isPending ? (
            <svg className="animate-spin h-4 w-4"
                 viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <Send size={16} />
          )}
          {sendMutation.isPending ? 'Sending...' : (
            type === 'broadcast'
              ? 'Send to All Users'
              : type === 'role'
              ? 'Send to Role'
              : 'Send to User'
          )}
        </button>
      </div>
    </div>
  );
};

// MAIN NOTIFICATIONS PAGE
const AdminNotificationsPage = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications', page],
    queryFn: () => getAdminNotifications({ page, limit: 20 }),
    select: (res) => res.data.data
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-notifications']
      });
      toast.success('Notification deleted.');
    }
  });

  const notifications = data?.notifications || [];
  const pagination = data?.pagination;

  const roleBg = {
    admin:    { bg: '#fef3c7', color: '#92400e' },
    vendor:   { bg: '#ede9fe', color: '#5b21b6' },
    customer: { bg: '#f0fdf4', color: '#166534' },
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Notifications
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Send and manage platform notifications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Send Panel — 2/5 */}
        <div className="lg:col-span-2">
          <SendNotificationPanel />
        </div>

        {/* Notification History — 3/5 */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100
                          shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                Recent Notifications
              </h2>
            </div>

            {isLoading ? <Spinner center /> :
             notifications.length === 0 ? (
              <div className="py-16 text-center">
                <Bell size={40}
                      className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-sm">
                  No notifications sent yet
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-50">
                  {notifications.map((notif) => {
                    const badge = roleBg[notif.recipient_role] ||
                                  roleBg.customer;
                    return (
                      <div key={notif.id}
                           className="flex items-start gap-3 p-4
                                      hover:bg-gray-50 transition-colors
                                      group">

                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full flex items-center
                                        justify-center text-white text-xs
                                        font-bold shrink-0"
                             style={{ backgroundColor: '#3c1a5b' }}>
                          {notif.recipient_name?.[0]?.toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5
                                          flex-wrap">
                            <p className="text-sm font-semibold
                                          text-gray-900 truncate">
                              {notif.title}
                            </p>
                            <span className={`text-xs px-2 py-0.5
                                             rounded-full font-medium
                                             shrink-0 ${
                              notif.is_read
                                ? 'bg-gray-100 text-gray-500'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {notif.is_read ? 'Read' : 'Unread'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1
                                          flex-wrap">
                            <span className="text-xs font-medium truncate"
                                  style={{ color: '#3c1a5b' }}>
                              → {notif.recipient_name}
                            </span>
                            <span className="text-xs px-1.5 py-0.5
                                             rounded-full font-medium
                                             capitalize shrink-0"
                                  style={{
                                    backgroundColor: badge.bg,
                                    color: badge.color
                                  }}>
                              {notif.recipient_role}
                            </span>
                            <span className="text-xs text-gray-400
                                             shrink-0">
                              {formatDate(notif.created_at)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => deleteMutation.mutate(notif.id)}
                          className="p-1.5 rounded-lg text-gray-300
                                     hover:text-red-500 hover:bg-red-50
                                     transition-colors opacity-0
                                     group-hover:opacity-100 shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
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
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;