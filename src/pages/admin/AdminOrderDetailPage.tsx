import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Truck,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Save,
  Loader2,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { getOrderById, updateOrderStatus, updatePaymentStatus } from '../../services/orderService';
import { Order, OrderStatus, PaymentStatus } from '../../types/order';
import { formatCurrency, formatDate } from '../../lib/utils';
import { logAdminAction } from '../../services/auditService';
import { useAuth } from '../../lib/authContext';

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Status update state
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);

  const loadOrder = async (orderId: string) => {
    setLoading(true);
    const data = await getOrderById(orderId);
    if (data) {
      setOrder(data);
      setSelectedStatus(data.orderStatus);
      setSelectedPaymentStatus(data.paymentStatus);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setUpdating(true);
    setSuccessMsg('');

    try {
      if (selectedStatus !== order.orderStatus) {
        await updateOrderStatus(order.id, selectedStatus, statusNote, currentUser?.uid);
      }
      if (selectedPaymentStatus !== order.paymentStatus) {
        await updatePaymentStatus(order.id, selectedPaymentStatus, currentUser?.uid);
      }

      if (currentUser) {
        logAdminAction(
          currentUser.uid,
          'order.status_update',
          'order',
          order.id,
          { orderStatus: selectedStatus, paymentStatus: selectedPaymentStatus, note: statusNote },
          currentUser.email || ''
        );
      }

      setStatusNote('');
      setSuccessMsg('Order status updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadOrder(order.id);
    } catch (e) {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-sm text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-primary" />
        <span>Loading order record...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Order not found.</p>
        <Link to="/admin/orders" className="text-xs text-brand-primary underline mt-2 block">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <SEO title={`Order ${order.orderNumber} — Admin Portal`} />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/orders"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900">
                {order.orderNumber}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white">
                {order.orderStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
        >
          <Printer className="w-4 h-4 text-brand-secondary" />
          <span>Print Official Invoice</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Order Details & Update Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer, Shipping & Items (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Address Details */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Customer & Delivery Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="text-slate-400 font-semibold block text-[11px]">Recipient</span>
                <p className="font-bold text-slate-900 text-sm">{order.customer.fullName}</p>
                <p className="text-slate-600 flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${order.customer.phone}`} className="hover:underline">
                    {order.customer.phone}
                  </a>
                </p>
                {order.customer.email && (
                  <p className="text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{order.customer.email}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400 font-semibold block text-[11px]">
                  Shipping Address
                </span>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {order.customer.fullAddress}
                </p>
                <p className="text-slate-500">
                  {order.customer.upazila ? `${order.customer.upazila}, ` : ''}
                  {order.customer.district}, {order.customer.division}
                </p>
                <p className="text-[11px] text-slate-400">
                  Zone: <strong className="text-slate-700">{order.deliveryZoneName}</strong>
                </p>
              </div>
            </div>

            {order.customer.deliveryNotes && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <strong>Customer Note:</strong> {order.customer.deliveryNotes}
              </div>
            )}

            {/* Payment Information */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 uppercase">
                  Payment Method: {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod.toUpperCase()}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.paymentDetails?.senderNumber && (
                <p className="text-slate-600">
                  Sender Phone: <strong className="font-mono text-slate-900">{order.paymentDetails.senderNumber}</strong>
                </p>
              )}
              {order.paymentDetails?.transactionId && (
                <p className="text-slate-600">
                  Transaction ID (TrxID): <strong className="font-mono text-brand-primary">{order.paymentDetails.transactionId}</strong>
                </p>
              )}
              {order.paymentDetails?.accountHolderName && (
                <p className="text-slate-600">
                  Account / Depositor Name: <strong className="text-slate-900">{order.paymentDetails.accountHolderName}</strong>
                </p>
              )}
              {order.paymentDetails?.reference && (
                <p className="text-slate-600">
                  Reference: <strong className="font-mono text-slate-900">{order.paymentDetails.reference}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Ordered Items ({order.items.length})
            </h2>

            <div className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={item.image || '/logo.png'}
                      alt={item.name}
                      className="w-12 h-12 object-contain rounded-lg bg-slate-50 border p-1"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{item.name}</p>
                      {item.variantSummary && (
                        <p className="text-slate-500 text-[11px]">{item.variantSummary}</p>
                      )}
                      <p className="text-slate-400 text-[11px]">SKU: {item.sku}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                    <p className="font-extrabold text-slate-900 text-sm">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount ({order.couponCode || 'Promo'})</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(order.deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-900">Final Order Total</span>
                <span className="text-xl font-extrabold text-slate-900">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Update Order Status & Audit Trail */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle space-y-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Update Status
            </h2>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Order Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold uppercase bg-white cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="returned">Returned</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Status</label>
                <select
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold uppercase bg-white cursor-pointer"
                >
                  <option value="unpaid">Unpaid (Pending COD)</option>
                  <option value="paid">Paid (Cash Collected)</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status Note / Courier Tracking No.
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dispatched via Steadfast Courier #123456"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Update Status</span>
              </button>
            </form>
          </div>

          {/* Activity / Status History */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Status History Trail
            </h3>

            <div className="space-y-3 text-xs">
              {order.statusHistory?.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-slate-900 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 uppercase text-[10px]">
                      {item.status}
                    </span>
                    {item.note && <p className="text-slate-600">{item.note}</p>}
                    <p className="text-[10px] text-slate-400">{formatDate(item.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Invoice Hidden Container (visible only when printing) */}
      <div id="printable-invoice" className="hidden print:block font-sans text-slate-900">
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
          <div>
            <img src="/logo.png" alt="Uniqzen Shop" className="h-12 object-contain mb-2" />
            <h2 className="text-xl font-bold">Uniqzen Shop — Customer Invoice</h2>
            <p className="text-xs">Phone: 01566088159 | Email: uniqzenshop@gmail.com</p>
            <p className="text-xs">Dhaka, Bangladesh</p>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold text-base">Invoice #{order.orderNumber}</p>
            <p className="text-xs">Date: {formatDate(order.createdAt)}</p>
            <p className="text-xs font-bold uppercase mt-1">
              Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod.toUpperCase()}
            </p>
            {order.paymentDetails?.transactionId && (
              <p className="text-[11px] font-mono">TrxID: {order.paymentDetails.transactionId}</p>
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 text-xs">
          <div>
            <h4 className="font-bold uppercase text-slate-500 mb-1">Billed & Shipped To:</h4>
            <p className="font-bold text-sm">{order.customer.fullName}</p>
            <p>{order.customer.phone}</p>
            <p>{order.customer.fullAddress}</p>
            <p>{order.customer.district}, {order.customer.division}</p>
          </div>
          <div className="text-right">
            <h4 className="font-bold uppercase text-slate-500 mb-1">Delivery Zone:</h4>
            <p className="font-bold">{order.deliveryZoneName}</p>
            <p>Status: {order.orderStatus.toUpperCase()}</p>
          </div>
        </div>

        <table className="w-full text-xs border-collapse border border-slate-300 mb-6">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-2 border border-slate-300">Item</th>
              <th className="p-2 border border-slate-300">SKU</th>
              <th className="p-2 border border-slate-300 text-right">Unit Price</th>
              <th className="p-2 border border-slate-300 text-center">Qty</th>
              <th className="p-2 border border-slate-300 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={i}>
                <td className="p-2 border border-slate-300 font-semibold">
                  {it.name} {it.variantSummary ? `(${it.variantSummary})` : ''}
                </td>
                <td className="p-2 border border-slate-300 font-mono">{it.sku}</td>
                <td className="p-2 border border-slate-300 text-right">{formatCurrency(it.unitPrice)}</td>
                <td className="p-2 border border-slate-300 text-center">{it.quantity}</td>
                <td className="p-2 border border-slate-300 text-right font-bold">
                  {formatCurrency(it.unitPrice * it.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right space-y-1 text-xs ml-auto w-64 border-t pt-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Delivery:</span>
            <span>{formatCurrency(order.deliveryCharge)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t pt-1">
            <span>Total Payable:</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        <div className="mt-12 text-center text-xs text-slate-500 border-t pt-4">
          <p>Thank you for shopping at Uniqzen Shop! Unique Finds, Just For You.</p>
          <p>For warranty claims or support, please call 01566088159.</p>
        </div>
      </div>
    </div>
  );
};
