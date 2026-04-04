import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Store, MapPin, FileText, CheckCircle,
  ArrowRight, User, Lock, Eye, EyeOff,
  CreditCard, ChevronRight, ShoppingBag,
  Star, Shield, Zap
} from 'lucide-react';
import { applyAsVendor } from '../../api/vendors.api';
import useAuthStore from '../../store/authStore';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue',
  'Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu',
  'FCT - Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina',
  'Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo',
  'Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'
];

const inputClass = (hasError) => `
  w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
  focus:ring-2 focus:ring-yellow-400 focus:border-transparent
  ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}
`;

const Field = ({ label, required, error, hint, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
  </div>
);

const Section = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
      <span style={{ color: '#3c1a5b' }}>{icon}</span>
      {title}
    </h2>
    {children}
  </div>
);

// SUCCESS SCREEN
const SuccessScreen = ({ isExistingUser }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100
                      p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center
                        mx-auto mb-6"
             style={{ backgroundColor: '#f0fdf4' }}>
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Application Submitted!
        </h2>
        <p className="text-gray-500 text-sm mb-2">
          Your vendor application is under review. We'll notify you
          once it's approved — usually within 24 hours.
        </p>
        {!isExistingUser && (
          <p className="text-gray-400 text-xs mb-2">
            Your account has been sucessfully created. You can now log in while you await store approval.
          </p>
        )}
        <p className="text-gray-400 text-xs mb-8">
          You'll receive a notification when your store goes live.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="w-full py-3.5 rounded-xl font-bold text-sm
                     transition-all hover:opacity-90"
          style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
        >
          Login to Dashboard
        </button>
      </div>
    </div>
  );
};

