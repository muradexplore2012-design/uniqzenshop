import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Store, Home, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../../lib/cartContext';

interface MobileBottomNavProps {
  visible?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ visible = true }) => {
  const location = useLocation();
  const { totalItemsCount } = useCart();

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('toggle-mobile-menu'));
  };

  const isHome = location.pathname === '/';
  const isShop = location.pathname.startsWith('/shop') || location.pathname.startsWith('/category');
  const isCart = location.pathname === '/cart';
  const isAccount = location.pathname === '/account';

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] rounded-t-2xl pb-[env(safe-area-inset-bottom)] transition-all duration-500 ease-in-out transform ${
        visible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-end justify-between px-3 sm:px-6 h-14 sm:h-16 relative">
        {/* 1. Menu Item (4-square grid icon) */}
        <button
          type="button"
          onClick={handleMenuClick}
          aria-label="Categories Menu"
          className="flex-1 flex flex-col items-center justify-center py-1.5 text-slate-600 hover:text-slate-900 active:scale-95 transition-all group"
        >
          <LayoutGrid className="w-5 h-5 text-slate-700 group-hover:text-slate-950 transition-colors" />
          <span className="text-[10px] font-semibold text-slate-600 group-hover:text-slate-950 mt-1 leading-none">
            Menu
          </span>
        </button>

        {/* 2. Shop Item (Storefront icon) */}
        <Link
          to="/shop"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 active:scale-95 transition-all group ${
            isShop ? 'text-slate-950 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className={`w-5 h-5 transition-colors ${isShop ? 'text-slate-950 stroke-[2.5]' : 'text-slate-700'}`} />
          <span className={`text-[10px] mt-1 leading-none ${isShop ? 'font-bold text-slate-950' : 'font-semibold text-slate-600'}`}>
            Shop
          </span>
        </Link>

        {/* 3. Home Item (Center Raised Circular Button) */}
        <div className="flex-1 flex flex-col items-center justify-center relative -top-3">
          <Link
            to="/"
            aria-label="Home"
            className="w-12 h-12 rounded-full bg-[#0b0d13] text-white flex items-center justify-center border-4 border-white shadow-md active:scale-95 transition-transform group"
          >
            <Home className="w-5 h-5 text-white transition-transform group-hover:scale-110" />
          </Link>
          <span className={`text-[10px] mt-0.5 leading-none ${isHome ? 'font-bold text-slate-950' : 'font-semibold text-slate-700'}`}>
            Home
          </span>
        </div>

        {/* 4. Cart Item (Shopping Cart with Badge) */}
        <Link
          to="/cart"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 active:scale-95 transition-all relative group ${
            isCart ? 'text-slate-950 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <ShoppingCart className={`w-5 h-5 transition-colors ${isCart ? 'text-slate-950 stroke-[2.5]' : 'text-slate-700'}`} />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#E11D48] text-white text-[9px] font-bold rounded-full h-4 w-4 min-w-[16px] flex items-center justify-center shadow-xs leading-none">
                {totalItemsCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-1 leading-none ${isCart ? 'font-bold text-slate-950' : 'font-semibold text-slate-600'}`}>
            Cart
          </span>
        </Link>

        {/* 5. Account Item (User Silhouette) */}
        <Link
          to="/account"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 active:scale-95 transition-all group ${
            isAccount ? 'text-slate-950 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className={`w-5 h-5 transition-colors ${isAccount ? 'text-slate-950 stroke-[2.5]' : 'text-slate-700'}`} />
          <span className={`text-[10px] mt-1 leading-none ${isAccount ? 'font-bold text-slate-950' : 'font-semibold text-slate-600'}`}>
            Account
          </span>
        </Link>
      </div>
    </nav>
  );
};
