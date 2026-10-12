import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Truck, ShoppingBag, ArrowRight, Phone, MapPin } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { getOrderById } from '../../services/orderService';
import { Order } from '../../types/order';
import { formatCurrency, formatDate } from '../../lib/utils';

export const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getOrderById(id).then((o) => {
        setOrder(o);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Retrieving order details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <SEO title="Order Confirmed — Uniqzen Shop" />

      {/* Confirmation Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Order Successfully Placed!
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Thank you for choosing Uniqzen Shop. We have received your order and are preparing it for shipment.
        </p>
        <div className="pt-2">
          <span className="inline-block px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800">
            Order ID: {order?.orderNumber || id}
          </span>
        </div>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-subtle space-y-6">
        {/* Customer & Delivery Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100 text-xs">
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Customer Details
            </h4>
            <p className="font-semibold text-slate-800 text-sm">{order?.customer.fullName}</p>
            <p className="text-slate-500 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{order?.customer.phone}</span>
            </p>
            {order?.customer.email && <p className="text-slate-500">{order.customer.email}</p>}
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Shipping Address
            </h4>
            <p className="text-slate-700 leading-relaxed flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                {order?.customer.fullAddress}, {order?.customer.district}, {order?.customer.division}
              </span>
            </p>
            <p className="text-slate-500">
              Zone: <strong className="text-slate-700">{order?.deliveryZoneName}</strong>
            </p>
          </div>
        </div>

        {/* Items List */}
        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-3">
            Purchased Items
          </h4>
          <div className="divide-y divide-slate-100">
            {order?.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center space-x-3 min-w-0">
                  <img
                    src={item.image || '/logo.png'}
                    alt={item.name}
                    className="w-12 h-12 object-contain rounded bg-slate-50 border p-1"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-slate-400">
                      Qty: {item.quantity} {item.variantSummary ? `• ${item.variantSummary}` : ''}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-slate-900">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Total */}
        <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">{formatCurrency(order?.subtotal)}</span>
          </div>
          {order?.discount && order.discount > 0 ? (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Discount</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-slate-600">
            <span>Delivery Charge</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(order?.deliveryCharge)}
            </span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm">
            <span className="font-bold text-slate-900">Total Amount Payable</span>
            <span className="text-xl font-extrabold text-slate-900">
              {formatCurrency(order?.total)}
            </span>
          </div>
          <div className="pt-2 text-slate-500 flex items-center justify-between text-[11px]">
            <span>Payment Method: <strong>Cash on Delivery (COD)</strong></span>
            <span>Status: <strong className="uppercase text-amber-600 font-bold">{order?.orderStatus || 'Pending'}</strong></span>
          </div>
        </div>
      </div>

      {/* Buttons: Track Order & Continue Shopping */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to={`/track-order?orderId=${order?.orderNumber || id}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold shadow-sm transition-all"
        >
          <Truck className="w-4 h-4" />
          <span>Track Order Status</span>
        </Link>
        <Link
          to="/shop"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
};
