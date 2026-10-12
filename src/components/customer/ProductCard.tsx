import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Check } from 'lucide-react';
import { Product } from '../../types/product';
import { useCart } from '../../lib/cartContext';
import { useWishlist } from '../../lib/wishlistContext';
import { formatCurrency } from '../../lib/utils';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  const [addedAnimation, setAddedAnimation] = React.useState(false);

  const isFavorite = isInWishlist(product.id);
  const currentPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
  const originalPrice = product.salePrice && product.salePrice > 0 ? product.price : null;
  const isOutOfStock = product.stock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If product has variants, navigate to detail page to select options
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      navigate(`/product/${product.slug || product.id}`);
      return;
    }

    const res = addToCart(product, 1);
    if (res.success) {
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1200);
    } else {
      alert(res.message);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="group bg-white rounded-2xl border border-brand-border hover:border-slate-300 hover:shadow-premium transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
      {/* Top Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
        {product.discountPercent && product.discountPercent > 0 ? (
          <span className="bg-brand-secondary text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            -{product.discountPercent}% OFF
          </span>
        ) : null}
        {product.newArrival && (
          <span className="bg-brand-primary text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
            NEW
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlistClick}
        aria-label="Add to wishlist"
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          isFavorite
            ? 'bg-rose-50 text-brand-secondary shadow-sm'
            : 'bg-white/80 text-slate-400 hover:text-brand-secondary hover:bg-white'
        }`}
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      {/* Product Image Link */}
      <Link
        to={`/product/${product.slug || product.id}`}
        className="block aspect-square w-full p-4 bg-slate-50 relative overflow-hidden group-hover:bg-slate-100/50 transition-colors"
      >
        <img
          src={product.thumbnail || product.images[0] || '/logo.png'}
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-slate-500">
              {product.brand || 'Uniqzen'}
            </span>
            {product.categoryName && (
              <span className="truncate max-w-[100px]">{product.categoryName}</span>
            )}
          </div>

          {/* Title */}
          <Link
            to={`/product/${product.slug || product.id}`}
            className="text-sm font-semibold text-slate-900 line-clamp-2 hover:text-brand-primary transition-colors mb-2"
            title={product.name}
          >
            {product.name}
          </Link>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-baseline space-x-2 mb-3">
            <span className="text-base sm:text-lg font-bold text-slate-900">
              {formatCurrency(currentPrice)}
            </span>
            {originalPrice && (
              <span className="text-xs text-slate-400 line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={`w-full py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : addedAnimation
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-primary hover:bg-brand-primary-hover text-white'
            }`}
          >
            {isOutOfStock ? (
              <span>Out of Stock</span>
            ) : addedAnimation ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added</span>
              </>
            ) : product.hasVariants ? (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Select Options</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
