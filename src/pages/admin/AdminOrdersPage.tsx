import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  ShoppingBag,
  Clock,
  Phone,
  CheckCircle2,
  Truck,
  RotateCcw,
  Trash2,
  Loader2,
  Edit2,
  ExternalLink,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { EmptyState } from '../../components/common/EmptyState';
import { getAllOrdersAdmin, deleteOrder } from '../../services/orderService';
import { Order, OrderStatus } from '../../types/order';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useAuth } from '../../lib/authContext';
import { logAdminAction } from '../../services/auditService';

export const AdminOrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    getAllOrdersAdmin().then((res) => {
      setOrders(res);
      setLoading(false);
    });
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.fullName.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.phone.includes(search);

    const matchStatus = statusFilter === 'all' ? true : o.orderStatus === statusFilter;

    return matchSearch && matchStatus;
  });

  const handleDeleteOrder = async (order: Order) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete order "${order.orderNumber}" for ${order.customer.fullName}?\n\nThis will permanently delete this order record.`
    );
    if (!confirmDelete) return;

    setDeletingId(order.id);
    try {
      await deleteOrder(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      if (currentUser) {
        logAdminAction(
          currentUser.uid,
          'order.delete',
          'order',
          order.id,
          { orderNumber: order.orderNumber, total: order.total },
          currentUser.email || ''
        );
      }
    } catch (e: any) {
      console.error('Failed to delete order:', e);
      alert(e.message || 'Failed to delete order. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'packed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
      case 'returned':
      case 'refunded':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBorderColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'border-l-amber-500';
      case 'confirmed':
      case 'processing':
        return 'border-l-blue-500';
      case 'packed':
        return 'border-l-purple-500';
      case 'shipped':
        return 'border-l-sky-500';
      case 'delivered':
        return 'border-l-emerald-500';
      case 'cancelled':
      case 'returned':
      case 'refunded':
        return 'border-l-rose-500';
      default:
        return 'border-l-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Order Management — Admin Portal | Uniqzen Shop" />

      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Order Management ({filteredOrders.length})
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Process customer orders, update delivery milestones, and issue invoices.
        </p>
      </div>

      {/* Search & Status Tabs */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search Order Number, Customer, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 cursor-pointer focus:outline-none font-medium w-full sm:w-auto"
          >
            <option value="all">All Statuses ({orders.length})</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Content */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading orders...</div>
      ) : filteredOrders.length > 0 ? (
        <>
          {/* Mobile Orders Card View (Distinct Order Workflow Design) */}
          <div className="block md:hidden space-y-3.5">
            {filteredOrders.map((o) => {
              const firstItem = o.items?.[0];
              const totalItemsCount = o.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
              return (
                <div
                  key={`mobile-${o.id}`}
                  className={`bg-white rounded-2xl border border-slate-200/90 border-l-4 ${getStatusBorderColor(
                    o.orderStatus
                  )} p-4 shadow-xs space-y-3 transition-all hover:border-slate-300`}
                >
                  {/* 1. Order Header Bar: Order Number + Order Status */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-700">
                        <ShoppingBag className="w-4 h-4 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/admin/orders/${o.id}`}
                          className="font-mono font-bold text-slate-900 text-sm hover:text-brand-primary block truncate"
                        >
                          {o.orderNumber}
                        </Link>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatDate(o.createdAt)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 border ${getStatusBadgeClass(
                        o.orderStatus
                      )}`}
                    >
                      {o.orderStatus}
                    </span>
                  </div>

                  {/* 2. Customer & Address Details */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {o.customer.fullName}
                      </p>
                      <a
                        href={`tel:${o.customer.phone}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors flex-shrink-0"
                        title="Call Customer"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{o.customer.phone}</span>
                      </a>
                    </div>

                    {o.customer.fullAddress && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">
                          {o.customer.fullAddress}
                          {o.customer.district ? `, ${o.customer.district}` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 3. Items Preview Box */}
                  <div className="bg-slate-50/90 rounded-xl p-2.5 flex items-center justify-between gap-3 border border-slate-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={firstItem?.image || '/logo.png'}
                          alt={firstItem?.name || 'Item'}
                          className="w-12 h-12 object-contain rounded-lg bg-white border border-slate-200 p-1"
                        />
                        {o.items.length > 1 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                            +{o.items.length - 1}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                          {firstItem?.name || 'Product Item'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Qty: {totalItemsCount}
                          {firstItem?.variantSummary ? ` • ${firstItem.variantSummary}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-1">
                      <p className="text-[10px] text-slate-400 font-medium">Total Amount</p>
                      <p className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {formatCurrency(o.total)}
                      </p>
                    </div>
                  </div>

                  {/* 4. Bottom Footer: Payment Method & Manage/Delete Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                          o.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {o.paymentStatus === 'paid' ? 'Paid' : 'Unpaid (COD)'}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[10px] uppercase font-medium">
                        {o.paymentMethod || 'COD'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(o)}
                        disabled={deletingId === o.id}
                        className="p-1.5 rounded-xl text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
                        title="Delete Order"
                      >
                        {deletingId === o.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold text-left">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Order Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <Link to={`/admin/orders/${o.id}`} className="hover:underline">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{o.customer.fullName}</p>
                        <p className="text-[11px] text-slate-500">{o.customer.phone}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {o.items.length} {o.items.length === 1 ? 'item' : 'items'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatCurrency(o.total)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            o.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(
                            o.orderStatus
                          )}`}
                        >
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{formatDate(o.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Link
                            to={`/admin/orders/${o.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Manage</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(o)}
                            disabled={deletingId === o.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-50"
                            title="Delete Order"
                          >
                            {deletingId === o.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description={
            search || statusFilter !== 'all'
              ? 'No orders match your filter criteria.'
              : 'When customers place orders, they will appear here in real time.'
          }
        />
      )}
    </div>
  );
};
