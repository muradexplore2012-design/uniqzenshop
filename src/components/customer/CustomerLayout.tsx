import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';
import { MobileBottomNav } from '../common/MobileBottomNav';

export const CustomerLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-brand-background text-brand-foreground">
      <Header />
      <main className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </main>
      <Footer />

      {/* Floating WhatsApp Quick Support Button */}
      <a
        href="https://wa.me/8801768534545?text=Hello%20Uniqzen%20Shop%2C%20I%20have%20an%20inquiry%20regarding%20a%20product."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-20 right-3.5 sm:bottom-6 sm:right-6 z-40 flex items-center group transition-transform active:scale-95 hover:scale-105 select-none"
      >
        <span className="hidden sm:inline max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold text-slate-800 bg-white py-2 px-0 group-hover:px-3 rounded-full shadow-lg border border-slate-100 mr-2 opacity-0 group-hover:opacity-100">
          Chat on WhatsApp
        </span>
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
          <img
            src="/whatsapp.png"
            alt="WhatsApp Chat"
            className="w-full h-full object-contain"
          />
        </div>
      </a>

      {/* Mobile Bottom Navigation Bar (Matching Reference Screenshot) */}
      <MobileBottomNav />
    </div>
  );
};

