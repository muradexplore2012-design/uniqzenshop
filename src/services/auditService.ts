import { collection, doc, setDoc, getDocs, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuditLog } from '../types/audit';

const COLLECTION_NAME = 'audit_logs';

export async function logAdminAction(
  adminUid: string,
  action: string,
  targetType: string,
  targetId?: string,
  details?: Record<string, any>,
  adminEmail?: string
): Promise<void> {
  if (!db) return;
  try {
    const newRef = doc(collection(db, COLLECTION_NAME));
    const payload: AuditLog = {
      id: newRef.id,
      adminUid,
      adminEmail,
      action,
      targetType,
      targetId,
      details,
      timestamp: serverTimestamp(),
    };
    await setDoc(newRef, payload);
  } catch (e) {
    console.warn('Could not record audit log:', e);
  }
}

export async function getRecentAuditLogs(max: number = 50): Promise<AuditLog[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
    return list
      .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
      .slice(0, max);
  } catch (e) {
    console.error('Error fetching audit logs:', e);
    return [];
  }
}
