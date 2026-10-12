import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShoppingBag } from 'lucide-react';
import { SEO } from '../../components/common/SEO';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <SEO title="Page Not Found (404) — Uniqzen Shop" />
      <div className="max-w-md w-full bg-white p-8 sm:p-12 rounded-3xl border border-brand-border shadow-subtle space-y-6">
        <img src="/logo.png" alt="Uniqzen Shop" className="h-14 mx-auto object-contain" />
        <div className="space-y-2">
          <span className="text-5xl font-black text-slate-900 block font-mono">404</span>
          <h1 className="text-xl font-bold text-slate-800">Page Not Found</h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            The page you are looking for does not exist or has been moved. Explore our authentic gadget catalog.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/"
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-hover transition-colors shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
          <Link
            to="/shop"
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Shop</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
