import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { loginUser } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';
import logo from '../../assets/logo.png';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data.data;
      login(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.first_name}! 👋`);

      // Role-based redirect after login
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'vendor') {
        navigate('/vendor/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Invalid email or password.');
    }
  });

  const onSubmit = (data) => loginMutation.mutate(data);

  const perks = [
    'Track your orders in real time',
    'Save items to your wishlist',
    'Faster checkout every time',
    'Exclusive deals for members'
  ];

  return (
    <div className="min-h-screen flex">

      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex w-2/5 flex-col justify-center px-12"
        style={{ backgroundColor: '#3c1a5b' }}
      >
        <div className="mb-12">
          <img src={logo} alt="Karakata Market" className="h-50 w-auto" />
        </div>

        <h2 className="text-4xl font-bold text-white leading-tight mb-4">
          Welcome<br />
          <span style={{ color: '#ffc70e' }}>back.</span>
        </h2>
        <p className="text-purple-200 mb-10 text-sm leading-relaxed">
          Sign in to continue shopping the best deals from verified vendors across Nigeria.
        </p>

        <div className="space-y-4">
          {perks.map((perk, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle
                className="w-5 h-5 shrink-0"
                style={{ color: '#ffc70e' }}
              />
              <span className="text-purple-100 text-sm">{perk}</span>
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

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Sign in to your account
          </h1>
          <p className="text-gray-500 text-sm mb-7">
            Enter your credentials to continue shopping.
          </p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

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

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-gray-700">
                    Password
                  </label>
                  <span
                    className="text-xs cursor-pointer hover:underline"
                    style={{ color: '#3c1a5b' }}
                  >
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className={`w-full px-3 py-2.5 pr-10 rounded-xl border text-sm
                      outline-none transition-all
                      focus:ring-2 focus:ring-yellow-400 focus:border-transparent
                      ${errors.password
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 bg-gray-50'}`}
                    {...register('password', {
                      required: 'Password is required'
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm
                  transition-all duration-200 disabled:opacity-60
                  disabled:cursor-not-allowed mt-2"
                style={{
                  backgroundColor: '#ffc70e',
                  color: '#3c1a5b'
                }}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                              stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>

            </form>
          </div>

          <p className="text-center mt-5 text-sm text-gray-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold hover:underline"
              style={{ color: '#3c1a5b' }}
            >
              Create one free
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;