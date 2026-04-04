import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  User, Lock, MapPin, Plus, Trash2,
  Star, CheckCircle, Home, Briefcase,
  Edit2, Shield
} from 'lucide-react';
import { getMe, changePassword } from '../../api/auth.api';
import {
  getAddresses, addAddress,
  deleteAddress, setDefaultAddress
} from '../../api/addresses.api';
import useAuthStore from '../../store/authStore';

// ─────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────
const Section = ({ title, subtitle, icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
           style={{ backgroundColor: '#f5f0fa' }}>
        <span style={{ color: '#3c1a5b' }}>{icon}</span>
      </div>
      <div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
    {children}
  </div>
);

// ─────────────────────────────────────────────
// INPUT COMPONENT
// ─────────────────────────────────────────────
const FormInput = ({ label, error, required, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input
      className={`w-full px-4 py-3 rounded-xl border text-sm outline-none
                  transition-all focus:ring-2 focus:ring-yellow-400
                  focus:border-transparent
                  ${error
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-200 bg-gray-50'}`}
      {...props}
    />
    {error && (
      <p className="mt-1 text-xs text-red-500">{error.message}</p>
    )}
  </div>
);

// ─────────────────────────────────────────────
// TAB NAVIGATION
// ─────────────────────────────────────────────
const tabs = [
  { key: 'profile', label: 'Personal Info', icon: <User size={16} /> },
  { key: 'password', label: 'Password', icon: <Lock size={16} /> },
  { key: 'addresses', label: 'Addresses', icon: <MapPin size={16} /> },
];

// ─────────────────────────────────────────────
// PERSONAL INFO TAB
// ─────────────────────────────────────────────
const PersonalInfoTab = ({ user, onUpdate }) => {
  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    }
  });

  // For now updates local state — hook up to PATCH /users/me when ready
  const onSubmit = (data) => {
    // Update Zustand store
    updateUser({
      ...user,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone
    });
    toast.success('Profile updated successfully!');
  };

  return (
    <Section
      title="Personal Information"
      subtitle="Update your name, email and phone number"
      icon={<User size={20} />}
    >
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center
                        text-white text-2xl font-bold flex-shrink-0"
             style={{ backgroundColor: '#3c1a5b' }}>
          {user?.first_name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="inline-block mt-1.5 text-xs font-semibold px-3
                           py-1 rounded-full capitalize"
                style={{
                  backgroundColor: user?.role === 'admin'
                    ? '#fef3c7' : user?.role === 'vendor'
                    ? '#ede9fe' : '#f0fdf4',
                  color: user?.role === 'admin'
                    ? '#92400e' : user?.role === 'vendor'
                    ? '#5b21b6' : '#166534'
                }}>
            {user?.role}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="First Name"
            required
            placeholder="John"
            error={errors.firstName}
            {...register('firstName', { required: 'Required' })}
          />
          <FormInput
            label="Last Name"
            required
            placeholder="Doe"
            error={errors.lastName}
            {...register('lastName', { required: 'Required' })}
          />
        </div>

        <FormInput
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          disabled
          error={errors.email}
          {...register('email')}
        />
        <p className="text-xs text-gray-400 -mt-2">
          Email cannot be changed for security reasons.
        </p>

        <FormInput
          label="Phone Number"
          type="tel"
          placeholder="08012345678"
          error={errors.phone}
          {...register('phone')}
        />

        <button
          type="submit"
          disabled={!isDirty}
          className="px-8 py-3 rounded-xl font-bold text-sm transition-all
                     hover:opacity-90 disabled:opacity-40
                     disabled:cursor-not-allowed"
          style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
        >
          Save Changes
        </button>
      </form>
    </Section>
  );
};

