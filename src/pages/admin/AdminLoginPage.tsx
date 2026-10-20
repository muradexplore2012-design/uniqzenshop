import React, { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { useAuth } from '../../lib/authContext';
import { GoogleSignInButton } from '../../components/common/GoogleSignInButton';

export const AdminLoginPage: React.FC = () => {
  const { currentUser, isAdmin, loading: authLoading, loginWithEmail, loginWithGoogle, resetPassword, logout } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // While checking redirect authentication:
  if (authLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-secondary" />
        <p className="text-xs text-slate-400 font-medium">Signing into Admin...</p>
      </div>
    );
  }

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
        msg = 'Invalid email or password. Please verify your admin credentials.';
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
      // Browser navigates directly to Google authentication page
    } catch (err: any) {
      setGoogleLoading(false);
      let msg = err.message || 'Failed to sign in with Google. Please try again.';
      if (err.code === 'auth/unauthorized-domain') {
        msg = `এই ডোমেইনটি (${window.location.hostname}) Firebase Console-এ অথোরাইজ করা নেই। অনুগ্রহ করে Firebase Console > Authentication > Settings > Authorized domains-এ যোগ করুন।`;
      }
      setErrorMsg(msg);
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
            {mode === 'login' ? 'Staff Administration Portal' : 'Reset Admin Password'}
          </h1>
          <p className="text-xs text-slate-400">
            {mode === 'login'
              ? 'Sign in with administrator credentials to manage Uniqzen Shop.'
              : 'আপনার অ্যাডমিন ইমেইলটি লিখে বাটনে চাপ দিন। আপনার ইনবক্সে পাসওয়ার্ড রিসেট লিংক চলে যাবে।'}
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
          <div className="p-3.5 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder=""
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
                    className="text-[11px] text-white hover:text-slate-200 hover:underline font-medium transition-colors"
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
            ) : (
              <span>Send Password Reset Link (রিসেট লিংক পাঠান)</span>
            )}
          </button>
        </form>

        {/* Toggle Mode Links */}
        {mode === 'forgot' && (
          <div className="text-center text-xs">
            <p className="text-slate-400">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="font-bold text-white hover:underline"
              >
                Back to Sign In
              </button>
            </p>
          </div>
        )}

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

        {/* Native Ultra-Fast Google Sign-In */}
        <GoogleSignInButton
          theme="dark"
          onSuccess={() => {
            navigate('/admin');
          }}
          onError={(err) => setErrorMsg(err)}
        />

        <div className="pt-2 text-center">
          <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Return to Customer Storefront
          </Link>
        </div>
      </div>
    </div>
  );
};
