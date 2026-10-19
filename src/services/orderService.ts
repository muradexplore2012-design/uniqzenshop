import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, OrderItem, CustomerInfo, OrderStatus, PaymentStatus, PaymentMethod, PaymentDetails } from '../types/order';

const COLLECTION_NAME = 'orders';

export async function createOrder(
  customer: CustomerInfo,
  cartItems: OrderItem[],
  deliveryCharge: number,
  couponCode?: string,
  deliveryZoneName?: string,
  paymentMethod: PaymentMethod = 'cod',
  paymentDetails?: PaymentDetails
): Promise<{ success: boolean; orderId?: string; orderNumber?: string; message?: string }> {
  if (!db) {
    return { success: false, message: 'Database is not initialized' };
  }

  if (!cartItems || cartItems.length === 0) {
    return { success: false, message: 'Cart is empty' };
  }

  try {
    const orderNumber = `UZ-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await runTransaction(db, async (transaction) => {
      let computedSubtotal = 0;
      const validatedItems: OrderItem[] = [];

      // 1. Validate each product price & stock from database directly (prevent tampering)
      for (const item of cartItems) {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnap = await transaction.get(prodRef);

        if (!prodSnap.exists()) {
          throw new Error(`Product "${item.name}" no longer exists.`);
        }

        const prodData = prodSnap.data();
        if (!prodData.active) {
          throw new Error(`Product "${item.name}" is currently unavailable.`);
        }

        let itemPrice = prodData.salePrice && prodData.salePrice > 0 ? prodData.salePrice : prodData.price;
        let availableStock = prodData.stock;

        // If variant was chosen, validate variant price & stock
        if (item.variantId && prodData.variants) {
          const variant = prodData.variants.find((v: any) => v.id === item.variantId);
          if (!variant) {
            throw new Error(`Selected variant for "${item.name}" is invalid.`);
          }
          if (variant.salePrice && variant.salePrice > 0) itemPrice = variant.salePrice;
          else if (variant.price > 0) itemPrice = variant.price;
          availableStock = variant.stock;

          if (availableStock < item.quantity) {
            throw new Error(`Insufficient stock for "${item.name}" (${item.variantSummary || ''}). Only ${availableStock} left.`);
          }

          // Decrement variant stock
          variant.stock = Math.max(0, variant.stock - item.quantity);
          // Recalculate total stock
          const newTotalStock = prodData.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0);
          transaction.update(prodRef, {
            variants: prodData.variants,
            stock: newTotalStock,
            updatedAt: serverTimestamp(),
          });
        } else {
          if (availableStock < item.quantity) {
            throw new Error(`Insufficient stock for "${item.name}". Only ${availableStock} available.`);
          }
          // Decrement product stock
          transaction.update(prodRef, {
            stock: Math.max(0, availableStock - item.quantity),
            updatedAt: serverTimestamp(),
          });
        }

        const itemSubtotal = itemPrice * item.quantity;
        computedSubtotal += itemSubtotal;

        validatedItems.push({
          ...item,
          unitPrice: itemPrice,
          subtotal: itemSubtotal,
        });
      }

      // 2. Validate Coupon if supplied
      let couponDiscount = 0;
      if (couponCode) {
        const couponQuery = query(
          collection(db, 'coupons'),
          where('code', '==', couponCode.toUpperCase().trim()),
          where('active', '==', true)
        );
        const couponSnap = await getDocs(couponQuery);
        if (!couponSnap.empty) {
          const couponDoc = couponSnap.docs[0];
          const couponData = couponDoc.data();

          if (!couponData.minOrderAmount || computedSubtotal >= couponData.minOrderAmount) {
            if (couponData.discountType === 'percentage') {
              const calc = (computedSubtotal * couponData.discountAmount) / 100;
              couponDiscount = couponData.maxDiscountAmount ? Math.min(calc, couponData.maxDiscountAmount) : calc;
            } else {
              couponDiscount = Math.min(couponData.discountAmount, computedSubtotal);
            }
            // Increment coupon usedCount
            transaction.update(couponDoc.ref, {
              usedCount: (couponData.usedCount || 0) + 1,
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      const verifiedDelivery = Math.max(0, deliveryCharge);
      const grandTotal = Math.max(0, computedSubtotal - couponDiscount + verifiedDelivery);

      const orderRef = doc(collection(db, COLLECTION_NAME));
      const newOrder: Order = {
        id: orderRef.id,
        orderNumber,
        customer,
        items: validatedItems,
        subtotal: computedSubtotal,
        discount: couponDiscount,
        couponCode: couponCode || '',
        deliveryZoneName: deliveryZoneName || 'Standard Delivery',
        deliveryCharge: verifiedDelivery,
        total: grandTotal,
        paymentMethod: paymentMethod || 'cod',
        paymentDetails: paymentDetails || undefined,
        paymentStatus: 'unpaid',
        orderStatus: 'pending',
        statusHistory: [
          {
            status: 'pending',
            timestamp: new Date().toISOString(),
            note: `Order placed via ${paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : paymentMethod.toUpperCase()}`,
          },
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      transaction.set(orderRef, newOrder);

      // If user profile exists, update order statistics
      if (customer.userId) {
        const userRef = doc(db, 'users', customer.userId);
        const userSnap = await transaction.get(userRef);
        if (userSnap.exists()) {
          const curData = userSnap.data();
          transaction.update(userRef, {
            totalOrders: (curData.totalOrders || 0) + 1,
            totalSpent: (curData.totalSpent || 0) + grandTotal,
            updatedAt: serverTimestamp(),
          });
        }
      }

      return { success: true, orderId: orderRef.id, orderNumber };
    });

    return result;
  } catch (error: any) {
    console.error('Error placing order:', error);
    return { success: false, message: error.message || 'Failed to place order' };
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Order;
    }
    // Also try searching by orderNumber
    const q = query(collection(db, COLLECTION_NAME), where('orderNumber', '==', id));
    const snapNum = await getDocs(q);
    if (!snapNum.empty) {
      const d = snapNum.docs[0];
      return { id: d.id, ...d.data() } as Order;
    }
    return null;
  } catch (e) {
    console.error('Error getting order:', e);
    return null;
  }
}

export async function getCustomerOrders(userId: string): Promise<Order[]> {
  if (!db || !userId) return [];
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('customer.userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (e) {
    console.error('Error getting customer orders:', e);
    return [];
  }
}

export async function getAllOrdersAdmin(): Promise<Order[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (e) {
    console.error('Error getting admin orders:', e);
    return [];
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string,
  adminUid?: string
): Promise<void> {
  if (!db) return;
  const orderRef = doc(db, COLLECTION_NAME, orderId);
  const snap = await getDoc(orderRef);
  if (!snap.exists()) return;

  const currentOrder = snap.data() as Order;
  const newHistoryItem = {
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: note || `Status updated to ${newStatus}`,
    updatedBy: adminUid,
  };

  const updatedHistory = [...(currentOrder.statusHistory || []), newHistoryItem];

  await updateDoc(orderRef, {
    orderStatus: newStatus,
    statusHistory: updatedHistory,
    updatedAt: serverTimestamp(),
  });
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  adminUid?: string
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COLLECTION_NAME, orderId), {
    paymentStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteOrder(orderId: string): Promise<boolean> {
  if (!db || !orderId) return false;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, orderId));
    return true;
  } catch (e) {
    console.error('Error deleting order:', e);
    throw e;
  }
}