// ─────────────────────────────────────────────
// CHANGE PASSWORD TAB
// ─────────────────────────────────────────────
const PasswordTab = () => {
  const [showPasswords, setShowPasswords] = useState({
    current: false, new: false, confirm: false
  });

  const {
    register, handleSubmit, watch, reset,
    formState: { errors }
  } = useForm();

  const newPassword = watch('newPassword');

  const changeMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully!');
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to change password.');
    }
  });

  const onSubmit = (data) => {
    changeMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    });
  };

  const PasswordInput = ({ name, label, placeholder }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPasswords[name] ? 'text' : 'password'}
          placeholder={placeholder}
          className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm
                      outline-none transition-all focus:ring-2
                      focus:ring-yellow-400 focus:border-transparent
                      ${errors[name]
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 bg-gray-50'}`}
          {...register(name, {
            required: 'This field is required',
            ...(name === 'newPassword' && {
              minLength: {
                value: 8,
                message: 'At least 8 characters required'
              }
            }),
            ...(name === 'confirmPassword' && {
              validate: (v) => v === newPassword || 'Passwords do not match'
            })
          })}
        />
        <button
          type="button"
          onClick={() => setShowPasswords(p => ({
            ...p, [name]: !p[name]
          }))}
          className="absolute right-3 top-1/2 -translate-y-1/2
                     text-gray-400 hover:text-gray-600 text-xs font-medium"
        >
          {showPasswords[name] ? 'Hide' : 'Show'}
        </button>
      </div>
      {errors[name] && (
        <p className="mt-1 text-xs text-red-500">{errors[name].message}</p>
      )}
    </div>
  );

  return (
    <Section
      title="Change Password"
      subtitle="Keep your account secure with a strong password"
      icon={<Lock size={20} />}
    >
      {/* Security Tips */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
        <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
          <Shield size={14} />
          Password Tips
        </p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• At least 8 characters long</li>
          <li>• Mix of uppercase and lowercase letters</li>
          <li>• Include numbers and special characters</li>
          <li>• Don't reuse recent passwords</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordInput
          name="currentPassword"
          label="Current Password"
          placeholder="Enter current password"
        />
        <PasswordInput
          name="newPassword"
          label="New Password"
          placeholder="Min. 8 characters"
        />
        <PasswordInput
          name="confirmPassword"
          label="Confirm New Password"
          placeholder="Repeat new password"
        />

        <button
          type="submit"
          disabled={changeMutation.isPending}
          className="px-8 py-3 rounded-xl font-bold text-sm transition-all
                     hover:opacity-90 disabled:opacity-50
                     disabled:cursor-not-allowed"
          style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
        >
          {changeMutation.isPending ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </Section>
  );
};

// ─────────────────────────────────────────────
// ADDRESS CARD
// ─────────────────────────────────────────────
const AddressCard = ({ address, onDelete, onSetDefault, isDeleting }) => {
  const icons = {
    Home: <Home size={14} />,
    Office: <Briefcase size={14} />,
    Other: <MapPin size={14} />
  };

  return (
    <div className={`relative p-4 rounded-xl border-2 transition-all
                     ${address.is_default
                       ? 'shadow-sm'
                       : 'border-gray-200'}`}
         style={address.is_default
           ? { borderColor: '#3c1a5b', backgroundColor: '#faf7ff' }
           : {}}>

      {/* Label Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold
                         px-3 py-1 rounded-full"
              style={{
                backgroundColor: address.is_default ? '#3c1a5b' : '#f3f4f6',
                color: address.is_default ? '#fff' : '#6b7280'
              }}>
          {icons[address.label] || <MapPin size={12} />}
          {address.label}
        </span>

        {address.is_default && (
          <span className="text-xs font-semibold flex items-center gap-1"
                style={{ color: '#ffc70e' }}>
            <Star size={12} fill="#ffc70e" stroke="none" />
            Default
          </span>
        )}
      </div>

      {/* Address Details */}
      <div className="space-y-0.5 mb-4">
        <p className="text-sm font-semibold text-gray-900">
          {address.full_name}
        </p>
        <p className="text-xs text-gray-500">{address.phone}</p>
        <p className="text-xs text-gray-600">{address.address}</p>
        <p className="text-xs text-gray-600">
          {address.city}, {address.state}, {address.country}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!address.is_default && (
          <button
            onClick={() => onSetDefault(address.id)}
            className="flex-1 py-2 text-xs font-semibold rounded-lg
                       border transition-colors hover:bg-gray-50"
            style={{ borderColor: '#3c1a5b', color: '#3c1a5b' }}
          >
            Set as Default
          </button>
        )}
        <button
          onClick={() => onDelete(address.id)}
          disabled={isDeleting || address.is_default}
          className="p-2 rounded-lg text-gray-400 hover:text-red-500
                     hover:bg-red-50 transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
          title={address.is_default
            ? 'Cannot delete default address'
            : 'Delete address'}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ADD ADDRESS FORM
// ─────────────────────────────────────────────
const AddAddressForm = ({ onSave, onCancel, isSaving }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { label: 'Home' }
  });

  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
    'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
    'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa',
    'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
    'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
    'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];

  const inputClass = (hasError) => `
    w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
    focus:ring-2 focus:ring-yellow-400 focus:border-transparent
    ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}
  `;

  return (
    <div className="border-2 border-dashed border-purple-200 rounded-2xl
                    p-5 space-y-4"
         style={{ backgroundColor: '#faf7ff' }}>
      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
        <Plus size={16} style={{ color: '#3c1a5b' }} />
        Add New Address
      </h4>

      {/* Address Type */}
      <div className="flex gap-4">
        {['Home', 'Office', 'Other'].map((label) => (
          <label key={label}
                 className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" value={label}
                   {...register('label')}
                   defaultChecked={label === 'Home'}
                   className="accent-purple-700" />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      {/* Name & Phone */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input type="text" placeholder="Full Name *"
                 className={inputClass(errors.fullName)}
                 {...register('fullName', { required: true })} />
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-500">Required</p>
          )}
        </div>
        <div>
          <input type="tel" placeholder="Phone Number *"
                 className={inputClass(errors.phone)}
                 {...register('phone', { required: true })} />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">Required</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div>
        <textarea placeholder="Street address, house number, area *"
                  rows={2}
                  className={inputClass(errors.address)}
                  {...register('address', { required: true })} />
        {errors.address && (
          <p className="mt-1 text-xs text-red-500">Required</p>
        )}
      </div>

      {/* City & State */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input type="text" placeholder="City *"
                 className={inputClass(errors.city)}
                 {...register('city', { required: true })} />
          {errors.city && (
            <p className="mt-1 text-xs text-red-500">Required</p>
          )}
        </div>
        <div>
          <select className={inputClass(errors.state)}
                  {...register('state', { required: true })}>
            <option value="">Select State *</option>
            {nigerianStates.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.state && (
            <p className="mt-1 text-xs text-red-500">Required</p>
          )}
        </div>
      </div>

      {/* Set as Default */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" {...register('isDefault')}
               className="accent-purple-700 w-4 h-4" />
        <span className="text-sm text-gray-700">Set as default address</span>
      </label>

      {/* Buttons */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium
                           border border-gray-200 hover:bg-gray-100
                           transition-colors bg-white">
          Cancel
        </button>
        <button type="button"
                onClick={handleSubmit(onSave)}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold
                           text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#3c1a5b' }}>
          {isSaving ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ADDRESSES TAB
// ─────────────────────────────────────────────
const AddressesTab = () => {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: addressesData, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
    select: (res) => res.data.data.addresses
  });

  const addMutation = useMutation({
    mutationFn: addAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowForm(false);
      toast.success('Address saved!');
    },
    onError: () => toast.error('Failed to save address.')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address deleted.');
    },
    onError: () => toast.error('Failed to delete address.')
  });

  const defaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Default address updated!');
    },
    onError: () => toast.error('Failed to update default address.')
  });

  const addresses = addressesData || [];

  return (
    <Section
      title="Saved Addresses"
      subtitle="Manage your delivery addresses"
      icon={<MapPin size={20} />}
    >
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i}
                 className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.length === 0 && !showForm && (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full flex items-center
                              justify-center mx-auto mb-4"
                   style={{ backgroundColor: '#f5f0fa' }}>
                <MapPin size={28} style={{ color: '#3c1a5b' }}
                        className="opacity-50" />
              </div>
              <p className="text-gray-500 text-sm mb-1">
                No addresses saved yet
              </p>
              <p className="text-gray-400 text-xs">
                Add an address to speed up checkout
              </p>
            </div>
          )}

          {/* Address Cards */}
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onDelete={(id) => deleteMutation.mutate(id)}
              onSetDefault={(id) => defaultMutation.mutate(id)}
              isDeleting={deleteMutation.isPending}
            />
          ))}

          {/* Add Form */}
          {showForm ? (
            <AddAddressForm
              onSave={(data) => addMutation.mutate(data)}
              onCancel={() => setShowForm(false)}
              isSaving={addMutation.isPending}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3.5 rounded-xl border-2 border-dashed
                         text-sm font-semibold flex items-center
                         justify-center gap-2 transition-colors
                         hover:bg-purple-50"
              style={{ borderColor: '#3c1a5b', color: '#3c1a5b' }}
            >
              <Plus size={18} />
              Add New Address
            </button>
          )}
        </div>
      )}
    </Section>
  );
};