// MAIN PAGE
const VendorRegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register, handleSubmit, watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      firstName: user?.first_name || '',
      lastName:  user?.last_name  || '',
      email:     user?.email      || '',
    }
  });

  const applyMutation = useMutation({
    mutationFn: (data) => {
      if (isAuthenticated) {
        // Use the existing /register endpoint for logged-in users
        const { registerVendor } = require('../../api/vendors.api');
        return registerVendor({
          storeName:        data.storeName,
          storeDescription: data.storeDescription,
          businessEmail:    data.businessEmail,
          businessPhone:    data.businessPhone,
          businessAddress:  `${data.address}, ${data.city}, ${data.state}`,
          bankName:         data.bankName,
          accountNumber:    data.accountNumber,
          accountName:      data.accountName,
        });
      }
      // New user — use /apply endpoint
      return applyAsVendor({
        firstName:        data.firstName,
        lastName:         data.lastName,
        email:            data.email,
        password:         data.password,
        storeName:        data.storeName,
        storeDescription: data.storeDescription,
        businessEmail:    data.businessEmail || data.email,
        businessPhone:    data.businessPhone,
        businessAddress:  `${data.address}, ${data.city}, ${data.state}`,
        bankName:         data.bankName,
        accountNumber:    data.accountNumber,
        accountName:      data.accountName,
      });
    },
    onSuccess: () => setSubmitted(true),
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to submit application.'),
  });

  if (submitted) return <SuccessScreen isExistingUser={isAuthenticated} />;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Banner */}
      <div className="py-14 px-4 text-center text-white"
           style={{ background: 'linear-gradient(135deg, #3c1a5b 0%, #5a2d82 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          text-xs font-bold mb-4"
               style={{ backgroundColor: 'rgba(255,199,14,0.15)', color: '#ffc70e' }}>
            <Zap size={12} /> Free to join — No hidden fees
          </div>
          <h1 className="text-4xl font-extrabold mb-3">
            Start Selling on Karakata
          </h1>
          <p className="text-purple-200 max-w-lg mx-auto">
            Join thousands of vendors reaching millions of customers across Nigeria.
            Fill in your details below to get started.
          </p>

          {/* Perks */}
          <div className="flex items-center justify-center gap-8 mt-8 flex-wrap">
            {[
              { icon: <ShoppingBag size={16} />, text: 'Millions of buyers' },
              { icon: <Star size={16} />,        text: 'Free registration' },
              { icon: <Shield size={16} />,      text: 'Secure payouts' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm
                                         text-purple-200">
                <span style={{ color: '#ffc70e' }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-10 space-y-6">

        {/* Already have an account? */}
        {!isAuthenticated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4
                          flex items-center justify-between gap-4">
            <p className="text-sm text-yellow-800">
              Already have a Karakata account?{' '}
              <Link to="/login" className="font-bold underline">
                Log in first
              </Link>
              {' '}then apply as a vendor.
            </p>
            <Link to="/login"
                  className="shrink-0 flex items-center gap-1 text-xs font-bold
                             px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}>
              Log in <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* Account Details — only for new users */}
        {!isAuthenticated && (
          <Section title="Your Account" icon={<User size={18} />}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" required error={errors.firstName}>
                  <input type="text" placeholder="John"
                         className={inputClass(errors.firstName)}
                         {...register('firstName', { required: 'Required' })} />
                </Field>
                <Field label="Last Name" required error={errors.lastName}>
                  <input type="text" placeholder="Doe"
                         className={inputClass(errors.lastName)}
                         {...register('lastName', { required: 'Required' })} />
                </Field>
              </div>
              <Field label="Email Address" required error={errors.email}>
                <input type="email" placeholder="you@example.com"
                       className={inputClass(errors.email)}
                       {...register('email', {
                         required: 'Email is required',
                         pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                       })} />
              </Field>
              <Field label="Password" required error={errors.password}>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'}
                         placeholder="Min 8 characters"
                         className={inputClass(errors.password) + ' pr-12'}
                         {...register('password', {
                           required: 'Password is required',
                           minLength: { value: 8, message: 'Min 8 characters' }
                         })} />
                  <button type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm Password" required error={errors.confirmPassword}>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'}
                         placeholder="Repeat your password"
                         className={inputClass(errors.confirmPassword) + ' pr-12'}
                         {...register('confirmPassword', {
                           required: 'Please confirm password',
                           validate: (v) => v === watch('password') || 'Passwords do not match'
                         })} />
                  <button type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>
            </div>
          </Section>
        )}

        {/* Store Information */}
        <Section title="Store Information" icon={<Store size={18} />}>
          <div className="space-y-4">
            <Field label="Store Name" required error={errors.storeName}>
              <input type="text" placeholder="e.g. John's Electronics"
                     className={inputClass(errors.storeName)}
                     {...register('storeName', {
                       required: 'Store name is required',
                       minLength: { value: 3, message: 'Min 3 characters' }
                     })} />
            </Field>
            <Field label="Store Description" required error={errors.storeDescription}
                   hint="Tell customers what you sell and what makes your store special">
              <textarea rows={4}
                        placeholder="Describe your store, products, and what makes you unique..."
                        className={inputClass(errors.storeDescription)}
                        {...register('storeDescription', {
                          required: 'Description is required',
                          minLength: { value: 20, message: 'Please write at least 20 characters' }
                        })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Business Phone" required error={errors.businessPhone}>
                <input type="tel" placeholder="08012345678"
                       className={inputClass(errors.businessPhone)}
                       {...register('businessPhone', {
                         required: 'Phone is required',
                         pattern: { value: /^[0-9]{10,11}$/, message: 'Enter valid Nigerian number' }
                       })} />
              </Field>
              <Field label="Business Email" error={errors.businessEmail}
                     hint="Leave blank to use your account email">
                <input type="email" placeholder="store@example.com"
                       className={inputClass(errors.businessEmail)}
                       {...register('businessEmail', {
                         pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                       })} />
              </Field>
            </div>
          </div>
        </Section>

        {/* Store Address */}
        <Section title="Store Address" icon={<MapPin size={18} />}>
          <div className="space-y-4">
            <Field label="Street Address" required error={errors.address}>
              <textarea rows={2} placeholder="Shop number, street, area..."
                        className={inputClass(errors.address)}
                        {...register('address', { required: 'Address is required' })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" required error={errors.city}>
                <input type="text" placeholder="Lagos"
                       className={inputClass(errors.city)}
                       {...register('city', { required: 'City is required' })} />
              </Field>
              <Field label="State" required error={errors.state}>
                <select className={inputClass(errors.state)}
                        {...register('state', { required: 'State is required' })}>
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </Section>

        {/* Bank Details */}
        <Section title="Bank Details" icon={<CreditCard size={18} />}>
          <p className="text-xs text-gray-400 -mt-3 mb-5">
            For receiving payouts from your sales. This information is kept secure.
          </p>
          <div className="space-y-4">
            <Field label="Bank Name" required error={errors.bankName}>
              <input type="text" placeholder="e.g. First Bank of Nigeria"
                     className={inputClass(errors.bankName)}
                     {...register('bankName', { required: 'Bank name is required' })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Account Number" required error={errors.accountNumber}>
                <input type="text" placeholder="0123456789" maxLength={10}
                       className={inputClass(errors.accountNumber)}
                       {...register('accountNumber', {
                         required: 'Account number is required',
                         pattern: { value: /^[0-9]{10}$/, message: 'Must be 10 digits' }
                       })} />
              </Field>
              <Field label="Account Name" required error={errors.accountName}>
                <input type="text" placeholder="John Doe"
                       className={inputClass(errors.accountName)}
                       {...register('accountName', { required: 'Account name is required' })} />
              </Field>
            </div>
          </div>
        </Section>

        {/* Terms & Submit */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input type="checkbox"
                   className="w-5 h-5 mt-0.5 accent-purple-700 shrink-0"
                   {...register('terms', { required: 'You must accept the terms to continue' })} />
            <span className="text-sm text-gray-600">
              I agree to Karakata Market's{' '}
              <Link to="/vendor-terms" target="_blank"
                    className="font-semibold" style={{ color: '#3c1a5b' }}>
                Vendor Terms & Conditions
              </Link>{' '}
              and understand that my application will be reviewed before
              my store goes live.
            </span>
          </label>
          {errors.terms && (
            <p className="mb-4 text-xs text-red-500">{errors.terms.message}</p>
          )}

          <button
            onClick={handleSubmit((data) => applyMutation.mutate(data))}
            disabled={applyMutation.isPending}
            className="w-full py-4 rounded-xl font-bold text-sm
                       flex items-center justify-center gap-2
                       transition-all hover:opacity-90
                       disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
          >
            {applyMutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Submitting Application...
              </>
            ) : (
              <>
                Submit Application
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <p className="mt-4 text-center text-s text-gray-400">
            Already a vendor?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#3c1a5b' }}>
              Sign in to your dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorRegisterPage;
