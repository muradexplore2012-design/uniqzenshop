import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, ProductFilterParams } from '../types/product';
import { slugify } from '../lib/utils';

const COLLECTION_NAME = 'products';

export async function getProducts(filters: ProductFilterParams = {}): Promise<Product[]> {
  if (!db) return [];
  try {
    const productsRef = collection(db, COLLECTION_NAME);
    let q = query(productsRef, where('active', '==', true));

    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }

    const snapshot = await getDocs(q);
    let products: Product[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product));

    // In-memory filters for flexible querying without needing composite index explosion
    if (filters.subcategory) {
      products = products.filter((p) => p.subcategory?.toLowerCase() === filters.subcategory?.toLowerCase());
    }
    if (filters.brand) {
      products = products.filter((p) => p.brand.toLowerCase() === filters.brand?.toLowerCase());
    }
    if (filters.inStock) {
      products = products.filter((p) => p.stock > 0);
    }
    if (filters.minPrice !== undefined) {
      products = products.filter((p) => {
        const price = p.salePrice || p.price;
        return price >= (filters.minPrice || 0);
      });
    }
    if (filters.maxPrice !== undefined) {
      products = products.filter((p) => {
        const price = p.salePrice || p.price;
        return price <= (filters.maxPrice || Infinity);
      });
    }
    if (filters.search) {
      const term = filters.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.tags?.some((t) => t.toLowerCase().includes(term))
      );
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price-asc':
        products.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
        break;
      case 'price-desc':
        products.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
        break;
      case 'featured':
        products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case 'popular':
        products.sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0));
        break;
      case 'newest':
      default:
        // sort by newest
        products.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        break;
    }

    cacheProducts(products);
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}


// In-memory cache for ultra-fast, zero-delay product page loads
const productMemoryCache = new Map<string, Product>();

export function cacheProduct(p: Product) {
  if (!p) return;
  if (p.id) productMemoryCache.set(p.id, p);
  if (p.slug) productMemoryCache.set(p.slug, p);
}

export function cacheProducts(list: Product[]) {
  if (Array.isArray(list)) {
    list.forEach(cacheProduct);
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!slug) return null;
  // 1. Instant cache hit (0ms)
  if (productMemoryCache.has(slug)) {
    return productMemoryCache.get(slug)!;
  }
  if (!db) return null;

  try {
    // 2. Direct ID lookup first if slug matches Firestore ID format (15+ chars without hyphens)
    if (slug.length >= 15 && !slug.includes('-')) {
      const direct = await getProductById(slug);
      if (direct) {
        cacheProduct(direct);
        return direct;
      }
    }

    // 3. Fast single-field query on slug
    const q = query(
      collection(db, COLLECTION_NAME),
      where('slug', '==', slug),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const prod = { id: doc.id, ...doc.data() } as Product;
      cacheProduct(prod);
      return prod;
    }

    // 4. Fallback direct doc lookup
    const direct = await getProductById(slug);
    if (direct) {
      cacheProduct(direct);
      return direct;
    }
    return null;
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return await getProductById(slug);
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!id) return null;
  if (productMemoryCache.has(id)) {
    return productMemoryCache.get(id)!;
  }
  if (!db) return null;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const prod = { id: snap.id, ...snap.data() } as Product;
      cacheProduct(prod);
      return prod;
    }
    return null;
  } catch (error) {
    console.error('Error fetching product by id:', error);
    return null;
  }
}


export async function getAllProductsAdmin(): Promise<Product[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    const products: Product[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
    return products.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return [];
  }
}

// Recursively removes undefined keys to prevent Firestore crashes
function removeUndefined<T>(val: T): T {
  if (val === undefined) return undefined as any;
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val.map((item) => removeUndefined(item)).filter((item) => item !== undefined) as any;
  }
  const result: any = {};
  for (const [key, value] of Object.entries(val)) {
    if (value !== undefined) {
      result[key] = removeUndefined(value);
    }
  }
  return result;
}

