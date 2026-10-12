import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  Ticket,
  Truck,
  ShieldCheck,
  Check,
  AlertCircle,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { EmptyState } from '../../components/common/EmptyState';
import { useCart } from '../../lib/cartContext';
import { validateCoupon } from '../../services/couponService';
import { getStoreSettings } from '../../services/settingsService';
import { DeliveryZone } from '../../types/settings';
import { formatCurrency } from '../../lib/utils';

export const CartPage: React.FC = () => {
  const {
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    selectedZone,
    setSelectedZone,
    deliveryCharge,
    grandTotal,
  } = useCart();

  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);

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

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setValidatingCoupon(true);
    setCouponError('');
    setCouponSuccess('');

    const res = await validateCoupon(couponInput.trim(), subtotal);
    if (res.valid && res.coupon) {
      applyCoupon(res.coupon);
      setCouponSuccess(`Coupon "${res.coupon.code}" applied successfully!`);
      setCouponInput('');
    } else {
      setCouponError(res.message || 'Invalid coupon code');
    }
    setValidatingCoupon(false);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <SEO title="Shopping Cart — Uniqzen Shop" />
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping Cart is Empty"
          description="Looks like you haven't added any gadgets to your cart yet. Explore our genuine electronics collection."
          actionLabel="Start Shopping"
          actionLink="/shop"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO title="Shopping Cart — Uniqzen Shop" />

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">
        Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-brand-border divide-y divide-slate-100 overflow-hidden shadow-subtle">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Item Thumbnail & Title */}
                <div className="flex items-center space-x-4 min-w-0">
                  <Link
                    to={`/product/${item.slug || item.productId}`}
                    className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-200 p-2 flex-shrink-0"
                  >
                    <img
                      src={item.image || '/logo.png'}
                      alt={item.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </Link>

                  <div className="min-w-0">
                    <Link
                      to={`/product/${item.slug || item.productId}`}
                      className="text-sm font-bold text-slate-900 hover:text-brand-primary line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    {item.variantSummary && (
                      <p className="text-xs text-slate-500 mt-0.5">{item.variantSummary}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">SKU: {item.sku}</p>
                    <p className="text-sm font-bold text-brand-secondary mt-1">
                      {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                </div>

                {/* Quantity Controls & Total */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-6">
                  <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-semibold text-slate-900 bg-white min-w-[32px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantity >= item.maxStock}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 text-sm font-bold disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <span className="text-sm font-extrabold text-slate-900 block">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Link
              to="/shop"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-brand-primary"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary & Coupon */}
        <div className="space-y-6">
          {/* Order Summary Box */}
          <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-subtle space-y-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            {/* Subtotal */}
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>

            {/* Delivery Zone Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Delivery Location
              </label>
              <div className="space-y-2">
                {deliveryZones.map((zone) => (
                  <label
                    key={zone.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedZone?.id === zone.id
                        ? 'border-brand-primary bg-slate-50 font-semibold text-slate-900'
                        : 'border-slate-200 hover:bg-slate-50/50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="delivery_zone"
                        checked={selectedZone?.id === zone.id}
                        onChange={() => setSelectedZone(zone)}
                        className="text-brand-primary focus:ring-brand-primary"
                      />
                      <span>{zone.name}</span>
                    </div>
                    <span className="font-bold">
                      {zone.minOrderFreeShipping && subtotal >= zone.minOrderFreeShipping
                        ? 'FREE'
                        : formatCurrency(zone.charge)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Discount Coupon
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{appliedCoupon.code}</span>
                    <span className="font-normal text-emerald-700">(-{formatCurrency(couponDiscount)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 uppercase tracking-wider focus:outline-none focus:border-brand-primary"
                  />
                  <button
                    type="submit"
                    disabled={validatingCoupon}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {validatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                </form>
              )}
              {couponError && (
                <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{couponError}</span>
                </p>
              )}
              {couponSuccess && (
                <p className="text-xs text-emerald-600 mt-1.5">{couponSuccess}</p>
              )}
            </div>

            {/* Delivery Charge Line */}
            <div className="flex justify-between text-sm text-slate-600 pt-2 border-t border-slate-100">
              <span>Delivery Fee</span>
              <span className="font-semibold text-slate-900">
                {deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}
              </span>
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-baseline pt-3 border-t border-slate-200">
              <span className="text-base font-bold text-slate-900">Grand Total</span>
              <span className="text-2xl font-extrabold text-slate-900">
                {formatCurrency(grandTotal)}
              </span>
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Safe note */}
            <div className="text-center pt-1">
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cash on Delivery — Inspect upon receipt</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
