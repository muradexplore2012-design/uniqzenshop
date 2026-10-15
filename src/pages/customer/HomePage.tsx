import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Zap,
  Sparkles,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { ProductCard } from '../../components/customer/ProductCard';
import { HeroBannerSlider } from '../../components/customer/HeroBannerSlider';
import { ProductGridSkeleton } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import { getFeaturedProducts, getNewArrivals, getBestSellers } from '../../services/productService';
import { getCategories, getCachedCategories } from '../../services/categoryService';
import { getActiveBanners, getCachedBanners } from '../../services/bannerService';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import { Banner } from '../../types/banner';

export const HomePage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>(() => getCachedBanners());
  const [categories, setCategories] = useState<Category[]>(() => getCachedCategories());
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Category horizontal scroll slider state
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkCategoryScroll = () => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    checkCategoryScroll();
    const handleResize = () => checkCategoryScroll();
    window.addEventListener('resize', handleResize);
    const t = setTimeout(checkCategoryScroll, 300);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t);
    };
  }, [categories]);

  const handleScrollCategories = (direction: 'left' | 'right') => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const scrollAmount = Math.max(220, el.clientWidth * 0.75);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [bannersData, categoriesData, featData, newData, bestData] = await Promise.all([
          getActiveBanners(),
          getCategories(),
          getFeaturedProducts(8),
          getNewArrivals(8),
          getBestSellers(8),
        ]);
        setBanners(bannersData);
        setCategories(categoriesData);
        setFeatured(featData);
        setNewArrivals(newData);
        setBestSellers(bestData);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);


  // Filter out products already shown in previous sections to avoid repeating items on the homepage
  const displayedFeaturedIds = new Set(featured.slice(0, 8).map((p) => p.id));
  const distinctNewArrivals = newArrivals.filter((p) => !displayedFeaturedIds.has(p.id));
  const displayedNewArrivalIds = new Set(distinctNewArrivals.map((p) => p.id));
  const distinctBestSellers = bestSellers.filter(
    (p) => !displayedFeaturedIds.has(p.id) && !displayedNewArrivalIds.has(p.id)
  );

  return (
    <div className="space-y-12 sm:space-y-16">
      <SEO
        title="Uniqzen Shop — Authentic Gadgets & Electronics Bangladesh"
        description="Shop latest smartphones, smartwatches, wireless audio, chargers, and tech accessories at Uniqzen Shop. Cash on Delivery across Bangladesh."
      />

      {/* Hero Banner Section (Clean Visual Banner with Slide/Fade Animation) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2.5 sm:pt-6">
        <HeroBannerSlider banners={banners} loading={loading} />
      </section>

      {/* Trust Badges - Hidden on Mobile per request, visible on md/desktop */}
      <section className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white rounded-2xl border border-brand-border shadow-subtle">
          <div className="flex items-center space-x-3.5 p-2">
            <ShieldCheck className="w-8 h-8 text-brand-secondary flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">100% Genuine</h4>
              <p className="text-xs text-slate-500">Verified authentic devices</p>
            </div>
          </div>
          <div className="flex items-center space-x-3.5 p-2">
            <Truck className="w-8 h-8 text-brand-secondary flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Fast Delivery</h4>
              <p className="text-xs text-slate-500">Inside & outside Dhaka</p>
            </div>
          </div>
          <div className="flex items-center space-x-3.5 p-2">
            <RotateCcw className="w-8 h-8 text-brand-secondary flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Easy Returns</h4>
              <p className="text-xs text-slate-500">7 days replacement policy</p>
            </div>
          </div>
          <div className="flex items-center space-x-3.5 p-2">
            <Zap className="w-8 h-8 text-brand-secondary flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Cash on Delivery</h4>
              <p className="text-xs text-slate-500">Pay safely upon receipt</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Category Section - ONLY Real User Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Category
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
              Get Your Desired Product from Featured Category!
            </p>
          </div>

          <div className="relative group/cat-slider px-1 sm:px-2">
            {/* Left Arrow Button */}
            <button
              type="button"
              onClick={() => handleScrollCategories('left')}
              aria-label="Scroll Categories Left"
              className={`absolute -left-1 sm:-left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md flex items-center justify-center text-slate-700 hover:text-brand-primary hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 ${
                canScrollLeft
                  ? 'opacity-100 pointer-events-auto'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </button>

            {/* Scrollable Categories Track */}
            <div
              ref={categoryScrollRef}
              onScroll={checkCategoryScroll}
              className={`flex items-center gap-3 sm:gap-4 overflow-x-auto scroll-smooth no-scrollbar py-2 px-1 ${
                canScrollLeft || canScrollRight ? 'justify-start' : 'justify-center'
              }`}
            >
              {categories.map((cat) => (
                <Link
                  key={cat.id || cat.slug}
                  to={`/category/${cat.slug || cat.id}`}
                  className="flex-shrink-0 group w-24 sm:w-28 md:w-32 bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-100 hover:border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 flex flex-col items-center select-none"
                >
                  {/* Clean Inner Image Box (Compact size) */}
                  <div className="w-full aspect-square rounded-xl bg-[#f2f4f8] group-hover:bg-[#eaedf3] flex items-center justify-center p-2 sm:p-2.5 transition-colors overflow-hidden">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm"
                        loading="lazy"
                      />
                    ) : (
                      <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 group-hover:text-brand-primary transition-colors" />
                    )}
                  </div>

                  {/* Category Name */}
                  <h3 className="mt-1.5 text-center text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-brand-primary transition-colors line-clamp-1 w-full px-0.5">
                    {cat.name}
                  </h3>
                </Link>
              ))}
            </div>

            {/* Right Arrow Button */}
            <button
              type="button"
              onClick={() => handleScrollCategories('right')}
              aria-label="Scroll Categories Right"
              className={`absolute -right-1 sm:-right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md flex items-center justify-center text-slate-700 hover:text-brand-primary hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 ${
                canScrollRight
                  ? 'opacity-100 pointer-events-auto'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </button>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Featured Products</h2>
            <p className="text-xs sm:text-sm text-slate-500">Handpicked technology picks</p>
          </div>
          {featured.length >= 8 && (
            <Link
              to="/shop"
              className="text-xs sm:text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1"
            >
              <span>View Shop</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : featured.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featured.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Prominent View Shop Button - shown ONLY when 8 or more products are added */}
            {featured.length >= 8 && (
              <div className="mt-8 sm:mt-10 flex justify-center">
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-brand-primary hover:bg-brand-primary-hover shadow-md hover:shadow-lg transition-all duration-200 group active:scale-95"
                >
                  <span>View Shop</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="No products yet"
            description="Our gadget catalog is being updated. Explore all available products in our shop."
            actionLabel="Visit Shop"
            actionLink="/shop"
          />
        )}
      </section>

      {/* New Arrivals Section */}
      {distinctNewArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">New Arrivals</h2>
              <p className="text-xs sm:text-sm text-slate-500">Fresh gadgets in stock</p>
            </div>
            {distinctNewArrivals.length >= 8 && (
              <Link
                to="/shop?sortBy=newest"
                className="text-xs sm:text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1"
              >
                <span>See All New</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {distinctNewArrivals.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {distinctNewArrivals.length >= 8 && (
            <div className="mt-8 sm:mt-10 flex justify-center">
              <Link
                to="/shop?sortBy=newest"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-brand-primary hover:bg-brand-primary-hover shadow-md hover:shadow-lg transition-all duration-200 group active:scale-95"
              >
                <span>View Shop</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Best Sellers Section */}
      {distinctBestSellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Popular Gadgets</h2>
              <p className="text-xs sm:text-sm text-slate-500">Customer favorites</p>
            </div>
            {distinctBestSellers.length >= 8 && (
              <Link
                to="/shop?sortBy=popular"
                className="text-xs sm:text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1"
              >
                <span>Browse All</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {distinctBestSellers.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {distinctBestSellers.length >= 8 && (
            <div className="mt-8 sm:mt-10 flex justify-center">
              <Link
                to="/shop?sortBy=popular"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-brand-primary hover:bg-brand-primary-hover shadow-md hover:shadow-lg transition-all duration-200 group active:scale-95"
              >
                <span>View Shop</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