export async function saveProduct(
  productData: Partial<Product>,
  productId?: string
): Promise<string> {
  if (!db) throw new Error('Database not connected. Please check internet connection.');

  const name = productData.name?.trim() || 'Product';
  const slug = productData.slug?.trim() || slugify(name);
  const now = serverTimestamp();

  // Calculate discount percentage if sale price is provided
  let discountPercent = 0;
  const regularPrice = Number(productData.price) || 0;
  const salePrice = productData.salePrice ? Number(productData.salePrice) : 0;
  if (salePrice > 0 && regularPrice > salePrice) {
    discountPercent = Math.round(
      ((regularPrice - salePrice) / regularPrice) * 100
    );
  }

  // Calculate total stock from variants if variants are enabled
  let totalStock = Number(productData.stock) || 0;
  if (productData.hasVariants && productData.variants && productData.variants.length > 0) {
    totalStock = productData.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
  }

  const rawPayload: any = {
    ...productData,
    name,
    slug,
    price: regularPrice,
    discountPercent,
    stock: totalStock,
    updatedAt: now,
  };

  if (salePrice > 0) {
    rawPayload.salePrice = salePrice;
  } else {
    delete rawPayload.salePrice;
  }

  if (productData.costPrice && Number(productData.costPrice) > 0) {
    rawPayload.costPrice = Number(productData.costPrice);
  } else {
    delete rawPayload.costPrice;
  }

  const payload = removeUndefined(rawPayload);

  if (productId) {
    payload.id = productId;
    await setDoc(doc(db, COLLECTION_NAME, productId), payload, { merge: true });
    return productId;
  } else {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    payload.id = newDocRef.id;
    payload.createdAt = now;
    await setDoc(newDocRef, payload);
    return newDocRef.id;
  }
}


export async function deleteProduct(productId: string, softDelete: boolean = false): Promise<void> {
  if (!db) return;
  productMemoryCache.delete(productId);
  if (softDelete) {
    await updateDoc(doc(db, COLLECTION_NAME, productId), {
      active: false,
      updatedAt: serverTimestamp(),
    });
  } else {
    await deleteDoc(doc(db, COLLECTION_NAME, productId));
  }
}

export async function getFeaturedProducts(limitCount: number = 8): Promise<Product[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('active', '==', true),
      where('featured', '==', true),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));

    // Fallback: If fewer than limitCount featured products, fill with active products so added products show on home page
    if (list.length < limitCount) {
      const fallbackQ = query(
        collection(db, COLLECTION_NAME),
        where('active', '==', true),
        limit(limitCount)
      );
      const fallbackSnap = await getDocs(fallbackQ);
      const fallbackList = fallbackSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
      const existingIds = new Set(list.map((p) => p.id));
      for (const p of fallbackList) {
        if (!existingIds.has(p.id) && list.length < limitCount) {
          list.push(p);
          existingIds.add(p.id);
        }
      }
    }

    cacheProducts(list);
    return list;
  } catch (e) {
    console.error('Error fetching featured products:', e);
    return [];
  }
}

export async function getNewArrivals(limitCount: number = 8): Promise<Product[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('active', '==', true),
      where('newArrival', '==', true),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
    cacheProducts(list);
    return list;
  } catch (e) {
    console.error('Error fetching new arrivals:', e);
    return [];
  }
}

export async function getBestSellers(limitCount: number = 8): Promise<Product[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('active', '==', true),
      where('bestSeller', '==', true),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
    cacheProducts(list);
    return list;
  } catch (e) {
    console.error('Error fetching best sellers:', e);
    return [];
  }
}


export async function getRelatedProducts(
  category: string,
  excludeId: string,
  limitCount: number = 4
): Promise<Product[]> {
  if (!db || !category) return [];
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('active', '==', true),
      where('category', '==', category),
      limit(limitCount + 1)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Product))
      .filter((p) => p.id !== excludeId)
      .slice(0, limitCount);
  } catch (e) {
    console.error('Error fetching related products:', e);
    return [];
  }
}
