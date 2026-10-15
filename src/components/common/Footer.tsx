import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, ChevronRight } from 'lucide-react';
import { getStoreSettings, DEFAULT_STORE_SETTINGS } from '../../services/settingsService';
import { StoreSettings } from '../../types/settings';

export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    let isMounted = true;
    getStoreSettings()
      .then((data) => {
        if (isMounted && data) {
          setSettings(data);
        }
      })
      .catch((err) => {
        console.warn('Could not load store settings for footer:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const phone = settings.phone || '01566088159';
  const email = settings.email || 'uniqzenshop@gmail.com';
  const facebookUrl = settings.facebookUrl || '';
  const twitterUrl = settings.twitterUrl || '';
  const youtubeUrl = settings.youtubeUrl || '';
  const instagramUrl = settings.instagramUrl || '';

  return (
    <footer id="site-footer" className="bg-[#0b1320] text-slate-300 mt-16 pt-14 pb-6 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12">
          
          {/* Column 1: Store Logo & Contact Information */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img
                src={settings.logoUrl || '/logo.png'}
                alt={settings.storeName || 'Uniqzen Shop'}
                className="h-12 w-auto object-contain bg-white/95 px-2 py-1 rounded-xl shadow-sm"
              />
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed">
              UniqzenShop is your trusted destination for cutting-edge gadgets, tech accessories, and smart lifestyle products in Bangladesh.
            </p>

            <div className="space-y-3 pt-2 text-sm">
              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <a
                    href={`tel:${phone}`}
                    className="font-semibold text-white hover:text-brand-secondary transition-colors block text-sm"
                  >
                    {phone}
                  </a>
                  <span className="text-xs text-slate-400">9:00 AM – 11:00 PM</span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <a
                  href={`mailto:${email}`}
                  className="text-slate-300 hover:text-white transition-colors text-sm break-all"
                >
                  {email}
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Customer Service */}
          <div>
            <h3 className="text-base font-bold text-white mb-5 tracking-wide">
              Customer Service
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <Link
                  to="/contact"
                  className="flex items-center gap-2 hover:text-brand-secondary hover:translate-x-1 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <span>Contact Us</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/track-order"
                  className="flex items-center gap-2 hover:text-brand-secondary hover:translate-x-1 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <span>Track Order</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/return-policy"
                  className="flex items-center gap-2 hover:text-brand-secondary hover:translate-x-1 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <span>Return & Exchange</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/warranty-policy"
                  className="flex items-center gap-2 hover:text-brand-secondary hover:translate-x-1 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <span>Warranty Policy</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/shipping-policy"
                  className="flex items-center gap-2 hover:text-brand-secondary hover:translate-x-1 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <span>Shipping Information</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="flex items-center gap-2 hover:text-brand-secondary hover:translate-x-1 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Useful Links */}
          <div>
            <h3 className="text-base font-bold text-white mb-5 tracking-wide">
              Useful Links
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <Link
                  to="/shop"
                  className="flex items-center gap-2 hover:text-brand-secondary hover:translate-x-1 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <span>All Products</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="flex items-center gap-2 hover:text-brand-secondary hover:translate-x-1 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="flex items-center gap-2 hover:text-brand-secondary hover:translate-x-1 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <span>Blogs</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="flex items-center gap-2 hover:text-brand-secondary hover:translate-x-1 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <span>FAQ</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="flex items-center gap-2 hover:text-brand-secondary hover:translate-x-1 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <span>Terms & Conditions</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Follow Us & We Accept */}
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white mb-1 tracking-wide">
                Follow Us
              </h3>
              <p className="text-xs text-slate-400 mb-3.5">
                Stay connected with us
              </p>

              {/* Social Media Icons */}
              <div className="flex items-center gap-2.5">
                {/* Facebook */}
                <a
                  href={facebookUrl || '#'}
                  target={facebookUrl ? '_blank' : undefined}
                  rel={facebookUrl ? 'noopener noreferrer' : undefined}
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-lg bg-slate-800/90 border border-slate-700 hover:bg-[#1877F2] hover:border-[#1877F2] text-slate-300 hover:text-white transition-all flex items-center justify-center shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* X (Twitter) */}
                <a
                  href={twitterUrl || '#'}
                  target={twitterUrl ? '_blank' : undefined}
                  rel={twitterUrl ? 'noopener noreferrer' : undefined}
                  aria-label="X (Twitter)"
                  className="w-9 h-9 rounded-lg bg-slate-800/90 border border-slate-700 hover:bg-black hover:border-slate-500 text-slate-300 hover:text-white transition-all flex items-center justify-center shadow-sm"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href={youtubeUrl || '#'}
                  target={youtubeUrl ? '_blank' : undefined}
                  rel={youtubeUrl ? 'noopener noreferrer' : undefined}
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-lg bg-slate-800/90 border border-slate-700 hover:bg-[#FF0000] hover:border-[#FF0000] text-slate-300 hover:text-white transition-all flex items-center justify-center shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href={instagramUrl || '#'}
                  target={instagramUrl ? '_blank' : undefined}
                  rel={instagramUrl ? 'noopener noreferrer' : undefined}
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-lg bg-slate-800/90 border border-slate-700 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:border-pink-500 text-slate-300 hover:text-white transition-all flex items-center justify-center shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* We Accept */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3 tracking-wide">
                We Accept
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {/* bKash */}
                <div className="bg-white px-2.5 py-1.5 rounded-md flex items-center justify-center border border-slate-200 shadow-sm h-7">
                  <span className="text-[11px] font-black text-[#E2136E]">bKash</span>
                </div>
                {/* Nagad */}
                <div className="bg-white px-2.5 py-1.5 rounded-md flex items-center justify-center border border-slate-200 shadow-sm h-7">
                  <span className="text-[11px] font-black text-[#F7941D]">Nagad</span>
                </div>
                {/* Rocket */}
                <div className="bg-white px-2.5 py-1.5 rounded-md flex items-center justify-center border border-slate-200 shadow-sm h-7">
                  <span className="text-[11px] font-black text-[#8C3494]">Rocket</span>
                </div>
                {/* Upay */}
                <div className="bg-white px-2.5 py-1.5 rounded-md flex items-center justify-center border border-slate-200 shadow-sm h-7">
                  <span className="text-[11px] font-black text-[#005BAC]">Upay</span>
                </div>
                {/* Cash on Delivery */}
                <div className="bg-slate-800 border border-slate-700 px-2 py-1 rounded-md flex items-center gap-1.5 h-7">
                  <span className="text-[10px] font-semibold text-emerald-400">💵 COD</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sub-Footer Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© 2026 UniqzenShop</p>
          <p className="text-slate-400">
            Design By{' '}
            <a
              href="https://www.facebook.com/profile.php?id=100085471628384"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white hover:underline hover:text-blue-400 transition-colors inline-block"
            >
              Murad Rahman
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
