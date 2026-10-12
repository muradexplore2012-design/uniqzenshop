export interface ProductSpecification {
  key: string;
  value: string;
  group?: string;
}

export interface ProductOption {
  name: string; // e.g. "Storage", "Color", "RAM", "Connectivity"
  values: string[]; // e.g. ["128GB", "256GB"] or ["Black", "Silver"]
}

export interface ProductVariant {
  id: string;
  sku: string;
  options: Record<string, string>; // e.g. { "Color": "Black", "Storage": "256GB" }
  price: number;
  salePrice?: number;
  stock: number;
  image?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: string; // category id or slug
  categoryName: string;
  subcategory?: string;
  brand: string;
  modelNumber?: string;
  productType?: string;
  images: string[];
  thumbnail: string;
  price: number;
  salePrice?: number;
  costPrice?: number; // admin view
  discountPercent?: number;
  technicalSpecifications: ProductSpecification[];
  warrantyDuration?: string; // e.g. "1 Year Official Warranty"
  warrantyDetails?: string;
  compatibility?: string;
  includedItems?: string[]; // e.g. ["Device", "Type-C Cable", "Manual"]
  hasVariants: boolean;
  options?: ProductOption[];
  variants?: ProductVariant[];
  stock: number;
  weight?: number; // in grams/kg
  tags: string[];
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  active: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: any;
  updatedAt: any;
}

export type ProductFilterParams = {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'featured';
  search?: string;
};
