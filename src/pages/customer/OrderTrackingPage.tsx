import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  Check,
  AlertCircle,
  MapPin,
  Calendar,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { getOrderById } from '../../services/orderService';
import { Order, OrderStatus } from '../../types/order';
import { formatCurrency, formatDate } from '../../lib/utils';

const TRACKING_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'pending', label: 'Order Placed', desc: 'Received and awaiting verification' },
  { status: 'confirmed', label: 'Confirmed', desc: 'Order approved for dispatch' },
  { status: 'processing', label: 'Processing', desc: 'Allocating inventory at warehouse' },
  { status: 'packed', label: 'Packed', desc: 'Safely packaged and labeled' },
  { status: 'shipped', label: 'Shipped', desc: 'Handed over to courier partner' },
  { status: 'delivered', label: 'Delivered', desc: 'Package received by customer' },
];

export const OrderTrackingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryOrder = searchParams.get('orderId') || '';

  const [orderNumberInput, setOrderNumberInput] = useState(queryOrder);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (queryOrder) {
      handleSearch(queryOrder);
    }
  }, [queryOrder]);

  const handleSearch = async (targetId: string) => {
    if (!targetId.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setSearched(true);

    try {
      const res = await getOrderById(targetId.trim());
      if (res) {
        setOrder(res);
      } else {
        setOrder(null);
        setErrorMsg(`No order found matching "${targetId}". Please verify your Order ID.`);
      }
    } catch (e) {
      setErrorMsg('Failed to fetch tracking data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumberInput.trim()) {
      setSearchParams({ orderId: orderNumberInput.trim() });
      handleSearch(orderNumberInput.trim());
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    const orderMap: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 1,
      processing: 2,
      packed: 3,
      shipped: 4,
      delivered: 5,
      cancelled: -1,
      returned: -2,
      refunded: -3,
    };
    return orderMap[status] ?? 0;
  };

  const currentStep = order ? getStepIndex(order.orderStatus) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SEO title="Track Your Order — Uniqzen Shop" />

      {/* Header */}
      <div className="text-center space-y-2 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
          <Truck className="w-6 h-6 text-brand-secondary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Track Order Status</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your Uniqzen Order Number (e.g. UZ-2410-1234) provided on confirmation.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 sm:p-6 shadow-subtle max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="e.g. UZ-2610-1234"
            value={orderNumberInput}
            onChange={(e) => setOrderNumberInput(e.target.value)}
            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-300 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="max-w-xl mx-auto p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Order Tracking Progress Card */}
      {order && (
        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-10 shadow-subtle space-y-8 animate-in fade-in">
          {/* Top metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Order Number</span>
              <h2 className="text-xl font-bold font-mono text-slate-900">{order.orderNumber}</h2>
            </div>
            <div className="sm:text-right">
              <span className="text-xs text-slate-400 block mb-0.5">Estimated Status</span>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-white">
                {order.orderStatus}
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          {currentStep >= 0 ? (
            <div className="py-4">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative">
                {TRACKING_STEPS.map((step, idx) => {
                  const isDone = currentStep >= idx;
                  const isCurrent = currentStep === idx;
                  return (
                    <div
                      key={step.status}
                      className="flex flex-col items-center text-center space-y-2 relative"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors z-10 ${
                          isDone
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {isDone ? <Check className="w-5 h-5" /> : idx + 1}
                      </div>

                      <div>
                        <h4
                          className={`text-xs font-bold ${
                            isCurrent ? 'text-brand-secondary' : isDone ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </h4>
                        <p className="text-[10px] text-slate-400 hidden sm:block max-w-[120px]">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-center text-sm">
              This order has been marked as <strong>{order.orderStatus.toUpperCase()}</strong>.
            </div>
          )}

          {/* Status History Logs */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                Activity Log
              </h3>
              <div className="space-y-3">
                {order.statusHistory.map((item, i) => (
                  <div key={i} className="flex items-start space-x-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-slate-900 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 capitalize">
                        {item.status} — {item.note}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatDate(item.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between text-xs text-slate-500 gap-2">
            <span>
              Delivery Zone: <strong>{order.deliveryZoneName || 'Standard Delivery'}</strong>
            </span>
            <span>
              Total: <strong>{formatCurrency(order.total)}</strong> ({
                order.paymentMethod === 'bkash'
                  ? 'bKash'
                  : order.paymentMethod === 'nagad'
                  ? 'Nagad'
                  : order.paymentMethod === 'upay'
                  ? 'Upay'
                  : 'Cash on Delivery'
              })
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
