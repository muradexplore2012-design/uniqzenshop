import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { EmptyState } from '../../components/common/EmptyState';
import { ProductCard } from '../../components/customer/ProductCard';
import { useWishlist } from '../../lib/wishlistContext';
import { getProductById } from '../../services/productService';
import { Product } from '../../types/product';

export const WishlistPage: React.FC = () => {
  const { wishlistIds, removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlistProducts() {
      setLoading(true);
      if (wishlistIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      try {
        const fetched = await Promise.all(wishlistIds.map((id) => getProductById(id)));
        setProducts(fetched.filter((p): p is Product => p !== null));
      } catch (e) {
        console.error('Error loading wishlist products:', e);
      } finally {
        setLoading(false);
      }
    }
    loadWishlistProducts();
  }, [wishlistIds]);

  if (!loading && products.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <SEO title="My Wishlist — Uniqzen Shop" />
        <EmptyState
          icon={Heart}
          title="Your Wishlist is Empty"
          description="You haven't saved any gadgets yet. Click the heart icon on any product to save it for later."
          actionLabel="Explore Gadgets"
          actionLink="/shop"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <SEO title="My Wishlist — Uniqzen Shop" />

      <div className="flex items-center justify-between pb-4 border-b border-brand-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            My Wishlist ({products.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">Saved gadget favorites</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
};
