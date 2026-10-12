import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, ArrowUpDown } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { ProductCard } from '../../components/customer/ProductCard';
import { ProductFilterDrawer } from '../../components/customer/ProductFilterDrawer';
import { ProductGridSkeleton } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import { getProducts } from '../../services/productService';
import { getCategories, getCachedCategories } from '../../services/categoryService';
import { Product, ProductFilterParams } from '../../types/product';
import { Category } from '../../types/category';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(() => getCachedCategories());
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);


  // Initialize filters from URL query parameters
  const filters: ProductFilterParams = {
    category: searchParams.get('category') || undefined,
    subcategory: searchParams.get('subcategory') || undefined,
    brand: searchParams.get('brand') || undefined,
    search: searchParams.get('search') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    inStock: searchParams.get('inStock') === 'true',
    sortBy: (searchParams.get('sortBy') as any) || 'newest',
  };

  useEffect(() => {
    // Load categories
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    async function fetchCatalog() {
      setLoading(true);
      const data = await getProducts(filters);
      setProducts(data);

      // Extract unique brands for filter options
      const brands = Array.from(new Set(data.map((p) => p.brand).filter(Boolean)));
      if (brands.length > 0 && availableBrands.length === 0) {
        setAvailableBrands(brands);
      }
      setLoading(false);
    }
    fetchCatalog();
  }, [
    filters.category,
    filters.subcategory,
    filters.brand,
    filters.search,
    filters.minPrice,
    filters.maxPrice,
    filters.inStock,
    filters.sortBy,
  ]);

  const updateFilters = (newFilters: ProductFilterParams) => {
    const params = new URLSearchParams();
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.subcategory) params.set('subcategory', newFilters.subcategory);
    if (newFilters.brand) params.set('brand', newFilters.brand);
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.minPrice !== undefined) params.set('minPrice', String(newFilters.minPrice));
    if (newFilters.maxPrice !== undefined) params.set('maxPrice', String(newFilters.maxPrice));
    if (newFilters.inStock) params.set('inStock', 'true');
    if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);

    setSearchParams(params);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ ...filters, sortBy: e.target.value as any });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEO
        title="Shop Gadgets & Electronics — Uniqzen Shop"
        description="Browse all smartphones, smartwatches, true wireless earbuds, chargers, cables and accessories."
      />

      {/* Top Breadcrumb & Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-brand-border gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {filters.search
              ? `Results for "${filters.search}"`
              : filters.category
              ? `Category: ${categories.find((c) => c.slug === filters.category || c.id === filters.category)?.name || filters.category}`
              : 'All Gadgets & Tech'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Showing {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        {/* Action Controls: Mobile Filter Button & Sort Selector */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-brand-border text-xs font-semibold text-slate-700 shadow-xs"
          >
            <Filter className="w-3.5 h-3.5 text-brand-secondary" />
            <span>Filters</span>
          </button>

          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-brand-border shadow-xs text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.sortBy || 'newest'}
              onChange={handleSortChange}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="newest">Sort by: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="popular">Popularity</option>
              <option value="featured">Featured</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout (Sidebar Filters + Products Grid) */}
      <div className="flex gap-8 items-start">
        {/* Filter Drawer / Sidebar */}
        <ProductFilterDrawer
          categories={categories}
          availableBrands={availableBrands}
          filters={filters}
          onFilterChange={updateFilters}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          totalProductsCount={products.length}
        />

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No products available yet"
              description={
                filters.search || filters.category || filters.brand
                  ? 'No gadgets match your current filter criteria. Try clearing filters.'
                  : 'Our gadget catalog is currently empty. Check back soon as new electronics arrive.'
              }
              actionLabel={
                filters.search || filters.category || filters.brand ? 'Clear Filters' : undefined
              }
              onActionClick={() => updateFilters({})}
            />
          )}
        </div>
      </div>
    </div>
  );
};
