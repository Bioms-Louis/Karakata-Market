import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {Eye, EyeOff, CheckCircle, ArrowLeft} from 'lucide-react';
import { registerUser } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';
import logo from '../../assets/logo.png';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data.data;
      login(user, accessToken, refreshToken);
      toast.success(`Welcome to the platform, ${user.first_name}! 🎉`);
      navigate('/', { replace: true });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Registration failed.');
    }
  });

  const onSubmit = (data) => {
    const { confirmPassword, ...submitData } = data;
    registerMutation.mutate(submitData);
  };

  const benefits = [
    'Shop from thousands of vendors',
    'Secure payments via Paystack',
    'Real-time order tracking',
    'Easy returns & refunds'
  ];

  return (
    <div className="min-h-screen flex">

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex w-2/5 flex-col justify-center px-12"
           style={{ backgroundColor: '#3c1a5b' }}>
        <div className="flex items-center gap-3 mb-12">
          <div className="mb-12">
                    <img src={logo} alt="Karakata Market" className="h-50 w-auto" />
                  </div>
        </div>

        <h2 className="text-4xl font-bold text-white leading-tight mb-4">
          Shop smarter,<br />
          <span style={{ color: '#ffc70e' }}>save bigger.</span>
        </h2>
        <p className="text-purple-200 mb-10 text-sm leading-relaxed">
          Join thousands of shoppers getting the best deals from verified vendors across Nigeria.
        </p>

        <div className="space-y-4">
          {benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 shrink-0"
                           style={{ color: '#ffc70e' }} />
              <span className="text-purple-100 text-sm">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="md:hidden w-16 h-16 rounded-xl inline-flex items-center justify-center" style={{ backgroundColor: '#3c1a5b' }}>
            <img src={logo} alt="Karakata Market Logo" className="w-40 h-auto" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-gray-500 text-sm mb-7">Free forever. No credit card required.</p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    First name
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm
                      outline-none transition-all
                      focus:ring-2 focus:ring-yellow-400 focus:border-transparent
                      ${errors.firstName
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 bg-gray-50'}`}
                    {...register('firstName', { required: 'Required' })}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Last name
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm
                      outline-none transition-all
                      focus:ring-2 focus:ring-yellow-400 focus:border-transparent
                      ${errors.lastName
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 bg-gray-50'}`}
                    {...register('lastName', { required: 'Required' })}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm
                    outline-none transition-all
                    focus:ring-2 focus:ring-yellow-400 focus:border-transparent
                    ${errors.email
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-200 bg-gray-50'}`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Phone number <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="08012345678"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200
                    bg-gray-50 text-sm outline-none transition-all
                    focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  {...register('phone')}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    className={`w-full px-3 py-2.5 pr-10 rounded-xl border text-sm
                      outline-none transition-all
                      focus:ring-2 focus:ring-yellow-400 focus:border-transparent
                      ${errors.password
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 bg-gray-50'}`}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'At least 8 characters required'
                      }
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                               text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Confirm password
                </label>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm
                    outline-none transition-all
                    focus:ring-2 focus:ring-yellow-400 focus:border-transparent
                    ${errors.confirmPassword
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-200 bg-gray-50'}`}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === password || 'Passwords do not match'
                  })}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Terms */}
              <p className="text-xs text-gray-400 leading-relaxed">
                By creating an account you agree to our{' '}
                <span className="underline cursor-pointer" style={{ color: '#3c1a5b' }}>
                  <Link to="/terms" target="_blank">
                    Terms of Service
                  </Link>
                </span>{' '}
                and{' '}
                <span className="underline cursor-pointer" style={{ color: '#3c1a5b' }}>
                  <Link to="/privacy" target="_blank">
                    Privacy Policy
                  </Link>
                </span>.
              </p>

              {/* Submit */}
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm
                  transition-all duration-200 disabled:opacity-60
                  disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#ffc70e',
                  color: '#3c1a5b'
                }}
              >
                {registerMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                              stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>

            </form>
          </div>

          <p className="text-center mt-5 text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login"
                  className="font-semibold hover:underline"
                  style={{ color: '#3c1a5b' }}>
              Login
            </Link>
          </p>

          <p className="text-center mt-10 text-sm text-gray-500">
            <Link
                to="/"
                className="font-semibold hover:underline inline-flex items-center gap-2"
                style={{ color: '#3c1a5b' }}
            >
              <ArrowLeft size={14} />
              Back to home
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;