import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  User, Store, Lock, Bell, Camera, Save, Eye, EyeOff
} from 'lucide-react';
import {
  getVendorProfile, updatePersonalInfo, updateStoreInfo,
  changePassword, updateNotificationPrefs
} from '../../api/vendors.api';
import Spinner from '../../components/common/Spinner';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const Section = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
      <span style={{ color: '#3c1a5b' }}>{icon}</span>
      {title}
    </h2>
    {children}
  </div>
);

const Field = ({ label, error, required, hint, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
  </div>
);

const inputClass = (hasError) => `
  w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
  focus:ring-2 focus:ring-yellow-400 focus:border-transparent
  ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}
`;

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                font-semibold transition-all ${
      active ? 'text-white' : 'text-gray-500 hover:bg-gray-100'
    }`}
    style={active ? { backgroundColor: '#3c1a5b' } : {}}
  >
    {icon}
    {label}
  </button>
);

// ─────────────────────────────────────────────
// PERSONAL INFO TAB
// ─────────────────────────────────────────────
const PersonalInfoTab = ({ profile }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.first_name || '',
        lastName:  profile.last_name  || '',
        email:     profile.email      || '',
        phone:     profile.phone      || '',
      });
    }
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: updatePersonalInfo,
    onSuccess: () => toast.success('Personal info updated!'),
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed.'),
  });

  return (
    <Section title="Personal Information" icon={<User size={18} />}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" required error={errors.firstName}>
            <input type="text" className={inputClass(errors.firstName)}
                   {...register('firstName', { required: 'Required' })} />
          </Field>
          <Field label="Last Name" required error={errors.lastName}>
            <input type="text" className={inputClass(errors.lastName)}
                   {...register('lastName', { required: 'Required' })} />
          </Field>
        </div>
        <Field label="Email Address" required error={errors.email}>
          <input type="email" className={inputClass(errors.email)}
                 {...register('email', {
                   required: 'Required',
                   pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                 })} />
        </Field>
        <Field label="Phone Number" hint="Include country code e.g. +234...">
          <input type="tel" placeholder="+234 800 000 0000"
                 className={inputClass(false)}
                 {...register('phone')} />
        </Field>

        <button
          onClick={handleSubmit((data) => mutation.mutate(data))}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold
                     text-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
        >
          <Save size={16} />
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </Section>
  );
};

// ─────────────────────────────────────────────
// STORE INFO TAB
// ─────────────────────────────────────────────
const StoreInfoTab = ({ profile }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (profile?.vendor) {
      reset({
        storeName:        profile.vendor.store_name        || '',
        storeDescription: profile.vendor.store_description || '',
        storeEmail:       profile.vendor.store_email       || '',
        storePhone:       profile.vendor.store_phone       || '',
        storeAddress:     profile.vendor.store_address     || '',
        logoUrl:          profile.vendor.logo_url          || '',
      });
    }
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: updateStoreInfo,
    onSuccess: () => toast.success('Store info updated!'),
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed.'),
  });

  return (
    <Section title="Store Information" icon={<Store size={18} />}>
      <div className="space-y-4">
        <Field label="Store Name" required error={errors.storeName}>
          <input type="text" placeholder="Your store name"
                 className={inputClass(errors.storeName)}
                 {...register('storeName', { required: 'Store name is required' })} />
        </Field>

        <Field label="Store Description"
               hint="Tell customers what your store is about">
          <textarea rows={4} placeholder="Describe your store..."
                    className={inputClass(false)}
                    {...register('storeDescription')} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Store Email">
            <input type="email" placeholder="store@example.com"
                   className={inputClass(false)}
                   {...register('storeEmail')} />
          </Field>
          <Field label="Store Phone">
            <input type="tel" placeholder="+234 800 000 0000"
                   className={inputClass(false)}
                   {...register('storePhone')} />
          </Field>
        </div>

        <Field label="Store Address">
          <input type="text" placeholder="Your store address"
                 className={inputClass(false)}
                 {...register('storeAddress')} />
        </Field>

        {/* <Field label="Store Logo URL"
               hint="Paste a direct image URL for your store logo">
          <input type="url" placeholder="https://..."
                 className={inputClass(false)}
                 {...register('logoUrl')} />
        </Field> */}

        <button
          onClick={handleSubmit((data) => mutation.mutate(data))}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold
                     text-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
        >
          <Save size={16} />
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </Section>
  );
};

// ─────────────────────────────────────────────
// CHANGE PASSWORD TAB
// ─────────────────────────────────────────────
const ChangePasswordTab = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully!');
      reset();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to change password.'),
  });

  const PasswordField = ({ label, name, show, onToggle, rules, error }) => (
    <Field label={label} required error={error}>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className={inputClass(error) + ' pr-12'}
          {...register(name, rules)}
        />
        <button type="button" onClick={onToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </Field>
  );

  return (
    <Section title="Change Password" icon={<Lock size={18} />}>
      <div className="space-y-4 max-w-md">
        <PasswordField
          label="Current Password" name="currentPassword"
          show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)}
          rules={{ required: 'Current password is required' }}
          error={errors.currentPassword}
        />
        <PasswordField
          label="New Password" name="newPassword"
          show={showNew} onToggle={() => setShowNew(!showNew)}
          rules={{
            required: 'New password is required',
            minLength: { value: 8, message: 'Min 8 characters' }
          }}
          error={errors.newPassword}
        />
        <PasswordField
          label="Confirm New Password" name="confirmPassword"
          show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)}
          rules={{
            required: 'Please confirm your password',
            validate: (val) => val === watch('newPassword') || 'Passwords do not match'
          }}
          error={errors.confirmPassword}
        />

        <button
          onClick={handleSubmit((data) => mutation.mutate({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          }))}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold
                     text-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
        >
          <Lock size={16} />
          {mutation.isPending ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </Section>
  );
};

// ─────────────────────────────────────────────
// NOTIFICATION PREFERENCES TAB
// ─────────────────────────────────────────────
const NotificationsTab = ({ profile }) => {
  const [prefs, setPrefs] = useState({
    emailNewOrder:     true,
    emailOrderUpdate:  true,
    emailLowStock:     true,
    emailNewReview:    false,
    emailPromotions:   false,
  });

  useEffect(() => {
    if (profile?.notificationPrefs) {
      setPrefs(prev => ({ ...prev, ...profile.notificationPrefs }));
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: updateNotificationPrefs,
    onSuccess: () => toast.success('Notification preferences saved!'),
    onError: () => toast.error('Failed to save preferences.'),
  });

  const Toggle = ({ label, desc, prefKey }) => (
    <div className="flex items-center justify-between py-3 border-b
                    border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => setPrefs(p => ({ ...p, [prefKey]: !p[prefKey] }))}
        className={`relative w-12 h-6 rounded-full transition-colors
                    flex-shrink-0 ${prefs[prefKey] ? '' : 'bg-gray-200'}`}
        style={prefs[prefKey] ? { backgroundColor: '#3c1a5b' } : {}}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full
                          shadow transition-transform ${
          prefs[prefKey] ? 'translate-x-6' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  );

  return (
    <Section title="Notification Preferences" icon={<Bell size={18} />}>
      <div className="space-y-1 mb-5">
        <Toggle prefKey="emailNewOrder"    label="New Order"
                desc="Get notified when you receive a new order" />
        <Toggle prefKey="emailOrderUpdate" label="Order Updates"
                desc="Status changes on your orders" />
        <Toggle prefKey="emailLowStock"    label="Low Stock Alert"
                desc="When a product drops below 5 units" />
        <Toggle prefKey="emailNewReview"   label="New Review"
                desc="When a customer leaves a review" />
        <Toggle prefKey="emailPromotions"  label="Promotions & Tips"
                desc="Platform updates and selling tips" />
      </div>

      <button
        onClick={() => mutation.mutate(prefs)}
        disabled={mutation.isPending}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold
                   text-sm transition-all hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
      >
        <Save size={16} />
        {mutation.isPending ? 'Saving...' : 'Save Preferences'}
      </button>
    </Section>
  );
};

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
const VendorProfilePage = () => {
  const [activeTab, setActiveTab] = useState('personal');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: getVendorProfile,
    select: (res) => res.data.data.profile,
  });

  if (isLoading) return <Spinner center />;

  const tabs = [
    { id: 'personal',       label: 'Personal Info',   icon: <User size={16} /> },
    { id: 'store',          label: 'Store Info',      icon: <Store size={16} /> },
    { id: 'password',       label: 'Password',        icon: <Lock size={16} /> },
    { id: 'notifications',  label: 'Notifications',   icon: <Bell size={16} /> },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your account and store information
        </p>
      </div>

      {/* Profile Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                      flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center
                        text-white text-xl font-bold flex-shrink-0"
             style={{ backgroundColor: '#3c1a5b' }}>
          {profile?.first_name?.[0]?.toUpperCase() || 'V'}
        </div>
        <div>
          <p className="font-bold text-gray-900">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="text-sm text-gray-500">{profile?.email}</p>
          <p className="text-xs mt-0.5 font-semibold"
             style={{ color: '#3c1a5b' }}>
            {profile?.vendor?.store_name || 'Your Store'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            icon={tab.icon}
            label={tab.label}
          />
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'personal'      && <PersonalInfoTab profile={profile} />}
      {activeTab === 'store'         && <StoreInfoTab profile={profile} />}
      {activeTab === 'password'      && <ChangePasswordTab />}
      {activeTab === 'notifications' && <NotificationsTab profile={profile} />}
    </div>
  );
};

export default VendorProfilePage;
