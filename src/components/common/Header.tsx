import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  Gift,
  HelpCircle,
  Sparkles,
  Truck,
  Phone,
  Layers,
  LogOut,
  Package,
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { useCart } from '../../lib/cartContext';
import { useWishlist } from '../../lib/wishlistContext';
import { getCategories, getCachedCategories } from '../../services/categoryService';
import { getProducts } from '../../services/productService';
import { Category } from '../../types/category';
import { Product } from '../../types/product';
import { formatCurrency } from '../../lib/utils';

export const Header: React.FC = () => {

  const { currentUser, isAdmin, logout } = useAuth();
  const { totalItemsCount } = useCart();
  const { wishlistIds } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState<Category[]>(() => getCachedCategories());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [supportsDropdownOpen, setSupportsDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load categories from database
    getCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    });
  }, []);

  // Close menus on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    setShowSearchDropdown(false);
    setAccountDropdownOpen(false);
    setSupportsDropdownOpen(false);
    setHoveredCategory(null);
  }, [location.pathname]);

  // Listen for toggle-mobile-menu from MobileBottomNav
  useEffect(() => {
    const handleToggleMobileMenu = () => {
      setMobileMenuOpen((prev) => {
        const next = !prev;
        if (next) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return next;
      });
    };
    window.addEventListener('toggle-mobile-menu', handleToggleMobileMenu);
    return () => window.removeEventListener('toggle-mobile-menu', handleToggleMobileMenu);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live product search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await getProducts({ search: searchQuery.trim() });
      setSearchResults(results.slice(0, 5));
      setIsSearching(false);
      setShowSearchDropdown(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Only real user categories from database
  const navCategories = categories;


  return (
    <header className="sticky top-0 z-[70] w-full shadow-md">
      {/* =========================================================================
          TIER 1: MAIN HEADER (SLEEK BLACK BACKGROUND - EXACT REFERENCE MATCH)
         ========================================================================= */}
      <div className="bg-[#0b0d13] text-white border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20 gap-2 sm:gap-6">
            {/* -------------------------------------------------------------
                LEFT SECTION: Hamburger Menu on Mobile / Logo on Desktop
               ------------------------------------------------------------- */}
            <div className="flex items-center lg:hidden w-16 sm:w-20">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 -ml-1.5 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 focus:outline-none transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Store Logo Area: Centered on mobile, Left-aligned on Desktop */}
            <div className="flex-1 flex justify-center lg:justify-start lg:flex-initial">
              <Link to="/" className="flex items-center group">
                <div className="bg-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105 flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="Uniqzen Shop"
                    className="h-9 sm:h-10 lg:h-13 w-auto object-contain"
                    loading="eager"
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Search Bar (Reference layout: Wide input with black button inside right) */}
            <div ref={searchRef} className="hidden lg:flex flex-1 max-w-2xl mx-2 lg:mx-6 relative">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowSearchDropdown(true);
                    }}
                    className="w-full pl-5 pr-14 py-3 text-sm bg-white text-slate-900 placeholder-slate-400 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-secondary shadow-sm"
                  />
                  <button
                    type="submit"
                    aria-label="Search"
                    className="absolute right-1.5 top-1.5 bottom-1.5 w-11 bg-slate-950 hover:bg-slate-800 text-white rounded-md flex items-center justify-center transition-colors"
                  >
                    <Search className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </form>

              {/* Live Search Autocomplete Dropdown */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-elevated border border-brand-border z-50 overflow-hidden text-slate-900">
                  {isSearching ? (
                    <div className="p-4 text-center text-xs text-slate-500">Searching products...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.slug || product.id}`}
                          onClick={() => setShowSearchDropdown(false)}
                          className="flex items-center p-3 hover:bg-slate-50 transition-colors gap-3"
                        >
                          <img
                            src={product.thumbnail || product.images[0] || '/logo.png'}
                            alt={product.name}
                            className="w-10 h-10 object-contain rounded bg-white border border-slate-200"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                            <p className="text-xs text-brand-secondary font-bold">
                              {formatCurrency(product.salePrice || product.price)}
                            </p>
                          </div>
                        </Link>
                      ))}
                      <div className="p-2.5 bg-slate-50 text-center">
                        <Link
                          to={`/shop?search=${encodeURIComponent(searchQuery.trim())}`}
                          onClick={() => setShowSearchDropdown(false)}
                          className="text-xs text-brand-primary font-bold hover:underline"
                        >
                          View all matching gadgets for "{searchQuery}" →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No gadgets found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* -------------------------------------------------------------
                RIGHT SECTION (MOBILE): Search Icon + Cart Icon with badge
               ------------------------------------------------------------- */}
            <div className="flex items-center justify-end lg:hidden w-16 sm:w-20 space-x-1 sm:space-x-2">
              <button
                type="button"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                aria-label="Search"
                className={`p-2 rounded-full transition-colors ${
                  mobileSearchOpen ? 'bg-white/20 text-white' : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Search className="w-5 h-5" />
              </button>

              <Link
                to="/cart"
                aria-label="Shopping Cart"
                className="relative p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 576 512" aria-hidden="true">
                  <path fill="currentColor" d="M253.3 35.1c6.1-11.8 1.5-26.3-10.2-32.4s-26.3-1.5-32.4 10.2L117.6 192H32c-17.7 0-32 14.3-32 32s14.3 32 32 32L65 463.7C71.7 510.4 115.2 544 162.4 544h251.2c47.2 0 90.7-33.6 97.4-80.3L544 256c17.7 0 32-14.3 32-32s-14.3-32-32-32H458.4L365.3 12.9C359.2 1.2 344.7-3.4 332.9 2.7s-16.3 20.6-10.2 32.4L404.3 192H171.7L253.3 35.1zM192 288h32v160H192V288zm96 0h32v160H288V288zm96 0h32v160H384V288z" />
                </svg>
                <span className="absolute 0 top-0.5 right-0.5 bg-[#E11D48] text-white text-[10px] font-bold rounded-full h-4 w-4 min-w-[16px] flex items-center justify-center shadow-xs leading-none">
                  {totalItemsCount}
                </span>
              </Link>
            </div>

            {/* -------------------------------------------------------------
                RIGHT SECTION (DESKTOP): Offers, Wishlist, Cart, Account
               ------------------------------------------------------------- */}
            <div className="hidden lg:flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              {/* Offers / Latest Offers Item */}
              <Link
                to="/shop?sortBy=featured"
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors group text-left"
              >
                <div className="text-[#FF5722] group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 9.02V8h2v1.02L15.38 12 17 10.83 14.92 8H20v6z" />
                  </svg>
                </div>
                <div className="leading-tight">
                  <span className="block text-xs font-bold text-white tracking-wide">Offers</span>
                  <span className="block text-[11px] text-slate-300 font-medium group-hover:text-amber-300">
                    Latest Offers
                  </span>
                </div>
              </Link>

              {/* Wishlist Circle Icon Button */}
              <Link
                to="/wishlist"
                aria-label="Wishlist"
                className="relative w-10 h-10 sm:w-11 sm:h-11 bg-black hover:bg-[#E11D48]/15 rounded-full border border-white/70 hover:border-[#E11D48] text-white hover:text-[#E11D48] transition-all flex items-center justify-center shadow-sm group"
              >
                <svg className="w-5 h-5 fill-current transition-colors" viewBox="0 0 512 512" aria-hidden="true">
                  <path fill="currentColor" d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z" />
                </svg>
                {wishlistIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#E11D48] text-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow-xs">
                    {wishlistIds.length}
                  </span>
                )}
              </Link>

              {/* Cart Circle Icon Button with Red Badge */}
              <Link
                to="/cart"
                aria-label="Shopping Cart"
                className="relative w-10 h-10 sm:w-11 sm:h-11 bg-black hover:bg-[#E11D48]/15 rounded-full border border-white/70 hover:border-[#E11D48] text-white hover:text-[#E11D48] transition-all flex items-center justify-center shadow-sm group"
              >
                <svg className="w-5 h-5 fill-current transition-colors" viewBox="0 0 576 512" aria-hidden="true">
                  <path fill="currentColor" d="M253.3 35.1c6.1-11.8 1.5-26.3-10.2-32.4s-26.3-1.5-32.4 10.2L117.6 192H32c-17.7 0-32 14.3-32 32s14.3 32 32 32L65 463.7C71.7 510.4 115.2 544 162.4 544h251.2c47.2 0 90.7-33.6 97.4-80.3L544 256c17.7 0 32-14.3 32-32s-14.3-32-32-32H458.4L365.3 12.9C359.2 1.2 344.7-3.4 332.9 2.7s-16.3 20.6-10.2 32.4L404.3 192H171.7L253.3 35.1zM192 288h32v160H192V288zm96 0h32v160H288V288zm96 0h32v160H384V288z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-[#E11D48] text-white text-[11px] font-bold rounded-full h-4 w-4 min-w-[16px] flex items-center justify-center shadow-xs leading-none">
                  {totalItemsCount}
                </span>
              </Link>

              {/* Account Circle Icon Button with Dropdown */}
              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  aria-label="User Account"
                  className="w-10 h-10 sm:w-11 sm:h-11 bg-black hover:bg-[#E11D48]/15 rounded-full border border-white/70 hover:border-[#E11D48] text-white hover:text-[#E11D48] transition-all flex items-center justify-center shadow-sm group"
                >
                  <svg className="w-[18px] h-[18px] fill-current transition-colors" viewBox="0 0 448 512" aria-hidden="true">
                    <path fill="currentColor" d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z" />
                  </svg>
                </button>

                {accountDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-elevated border border-slate-200 py-2 z-50 text-slate-800">
                    {currentUser ? (
                      <>
                        <div className="px-4 py-2.5 border-b border-slate-100">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {currentUser.displayName || 'Customer'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                        </div>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center px-4 py-2 text-xs font-bold text-brand-secondary hover:bg-slate-50 gap-2"
                          >
                            <Layers className="w-4 h-4" />
                            <span>Admin Portal</span>
                          </Link>
                        )}

                        <Link
                          to="/account"
                          className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 gap-2"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          <span>My Account</span>
                        </Link>

                        <Link
                          to="/account?tab=orders"
                          className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 gap-2"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          <span>Order History</span>
                        </Link>

                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button
                            type="button"
                            onClick={async () => {
                              await logout();
                              navigate('/');
                            }}
                            className="flex items-center w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 gap-2"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 space-y-3">
                        <p className="text-center text-xs text-slate-500 font-medium">
                          Sign in to view your orders
                        </p>

                        <Link
                          to="/account"
                          onClick={() => setAccountDropdownOpen(false)}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#991b1b] hover:bg-[#b91c1c] active:bg-[#7f1d1d] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] text-center"
                        >
                          LOGIN / REGISTER
                        </Link>

                        <div className="pt-2 border-t border-slate-100">
                          <Link
                            to="/track-order"
                            onClick={() => setAccountDropdownOpen(false)}
                            className="block text-center text-xs text-slate-600 hover:text-slate-900 font-medium hover:underline py-1 transition-colors"
                          >
                            Track Order (Guest)
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search Toggle (Slide-down search bar when Search icon is tapped) */}
          {mobileSearchOpen && (
            <div className="lg:hidden pb-3 pt-1 border-t border-slate-800/60 animate-in fade-in duration-200">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder="Search for gadgets, phones, audio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-11 py-2 text-xs bg-white text-slate-900 placeholder-slate-400 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-secondary shadow-inner"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-1 top-1 bottom-1 w-9 bg-slate-950 text-white rounded flex items-center justify-center hover:bg-slate-800 transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          TIER 2: CATEGORIES SUB-NAVIGATION BAR (CLEAN WHITE - EXACT REFERENCE MATCH)
         ========================================================================= */}
      <div className="hidden lg:block bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-center space-x-5 xl:space-x-7 py-3 text-xs sm:text-[13px] font-semibold tracking-tight text-slate-800">
            {/* Home Link (Red Active Indicator in screenshot) */}
            <Link
              to="/"
              className={`transition-colors font-bold ${
                location.pathname === '/'
                  ? 'text-[#E11D48]'
                  : 'text-slate-800 hover:text-[#E11D48]'
              }`}
            >
              Home
            </Link>

            {/* Dynamic Category Navigation Items */}
            {navCategories.map((cat) => {
              const isHovered = hoveredCategory === cat.slug;
              const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;

              return (
                <div
                  key={cat.slug || cat.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredCategory(cat.slug)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <Link
                    to={`/category/${cat.slug || cat.id}`}
                    className={`flex items-center space-x-1 py-1 hover:text-[#E11D48] transition-colors ${
                      location.pathname === `/category/${cat.slug || cat.id}`
                        ? 'text-[#E11D48]'
                        : 'text-slate-800'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-[#E11D48] group-hover:rotate-180 transition-transform" />
                  </Link>

                  {/* Dropdown Menu for Subcategories or Quick Links */}
                  {isHovered && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-elevated border border-slate-200 py-2 z-50 animate-in fade-in">
                      {hasSubcategories ? (
                        cat.subcategories!.map((sub, idx) => (
                          <Link
                            key={idx}
                            to={`/shop?category=${cat.slug}&subcategory=${encodeURIComponent(sub)}`}
                            className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#E11D48] transition-colors"
                          >
                            {sub}
                          </Link>
                        ))
                      ) : (
                        <Link
                          to={`/category/${cat.slug || cat.id}`}
                          className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#E11D48] transition-colors"
                        >
                          View All {cat.name}
                        </Link>
                      )}
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <Link
                          to={`/shop?category=${cat.slug || cat.id}`}
                          className="block px-4 py-1.5 text-[11px] font-bold text-[#E11D48] hover:bg-slate-50"
                        >
                          Browse {cat.name} Catalog →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* New Arrivals Link */}
            <Link
              to="/shop?sortBy=newest"
              className={`hover:text-[#E11D48] transition-colors ${
                location.search.includes('newest') ? 'text-[#E11D48]' : 'text-slate-800'
              }`}
            >
              New Arrivals
            </Link>

            {/* Supports Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setSupportsDropdownOpen(true)}
              onMouseLeave={() => setSupportsDropdownOpen(false)}
            >
              <button
                type="button"
                className="flex items-center space-x-1 py-1 hover:text-[#E11D48] transition-colors text-slate-800"
              >
                <span>Supports</span>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-[#E11D48] group-hover:rotate-180 transition-transform" />
              </button>

              {supportsDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-52 bg-white rounded-xl shadow-elevated border border-slate-200 py-2 z-50 animate-in fade-in">
                  <Link
                    to="/track-order"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#E11D48]"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track Your Order</span>
                  </Link>
                  <Link
                    to="/contact"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#E11D48]"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Contact Support</span>
                  </Link>
                  <Link
                    to="/warranty-policy"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#E11D48]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Warranty Policy</span>
                  </Link>
                  <Link
                    to="/shipping-policy"
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#E11D48]"
                  >
                    Delivery Information
                  </Link>
                  <Link
                    to="/return-policy"
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#E11D48]"
                  >
                    Return & Refund
                  </Link>
                  <Link
                    to="/faq"
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#E11D48]"
                  >
                    Frequently Asked Questions
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* =========================================================================
          MOBILE SLIDING DRAWER MENU (SLIDES IN FROM THE LEFT)
         ========================================================================= */}
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-over panel (from left) - Cleanly layered over everything */}
      <div
        className={`fixed inset-y-0 left-0 w-[82%] max-w-xs bg-white z-[70] lg:hidden shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header: Logo + Close button */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
            <img
              src="/logo.png"
              alt="Uniqzen Shop"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {/* Main Navigation Links */}
          <div className="py-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-800 hover:bg-slate-50 hover:text-brand-primary transition-colors"
            >
              HOME
            </Link>

            <Link
              to="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-800 hover:bg-slate-50 hover:text-brand-primary transition-colors"
            >
              SHOP ALL
            </Link>

            {/* Categories Header & List */}
            <div className="px-5 pt-3 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                CATEGORIES
              </p>
            </div>
            {navCategories && navCategories.length > 0 ? (
              <div className="py-1">
                {navCategories.map((c) => (
                  <Link
                    key={c.slug || c.id}
                    to={`/category/${c.slug || c.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <span>{c.name}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 -rotate-90" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="px-5 py-1 text-xs text-slate-400 italic">No categories yet</p>
            )}

            <Link
              to="/track-order"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-800 hover:bg-slate-50 hover:text-brand-primary transition-colors border-t border-slate-100 mt-2"
            >
              TRACK ORDER
            </Link>

            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-800 hover:bg-slate-50 hover:text-brand-primary transition-colors"
            >
              ABOUT US
            </Link>

            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-800 hover:bg-slate-50 hover:text-brand-primary transition-colors"
            >
              CONTACT & SUPPORT
            </Link>

            <Link
              to="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-800 hover:bg-slate-50 hover:text-brand-primary transition-colors"
            >
              <span>WISHLIST ({wishlistIds.length})</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block mx-5 my-2 px-3 py-2 text-center rounded-xl bg-slate-950 text-white font-bold text-xs uppercase tracking-wider shadow-xs"
              >
                ADMIN DASHBOARD
              </Link>
            )}
          </div>
        </div>

        {/* Drawer Bottom Footer: Phone, Delivery Notice, Customer Account */}
        <div className="border-t border-slate-100 bg-slate-50/70 p-4 space-y-2 text-xs text-slate-600">
          <a
            href="tel:01768534545"
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span>01768-534545</span>
          </a>

          <div className="flex items-center gap-2 text-slate-600">
            <Truck className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span>All bangladesh delivery</span>
          </div>

          <div className="pt-2 border-t border-slate-200/80">
            <Link
              to="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="font-bold text-slate-900 hover:text-brand-primary text-xs underline block"
            >
              {currentUser ? `Logged in: ${currentUser.displayName || currentUser.email}` : 'Customer Login / Register'}
            </Link>
          </div>
        </div>
      </div>
    </header>

  );
};
