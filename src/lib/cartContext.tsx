import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, ProductVariant } from '../types/product';
import { Coupon } from '../types/coupon';
import { DeliveryZone } from '../types/settings';

export interface CartItem {
  id: string; // unique item key: `${productId}_${variantId || 'base'}`
  productId: string;
  name: string;
  slug: string;
  image: string;
  sku: string;
  variantId?: string;
  variantOptions?: Record<string, string>;
  variantSummary?: string;
  unitPrice: number;
  originalPrice?: number;
  quantity: number;
  maxStock: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    selectedVariant?: ProductVariant | null
  ) => { success: boolean; message?: string };
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, newQty: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  selectedZone: DeliveryZone | null;
  setSelectedZone: (zone: DeliveryZone | null) => void;
  deliveryCharge: number;
  grandTotal: number;
}

const CART_STORAGE_KEY = 'uniqzen_cart_items';

const CartContext = createContext<CartContextType>({} as CartContextType);

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const addToCart = (
    product: Product,
    quantity: number = 1,
    selectedVariant?: ProductVariant | null
  ) => {
    if (!product.active) {
      return { success: false, message: 'This product is currently unavailable.' };
    }

    const variantId = selectedVariant?.id;
    const itemKey = `${product.id}_${variantId || 'base'}`;

    // Determine unit price and stock
    let unitPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
    let maxStock = product.stock;
    let sku = product.sku;
    let image = product.thumbnail || product.images[0] || '/logo.png';
    let variantSummary = '';

    if (selectedVariant) {
      if (selectedVariant.salePrice && selectedVariant.salePrice > 0) {
        unitPrice = selectedVariant.salePrice;
      } else if (selectedVariant.price > 0) {
        unitPrice = selectedVariant.price;
      }
      maxStock = selectedVariant.stock;
      sku = selectedVariant.sku || product.sku;
      if (selectedVariant.image) {
        image = selectedVariant.image;
      }
      variantSummary = Object.entries(selectedVariant.options)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    }

    if (maxStock <= 0) {
      return { success: false, message: 'Sorry, this item is out of stock.' };
    }

    const existingIndex = items.findIndex((i) => i.id === itemKey);
    let updatedItems = [...items];

    if (existingIndex > -1) {
      const currentQty = updatedItems[existingIndex].quantity;
      const targetQty = currentQty + quantity;
      if (targetQty > maxStock) {
        return {
          success: false,
          message: `Only ${maxStock} items available in stock. You already have ${currentQty} in cart.`,
        };
      }
      updatedItems[existingIndex].quantity = targetQty;
    } else {
      if (quantity > maxStock) {
        return {
          success: false,
          message: `Only ${maxStock} items available in stock.`,
        };
      }
      updatedItems.push({
        id: itemKey,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: image,
        sku: sku,
        variantId: variantId,
        variantOptions: selectedVariant?.options,
        variantSummary: variantSummary,
        unitPrice: unitPrice,
        originalPrice: product.salePrice ? product.price : undefined,
        quantity: quantity,
        maxStock: maxStock,
      });
    }

    setItems(updatedItems);
    return { success: true };
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const validQty = Math.min(newQty, item.maxStock);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, defaultZero(0));
  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  // Calculate coupon discount
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.minOrderAmount && subtotal < appliedCoupon.minOrderAmount) {
      // Below min order amount
      couponDiscount = 0;
    } else if (appliedCoupon.discountType === 'percentage') {
      const calculated = (subtotal * appliedCoupon.discountAmount) / 100;
      couponDiscount = appliedCoupon.maxDiscountAmount
        ? Math.min(calculated, appliedCoupon.maxDiscountAmount)
        : calculated;
    } else {
      couponDiscount = Math.min(appliedCoupon.discountAmount, subtotal);
    }
  }

  // Delivery charge calculation
  let deliveryCharge = 0;
  if (selectedZone) {
    if (
      selectedZone.minOrderFreeShipping &&
      selectedZone.minOrderFreeShipping > 0 &&
      subtotal >= selectedZone.minOrderFreeShipping
    ) {
      deliveryCharge = 0;
    } else {
      deliveryCharge = selectedZone.charge;
    }
  }

  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryCharge);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemsCount,
        subtotal,
        appliedCoupon,
        couponDiscount,
        applyCoupon: setAppliedCoupon,
        removeCoupon: () => setAppliedCoupon(null),
        selectedZone,
        setSelectedZone,
        deliveryCharge,
        grandTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

function defaultZero(n: number) {
  return n;
}
