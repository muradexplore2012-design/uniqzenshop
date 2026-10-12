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
import { Coupon } from '../types/coupon';

const COLLECTION_NAME = 'coupons';

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<{ valid: boolean; coupon?: Coupon; message?: string }> {
  if (!db || !code) {
    return { valid: false, message: 'Invalid coupon code.' };
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('code', '==', code.toUpperCase().trim()),
      where('active', '==', true)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return { valid: false, message: 'Coupon code not found or inactive.' };
    }

    const couponDoc = snap.docs[0];
    const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

    if (coupon.expiryDate) {
      const exp = coupon.expiryDate.toDate ? coupon.expiryDate.toDate() : new Date(coupon.expiryDate);
      if (exp.getTime() < Date.now()) {
        return { valid: false, message: 'This coupon has expired.' };
      }
    }

    if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
      return { valid: false, message: 'This coupon usage limit has been reached.' };
    }

    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        message: `Minimum order amount for this coupon is ৳ ${coupon.minOrderAmount}.`,
      };
    }

    return { valid: true, coupon };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { valid: false, message: 'Failed to validate coupon.' };
  }
}

export async function getAllCouponsAdmin(): Promise<Coupon[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon));
  } catch (e) {
    console.error('Error getting coupons:', e);
    return [];
  }
}

export async function saveCoupon(data: Partial<Coupon>, id?: string): Promise<string> {
  if (!db) throw new Error('Database not connected');
  const now = serverTimestamp();
  const payload: any = {
    ...data,
    code: (data.code || '').toUpperCase().trim(),
    updatedAt: now,
  };

  if (id) {
    await updateDoc(doc(db, COLLECTION_NAME, id), payload);
    return id;
  } else {
    const newRef = doc(collection(db, COLLECTION_NAME));
    payload.id = newRef.id;
    payload.usedCount = 0;
    payload.createdAt = now;
    await setDoc(newRef, payload);
    return newRef.id;
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}
