import React, { useEffect, useState } from 'react';
import {
  Settings,
  Save,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  UserPlus,
  Info,
  Users,
  UserX,
  RefreshCw,
  Mail,
  Calendar,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { getStoreSettings, updateStoreSettings } from '../../services/settingsService';
import { StoreSettings } from '../../types/settings';
import { logAdminAction } from '../../services/auditService';
import { useAuth } from '../../lib/authContext';
import { makeUserAdmin, isValidEmail, getAdminUsers, revokeAdminRole } from '../../services/adminRoleService';
import { UserProfile } from '../../types/user';
import { formatDate } from '../../lib/utils';

export const AdminSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'store' | 'admin'>('store');

  // Make Admin State
  const [adminEmail, setAdminEmail] = useState('');
  const [promotingAdmin, setPromotingAdmin] = useState(false);
  const [adminStatus, setAdminStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Admin List State
  const [adminList, setAdminList] = useState<UserProfile[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [revokingUid, setRevokingUid] = useState<string | null>(null);

  const loadAdminList = async () => {
    setLoadingAdmins(true);
    try {
      const list = await getAdminUsers();
      // Ensure currentUser is included if not in the list
      if (
        currentUser &&
        !list.some(
          (a) =>
            a.uid === currentUser.uid ||
            (a.email && currentUser.email && a.email.toLowerCase() === currentUser.email.toLowerCase())
        )
      ) {
        list.unshift({
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || 'Administrator',
          role: 'admin',
          createdAt: null,
          updatedAt: null,
        });
      }
      setAdminList(list);
    } catch (e) {
      console.error('Error loading admins:', e);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin') {
      loadAdminList();
    }
  }, [activeTab]);

  const handleRevokeAdmin = async (admin: UserProfile) => {
    if (!currentUser) return;
    if (
      admin.uid === currentUser.uid ||
      (admin.email && currentUser.email && admin.email.toLowerCase() === currentUser.email.toLowerCase())
    ) {
      alert('You cannot revoke your own administrator access.');
      return;
    }

    const confirmMsg = `Are you sure you want to revoke admin privileges for "${admin.displayName || admin.email}"?\n\nThey will be reverted to a standard customer account.`;
    if (!window.confirm(confirmMsg)) return;

    setRevokingUid(admin.uid);
    try {
      const res = await revokeAdminRole(admin.uid, {
        uid: currentUser.uid,
        email: currentUser.email || '',
      });
      if (res.success) {
        setAdminStatus({
          type: 'info',
          message: `Admin privileges revoked for ${admin.email}.`,
        });
        await loadAdminList();
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to revoke admin privileges');
    } finally {
      setRevokingUid(null);
    }
  };

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
        await loadAdminList();
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

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('store')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'store'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Store Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'admin'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Make Admin</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {activeTab === 'store' && (
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
      )}

      {/* Make Admin & Admin List Tab Section */}
      {activeTab === 'admin' && (
      <div className="space-y-6">
        {/* Make Admin Form Card */}
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
              <p className="font-semibold text-slate-800">অ্যাকাউন্টের শর্তাবলী ও নিয়ম:</p>
              <p>
                যাকে অ্যাডমিন করতে চান, তাকে অবশ্যই পূর্বে ওয়েবসাইটে একটি অ্যাকাউন্ট রেজিস্টার করতে হবে এবং অন্তত একবার লগইন করতে হবে। ম্যানুয়ালি কোনো UID ইনপুট দেওয়ার প্রয়োজন নেই, Firebase Authentication-এর মাধ্যমে সার্ভারে তার পরিচয় স্বয়ংক্রিয় ও নিরাপদে যাচাই করা হবে।
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
                ইমেইলের বানান ভালোভাবে যাচাই করে নিন। এই ব্যবহারকারী প্রোডাক্ট, অর্ডার, কুপন এবং স্টোর সেটিংসের সম্পূর্ণ অ্যাডমিন নিয়ন্ত্রণ পাবেন।
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

        {/* Admin List Card */}
        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-subtle space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">Active Administrators</h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-purple-100 text-purple-700">
                    {adminList.length} {adminList.length === 1 ? 'Admin' : 'Admins'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Current dashboard administrators
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadAdminList}
              disabled={loadingAdmins}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors self-start sm:self-auto disabled:opacity-50"
              title="Refresh admin list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAdmins ? 'animate-spin text-brand-primary' : ''}`} />
              <span>Refresh List</span>
            </button>
          </div>

          {loadingAdmins ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
              <p className="text-xs font-medium">Loading administrators list...</p>
            </div>
          ) : adminList.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No administrators found.
            </div>
          ) : (
            <>
              {/* Mobile View: Clean Card Layout for small screens */}
              <div className="block md:hidden space-y-3">
                {adminList.map((admin) => {
                  const isSelf =
                    currentUser?.uid === admin.uid ||
                    (currentUser?.email && admin.email && currentUser.email.toLowerCase() === admin.email.toLowerCase());
                  const initials = (admin.displayName || admin.email || 'A').slice(0, 2).toUpperCase();

                  return (
                    <div
                      key={admin.uid}
                      className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 shadow-xs space-y-2.5 transition-all"
                    >
                      {/* Top Row: User Avatar, Name, Badges & Action */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {admin.photoURL ? (
                            <img
                              src={admin.photoURL}
                              alt={admin.displayName || admin.email}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                {admin.displayName || 'Administrator'}
                              </h4>
                              {isSelf && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                              <ShieldCheck className="w-3 h-3 text-purple-600" />
                              Administrator
                            </span>
                          </div>
                        </div>

                        {/* Action: Revoke or Active badge */}
                        <div className="flex-shrink-0">
                          {isSelf ? (
                            <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                              Current
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRevokeAdmin(admin)}
                              disabled={revokingUid === admin.uid}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                              title="Revoke admin access"
                            >
                              {revokingUid === admin.uid ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <UserX className="w-3.5 h-3.5" />
                              )}
                              <span>Revoke</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Email Row */}
                      <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200/70 text-xs text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium break-all">{admin.email}</span>
                      </div>

                      {/* Bottom Info: Created Date and UID */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{admin.createdAt ? formatDate(admin.createdAt) : 'Configured Admin'}</span>
                        </div>
                        <span className="font-mono">
                          UID: {admin.uid ? `${admin.uid.slice(0, 8)}...` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Full Responsive Table for md+ screens */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3">Admin User</th>
                      <th className="py-3 px-3">Email Address</th>
                      <th className="py-3 px-3">Role / Status</th>
                      <th className="py-3 px-3">Added Date</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {adminList.map((admin) => {
                      const isSelf =
                        currentUser?.uid === admin.uid ||
                        (currentUser?.email && admin.email && currentUser.email.toLowerCase() === admin.email.toLowerCase());
                      const initials = (admin.displayName || admin.email || 'A').slice(0, 2).toUpperCase();

                      return (
                        <tr key={admin.uid} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              {admin.photoURL ? (
                                <img
                                  src={admin.photoURL}
                                  alt={admin.displayName || admin.email}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                                  {initials}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  <span>{admin.displayName || 'Administrator'}</span>
                                  {isSelf && (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                      You (Current)
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  UID: {admin.uid ? `${admin.uid.slice(0, 8)}...` : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-medium text-slate-700">{admin.email}</span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                              <ShieldCheck className="w-3 h-3 text-purple-600" />
                              Administrator
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                            {admin.createdAt ? formatDate(admin.createdAt) : 'Configured Admin'}
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            {isSelf ? (
                              <span className="text-[11px] text-slate-400 italic">Active Session</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRevokeAdmin(admin)}
                                disabled={revokingUid === admin.uid}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-transparent text-[11px] font-medium transition-all disabled:opacity-50"
                                title="Revoke admin access"
                              >
                                {revokingUid === admin.uid ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <UserX className="w-3 h-3" />
                                )}
                                <span>Revoke</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      )}

    </div>
  );
};
