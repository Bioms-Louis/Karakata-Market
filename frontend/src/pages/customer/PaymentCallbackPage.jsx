import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { verifyPayment } from '../../api/payments.api';

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get('reference') ||
                    searchParams.get('trxref');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['verify-payment', reference],
    queryFn: () => verifyPayment(reference),
    select: (res) => res.data.data,
    enabled: !!reference,
    retry: false
  });

  // Auto-redirect to orders after success
  useEffect(() => {
    if (data?.status === 'success' || data?.payment_status === 'paid') {
      const timer = setTimeout(() => {
        navigate('/orders');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [data, navigate]);

  // ── No reference in URL ────────────────────
  if (!reference) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100
                        p-10 max-w-md w-full text-center">
          <XCircle size={56} className="mx-auto mb-5 text-red-400" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Invalid Payment Link
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            No payment reference found. Please contact support if you
            believe this is an error.
          </p>
          <Link to="/"
                className="inline-block px-8 py-3 rounded-xl font-bold
                           text-sm"
                style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100
                        p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center
                          justify-center mx-auto mb-6"
               style={{ backgroundColor: '#f5f0fa' }}>
            <Loader size={36} className="animate-spin"
                    style={{ color: '#3c1a5b' }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Verifying Payment...
          </h2>
          <p className="text-gray-500 text-sm">
            Please wait while we confirm your payment with Paystack.
          </p>
        </div>
      </div>
    );
  }

  // ── Error / Failed ─────────────────────────
  const isSuccess = !isError &&
    (data?.status === 'success' || data?.payment_status === 'paid');

  if (isError || !isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100
                        p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center
                          justify-center mx-auto mb-6 bg-red-50">
            <XCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h2>
          <p className="text-gray-500 text-sm mb-2">
            Your payment could not be verified. This could be because the
            payment was cancelled or an error occurred.
          </p>
          {reference && (
            <p className="text-xs text-gray-400 mb-8 font-mono
                          bg-gray-50 px-3 py-2 rounded-lg">
              Ref: {reference}
            </p>
          )}
          <div className="space-y-3">
            <Link
              to="/orders"
              className="block w-full py-3.5 rounded-xl font-bold text-sm
                         transition-all hover:opacity-90"
              style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
            >
              View My Orders
            </Link>
            <Link
              to="/"
              className="block w-full py-3 rounded-xl text-sm font-medium
                         border border-gray-200 hover:bg-gray-50
                         transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100
                      p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full flex items-center
                        justify-center mx-auto mb-6 bg-green-50">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful! 🎉
        </h2>
        <p className="text-gray-500 text-sm mb-2">
          Your order has been confirmed and the vendor has been notified.
        </p>

        {data?.order_number && (
          <div className="my-5 p-4 bg-gray-50 rounded-2xl">
            <p className="text-xs text-gray-500 mb-1">Order Number</p>
            <p className="text-lg font-extrabold"
               style={{ color: '#3c1a5b' }}>
              {data.order_number}
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400 mb-6">
          Redirecting to your orders in a few seconds...
        </p>

        {/* Animated Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6
                        overflow-hidden">
          <div className="h-full rounded-full animate-[shrink_4s_linear]"
               style={{ backgroundColor: '#3c1a5b', width: '100%',
                        animation: 'width 4s linear forwards' }} />
        </div>

        <div className="space-y-3">
          <Link
            to="/orders"
            className="block w-full py-3.5 rounded-xl font-bold text-sm
                       transition-all hover:opacity-90"
            style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
          >
            View My Orders
          </Link>
          <Link
            to="/products"
            className="block w-full py-3 rounded-xl text-sm font-medium
                       border border-gray-200 hover:bg-gray-50
                       transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallbackPage;