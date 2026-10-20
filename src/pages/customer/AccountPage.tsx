import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  Heart,
  LogOut,
  Package,
  Calendar,
  Lock,
  Mail,
  Phone,
  Eye,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../lib/authContext';
import { useWishlist } from '../../lib/wishlistContext';
import { getCustomerOrders } from '../../services/orderService';
import { Order } from '../../types/order';
import { formatCurrency, formatDate } from '../../lib/utils';
import { GoogleSignInButton } from '../../components/common/GoogleSignInButton';

export const AccountPage: React.FC = () => {
  const { currentUser, loading, userProfile, loginWithEmail, registerWithEmail, loginWithGoogle, loginWithGoogleRedirect, resetPassword, logout } = useAuth();
  const { wishlistIds } = useWishlist();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active tab: 'orders' | 'profile' | 'wishlist'
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'wishlist'>(
    (searchParams.get('tab') as any) || 'orders'
  );

  // Auth form states (for unauthenticated users)
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setLoadingOrders(true);
      getCustomerOrders(currentUser.uid).then((res) => {
        setOrders(res);
        setLoadingOrders(false);
      });
    }
  }, [currentUser]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        await loginWithEmail(email.trim(), password);
      } else if (authMode === 'register') {
        await registerWithEmail(email.trim(), password, fullName.trim(), phone.trim());
      } else if (authMode === 'forgot') {
        await resetPassword(email.trim());
        setAuthSuccess('Password reset link sent to your email. Please check your inbox!');
        setAuthLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('Customer Auth Error:', err);
      let msg = err.message || 'Authentication failed. Please check credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. If you don\'t have an account, click "Register" above.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please Sign In.';
      }
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthSuccess('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Browser navigates directly to Google authentication page
    } catch (err: any) {
      setGoogleLoading(false);
      let msg = err.message || 'Failed to sign in with Google. Please try again.';
      if (err.code === 'auth/unauthorized-domain') {
        msg = `This domain (${window.location.hostname}) is not authorized in Firebase Console yet. Please add "${window.location.hostname}" to Firebase Console -> Authentication -> Settings -> Authorized domains.`;
      }
      setAuthError(msg);
    }
  };

  // While checking redirect authentication:
  if (loading && !currentUser) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-xs text-slate-500 font-medium">Signing in...</p>
      </div>
    );
  }

  // If user is not logged in: display login / register portal
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <SEO title="Customer Login & Registration — Uniqzen Shop" />

        <div className="bg-white rounded-3xl border border-brand-border p-8 shadow-subtle space-y-6">
          <div className="text-center space-y-2">
            <img src="/logo.png" alt="Uniqzen Shop" className="h-12 mx-auto object-contain" />
            <h1 className="text-xl font-extrabold text-slate-900">
              {authMode === 'login' && 'Welcome Back'}
              {authMode === 'register' && 'Create an Account'}
              {authMode === 'forgot' && 'Reset Your Password'}
            </h1>
            <p className="text-xs text-slate-500">
              {authMode === 'login' && 'Sign in to access your orders and account settings'}
              {authMode === 'register' && 'Register to manage your gadget orders and save wishlist'}
              {authMode === 'forgot' && 'Enter your email to receive a password reset link'}
            </p>
          </div>

          {/* Toggle Tabs */}
          {authMode !== 'forgot' && (
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-relaxed">{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{authSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asif Rahman"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="youremail@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none"
              />
            </div>

            {authMode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setAuthError('');
                        setAuthSuccess('');
                      }}
                      className="text-[11px] text-brand-primary font-medium hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading || googleLoading}
              className="w-full py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Please wait...</span>
                </>
              ) : (
                <span>
                  {authMode === 'login' && 'Sign In'}
                  {authMode === 'register' && 'Create Account'}
                  {authMode === 'forgot' && 'Send Password Reset Link'}
                </span>
              )}
            </button>
          </form>

          {authMode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className="text-xs text-brand-primary font-semibold hover:underline"
              >
                ← Back to Sign In
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Native Ultra-Fast Google Sign-In */}
          <GoogleSignInButton
            onSuccess={() => {
              navigate('/account');
            }}
            onError={(err) => setAuthError(err)}
          />

          <div className="pt-2 text-center text-xs text-slate-500">
            <Link to="/track-order" className="hover:underline text-brand-primary">
              Looking to track a guest order? Click here
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Customer Dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SEO title="My Account — Uniqzen Shop" />

      {/* Account Header */}
      <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white font-extrabold text-xl flex items-center justify-center">
            {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {currentUser.displayName || 'Customer'}
            </h1>
            <p className="text-xs text-slate-500">{currentUser.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors w-fit"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 flex items-center gap-2 transition-all ${
            activeTab === 'orders'
              ? 'border-b-2 border-brand-primary text-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Order History ({orders.length})</span>
        </button>

        <button
          onClick={() => navigate('/wishlist')}
          className="pb-3 flex items-center gap-2 text-slate-500 hover:text-slate-800"
        >
          <Heart className="w-4 h-4" />
          <span>Wishlist ({wishlistIds.length})</span>
        </button>
      </div>

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading your orders...</div>
          ) : orders.length > 0 ? (
            <div className="bg-white rounded-2xl border border-brand-border divide-y divide-slate-100 overflow-hidden shadow-subtle">
              {orders.map((o) => (
                <div key={o.id} className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {o.orderNumber}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider bg-slate-100 text-slate-800">
                          {o.orderStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Placed on {formatDate(o.createdAt)}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-base font-extrabold text-slate-900">
                        {formatCurrency(o.total)}
                      </span>
                      <Link
                        to={`/track-order?orderId=${o.orderNumber}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                      >
                        Track
                      </Link>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="divide-y divide-slate-50">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs text-slate-700">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.image || '/logo.png'}
                            alt={item.name}
                            className="w-10 h-10 object-contain rounded bg-slate-50 border p-1"
                          />
                          <div>
                            <p className="font-medium text-slate-900">{item.name}</p>
                            <p className="text-slate-400">
                              Qty: {item.quantity} {item.variantSummary ? `• ${item.variantSummary}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold">{formatCurrency(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="No orders found"
              description="You have not placed any orders yet. When you buy gadgets, they will appear here."
              actionLabel="Start Shopping"
              actionLink="/shop"
            />
          )}
        </div>
      )}
    </div>
  );
};
