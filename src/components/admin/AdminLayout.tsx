import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  MessageSquare,
  Ticket,
  Truck,
  Image as ImageIcon,
  FileText,
  Settings,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';

export const AdminLayout: React.FC = () => {
  const { currentUser, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Verifying administrative access...</p>
        </div>
      </div>
    );
  }

  // If not logged in at all, redirect to admin login
  if (!currentUser) {
    navigate('/admin/login');
    return null;
  }

  // If authenticated but not authorized administrator
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-elevated border border-slate-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            You do not have administrative privileges to access this area.
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <Link
              to="/"
              className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-hover transition-colors"
            >
              Return to Store
            </Link>
            <button
              onClick={async () => {
                await logout();
                navigate('/admin/login');
              }}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
    { label: 'Coupons', path: '/admin/coupons', icon: Ticket },
    { label: 'Delivery', path: '/admin/delivery', icon: Truck },
    { label: 'Banners', path: '/admin/banners', icon: ImageIcon },
    { label: 'Pages & Policy', path: '/admin/pages', icon: FileText },
    { label: 'Site Settings', path: '/admin/settings', icon: Settings },
    { label: 'Audit Logs', path: '/admin/audit', icon: ClipboardList },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand Logo Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link to="/admin" className="flex items-center space-x-2">
            <img
              src="/logo.png"
              alt="Uniqzen Shop"
              className="h-9 w-auto object-contain bg-white p-1 rounded-lg"
            />
            <span className="text-xs font-semibold text-white tracking-wide uppercase">
              Admin
            </span>
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-secondary text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <Link
          to="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
        >
          <span>View Live Store</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <div className="flex items-center justify-between px-2 pt-1">
          <div className="min-w-0">
            <p className="text-xs text-white font-medium truncate">
              {currentUser.email || 'Administrator'}
            </p>
            <p className="text-[10px] text-emerald-400">Authenticated Admin</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 flex-shrink-0 sticky top-0 h-screen z-30">
        {navContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-72 bg-slate-900 h-full shadow-2xl z-10">
            {navContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              Admin Portal — Uniqzen Shop
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline-block text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
              Live Production
            </span>
            <Link
              to="/"
              className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
            >
              <span>Customer Shop</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