// ─────────────────────────────────────────────
// MAIN PROFILE PAGE
// ─────────────────────────────────────────────
const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuthStore();

  const { data: freshUser } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    select: (res) => res.data.data.user
  });

  const currentUser = freshUser || user;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your personal information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Sidebar Tabs ─────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100
                            shadow-sm p-3">

              {/* User Summary */}
              <div className="flex items-center gap-3 p-3 mb-2">
                <div className="w-12 h-12 rounded-full flex items-center
                                justify-center text-white font-bold
                                flex-shrink-0"
                     style={{ backgroundColor: '#3c1a5b' }}>
                  {currentUser?.first_name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {currentUser?.first_name} {currentUser?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser?.email}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-2 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3
                                rounded-xl text-sm font-medium transition-all
                                text-left ${activeTab === tab.key
                                  ? 'text-white'
                                  : 'text-gray-600 hover:bg-gray-50'}`}
                    style={activeTab === tab.key
                      ? { backgroundColor: '#3c1a5b' }
                      : {}}
                  >
                    <span className={activeTab === tab.key
                      ? 'text-yellow-400' : 'text-gray-400'}>
                      {tab.icon}
                    </span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Tab Content ──────────────── */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <PersonalInfoTab user={currentUser} />
            )}
            {activeTab === 'password' && <PasswordTab />}
            {activeTab === 'addresses' && <AddressesTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;