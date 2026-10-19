import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, AlertCircle, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { useAuth } from '../../lib/authContext';

export const AdminLoginPage: React.FC = () => {
  const { currentUser, isAdmin, loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword, logout } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // If already logged in and confirmed admin, redirect directly
  if (currentUser && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        await loginWithEmail(email.trim(), password);
      } else if (mode === 'register') {
        await registerWithEmail(email.trim(), password, fullName.trim() || 'Store Administrator');
        setSuccessMsg('Admin account created successfully! You are now signed in.');
      } else if (mode === 'forgot') {
        await resetPassword(email.trim());
        setSuccessMsg('পাসওয়ার্ড রিসেট লিংকটি আপনার ইমেইলে পাঠিয়ে দেওয়া হয়েছে! আপনার Gmail Inbox (অথবা Spam ফোল্ডার) চেক করে নতুন পাসওয়ার্ড সেট করে নিন।');
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('Admin Auth Error:', err);
      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. If you haven\'t created an account yet, click "Create Admin Account" below.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This email already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setGoogleLoading(true);

    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        let msg = err.message || 'Failed to sign in with Google. Please try again.';
        if (err.code === 'auth/unauthorized-domain') {
          msg = `এই ডোমেইনটি (${window.location.hostname}) Firebase Console-এ অথোরাইজ করা নেই। অনুগ্রহ করে Firebase Console > Authentication > Settings > Authorized domains-এ যোগ করুন।`;
        }
        setErrorMsg(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12">
      <SEO title="Admin Login — Uniqzen Shop" />

      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-700 p-8 sm:p-10 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/logo.png"
            alt="Uniqzen Shop"
            className="h-12 mx-auto object-contain bg-white p-1 rounded-xl shadow-xs"
          />
          <h1 className="text-xl font-bold text-white tracking-tight">
            {mode === 'login' && 'Staff Administration Portal'}
            {mode === 'register' && 'Create Admin Account'}
            {mode === 'forgot' && 'Reset Admin Password'}
          </h1>
          <p className="text-xs text-slate-400">
            {mode === 'login' && 'Sign in with administrator credentials to manage Uniqzen Shop.'}
            {mode === 'register' && 'Create your store administrator account with your store email.'}
            {mode === 'forgot' && 'আপনার অ্যাডমিন ইমেইলটি লিখে বাটনে চাপ দিন। আপনার ইনবক্সে পাসওয়ার্ড রিসেট লিংক চলে যাবে।'}
          </p>
        </div>

        {/* If logged in but not admin */}
        {currentUser && !isAdmin && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs rounded-2xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <AlertCircle className="w-4 h-4" />
              <span>Access Denied</span>
            </div>
            <p>The logged-in account ({currentUser.email}) is registered as a customer, not an administrator.</p>
            <button
              onClick={logout}
              className="text-xs font-semibold underline text-rose-300 hover:text-white"
            >
              Sign out and log in with admin account
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Store Admin"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-sm pl-4 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="admin@uniqzen.com or muradexplore2012@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-brand-secondary hover:underline font-medium"
                  >
                    Forgot Password? (পাসওয়ার্ড ভুলে গেছেন?)
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 rounded-xl bg-brand-secondary hover:bg-brand-secondary-hover text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : mode === 'login' ? (
              <span>Sign In to Admin Panel</span>
            ) : mode === 'register' ? (
              <span>Create Administrator Account</span>
            ) : (
              <span>Send Password Reset Link (রিসেট লিংক পাঠান)</span>
            )}
          </button>
        </form>

        {/* Toggle Mode Links */}
        <div className="text-center text-xs space-y-2">
          {mode === 'login' && (
            <p className="text-slate-400">
              Don't have an admin login yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="font-bold text-brand-secondary hover:underline"
              >
                Create Admin Account
              </button>
            </p>
          )}

          {mode !== 'login' && (
            <p className="text-slate-400">
              Already have credentials?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="font-bold text-brand-secondary hover:underline"
              >
                Back to Sign In
              </button>
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-800 px-3 text-slate-400 font-medium">
              Or continue with
            </span>
          </div>
        </div>

        {/* Continue with Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 hover:bg-slate-850 text-slate-200 text-sm font-semibold flex items-center justify-center gap-3 shadow-sm transition-all disabled:opacity-50"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="pt-2 text-center">
          <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Return to Customer Storefront
          </Link>
        </div>
      </div>
    </div>
  );
};
