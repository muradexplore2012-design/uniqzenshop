import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  Copy,
  Check,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { useCart } from '../../lib/cartContext';
import { useAuth } from '../../lib/authContext';
import { createOrder } from '../../services/orderService';
import { getStoreSettings } from '../../services/settingsService';
import { DeliveryZone } from '../../types/settings';
import { PaymentMethod } from '../../types/order';
import {
  formatCurrency,
  BANGLADESH_DIVISIONS,
  BANGLADESH_DISTRICTS,
  isValidBDPhone,
} from '../../lib/utils';

export const CheckoutPage: React.FC = () => {
  const {
    items,
    subtotal,
    appliedCoupon,
    couponDiscount,
    selectedZone,
    setSelectedZone,
    deliveryCharge,
    grandTotal,
    clearCart,
  } = useCart();

  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [fullName, setFullName] = useState(userProfile?.displayName || currentUser?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [fullAddress, setFullAddress] = useState('');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  useEffect(() => {
    getStoreSettings().then((settings) => {
      if (settings.deliveryZones && settings.deliveryZones.length > 0) {
        setDeliveryZones(settings.deliveryZones);
        if (!selectedZone) {
          setSelectedZone(settings.deliveryZones[0]);
        }
      }
    });
  }, []);

  // Update district when division changes
  const handleDivisionChange = (newDiv: string) => {
    setDivision(newDiv);
    const available = BANGLADESH_DISTRICTS[newDiv] || [];
    setDistrict(available[0] || '');

    // Auto-select Inside / Outside Dhaka zone based on division
    if (deliveryZones.length > 0) {
      if (newDiv === 'Dhaka') {
        const inside = deliveryZones.find((z) => z.id.includes('inside') || z.name.toLowerCase().includes('inside'));
        if (inside) setSelectedZone(inside);
      } else {
        const outside = deliveryZones.find((z) => z.id.includes('outside') || z.name.toLowerCase().includes('outside'));
        if (outside) setSelectedZone(outside);
      }
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!isValidBDPhone(phone.trim())) {
      setErrorMsg('Please enter a valid Bangladesh phone number (e.g. 017XXXXXXXX or 015XXXXXXXX).');
      return;
    }

    if (!fullAddress.trim()) {
      setErrorMsg('Please enter your full delivery address.');
      return;
    }

    // Payment validation
    if (paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'upay') {
      const methodName = paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Upay';
      if (!senderNumber.trim()) {
        setErrorMsg(`Please enter your ${methodName} sender phone number.`);
        return;
      }
      if (!isValidBDPhone(senderNumber.trim())) {
        setErrorMsg(`Please enter a valid 11-digit ${methodName} sender phone number (e.g. 01XXXXXXXXX).`);
        return;
      }
      if (!trxId.trim()) {
        setErrorMsg(`Please enter your ${methodName} Transaction ID (TrxID).`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const orderPayload = {
        userId: currentUser?.uid,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        fullAddress: fullAddress.trim(),
        division,
        district,
        upazila: upazila.trim() || undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
      };

      const cartOrderItems = items.map((item) => ({
        productId: item.productId,
        name: item.name,
        slug: item.slug,
        image: item.image,
        sku: item.sku,
        variantId: item.variantId,
        variantSummary: item.variantSummary,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
      }));

      const paymentDetails =
        paymentMethod !== 'cod'
          ? {
              senderNumber: senderNumber.trim() || undefined,
              transactionId: trxId.trim() || undefined,
            }
          : undefined;

      const res = await createOrder(
        orderPayload,
        cartOrderItems,
        deliveryCharge,
        appliedCoupon?.code,
        selectedZone?.name,
        paymentMethod,
        paymentDetails
      );

      if (res.success && res.orderNumber) {
        clearCart();
        navigate(`/order-confirmation/${res.orderNumber}`);
      } else {
        setErrorMsg(res.message || 'Could not place order. Please check item stock.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO title="Checkout — Uniqzen Shop" />

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
        Secure Checkout
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 mb-8">
        Please enter your delivery address and choose your preferred payment method below.
      </p>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Shipping Info (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-brand-border p-6 sm:p-8 shadow-subtle space-y-5">
              <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-secondary" />
                <span>Shipping Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Hossain"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (BD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>

              {/* Division & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Division <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={division}
                    onChange={(e) => handleDivisionChange(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none bg-white cursor-pointer"
                  >
                    {BANGLADESH_DIVISIONS.map((div) => (
                      <option key={div} value={div}>
                        {div}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none bg-white cursor-pointer"
                  >
                    {(BANGLADESH_DISTRICTS[division] || []).map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upazila / Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thana / Upazila / Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dhanmondi, Mirpur, Uttara, Sadar..."
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>

              {/* Full Detailed Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Street Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="House No, Road No, Sector / Village, Flat No..."
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>

              {/* Delivery Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Notes / Special Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please call before arriving"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-subtle space-y-4">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-brand-secondary" />
                  <span>Payment Method</span>
                </h2>
                <span className="text-xs text-slate-500 font-medium">Select one</span>
              </div>

              {/* Payment Methods Options List */}
              <div className="space-y-2.5">
                {/* 1. Cash on Delivery (COD) */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'cod'
                      ? 'border-brand-primary bg-slate-50/80 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'cod'
                          ? 'border-brand-primary'
                          : 'border-slate-300'
                      }`}
                    >
                      {paymentMethod === 'cod' && (
                        <div className="w-2 h-2 rounded-full bg-brand-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">Cash on Delivery (COD)</h4>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          💵 COD
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pay with cash when your package is delivered to your doorstep.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    ৳ BDT
                  </span>
                </div>

                {/* 2. bKash Personal */}
                <div
                  onClick={() => setPaymentMethod('bkash')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'bkash'
                      ? 'border-[#E2136E] bg-pink-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'bkash'
                          ? 'border-[#E2136E]'
                          : 'border-slate-300'
                      }`}
                    >
                      {paymentMethod === 'bkash' && (
                        <div className="w-2 h-2 rounded-full bg-[#E2136E]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#E2136E] text-white font-black text-xs">
                          bKash
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">bKash Personal</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Send Money to Personal: <strong className="font-mono text-slate-800">01768534545</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#E2136E] bg-pink-50 px-2 py-1 rounded-md border border-pink-200 font-mono">
                    01768534545
                  </span>
                </div>

                {/* 3. Nagad Personal */}
                <div
                  onClick={() => setPaymentMethod('nagad')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'nagad'
                      ? 'border-[#F7941D] bg-orange-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'nagad'
                          ? 'border-[#F7941D]'
                          : 'border-slate-300'
                      }`}
                    >
                      {paymentMethod === 'nagad' && (
                        <div className="w-2 h-2 rounded-full bg-[#F7941D]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#F7941D] text-white font-black text-xs">
                          Nagad
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">Nagad Personal</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Send Money to Personal: <strong className="font-mono text-slate-800">01768534545</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#F7941D] bg-orange-50 px-2 py-1 rounded-md border border-orange-200 font-mono">
                    01768534545
                  </span>
                </div>

                {/* 4. Upay Personal */}
                <div
                  onClick={() => setPaymentMethod('upay')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'upay'
                      ? 'border-[#005BAC] bg-sky-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'upay'
                          ? 'border-[#005BAC]'
                          : 'border-slate-300'
                      }`}
                    >
                      {paymentMethod === 'upay' && (
                        <div className="w-2 h-2 rounded-full bg-[#005BAC]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#005BAC] text-[#FFD200] font-black text-xs">
                          Upay
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">Upay Personal</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Send Money to Personal: <strong className="font-mono text-slate-800">01329913500</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#005BAC] bg-sky-50 px-2 py-1 rounded-md border border-sky-200 font-mono">
                    01329913500
                  </span>
                </div>
              </div>

              {/* Dynamic Payment Instruction & Input Box */}
              {(paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'upay') && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        {paymentMethod === 'bkash'
                          ? 'bKash Personal Number'
                          : paymentMethod === 'nagad'
                          ? 'Nagad Personal Number'
                          : 'Upay Personal Number'}
                      </span>
                      <span className="text-lg font-black text-slate-900 font-mono tracking-wider">
                        {paymentMethod === 'upay' ? '01329913500' : '01768534545'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyNumber(paymentMethod === 'upay' ? '01329913500' : '01768534545')}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs"
                    >
                      {copiedNumber === (paymentMethod === 'upay' ? '01329913500' : '01768534545') ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Number</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-white/60 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                    <p className="font-semibold text-slate-800">পেমেন্ট নির্দেশিকা (Payment Instructions):</p>
                    <p>
                      ১. আপনার <strong>{paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Upay'}</strong> অ্যাপে গিয়ে <strong>Send Money</strong> অপশন সিলেক্ট করুন।
                    </p>
                    <p>
                      ২. প্রাপক হিসেবে উপরের পার্সোনাল নম্বরটিতে সর্বমোট <strong>{formatCurrency(grandTotal)}</strong> টাকা পাঠান।
                    </p>
                    <p>
                      ৩. টাকা পাঠানোর পর নিচের ফর্মে আপনার সেন্ডার মোবাইল নম্বর এবং ফিরতি মেসেজের <strong>TrxID</strong> লিখে অর্ডার সম্পন্ন করুন।
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your {paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Upay'} Number (Sender) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="01XXXXXXXXX"
                        value={senderNumber}
                        onChange={(e) => setSenderNumber(e.target.value)}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Transaction ID (TrxID) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BL9A8B7C6D"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none bg-white font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Order Summary & Place Order Button */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-subtle space-y-4 sticky top-28">
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                Your Order Items ({items.length})
              </h3>

              {/* Items quick list */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
                {items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img
                        src={item.image || '/logo.png'}
                        alt={item.name}
                        className="w-10 h-10 object-contain rounded bg-slate-50 border p-1 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                        <p className="text-slate-400">
                          Qty: {item.quantity} {item.variantSummary ? `• ${item.variantSummary}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 flex-shrink-0">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculation breakdown */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon ({appliedCoupon?.code})</span>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery ({selectedZone?.name || 'Standard'})</span>
                  <span className="font-semibold text-slate-900">
                    {deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm">
                  <span className="font-bold text-slate-900">Total Payable</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Submit Order Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Confirming Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>
                      Confirm Order{' '}
                      {paymentMethod === 'cod'
                        ? '(Cash on Delivery)'
                        : `(${paymentMethod.toUpperCase()})`}
                    </span>
                  </>
                )}
              </button>

              <div className="text-center pt-1 text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>By ordering, you agree to our terms & return policy</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
