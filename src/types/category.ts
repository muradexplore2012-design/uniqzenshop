export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  active: boolean;
  sortOrder: number;
  subcategories?: string[];
  productCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

