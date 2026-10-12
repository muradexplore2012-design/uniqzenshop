import React, { useEffect, useState } from 'react';
import { Settings, Save, Loader2, CheckCircle2, ShieldCheck, AlertCircle, UserPlus, Info } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { getStoreSettings, updateStoreSettings } from '../../services/settingsService';
import { StoreSettings } from '../../types/settings';
import { logAdminAction } from '../../services/auditService';
import { useAuth } from '../../lib/authContext';
import { makeUserAdmin, isValidEmail } from '../../services/adminRoleService';

export const AdminSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Make Admin State
  const [adminEmail, setAdminEmail] = useState('');
  const [promotingAdmin, setPromotingAdmin] = useState(false);
  const [adminStatus, setAdminStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    getStoreSettings().then((res) => {
      setSettings(res);
      setLoading(false);
    });
  }, []);

  const handleChange = (field: keyof StoreSettings, val: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: val });
  };

  const handleMakeAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminStatus(null);

    const emailTrimmed = adminEmail.trim().toLowerCase();

    if (!emailTrimmed) {
      setAdminStatus({
        type: 'error',
        message: 'Please provide an email address.',
      });
      return;
    }

    if (!isValidEmail(emailTrimmed)) {
      setAdminStatus({
        type: 'error',
        message: 'Please enter a valid email format (e.g., admin@example.com).',
      });
      return;
    }

    if (!currentUser) {
      setAdminStatus({
        type: 'error',
        message: 'You must be signed in as an authorized administrator.',
      });
      return;
    }

    setPromotingAdmin(true);

    try {
      const result = await makeUserAdmin(emailTrimmed, {
        uid: currentUser.uid,
        email: currentUser.email || '',
      });

      if (result.success) {
        setAdminStatus({
          type: 'success',
          message: result.message || `Administrator privileges successfully granted to ${emailTrimmed}.`,
        });
        setAdminEmail('');
      } else if (result.alreadyAdmin) {
        setAdminStatus({
          type: 'info',
          message: result.message || `${emailTrimmed} is already an administrator.`,
        });
      } else {
        setAdminStatus({
          type: 'error',
          message: result.message || 'Failed to promote user to administrator.',
        });
      }
    } catch (err: any) {
      setAdminStatus({
        type: 'error',
        message: err.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setPromotingAdmin(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSuccessMsg('');

    try {
      await updateStoreSettings(settings);
      if (currentUser) {
        logAdminAction(
          currentUser.uid,
          'settings.update',
          'settings',
          'store',
          { storeName: settings.storeName },
          currentUser.email || ''
        );
      }
      setSuccessMsg('Store settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-16 text-center text-sm text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-primary" />
        <span>Loading store settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <SEO title="Site Settings — Admin Portal | Uniqzen Shop" />

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Store Settings & Identity</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage contact numbers, branding, announcement bar, and social connections.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand Information */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Store Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Store Name</label>
              <input
                type="text"
                required
                value={settings.storeName}
                onChange={(e) => handleChange('storeName', e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Store Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Logo Asset Path / URL
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={settings.logoUrl || '/logo.png'}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none font-mono text-xs"
                />
                <img
                  src={settings.logoUrl || '/logo.png'}
                  alt="Logo preview"
                  className="h-10 w-auto object-contain bg-slate-50 border p-1 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Social Media Links
          </h2>
          <p className="text-xs text-slate-500">
            Set your public social profile links. These will appear as clickable icons in your website footer.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Facebook Page URL
              </label>
              <input
                type="url"
                placeholder="https://facebook.com/yourpage"
                value={settings.facebookUrl || ''}
                onChange={(e) => handleChange('facebookUrl', e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                X (Twitter) Profile URL
              </label>
              <input
                type="url"
                placeholder="https://x.com/yourhandle"
                value={settings.twitterUrl || ''}
                onChange={(e) => handleChange('twitterUrl', e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                YouTube Channel URL
              </label>
              <input
                type="url"
                placeholder="https://youtube.com/@yourchannel"
                value={settings.youtubeUrl || ''}
                onChange={(e) => handleChange('youtubeUrl', e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instagram Profile URL
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/yourprofile"
                value={settings.instagramUrl || ''}
                onChange={(e) => handleChange('instagramUrl', e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact & Support */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Contact & Support
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Phone Number
              </label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp Hotline
              </label>
              <input
                type="text"
                required
                value={settings.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Email
              </label>
              <input
                type="email"
                required
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Office / Dispatch Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer About Summary */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Footer About Summary
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Store Information & About Summary
            </label>
            <textarea
              rows={3}
              value={settings.footerAbout || ''}
              onChange={(e) => handleChange('footerAbout', e.target.value)}
              placeholder="A brief summary describing your store in the footer..."
              className="w-full text-sm p-3 rounded-xl border border-slate-300 outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              This text appears under your brand logo in the website footer.
            </p>
          </div>
        </div>

        {/* SEO Defaults */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            SEO Defaults
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Browser Title
            </label>
            <input
              type="text"
              value={settings.seoDefaultTitle}
              onChange={(e) => handleChange('seoDefaultTitle', e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Meta Description
            </label>
            <textarea
              rows={2}
              value={settings.seoDefaultDescription}
              onChange={(e) => handleChange('seoDefaultDescription', e.target.value)}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Store Settings</span>
          </button>
        </div>
      </form>

      {/* Make Admin Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Make Admin</h2>
            <p className="text-xs text-slate-500">
              Grant administrator access and dashboard privileges to an existing user account.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-brand-secondary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">Account Requirement:</p>
            <p>
              The user must already have registered an account on the website and logged in at least once. 
              Their identity is securely resolved on the server via Firebase Authentication without requiring manual UID entry.
            </p>
          </div>
        </div>

        {adminStatus && (
          <div
            className={`p-4 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 border ${
              adminStatus.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : adminStatus.type === 'info'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {adminStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : adminStatus.type === 'info' ? (
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">
                {adminStatus.type === 'success'
                  ? 'Success'
                  : adminStatus.type === 'info'
                  ? 'Notice'
                  : 'Error'}
              </span>
              <span>{adminStatus.message}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleMakeAdminSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="admin-email-input">
              User Email Address
            </label>
            <div className="relative">
              <input
                id="admin-email-input"
                type="email"
                required
                placeholder="e.g. colleague@example.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                disabled={promotingAdmin}
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Double-check the spelling. The user will be given full administrative control over products, orders, coupons, and store settings.
            </p>
          </div>

          <div className="flex justify-start pt-1">
            <button
              type="submit"
              disabled={promotingAdmin || !adminEmail.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {promotingAdmin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying & Promoting...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Make Admin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
