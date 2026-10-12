import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Banner } from '../types/banner';

const COLLECTION_NAME = 'banners';
const CACHE_KEY = 'uniqzen_cached_banners';

/**
 * Returns locally cached banners synchronously so the homepage never flickers on refresh.
 */
export function getCachedBanners(): Banner[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCachedBanners(banners: Banner[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(banners));
  } catch (e) {
    console.warn('Failed to cache banners:', e);
  }
}

export async function getActiveBanners(): Promise<Banner[]> {
  if (!db) return getCachedBanners();
  try {
    const q = query(collection(db, COLLECTION_NAME), where('active', '==', true));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Banner));
    const sorted = list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    setCachedBanners(sorted);
    return sorted;
  } catch (e) {
    console.error('Error getting banners:', e);
    return getCachedBanners();
  }
}

export async function getAllBannersAdmin(): Promise<Banner[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Banner));
    return list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  } catch (e) {
    console.error('Error getting admin banners:', e);
    return [];
  }
}

export async function saveBanner(data: Partial<Banner>, id?: string): Promise<string> {
  if (!db) throw new Error('Database not connected');
  const now = serverTimestamp();
  const targetId = id || data.id || doc(collection(db, COLLECTION_NAME)).id;

  const payload: any = {
    ...data,
    id: targetId,
    position: data.position || 'hero',
    active: data.active !== undefined ? data.active : true,
    sortOrder: data.sortOrder || 0,
    updatedAt: now,
  };

  if (!id && !data.createdAt) {
    payload.createdAt = now;
  }

  const docRef = doc(db, COLLECTION_NAME, targetId);
  await setDoc(docRef, payload, { merge: true });

  // Refresh active cache in background
  getActiveBanners().catch(() => {});

  return targetId;
}

export async function saveSidePoster(
  position: 'side_top' | 'side_bottom',
  data: {
    image: string;
    link?: string;
    title?: string;
    subtitle?: string;
    tagline?: string;
    buttonText?: string;
    active?: boolean;
    isFullGraphic?: boolean;
  }
): Promise<string> {
  return saveBanner(
    {
      id: position,
      title: data.title || (position === 'side_top' ? 'Premium Wireless Earbuds' : 'Smart Monitor Setup'),
      subtitle: data.subtitle || (position === 'side_top' ? 'Pure sound. Everyday comfort.' : 'Work. Play. Create.'),
      tagline: data.tagline || (position === 'side_top' ? 'AUDIO PICKS' : 'TECH ESSENTIALS'),
      buttonText: data.buttonText || 'Shop Now',
      buttonLink: data.link || (position === 'side_top' ? '/shop?category=audio-gadgets' : '/shop?category=monitors'),
      image: data.image,
      position,
      isFullGraphic: Boolean(data.isFullGraphic),
      active: data.active !== undefined ? data.active : true,
      sortOrder: position === 'side_top' ? 1 : 2,
    },
    position
  );
}

export async function deleteBanner(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTION_NAME, id));
  // Refresh cache
  getActiveBanners().catch(() => {});
}
