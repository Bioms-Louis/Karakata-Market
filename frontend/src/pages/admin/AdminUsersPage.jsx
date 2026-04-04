import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Users, Search, Plus, Trash2, Edit2,
  Key, X, Check, Shield, ShoppingBag,
  User, ToggleLeft, ToggleRight
} from 'lucide-react';
import {
  getAdminUsers, createUser, deleteUser,
  updateUserRole, updateUserStatus, resetUserPassword
} from '../../api/admin.api';
import { formatDate } from '../../utils/formatDate';
import Spinner from '../../components/common/Spinner';

// HELPERS
const inputClass = (err) => `
  w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
  focus:ring-2 focus:ring-yellow-400 focus:border-transparent
  ${err ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}
`;

const roleBadge = {
  admin:    { bg: '#fef3c7', color: '#92400e', icon: <Shield size={11} /> },
  vendor:   { bg: '#ede9fe', color: '#5b21b6', icon: <ShoppingBag size={11} /> },
  customer: { bg: '#f0fdf4', color: '#166534', icon: <User size={11} /> },
};

// ADD USER MODAL
const AddUserModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: '', lastName: '', email: '',
      password: '', role: 'customer', phone: ''
    }
  });

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('User created successfully!');
      onClose();
    },
    onError: (err) => toast.error(
      err.response?.data?.message || 'Failed to create user.'
    )
  });

  const onSubmit = (data) => mutation.mutate(data);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b
                        border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add New User</h2>
          <button onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold
                                text-gray-700 mb-1.5">
                First Name <span className="text-red-400">*</span>
              </label>
              <input type="text" placeholder="John"
                     className={inputClass(errors.firstName)}
                     {...register('firstName', {
                       required: 'Required'
                     })} />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold
                                text-gray-700 mb-1.5">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input type="text" placeholder="Doe"
                     className={inputClass(errors.lastName)}
                     {...register('lastName', {
                       required: 'Required'
                     })} />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold
                              text-gray-700 mb-1.5">
              Email <span className="text-red-400">*</span>
            </label>
            <input type="email" placeholder="john@example.com"
                   className={inputClass(errors.email)}
                   {...register('email', {
                     required: 'Email is required',
                     pattern: {
                       value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                       message: 'Invalid email address'
                     }
                   })} />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold
                              text-gray-700 mb-1.5">
              Phone
              <span className="text-gray-400 font-normal ml-1">
                (optional)
              </span>
            </label>
            <input type="tel" placeholder="08012345678"
                   className={inputClass(false)}
                   {...register('phone')} />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold
                              text-gray-700 mb-1.5">
              Role <span className="text-red-400">*</span>
            </label>
            <select className={inputClass(errors.role)}
                    {...register('role', { required: 'Role is required' })}>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold
                              text-gray-700 mb-1.5">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                className={inputClass(errors.password)}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Min 6 characters'
                  }
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-xs text-gray-500 hover:text-gray-700"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
                    className="flex-1 py-3 rounded-xl text-sm font-medium
                               border border-gray-200 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={mutation.isPending}
              className="flex-1 py-3 rounded-xl font-bold text-sm
                         flex items-center justify-center gap-2
                         disabled:opacity-50 transition-all hover:opacity-90"
              style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
            >
              {mutation.isPending ? (
                <svg className="animate-spin h-4 w-4"
                     viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <><Plus size={16} />Create User</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// EDIT USER MODAL
const EditUserModal = ({ user, onClose }) => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('role');
  const [showPassword, setShowPassword] = useState(false);

  const { register: registerRole, handleSubmit: handleRoleSubmit } =
    useForm({ defaultValues: { role: user.role } });

  const { register: registerPwd, handleSubmit: handlePwdSubmit,
          formState: { errors: pwdErrors } } = useForm();

  const roleMutation = useMutation({
    mutationFn: (data) => updateUserRole(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Role updated!');
      onClose();
    },
    onError: (err) => toast.error(
      err.response?.data?.message || 'Failed to update role.'
    )
  });

  const pwdMutation = useMutation({
    mutationFn: (data) => resetUserPassword(user.id, data),
    onSuccess: () => {
      toast.success('Password reset successfully!');
      onClose();
    },
    onError: (err) => toast.error(
      err.response?.data?.message || 'Failed to reset password.'
    )
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b
                        border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Edit User
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {user.first_name} {user.last_name} · {user.email}
            </p>
          </div>
          <button onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 m-4 mb-0 bg-gray-100 rounded-xl">
          {['role', 'password'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold
                          capitalize transition-all ${
                tab === t
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500'
              }`}
            >
              {t === 'role' ? '🎭 Change Role' : '🔑 Reset Password'}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* Role Tab */}
          {tab === 'role' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Current role:
                <span className="font-bold ml-1 capitalize">
                  {user.role}
                </span>
              </p>

              <div>
                <label className="block text-xs font-semibold
                                  text-gray-700 mb-1.5">
                  New Role
                </label>
                <select
                  className={inputClass(false)}
                  {...registerRole('role')}
                >
                  <option value="customer">👤 Customer</option>
                  <option value="vendor">🏪 Vendor</option>
                  <option value="admin">🛡️ Admin</option>
                </select>
              </div>

              <div className="p-3 bg-yellow-50 rounded-xl border
                              border-yellow-200">
                <p className="text-xs text-yellow-800">
                  ⚠️ Upgrading to <strong>vendor</strong> will
                  auto-create a store profile. Upgrading to{' '}
                  <strong>admin</strong> grants full platform access.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={onClose}
                        className="flex-1 py-3 rounded-xl text-sm
                                   font-medium border border-gray-200
                                   hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleRoleSubmit((data) =>
                    roleMutation.mutate(data)
                  )}
                  disabled={roleMutation.isPending}
                  className="flex-1 py-3 rounded-xl font-bold text-sm
                             flex items-center justify-center gap-2
                             disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
                >
                  {roleMutation.isPending ? (
                    <svg className="animate-spin h-4 w-4"
                         viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12"
                              r="10" stroke="currentColor"
                              strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <><Check size={16} />Update Role</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {tab === 'password' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Set a new password for this user. They will need to use
                it on their next login.
              </p>

              <div>
                <label className="block text-xs font-semibold
                                  text-gray-700 mb-1.5">
                  New Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    className={inputClass(pwdErrors.newPassword)}
                    {...registerPwd('newPassword', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Min 6 characters'
                      }
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                               text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {pwdErrors.newPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    {pwdErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={onClose}
                        className="flex-1 py-3 rounded-xl text-sm
                                   font-medium border border-gray-200
                                   hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handlePwdSubmit((data) =>
                    pwdMutation.mutate(data)
                  )}
                  disabled={pwdMutation.isPending}
                  className="flex-1 py-3 rounded-xl font-bold text-sm
                             flex items-center justify-center gap-2
                             disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: '#3c1a5b', color: 'white' }}
                >
                  {pwdMutation.isPending ? (
                    <svg className="animate-spin h-4 w-4"
                         viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12"
                              r="10" stroke="currentColor"
                              strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <><Key size={16} />Reset Password</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// MAIN ADMIN USERS PAGE
const AdminUsersPage = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, page],
    queryFn: () => getAdminUsers({
      search,
      role: roleFilter === 'all' ? '' : roleFilter,
      page,
      limit: 15
    }),
    select: (res) => res.data.data
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateUserStatus(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated.');
    },
    onError: () => toast.error('Failed to update user.')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('User deactivated.');
    },
    onError: (err) => toast.error(
      err.response?.data?.message || 'Failed to deactivate user.'
    )
  });

  const handleDelete = (id, name) => {
    if (window.confirm(
      `Deactivate "${name}"? They will lose access to their account.`
    )) {
      deleteMutation.mutate(id);
    }
  };

  const users = data?.users || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage all platform users
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                     font-bold text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
        >
          <Plus size={18} />
          Add User
        </button>
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
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border
                       border-gray-200 text-sm outline-none focus:ring-2
                       focus:ring-yellow-400"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'customer', 'vendor', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => { setRoleFilter(role); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold
                          capitalize transition-all ${
                roleFilter === role
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={roleFilter === role
                ? { backgroundColor: '#3c1a5b' } : {}}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm overflow-hidden">
        {isLoading ? <Spinner center /> : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={40} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50
                            border-b border-gray-100 text-xs font-semibold
                            text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">User</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2 text-center">Role</div>
              <div className="col-span-2 text-center">Joined</div>
              <div className="col-span-1 text-center">Active</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>

            <div className="divide-y divide-gray-50">
              {users.map((user) => {
                const badge = roleBadge[user.role] || roleBadge.customer;
                return (
                  <div key={user.id}
                       className="grid grid-cols-12 gap-4 px-5 py-3.5
                                  items-center hover:bg-gray-50
                                  transition-colors">

                    {/* Name */}
                    <div className="col-span-3 flex items-center gap-3
                                    min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center
                                      justify-center text-white text-sm
                                      font-bold shrink-0"
                           style={{ backgroundColor: '#3c1a5b' }}>
                        {user.first_name?.[0]?.toUpperCase()}
                      </div>
                      <p className="text-sm font-medium text-gray-900
                                    truncate">
                        {user.first_name} {user.last_name}
                      </p>
                    </div>

                    {/* Email */}
                    <div className="col-span-3 min-w-0">
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* Role */}
                    <div className="col-span-2 flex justify-center">
                      <span className="inline-flex items-center gap-1
                                       px-2.5 py-1 rounded-full text-xs
                                       font-semibold capitalize"
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.color
                            }}>
                        {badge.icon}
                        {user.role}
                      </span>
                    </div>

                    {/* Joined */}
                    <div className="col-span-2 text-center">
                      <p className="text-xs text-gray-500">
                        {formatDate(user.created_at)}
                      </p>
                    </div>

                    {/* Active Toggle */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => toggleMutation.mutate({
                          id: user.id,
                          isActive: !user.is_active
                        })}
                        title={user.is_active
                          ? 'Click to deactivate'
                          : 'Click to activate'}
                      >
                        {user.is_active ? (
                          <ToggleRight size={26}
                                       style={{ color: '#3c1a5b' }} />
                        ) : (
                          <ToggleLeft size={26}
                                      className="text-gray-300" />
                        )}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center
                                    justify-center gap-1">
                      <button
                        onClick={() => setEditUser(user)}
                        className="p-1.5 rounded-lg text-gray-400
                                   hover:text-blue-500 hover:bg-blue-50
                                   transition-colors"
                        title="Edit role / reset password"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(
                          user.id,
                          `${user.first_name} ${user.last_name}`
                        )}
                        className="p-1.5 rounded-lg text-gray-400
                                   hover:text-red-500 hover:bg-red-50
                                   transition-colors"
                        title="Deactivate user"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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

      {/* Modals */}
      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
        />
      )}
    </div>
  );
};

export default AdminUsersPage;