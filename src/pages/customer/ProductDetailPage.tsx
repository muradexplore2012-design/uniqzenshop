import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ChevronRight,
  Package,
  Cpu,
  Clock,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { ImageZoomGallery } from '../../components/customer/ImageZoomGallery';
import { SpecificationTable } from '../../components/customer/SpecificationTable';
import { ReviewSection } from '../../components/customer/ReviewSection';
import { ProductCard } from '../../components/customer/ProductCard';
import { EmptyState } from '../../components/common/EmptyState';
import { useCart } from '../../lib/cartContext';
import { useWishlist } from '../../lib/wishlistContext';
import { getProductBySlug, getRelatedProducts } from '../../services/productService';
import { Product, ProductVariant } from '../../types/product';
import { formatCurrency } from '../../lib/utils';

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Variant selection state: map of optionName -> selectedValue
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Quantity selector state
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);

  useEffect(() => {
    // Reset window scroll to top immediately
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    async function loadProduct() {
      if (!productId) return;
      setLoading(true);
      const data = await getProductBySlug(productId);
      setProduct(data);
      // Unblock UI loading immediately as soon as main product is fetched
      setLoading(false);

      if (data) {
        // Initialize default variant/options
        if (data.hasVariants && data.options && data.options.length > 0) {
          const initialOptions: Record<string, string> = {};
          data.options.forEach((opt) => {
            if (opt.values.length > 0) {
              initialOptions[opt.name] = opt.values[0];
            }
          });
          setSelectedOptions(initialOptions);

          // Find matching variant
          if (data.variants && data.variants.length > 0) {
            const matched = data.variants.find((v) =>
              Object.entries(initialOptions).every(([k, val]) => v.options[k] === val)
            );
            setSelectedVariant(matched || data.variants[0]);
          }
        }

        // Load related products in the background without delaying page render
        if (data.category) {
          getRelatedProducts(data.category, data.id, 4).then(setRelatedProducts);
        }
      }
    }
    loadProduct();
  }, [productId]);

  // Update variant when options change
  const handleOptionSelect = (optionName: string, value: string) => {
    const updated = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(updated);

    if (product?.variants) {
      const matched = product.variants.find((v) =>
        Object.entries(updated).every(([k, val]) => v.options[k] === val)
      );
      setSelectedVariant(matched || null);
    }
    setQuantity(1);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[75vh]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 animate-pulse">
          {/* Skeleton Gallery */}
          <div className="aspect-square bg-slate-100 rounded-3xl" />

          {/* Skeleton Details */}
          <div className="space-y-4 pt-4">
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-8 bg-slate-100 rounded w-3/4" />
            <div className="h-6 bg-slate-100 rounded w-1/3" />
            <div className="h-28 bg-slate-100 rounded-2xl w-full" />
            <div className="h-12 bg-slate-100 rounded-xl w-full" />
            <div className="h-12 bg-slate-100 rounded-xl w-full" />
          </div>
        </div>
      </div>
    );
  }


  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          title="Product Not Found"
          description="The gadget you are looking for is not available or has been removed."
          actionLabel="Browse Catalog"
          actionLink="/shop"
        />
      </div>
    );
  }

  // Determine current active price & stock safely
  const safePrice = Number(product.salePrice && product.salePrice > 0 ? product.salePrice : product.price) || 0;
  let currentPrice = safePrice;
  let originalPrice: number | null = product.salePrice && product.salePrice > 0 ? Number(product.price) : null;
  let currentStock = product.stock || 0;
  let currentSku = product.sku || '';

  if (selectedVariant) {
    if (selectedVariant.salePrice && selectedVariant.salePrice > 0) {
      currentPrice = Number(selectedVariant.salePrice);
      originalPrice = selectedVariant.price > 0 ? Number(selectedVariant.price) : null;
    } else if (selectedVariant.price > 0) {
      currentPrice = Number(selectedVariant.price);
    }
    currentStock = selectedVariant.stock || 0;
    if (selectedVariant.sku) currentSku = selectedVariant.sku;
  }

  const discountPercent =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : (product.discountPercent || 0);

  const isOutOfStock = currentStock <= 0;
  const isFavorite = isInWishlist(product.id);

  // Extract key highlight bullet points (Plain JavaScript computation - safe from Hook order violations)
  let keyHighlights: string[] = [];
  if (product.shortDescription) {
    const lines = product.shortDescription
      .split(/\r?\n|•/)
      .map((l) => l.trim().replace(/^[-*•]\s*/, ''))
      .filter((l) => l.length > 2);
    if (lines.length > 0) keyHighlights = lines.slice(0, 5);
  }
  if (keyHighlights.length === 0 && product.technicalSpecifications && product.technicalSpecifications.length > 0) {
    keyHighlights = product.technicalSpecifications
      .slice(0, 5)
      .map((s) => `${s.key}: ${s.value}`);
  }
  if (keyHighlights.length === 0) {
    if (product.brand) keyHighlights.push(`Brand: ${product.brand}`);
    if (product.warrantyDuration) keyHighlights.push(`Warranty: ${product.warrantyDuration}`);
    if (product.categoryName) keyHighlights.push(`Category: ${product.categoryName}`);
    if (product.modelNumber) keyHighlights.push(`Model: ${product.modelNumber}`);
    keyHighlights.push('100% Genuine and Authentic Gadget');
  }

  const handleAddToCart = () => {
    if (product.hasVariants && !selectedVariant) {
      alert('Please select all available options first.');
      return;
    }
    const res = addToCart(product, quantity, selectedVariant);
    if (res.success) {
      setAddedMessage(true);
      setTimeout(() => setAddedMessage(false), 2500);
    } else {
      alert(res.message);
    }
  };

  const handleBuyNow = () => {
    if (product.hasVariants && !selectedVariant) {
      alert('Please select all available options first.');
      return;
    }
    const res = addToCart(product, quantity, selectedVariant);
    if (res.success) {
      navigate('/checkout');
    } else {
      alert(res.message);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Uniqzen Shop, I want to order/inquire about:\nProduct: ${product.name}\nSKU: ${currentSku}\nPrice: ৳${Math.round(currentPrice).toLocaleString('en-BD')}\nLink: ${window.location.href}`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-8 sm:space-y-10">
      <SEO
        title={`${product.name} — Uniqzen Shop`}
        description={product.shortDescription || product.description?.slice(0, 160)}
        ogImage={product.thumbnail || product.images[0]}
      />

      {/* Breadcrumb (Exact Reference Style: Home / Category / Subcategory / Product Name) */}
      <nav className="flex items-center space-x-2 text-xs sm:text-[13px] text-slate-500 overflow-x-auto whitespace-nowrap py-1">
        <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
        <span className="text-slate-400">/</span>
        {product.category && (
          <>
            <Link to={`/category/${product.category}`} className="hover:text-slate-900 transition-colors">
              {product.categoryName || product.category}
            </Link>
            <span className="text-slate-400">/</span>
          </>
        )}
        {product.subcategory && (
          <>
            <Link
              to={`/shop?category=${product.category}&subcategory=${encodeURIComponent(product.subcategory)}`}
              className="hover:text-slate-900 transition-colors"
            >
              {product.subcategory}
            </Link>
            <span className="text-slate-400">/</span>
          </>
        )}
        <span className="text-slate-900 font-semibold truncate">{product.name}</span>
      </nav>

      {/* Main Product Showcase Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 border border-slate-200/80 shadow-subtle">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Gallery with SAVE % and Zoom Search Icon */}
          <div>
            <ImageZoomGallery
              images={
                selectedVariant?.image
                  ? [selectedVariant.image, ...(product.images || []).filter((img) => img !== selectedVariant?.image)]
                  : (product.images || [])
              }
              productName={product.name}
              discountPercent={discountPercent}
            />
          </div>

          {/* Right: Info, Price, Bullets, Purchase Actions (Exact Reference Layout) */}
          <div className="space-y-4 sm:space-y-5">
            {/* 1. Stock Status Badge */}
            <div>
              <span className="inline-block px-3 py-1 rounded-md bg-slate-100 border border-slate-200/60 text-slate-800 text-xs font-semibold">
                {isOutOfStock ? 'Out of Stock' : 'In Stock'}
              </span>
            </div>

            {/* 2. Product Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* 3. Price Row: Original (struck), Sale Price (Red), Discount Badge */}
            <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3.5 pt-0.5 pb-2">
              {originalPrice && originalPrice > currentPrice && (
                <span className="text-xl sm:text-2xl text-rose-500 line-through font-semibold">
                  {Math.round(originalPrice).toLocaleString('en-BD')}৳
                </span>
              )}
              <span className="text-2xl sm:text-3xl font-extrabold text-[#E11D48]">
                {Math.round(currentPrice).toLocaleString('en-BD')}৳
              </span>
              {discountPercent > 0 && (
                <span className="bg-rose-50 text-[#E11D48] text-xs font-bold px-2 py-0.5 rounded border border-rose-100">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* 4. Key Highlights (Bullet Points) & View More Info */}
            <div className="space-y-2 text-xs sm:text-sm text-slate-700">
              <ul className="space-y-1.5">
                {keyHighlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-slate-900 font-bold leading-none mt-1 text-sm">•</span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  document.getElementById('product-overview')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-semibold text-slate-900 hover:text-[#E11D48] underline pt-1 block"
              >
                View More Info
              </button>
            </div>

            {/* Variant Options Selection (if applicable) */}
            {product.hasVariants && product.options && product.options.length > 0 && (
              <div className="space-y-3 pt-2 pb-1 border-t border-slate-100">
                {product.options.map((option) => (
                  <div key={option.name} className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {option.name}:{' '}
                      <span className="font-normal text-slate-900 ml-1">
                        {selectedOptions[option.name] || 'Select'}
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((val) => {
                        const isSelected = selectedOptions[option.name] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleOptionSelect(option.name, val)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                              isSelected
                                ? 'border-slate-950 bg-slate-950 text-white shadow-xs'
                                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Quantity Box, ADD TO CART, BUY NOW Row */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
              {/* Quantity Selector */}
              <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-white h-11 shadow-2xs">
                <button
                  type="button"
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 h-full text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors font-bold text-base"
                >
                  -
                </button>
                <span className="px-3 h-full flex items-center justify-center text-sm font-bold text-slate-900 bg-white min-w-[38px] text-center border-x border-slate-200">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= currentStock || isOutOfStock}
                  onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  className="px-3.5 h-full text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors font-bold text-base"
                >
                  +
                </button>
              </div>

              {/* ADD TO CART */}
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="flex-1 min-w-[130px] h-11 px-5 rounded-md bg-[#0b0d13] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center transition-all disabled:opacity-50 shadow-xs"
              >
                ADD TO CART
              </button>

              {/* BUY NOW */}
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className="flex-1 min-w-[130px] h-11 px-5 rounded-md bg-[#E11D48] hover:bg-[#be123c] text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center transition-all disabled:opacity-50 shadow-xs"
              >
                BUY NOW
              </button>
            </div>

            {/* 6. WHATSAPP Full-Width Order Button */}
            <div>
              <a
                href={`https://wa.me/8801768534545?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-md bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.83a8.196 8.196 0 01-5.82 2.41h-.01c-1.49 0-2.96-.4-4.24-1.16l-.3-.18-3.12.82.83-3.04-.2-.31a8.212 8.212 0 01-1.26-4.37c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.78 2.72 4.31 3.81.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29z" />
                </svg>
                <span>WHATSAPP</span>
              </a>
            </div>

            {/* 7. Meta Pills: Product SKU & Category */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                Product SKU: <strong className="text-slate-900 font-bold ml-1">{currentSku}</strong>
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                Category:{' '}
                <strong className="text-slate-900 font-bold ml-1">
                  {product.categoryName || product.category}
                  {product.subcategory ? `, ${product.subcategory}` : ''}
                </strong>
              </span>
            </div>

            {/* Feedback message when item added */}
            {addedMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center justify-between animate-in fade-in">
                <span className="flex items-center gap-1.5 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Item successfully added to your cart!
                </span>
                <Link to="/cart" className="font-bold underline text-emerald-900">
                  View Cart
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs / Detailed Information Section */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-subtle space-y-10">
        {/* Delivery, Warranty & Payment Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
          <div className="flex items-center gap-2.5">
            <Truck className="w-4 h-4 text-[#E11D48] flex-shrink-0" />
            <span><strong>Home Delivery:</strong> Dhaka (24–48h) | Nationwide</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#E11D48] flex-shrink-0" />
            <span><strong>Warranty:</strong> {product.warrantyDuration || '7 Days Replacement Guarantee'}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-[#E11D48] flex-shrink-0" />
            <span><strong>Cash on Delivery:</strong> Available across Bangladesh</span>
          </div>
        </div>

        {/* Description / Overview */}
        <section id="product-overview" className="scroll-mt-24">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#E11D48]" />
            <span>Product Overview</span>
          </h2>
          <div className="prose max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {product.description || 'No description provided.'}
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="pt-6 border-t border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-brand-secondary" />
            <span>Technical Specifications</span>
          </h2>
          <SpecificationTable specifications={product.technicalSpecifications} />
        </section>

        {/* Included Items / What's in the box */}
        {product.includedItems && product.includedItems.length > 0 && (
          <section className="pt-6 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-3">
              What's In The Box
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
              {product.includedItems.map((item, idx) => (
                <li key={idx} className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Customer Reviews Section */}
        <section className="pt-6 border-t border-slate-100">
          <ReviewSection productId={product.id} productName={product.name} />
        </section>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Related Gadgets
            </h2>
            <Link
              to={`/category/${product.category}`}
              className="text-xs sm:text-sm font-semibold text-brand-primary hover:underline"
            >
              View More in {product.categoryName}
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
