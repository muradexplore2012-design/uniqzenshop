import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { getStaticPage, getStoreSettings, DEFAULT_STORE_SETTINGS } from '../../services/settingsService';
import { StaticPageContent, StoreSettings } from '../../types/settings';

export const StaticContentPage: React.FC = () => {
  const location = useLocation();
  // slug without leading slash
  const slug = location.pathname.replace(/^\//, '');

  const [page, setPage] = useState<StaticPageContent | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getStaticPage(slug),
      getStoreSettings(),
    ]).then(([pageData, settingsData]) => {
      setPage(pageData);
      if (settingsData) setStoreSettings(settingsData);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading page content...</p>
      </div>
    );
  }

  const isContactPage = slug === 'contact';
  const cleanPhone = (storeSettings.phone || '01768534545').trim();
  const rawWhatsapp = (storeSettings.whatsapp || cleanPhone).trim();
  const digitsOnlyWhatsapp = rawWhatsapp.replace(/\D/g, '');
  const waInternational = digitsOnlyWhatsapp.startsWith('880')
    ? digitsOnlyWhatsapp
    : digitsOnlyWhatsapp.startsWith('0')
    ? `88${digitsOnlyWhatsapp}`
    : `880${digitsOnlyWhatsapp}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SEO title={`${page?.title || 'Policy'} — Uniqzen Shop`} />

      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-slate-700">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-semibold">{page?.title}</span>
      </nav>

      {/* Page Card */}
      <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-12 shadow-subtle space-y-6">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {page?.title}
        </h1>

        {/* If Contact Page, show live contact details from Settings */}
        {isContactPage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 block">Customer Hotline</span>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Phone className="w-4 h-4 text-brand-secondary" />
                <a href={`tel:${cleanPhone}`} className="hover:text-brand-secondary transition-colors">
                  {cleanPhone}
                </a>
              </div>
              <p className="text-[11px] text-slate-400">Available 9:00 AM – 10:00 PM</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 block">WhatsApp Support</span>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <a
                  href={`https://wa.me/${waInternational}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-800 transition-colors"
                >
                  {rawWhatsapp}
                </a>
              </div>
              <p className="text-[11px] text-slate-400">Instant chat & order queries</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 block">Official Email</span>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Mail className="w-4 h-4 text-brand-secondary" />
                <a
                  href={`mailto:${storeSettings.email || 'uniqzenshop@gmail.com'}`}
                  className="hover:text-brand-secondary transition-colors break-all"
                >
                  {storeSettings.email || 'uniqzenshop@gmail.com'}
                </a>
              </div>
              <p className="text-[11px] text-slate-400">We respond within 24 hours</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 block">Dispatch Hub</span>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <MapPin className="w-4 h-4 text-brand-secondary" />
                <span>{storeSettings.address || 'Dhaka, Bangladesh'}</span>
              </div>
              <p className="text-[11px] text-slate-400">Nationwide home delivery</p>
            </div>
          </div>
        )}

        <div className="prose max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {page?.content}
        </div>
      </div>
    </div>
  );
};
