import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Zap,
  Sparkles,
  ShoppingBag,
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
          <div className="text-center mb-7 sm:mb-9">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Category
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
              Get Your Desired Product from Featured Category!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
            {categories.map((cat) => (
              <Link
                key={cat.id || cat.slug}
                to={`/category/${cat.slug || cat.id}`}
                className="group w-[calc(33.333%-8px)] sm:w-[calc(25%-12px)] md:w-[calc(16.666%-12px)] lg:w-[calc(12.5%-14px)] min-w-[95px] max-w-[125px] bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-100 hover:border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 flex flex-col items-center"
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
        </section>
      )}



      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Featured Gadgets</h2>
            <p className="text-xs sm:text-sm text-slate-500">Handpicked technology picks</p>
          </div>
          <Link
            to="/shop"
            className="text-xs sm:text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1"
          >
            <span>View Shop</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No featured products yet"
            description="Our gadget catalog is being updated. Explore all available products in our shop."
            actionLabel="Visit Shop"
            actionLink="/shop"
          />
        )}
      </section>

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">New Arrivals</h2>
              <p className="text-xs sm:text-sm text-slate-500">Fresh gadgets in stock</p>
            </div>
            <Link
              to="/shop?sortBy=newest"
              className="text-xs sm:text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1"
            >
              <span>See All New</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Popular Gadgets</h2>
              <p className="text-xs sm:text-sm text-slate-500">Customer favorites</p>
            </div>
            <Link
              to="/shop?sortBy=popular"
              className="text-xs sm:text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1"
            >
              <span>Browse All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
