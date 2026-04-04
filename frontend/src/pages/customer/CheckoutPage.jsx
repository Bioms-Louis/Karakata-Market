import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  MapPin, CreditCard, ChevronRight,
  Shield, Lock, Package, CheckCircle,
  Plus, Home, Briefcase, Star
} from 'lucide-react';
import { getCart } from '../../api/cart.api';
import { createOrder , getShippingFee} from '../../api/orders.api';
import { initializePayment } from '../../api/payments.api';
import { getAddresses, addAddress } from '../../api/addresses.api';
import { formatCurrency } from '../../utils/formatCurrency';
import Spinner from '../../components/common/Spinner';

// ─────────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────────
const StepIndicator = ({ currentStep }) => {
  const steps = [
    { number: 1, label: 'Shipping', icon: <MapPin size={16} /> },
    { number: 2, label: 'Review', icon: <Package size={16} /> },
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-full flex items-center
                         justify-center font-bold text-sm transition-all"
              style={{
                backgroundColor: currentStep >= step.number
                  ? '#3c1a5b' : '#e5e7eb',
                color: currentStep >= step.number ? '#fff' : '#9ca3af'
              }}
            >
              {currentStep > step.number
                ? <CheckCircle size={18} />
                : step.icon}
            </div>
            <span className={`text-xs font-medium mt-1.5 ${
              currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
            }`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className="w-16 sm:w-24 h-0.5 mx-2 mb-5 transition-all"
              style={{
                backgroundColor: currentStep > step.number
                  ? '#3c1a5b' : '#e5e7eb'
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// SAVED ADDRESS CARD
// ─────────────────────────────────────────────
const AddressCard = ({ address, isSelected, onSelect }) => {
  const icons = {
    Home: <Home size={14} />,
    Office: <Briefcase size={14} />,
    default: <MapPin size={14} />
  };

  return (
    <button
      onClick={() => onSelect(address)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all
                  ${isSelected
                    ? 'shadow-sm'
                    : 'border-gray-200 hover:border-purple-200'}`}
      style={isSelected
        ? { borderColor: '#3c1a5b', backgroundColor: '#faf7ff' }
        : {}}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full
                             flex items-center gap-1"
                  style={{
                    backgroundColor: isSelected ? '#3c1a5b' : '#f3f4f6',
                    color: isSelected ? '#fff' : '#6b7280'
                  }}>
              {icons[address.label] || icons.default}
              {address.label}
            </span>
            {address.is_default && (
              <span className="text-xs font-medium flex items-center gap-1"
                    style={{ color: '#ffc70e' }}>
                <Star size={10} fill="#ffc70e" stroke="none" />
                Default
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {address.full_name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{address.phone}</p>
          <p className="text-xs text-gray-500">
            {address.address}, {address.city}, {address.state}
          </p>
        </div>
        {/* Selection indicator */}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center
                         justify-center shrink-0 mt-1 transition-all`}
             style={isSelected
               ? { borderColor: '#3c1a5b', backgroundColor: '#3c1a5b' }
               : { borderColor: '#d1d5db' }}>
          {isSelected && (
            <div className="w-2 h-2 rounded-full bg-white" />
          )}
        </div>
      </div>
    </button>
  );
};

// ─────────────────────────────────────────────
// ADD NEW ADDRESS FORM
// ─────────────────────────────────────────────
const AddAddressForm = ({ onSave, onCancel, isSaving }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

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
    <form onSubmit={handleSubmit(onSave)}
          className="border-2 border-dashed border-gray-200 rounded-xl p-5
                     space-y-4">
      <h4 className="text-sm font-bold text-gray-900">New Address</h4>

      {/* Label */}
      <div className="flex gap-3">
        {['Home', 'Office', 'Other'].map((label) => (
          <label key={label}
                 className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" value={label}
                   defaultChecked={label === 'Home'}
                   {...register('label')}
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
        </div>
        <div>
          <input type="tel" placeholder="Phone Number *"
                 className={inputClass(errors.phone)}
                 {...register('phone', { required: true })} />
        </div>
      </div>

      {/* Address */}
      <textarea placeholder="Delivery Address *" rows={2}
                className={inputClass(errors.address)}
                {...register('address', { required: true })} />

      {/* City & State */}
      <div className="grid grid-cols-2 gap-3">
        <input type="text" placeholder="City *"
               className={inputClass(errors.city)}
               {...register('city', { required: true })} />
        <select className={inputClass(errors.state)}
                {...register('state', { required: true })}>
          <option value="">Select State *</option>
          {nigerianStates.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Save as default */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" {...register('isDefault')}
               className="accent-purple-700 w-4 h-4" />
        <span className="text-sm text-gray-700">Set as default address</span>
      </label>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium
                           border border-gray-200 hover:bg-gray-50
                           transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold
                           transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#3c1a5b', color: '#fff' }}>
          {isSaving ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </form>
  );
};

// ─────────────────────────────────────────────
// STEP 1 — SHIPPING
// ─────────────────────────────────────────────
const ShippingStep = ({ onNext }) => {
  const queryClient = useQueryClient();
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [notes, setNotes] = useState('');

  // Fetch saved addresses
  const { data: addressesData, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
    select: (res) => res.data.data.addresses,
    onSuccess: (addresses) => {
      // Auto-select default address
      const defaultAddr = addresses.find(a => a.is_default);
      if (defaultAddr && !selectedAddress) {
        setSelectedAddress(defaultAddr);
      }
    }
  });

  const addresses = addressesData || [];

  // Auto-select default on load
  useState(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [addresses]);

  // Save new address mutation
  const saveAddressMutation = useMutation({
    mutationFn: addAddress,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      const newAddr = res.data.data.address;
      setSelectedAddress(newAddr);
      setShowNewForm(false);
      toast.success('Address saved!');
    },
    onError: () => toast.error('Failed to save address.')
  });

  const handleContinue = () => {
    if (!selectedAddress) {
      toast.error('Please select or add a delivery address.');
      return;
    }

    // Map saved address fields to order fields
    onNext({
      shippingName: selectedAddress.full_name,
      shippingPhone: selectedAddress.phone,
      shippingAddress: selectedAddress.address,
      shippingCity: selectedAddress.city,
      shippingState: selectedAddress.state,
      shippingCountry: selectedAddress.country || 'Nigeria',
      notes
    });
  };

  if (isLoading) return <Spinner center />;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5
                       flex items-center gap-2">
          <MapPin size={20} style={{ color: '#3c1a5b' }} />
          Select Delivery Address
        </h2>

        {/* Saved Addresses */}
        {addresses.length > 0 && (
          <div className="space-y-3 mb-4">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                isSelected={selectedAddress?.id === address.id}
                onSelect={setSelectedAddress}
              />
            ))}
          </div>
        )}

        {/* Add New Address */}
        {showNewForm ? (
          <AddAddressForm
            onSave={(data) => saveAddressMutation.mutate(data)}
            onCancel={() => setShowNewForm(false)}
            isSaving={saveAddressMutation.isPending}
          />
        ) : (
          <button
            onClick={() => setShowNewForm(true)}
            className="w-full py-3 rounded-xl border-2 border-dashed
                       text-sm font-medium flex items-center justify-center
                       gap-2 transition-colors hover:bg-gray-50"
            style={{ borderColor: '#3c1a5b', color: '#3c1a5b' }}
          >
            <Plus size={16} />
            {addresses.length === 0
              ? 'Add Your First Address'
              : 'Add New Address'}
          </button>
        )}

        {/* Order Notes */}
        {selectedAddress && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Order Notes{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special delivery instructions..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200
                         bg-gray-50 text-sm outline-none transition-all
                         focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        )}
      </div>

      <button
        onClick={handleContinue}
        disabled={!selectedAddress}
        className="w-full py-4 rounded-xl font-bold text-sm
                   flex items-center justify-center gap-2 transition-all
                   hover:opacity-90 disabled:opacity-40
                   disabled:cursor-not-allowed"
        style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
      >
        Continue to Review
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// STEP 2 — ORDER REVIEW
// ─────────────────────────────────────────────
const OrderReview = ({ shippingData, cartData, onBack, onPlaceOrder, isPlacing, shippingFee = 0 }) => {
  const total = (cartData?.summary?.subtotal || 0) + shippingFee;

  return (
    <div className="space-y-5">

      {/* Shipping Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <MapPin size={18} style={{ color: '#3c1a5b' }} />
            Delivering To
          </h2>
          <button onClick={onBack}
                  className="text-xs font-medium hover:underline"
                  style={{ color: '#3c1a5b' }}>
            Change
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 space-y-1">
          <p className="font-semibold">{shippingData.shippingName}</p>
          <p>{shippingData.shippingPhone}</p>
          <p>{shippingData.shippingAddress}</p>
          <p>{shippingData.shippingCity}, {shippingData.shippingState}</p>
          {shippingData.notes && (
            <p className="text-gray-500 italic mt-1">
              Note: {shippingData.notes}
            </p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4
                       flex items-center gap-2">
          <Package size={18} style={{ color: '#3c1a5b' }} />
          Order Items ({cartData?.summary?.totalQuantity})
        </h2>

        <div className="space-y-3">
          {cartData?.items?.map((item) => (
            <div key={item.id}
                 className="flex items-center gap-3 py-2 border-b
                            border-gray-50 last:border-0">
              <div className="w-12 h-12 rounded-lg overflow-hidden
                              bg-gray-100 shrink-0">
                {item.product_image ? (
                  <img src={item.product_image} alt={item.product_name}
                       className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full"
                       style={{ backgroundColor: '#f5f0fa' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.product_name}
                </p>
                {item.variant_name && (
                  <p className="text-xs text-gray-500">{item.variant_name}</p>
                )}
                <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-bold shrink-0"
                 style={{ color: '#3c1a5b' }}>
                {formatCurrency(parseFloat(item.unit_price) * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 space-y-2 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(cartData?.summary?.subtotal || 0)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Shipping</span>
            <span>{formatCurrency(shippingFee)}</span>
          </div>
          <div className="flex justify-between text-base font-bold
                          pt-2 border-t border-gray-100">
            <span>Total</span>
            <span style={{ color: '#3c1a5b' }}>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Paystack Notice */}
      <div className="bg-blue-50 rounded-2xl p-4 flex items-start gap-3
                      border border-blue-100">
        <Shield size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">
            Secure Payment via Paystack
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            You'll be redirected automatically to Paystack after placing
            your order. Cards, bank transfer and USSD accepted.
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 rounded-xl font-bold text-sm border-2
                     transition-colors hover:bg-gray-50"
          style={{ borderColor: '#3c1a5b', color: '#3c1a5b' }}
        >
          ← Back
        </button>
        <button
          onClick={onPlaceOrder}
          disabled={isPlacing}
          className="flex-grow py-3.5 px-8 rounded-xl font-bold text-sm
                     flex items-center justify-center gap-2 transition-all
                     hover:opacity-90 disabled:opacity-50
                     disabled:cursor-not-allowed"
          style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
        >
          {isPlacing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"
                   fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <Lock size={16} />
              Place Order & Pay Now
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CART SUMMARY SIDEBAR
// ─────────────────────────────────────────────
const CartSidebar = ({ cartData, shippingFee }) => {
  const total = (cartData?.summary?.subtotal || 0) + shippingFee;

  return (
    <div className="bg-white rounded-2xl border border-gray-100
                    shadow-sm p-5 sticky top-24">
      <h3 className="font-bold text-gray-900 mb-4">Cart Summary</h3>

      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {cartData?.items?.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0
                            overflow-hidden">
              {item.product_image ? (
                <img src={item.product_image} alt={item.product_name}
                     className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full"
                     style={{ backgroundColor: '#f5f0fa' }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">
                {item.product_name}
              </p>
              <p className="text-xs text-gray-400">x{item.quantity}</p>
            </div>
            <p className="text-xs font-bold shrink-0"
               style={{ color: '#3c1a5b' }}>
              {formatCurrency(parseFloat(item.unit_price) * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(cartData?.summary?.subtotal || 0)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Shipping</span>
          <span>{formatCurrency(shippingFee)}</span>
        </div>
        <div className="flex justify-between font-bold pt-2
                        border-t border-gray-100">
          <span>Total</span>
          <span style={{ color: '#3c1a5b' }}>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2
                      text-xs text-gray-400">
        <Shield size={12} />
        <span>256-bit SSL secured checkout</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN CHECKOUT PAGE
// ─────────────────────────────────────────────
const CheckoutPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [shippingData, setShippingData] = useState(null);

  const { data: shippingFee = 1500 } = useQuery({
    queryKey: ['shipping-fee'],
    queryFn: getShippingFee,
    select: (res) => res.data.data.shippingFee,
    staleTime: 10 * 60 * 1000,
  });

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    select: (res) => res.data.data
  });

  // Create order + initialize payment + redirect — all in one flow
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: async (response) => {
      const order = response.data.data.order;

      try {
        // Initialize Paystack payment
        const paymentResponse = await initializePayment({ orderId: order.id });
        const { authorizationUrl } = paymentResponse.data.data;

        // Invalidate cart
        queryClient.invalidateQueries({ queryKey: ['cart'] });

        toast.success('Order placed! Redirecting to payment...');

        // ── AUTO REDIRECT TO PAYSTACK ──
        // Small delay so toast is visible
        setTimeout(() => {
          window.location.href = authorizationUrl;
        }, 1500);

      } catch {
        toast.error('Order placed but payment failed. Check your orders.');
        navigate('/orders');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to place order.');
    }
  });

  const handleShippingNext = (data) => {
    setShippingData(data);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = () => {
    createOrderMutation.mutate(shippingData);
  };

  if (isLoading) return <Spinner center />;

  if (!cartData?.items?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🛒</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h2>
          <Link to="/products"
                className="text-sm font-medium hover:underline"
                style={{ color: '#3c1a5b' }}>
            ← Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          <div className="flex items-center justify-center gap-2
                          text-xs text-gray-500 mt-1">
            <Lock size={12} />
            <span>Secure & encrypted checkout</span>
          </div>
        </div>

        <StepIndicator currentStep={step} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Step Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <ShippingStep onNext={handleShippingNext} />
            )}
            {step === 2 && (
              <OrderReview
                shippingData={shippingData}
                cartData={cartData}
                shippingFee={shippingFee}
                onBack={() => setStep(1)}
                onPlaceOrder={handlePlaceOrder}
                isPlacing={createOrderMutation.isPending}
              />
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <CartSidebar cartData={cartData} shippingFee={shippingFee} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;