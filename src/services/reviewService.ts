import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Review } from '../types/review';

const COLLECTION_NAME = 'reviews';

export async function getProductReviews(productId: string): Promise<Review[]> {
  if (!db || !productId) return [];
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('productId', '==', productId),
      where('status', '==', 'approved')
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (e) {
    console.error('Error fetching reviews:', e);
    return [];
  }
}

export async function getAllReviewsAdmin(): Promise<Review[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (e) {
    console.error('Error fetching admin reviews:', e);
    return [];
  }
}

export async function submitReview(data: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
  if (!db) throw new Error('Database not connected');
  const newRef = doc(collection(db, COLLECTION_NAME));
  const payload: Review = {
    ...data,
    id: newRef.id,
    status: 'pending', // Requires admin moderation
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(newRef, payload);
  return newRef.id;
}

export async function updateReviewStatus(id: string, status: 'approved' | 'rejected' | 'pending'): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COLLECTION_NAME, id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteReview(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}
