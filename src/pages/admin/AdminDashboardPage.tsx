import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Layers,
  Users,
  AlertTriangle,
  ArrowRight,
  Clock,
  TrendingUp,
  PlusCircle,
  Settings,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { getAllOrdersAdmin } from '../../services/orderService';
import { getAllProductsAdmin } from '../../services/productService';
import { getAllCategoriesAdmin } from '../../services/categoryService';
import { Order } from '../../types/order';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import { formatCurrency, formatDate } from '../../lib/utils';

export const AdminDashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const [ordersData, prodsData, catsData] = await Promise.all([
          getAllOrdersAdmin(),
          getAllProductsAdmin(),
          getAllCategoriesAdmin(),
        ]);
        setOrders(ordersData);
        setProducts(prodsData);
        setCategories(catsData);
      } catch (e) {
        console.error('Error fetching dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Compute real statistics (No dummy figures)
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'pending').length;
  const totalProductsCount = products.length;
  const activeProductsCount = products.filter((p) => p.active).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  // Real revenue calculated strictly from non-cancelled orders
  const validOrders = orders.filter(
    (o) => o.orderStatus !== 'cancelled' && o.orderStatus !== 'refunded'
  );
  const totalRevenue = validOrders.reduce((acc, o) => acc + (o.total || 0), 0);

  const isDatabaseEmpty = totalProductsCount === 0 && totalOrdersCount === 0;

  return (
    <div className="space-y-8">
      <SEO title="Dashboard — Admin Portal | Uniqzen Shop" />

      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Store Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time analytics and inventory status from Firestore.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Gadget</span>
          </Link>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Orders List</span>
          </Link>
        </div>
      </div>

      {/* First-login Admin Onboarding Guidance (if database has no products yet) */}
      {isDatabaseEmpty && !loading && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-elevated space-y-5">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-brand-secondary rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Administrator First-Time Setup Guide</h3>
              <p className="text-xs text-slate-300">
                Your database is ready. Follow this sequence to launch your gadget catalog:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            <Link
              to="/admin/settings"
              className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-bold text-brand-secondary">
                <span>Step 1</span>
                <Settings className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold text-white">Store Settings</p>
              <p className="text-xs text-slate-400">Configure phone, email, WhatsApp, and brand identity.</p>
            </Link>

            <Link
              to="/admin/categories"
              className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-bold text-brand-secondary">
                <span>Step 2</span>
                <Layers className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold text-white">Add Categories</p>
              <p className="text-xs text-slate-400">Create Smartwatches, Wireless Audio, Chargers, etc.</p>
            </Link>

            <Link
              to="/admin/products/new"
              className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-bold text-brand-secondary">
                <span>Step 3</span>
                <Package className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold text-white">Add Gadgets</p>
              <p className="text-xs text-slate-400">Add electronics with photography, specs, and variants.</p>
            </Link>

            <Link
              to="/admin/delivery"
              className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-bold text-brand-secondary">
                <span>Step 4</span>
                <Truck className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold text-white">Configure Delivery</p>
              <p className="text-xs text-slate-400">Set Inside Dhaka (৳ 70) and Outside Dhaka (৳ 130) rates.</p>
            </Link>

            <Link
              to="/admin/banners"
              className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-bold text-brand-secondary">
                <span>Step 5</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold text-white">Homepage Banners</p>
              <p className="text-xs text-slate-400">Create promotional banners and announcements.</p>
            </Link>

            <Link
              to="/admin/pages"
              className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-bold text-brand-secondary">
                <span>Step 6</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold text-white">Edit Policy Pages</p>
              <p className="text-xs text-slate-400">Update warranty, return, and shipping policies.</p>
            </Link>
          </div>
        </div>
      )}

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-brand-secondary" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {loading ? '...' : totalOrdersCount}
          </p>
          <p className="text-xs text-slate-400">
            {pendingOrdersCount} pending confirmation
          </p>
        </div>

        {/* Real Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {loading ? '...' : formatCurrency(totalRevenue)}
          </p>
          <p className="text-xs text-slate-400">From real customer orders</p>
        </div>

        {/* Total Products */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Gadgets</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {loading ? '...' : totalProductsCount}
          </p>
          <p className="text-xs text-slate-400">
            {activeProductsCount} currently active in store
          </p>
        </div>

        {/* Stock Alerts */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {loading ? '...' : lowStockCount + outOfStockCount}
          </p>
          <p className="text-xs text-slate-400">
            {lowStockCount} low stock • {outOfStockCount} out of stock
          </p>
        </div>
      </div>

      {/* Recent Orders & Stock Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Recent Customer Orders</h3>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-brand-primary hover:underline"
            >
              View All Orders →
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading orders...</div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead>
                  <tr className="text-slate-400 text-left">
                    <th className="py-2.5 px-3 font-semibold">Order</th>
                    <th className="py-2.5 px-3 font-semibold">Customer</th>
                    <th className="py-2.5 px-3 font-semibold">Total</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        <Link to={`/admin/orders/${o.id}`} className="hover:underline">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-800">{o.customer.fullName}</p>
                        <p className="text-[11px] text-slate-400">{o.customer.phone}</p>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {formatCurrency(o.total)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 italic">
              No orders placed yet. Real order transactions will appear here.
            </div>
          )}
        </div>

        {/* Quick Inventory Stock Watch (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Inventory Status</h3>
            <Link
              to="/admin/products"
              className="text-xs font-semibold text-brand-primary hover:underline"
            >
              Manage Catalog →
            </Link>
          </div>

          {products.filter((p) => p.stock <= 5).length > 0 ? (
            <div className="space-y-3">
              {products
                .filter((p) => p.stock <= 5)
                .slice(0, 5)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-slate-400">SKU: {p.sku}</p>
                    </div>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] flex-shrink-0 ${
                        p.stock === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.stock === 0 ? 'Out of Stock' : `${p.stock} left`}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 italic">
              {products.length === 0
                ? 'No products in database yet.'
                : 'All active products have healthy stock levels.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
