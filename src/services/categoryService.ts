import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category } from '../types/category';
import { slugify } from '../lib/utils';

const COLLECTION_NAME = 'categories';
const CACHE_KEY = 'uniqzen_cached_categories';

/**
 * Returns locally cached categories synchronously so navigation never flickers on refresh.
 */
export function getCachedCategories(): Category[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCachedCategories(categories: Category[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.warn('Failed to cache categories:', e);
  }
}

export async function getCategories(): Promise<Category[]> {
  const cached = getCachedCategories();
  if (!db) return cached;
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('active', '==', true)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
    const sorted = list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    if (sorted.length > 0) {
      setCachedCategories(sorted);
      return sorted;
    }
    return cached;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return cached;
  }
}

export async function getAllCategoriesAdmin(): Promise<Category[]> {
  const cached = getCachedCategories();
  if (!db) return cached;
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
    const sorted = list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    if (sorted.length > 0) {
      setCachedCategories(sorted.filter((c) => c.active));
      return sorted;
    }
    return cached;
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    return cached;
  }
}

export async function saveCategory(
  categoryData: Partial<Category>,
  id?: string
): Promise<string> {
  if (!db) throw new Error('Database not connected');
  const now = serverTimestamp();
  const slug = categoryData.slug || slugify(categoryData.name || 'category');

  const payload: any = {
    ...categoryData,
    slug,
    updatedAt: now,
  };

  let savedId = id;
  if (id) {
    await updateDoc(doc(db, COLLECTION_NAME, id), payload);
  } else {
    const newRef = doc(collection(db, COLLECTION_NAME));
    payload.id = newRef.id;
    payload.createdAt = now;
    if (payload.sortOrder === undefined) payload.sortOrder = 0;
    if (payload.active === undefined) payload.active = true;
    await setDoc(newRef, payload);
    savedId = newRef.id;
  }

  // Update localStorage cache right away
  try {
    const cached = getCachedCategories();
    const updated = id
      ? cached.map((c) => (c.id === id ? { ...c, ...payload, id } : c))
      : [...cached, { ...payload, id: savedId }];
    setCachedCategories(updated.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
  } catch {
    // non-fatal
  }

  return savedId!;
}

export async function deleteCategory(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTION_NAME, id));
  try {
    const cached = getCachedCategories();
    setCachedCategories(cached.filter((c) => c.id !== id));
  } catch {
    // non-fatal
  }
}

