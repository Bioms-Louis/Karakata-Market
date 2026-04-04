import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';
import {
  Bell, CheckCheck, Trash2, Package,
  ShoppingBag, Store, AlertCircle, Info
} from 'lucide-react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../../api/notifications.api';
import Spinner from '../../components/common/Spinner';

// ─────────────────────────────────────────────
// NOTIFICATION ICON BY TYPE
// ─────────────────────────────────────────────
const NotifIcon = ({ type }) => {
  const config = {
    order:    { icon: <ShoppingBag size={18} />, bg: '#dbeafe', color: '#1e40af' },
    delivery: { icon: <Package size={18} />,     bg: '#dcfce7', color: '#166534' },
    vendor:   { icon: <Store size={18} />,       bg: '#ede9fe', color: '#5b21b6' },
    alert:    { icon: <AlertCircle size={18} />, bg: '#fee2e2', color: '#991b1b' },
    info:     { icon: <Info size={18} />,        bg: '#f0fdf4', color: '#166534' },
  }[type] || { icon: <Bell size={18} />, bg: '#f5f0fa', color: '#3c1a5b' };

  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center
                    flex-shrink-0"
         style={{ backgroundColor: config.bg, color: config.color }}>
      {config.icon}
    </div>
  );
};

// ─────────────────────────────────────────────
// SINGLE NOTIFICATION ROW
// ─────────────────────────────────────────────
const NotifRow = ({ notif, onRead, onDelete }) => (
  <div
    className={`flex items-start gap-4 p-4 rounded-2xl border
                transition-all cursor-pointer group
                ${!notif.is_read
                  ? 'border-purple-100 bg-purple-50/50'
                  : 'border-gray-100 bg-white hover:bg-gray-50'}`}
    onClick={() => !notif.is_read && onRead(notif.id)}
  >
    <NotifIcon type={notif.type} />

    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-sm ${
            !notif.is_read
              ? 'font-bold text-gray-900'
              : 'font-medium text-gray-700'
          }`}>
            {notif.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
            {notif.message}
          </p>
          <p className="text-xs text-gray-400 mt-1.5">
            {formatDate(notif.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Unread dot */}
          {!notif.is_read && (
            <div className="w-2 h-2 rounded-full flex-shrink-0"
                 style={{ backgroundColor: '#3c1a5b' }} />
          )}

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notif.id);
            }}
            className="p-1.5 rounded-lg text-gray-300
                       hover:text-red-500 hover:bg-red-50
                       transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// MAIN NOTIFICATIONS PAGE
// ─────────────────────────────────────────────
const NotificationsPage = () => {
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => getNotifications({
      unreadOnly: filter === 'unread'
    }),
    select: (res) => res.data.data
  });

  const readMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const readAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted.');
    }
  });

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="text-sm font-bold px-2.5 py-1
                                 rounded-full text-white"
                      style={{ backgroundColor: '#3c1a5b' }}>
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Stay up to date with your orders and account activity
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl
                         text-sm font-semibold transition-colors
                         hover:bg-purple-50 disabled:opacity-50"
              style={{ color: '#3c1a5b' }}
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5">
          {['all', 'unread'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium
                          capitalize transition-all ${
                filter === f
                  ? 'text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
              style={filter === f ? { backgroundColor: '#3c1a5b' } : {}}
            >
              {f === 'all' ? 'All' : `Unread${unreadCount > 0
                ? ` (${unreadCount})` : ''}`}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <Spinner center />
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center
                          py-20 text-center">
            <div className="w-20 h-20 rounded-full flex items-center
                            justify-center mb-5"
                 style={{ backgroundColor: '#f5f0fa' }}>
              <Bell size={36} style={{ color: '#3c1a5b' }}
                   className="opacity-40" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet'}
            </h3>
            <p className="text-gray-500 text-sm">
              {filter === 'unread'
                ? "You're all caught up!"
                : "Notifications about your orders will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <NotifRow
                key={notif.id}
                notif={notif}
                onRead={(id) => readMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;