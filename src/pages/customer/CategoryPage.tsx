import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { ProductCard } from '../../components/customer/ProductCard';
import { ProductGridSkeleton } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import { getProducts } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { Product } from '../../types/product';
import { Category } from '../../types/category';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryData() {
      if (!slug) return;
      setLoading(true);
      const allCategories = await getCategories();
      const matched = allCategories.find((c) => c.slug === slug || c.id === slug);
      setCurrentCategory(matched || null);

      const categoryProducts = await getProducts({ category: slug });
      // If none found by slug, also search by category ID
      if (categoryProducts.length === 0 && matched) {
        const byId = await getProducts({ category: matched.id });
        setProducts(byId);
      } else {
        setProducts(categoryProducts);
      }
      setLoading(false);
    }
    loadCategoryData();
  }, [slug]);

  const categoryTitle = currentCategory?.name || (slug ? slug.replace(/-/g, ' ') : 'Category');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEO
        title={`${categoryTitle} — Uniqzen Shop`}
        description={currentCategory?.description || `Shop genuine ${categoryTitle} at Uniqzen Shop Bangladesh.`}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-400 mb-4 capitalize">
        <Link to="/" className="hover:text-slate-700">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/shop" className="hover:text-slate-700">Categories</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-semibold">{categoryTitle}</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-brand-border p-6 sm:p-8 mb-8 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 capitalize">
            {categoryTitle}
          </h1>
          {currentCategory?.description && (
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              {currentCategory.description}
            </p>
          )}
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 w-fit">
          {products.length} {products.length === 1 ? 'gadget' : 'gadgets'} available
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No products in "${categoryTitle}" yet`}
          description="Check back soon as we add new electronics to this category."
          actionLabel="Browse All Shop"
          actionLink="/shop"
        />
      )}
    </div>
  );
};
