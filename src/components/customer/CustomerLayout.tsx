import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';
import { MobileBottomNav } from '../common/MobileBottomNav';
import { getStoreSettings } from '../../services/settingsService';

export const CustomerLayout: React.FC = () => {
  const [showWhatsApp, setShowWhatsApp] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('01768534545');
  const location = useLocation();

  useEffect(() => {
    getStoreSettings().then((s) => {
      if (s?.whatsapp) {
        setWhatsappNumber(s.whatsapp.trim());
      }
    });
  }, []);

  useEffect(() => {
    const checkFooter = () => {
      const footer = document.getElementById('site-footer');
      if (!footer) {
        setShowWhatsApp(true);
        return;
      }

      const rect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;

      // If the top of the footer enters near the viewport bottom (buffer of 60px)
      // hide the WhatsApp icon so it never overlaps footer contents or copyright text
      if (rect.top <= windowHeight - 60) {
        setShowWhatsApp(false);
      } else {
        setShowWhatsApp(true);
      }
    };

    // Also observe footer with IntersectionObserver if available
    let observer: IntersectionObserver | null = null;
    const footer = document.getElementById('site-footer');
    if (footer && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          // When footer intersects with viewport bottom, hide
          if (entry.isIntersecting) {
            setShowWhatsApp(false);
          } else {
            checkFooter();
          }
        },
        {
          root: null,
          rootMargin: '0px 0px -60px 0px',
          threshold: 0,
        }
      );
      observer.observe(footer);
    }

    window.addEventListener('scroll', checkFooter, { passive: true });
    window.addEventListener('resize', checkFooter, { passive: true });

    // Initial check
    checkFooter();

    return () => {
      window.removeEventListener('scroll', checkFooter);
      window.removeEventListener('resize', checkFooter);
      if (observer) observer.disconnect();
    };
  }, [location.pathname]);

  const cleanWaDigits = whatsappNumber.replace(/\D/g, '');
  const waTarget = cleanWaDigits.startsWith('880')
    ? cleanWaDigits
    : cleanWaDigits.startsWith('0')
    ? `88${cleanWaDigits}`
    : `880${cleanWaDigits}`;

  return (
    <div className="flex flex-col min-h-screen bg-brand-background text-brand-foreground">
      <Header />
      <main className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </main>
      <Footer />

      {/* Floating WhatsApp Quick Support Button with smooth enter/exit animation */}
      <a
        href={`https://wa.me/${waTarget}?text=Hello%20Uniqzen%20Shop%2C%20I%20have%20an%20inquiry%20regarding%20a%20product.`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className={`fixed bottom-20 right-3.5 sm:bottom-6 sm:right-6 z-40 flex items-center group select-none transition-all duration-500 ease-in-out transform ${
          showWhatsApp
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-12 scale-75 pointer-events-none'
        }`}
      >
        <span className="hidden sm:inline max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold text-slate-800 bg-white py-2 px-0 group-hover:px-3 rounded-full shadow-lg border border-slate-100 mr-2 opacity-0 group-hover:opacity-100">
          Chat on WhatsApp
        </span>
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center drop-shadow-lg transition-transform duration-300 group-hover:scale-110 active:scale-95">
          <img
            src="/whatsapp.png"
            alt="WhatsApp Chat"
            className="w-full h-full object-contain"
          />
        </div>
      </a>

      {/* Mobile Bottom Navigation Bar with smooth slide animation on footer scroll */}
      <MobileBottomNav visible={showWhatsApp} />
    </div>
  );
};