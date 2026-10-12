import React, { useEffect, useState } from 'react';
import { FileText, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { getStaticPage, updateStaticPage } from '../../services/settingsService';
import { StaticPageContent } from '../../types/settings';
import { logAdminAction } from '../../services/auditService';
import { useAuth } from '../../lib/authContext';

const PAGES_LIST = [
  { slug: 'about', label: 'About Us' },
  { slug: 'contact', label: 'Contact Us' },
  { slug: 'shipping-policy', label: 'Shipping & Delivery Policy' },
  { slug: 'return-policy', label: 'Return & Refund Policy' },
  { slug: 'warranty-policy', label: 'Warranty Policy' },
  { slug: 'privacy-policy', label: 'Privacy Policy' },
  { slug: 'terms', label: 'Terms & Conditions' },
  { slug: 'faq', label: 'Frequently Asked Questions' },
];

export const AdminPagesManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedSlug, setSelectedSlug] = useState('shipping-policy');
  const [pageData, setPageData] = useState<StaticPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadPage(selectedSlug);
  }, [selectedSlug]);

  const loadPage = async (slug: string) => {
    setLoading(true);
    const data = await getStaticPage(slug);
    setPageData(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageData) return;

    setSaving(true);
    setSuccessMsg('');

    try {
      await updateStaticPage(selectedSlug, {
        title: pageData.title,
        content: pageData.content,
      });

      if (currentUser) {
        logAdminAction(
          currentUser.uid,
          'pages.update',
          'page',
          selectedSlug,
          { title: pageData.title },
          currentUser.email || ''
        );
      }

      setSuccessMsg(`Page "${pageData.title}" saved successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      alert('Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <SEO title="Pages & Policy Content — Admin Portal | Uniqzen Shop" />

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Website Content & Policies</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Edit policy guidelines, warranty details, and informational pages without writing code.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Page Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200">
        {PAGES_LIST.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => setSelectedSlug(p.slug)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedSlug === p.slug
                ? 'bg-brand-primary text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Editor Card */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading page content...</div>
      ) : pageData ? (
        <form
          onSubmit={handleSave}
          className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle space-y-5"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Page Headline / Title
            </label>
            <input
              type="text"
              required
              value={pageData.title}
              onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Page Content (Markdown & Text Supported)
            </label>
            <textarea
              rows={14}
              required
              value={pageData.content}
              onChange={(e) => setPageData({ ...pageData, content: e.target.value })}
              className="w-full text-sm p-4 rounded-xl border border-slate-300 font-sans leading-relaxed outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save & Publish Changes</span>
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
};
