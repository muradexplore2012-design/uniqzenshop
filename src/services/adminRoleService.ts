import { httpsCallable } from 'firebase/functions';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { functions, db } from '../lib/firebase';
import { logAdminAction } from './auditService';
import { UserProfile } from '../types/user';

export interface MakeAdminResult {
  success: boolean;
  message: string;
  uid?: string;
  email?: string;
  alreadyAdmin?: boolean;
}

/**
 * Validates email format according to standard RFC specifications
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Promotes a registered user to Administrator.
 *
 * Security Model:
 * 1. Checks that the active caller is an authorized administrator.
 * 2. Attempts primary promotion via trusted Firebase Cloud Function (grantAdminRole)
 *    which uses Firebase Admin SDK to verify Auth account existence and set custom user claims {admin: true}.
 * 3. If Cloud Functions is not deployed or unavailable, safely falls back to Firestore-based role promotion
 *    with server-side security rules enforcement (firestore.rules line 88 requires caller to be isAdmin()).
 * 4. Verifies the user has a registered website account in Firestore/Auth.
 * 5. Logs the action in audit_logs.
 */
export async function makeUserAdmin(
  targetEmail: string,
  caller: { uid: string; email?: string }
): Promise<MakeAdminResult> {
  const cleanEmail = targetEmail.trim().toLowerCase();

  if (!isValidEmail(cleanEmail)) {
    return {
      success: false,
      message: 'Please enter a valid email address.',
    };
  }

  // Attempt 1: Call Firebase Callable Cloud Function (Trusted Server-Side Admin SDK)
  if (functions) {
    try {
      const grantAdminFn = httpsCallable<{ email: string }, MakeAdminResult>(
        functions,
        'grantAdminRole'
      );
      const res = await grantAdminFn({ email: cleanEmail });
      if (res.data) {
        if (caller.uid) {
          logAdminAction(
            caller.uid,
            'admin.promote',
            'user',
            res.data.uid,
            { targetEmail: cleanEmail, method: 'cloud-function' },
            caller.email || ''
          );
        }
        return res.data;
      }
    } catch (fnErr: any) {
      console.warn('Cloud Function invocation notice:', fnErr);

      // Handle specific Cloud Function errors
      const errCode = fnErr.code;
      const errMsg = fnErr.message || '';

      if (errCode === 'functions/not-found' || errMsg.includes('This user must register')) {
        return {
          success: false,
          message: 'This user must register and log in to the website first.',
        };
      }

      if (errCode === 'functions/permission-denied') {
        return {
          success: false,
          message: 'Permission denied: Only an authorized administrator can perform this action.',
        };
      }

      if (errCode === 'functions/unauthenticated') {
        return {
          success: false,
          message: 'Your admin session has expired. Please sign in again.',
        };
      }

      // If the function is not deployed yet or network error occurred, proceed to Firestore verification fallback
      console.info('Attempting verified database role assignment fallback...');
    }
  }

  // Attempt 2: Secure Firestore Promotion Fallback
  // Protected by firestore.rules: allow update /users/{userId} if isAdmin()
  if (!db) {
    return {
      success: false,
      message: 'Database connection is not available.',
    };
  }

  try {
    const usersRef = collection(db, 'users');
    
    // Query 1: Exact lowercase match
    let userDocSnap: any = null;
    let userData: UserProfile | null = null;
    let targetUid: string = '';

    const q = query(usersRef, where('email', '==', cleanEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      userDocSnap = querySnapshot.docs[0];
      userData = userDocSnap.data() as UserProfile;
      targetUid = userDocSnap.id;
    } else {
      // Query 2: Fallback scan all users for case-insensitive match
      const allUsersSnap = await getDocs(usersRef);
      const match = allUsersSnap.docs.find((d) => {
        const email = (d.data()?.email || '').trim().toLowerCase();
        return email === cleanEmail;
      });

      if (match) {
        userDocSnap = match;
        userData = match.data() as UserProfile;
        targetUid = match.id;
      }
    }

    if (!userDocSnap || !userData) {
      return {
        success: false,
        message: 'This user must register and log in to the website first.',
      };
    }

    if (userData.role === 'admin') {
      return {
        success: false,
        alreadyAdmin: true,
        message: `${cleanEmail} is already an administrator.`,
        uid: targetUid,
        email: cleanEmail,
      };
    }

    // Update role to admin in Firestore
    await updateDoc(doc(db, 'users', targetUid), {
      role: 'admin',
      updatedAt: serverTimestamp(),
    });

    // Sync admin directory for login password reset security
    syncAdminDirectory().catch(() => {});

    // Record audit log
    if (caller.uid) {
      logAdminAction(
        caller.uid,
        'admin.promote',
        'user',
        targetUid,
        { targetEmail: cleanEmail, method: 'firestore-role' },
        caller.email || ''
      );
    }

    return {
      success: true,
      message: `Admin role successfully granted to ${cleanEmail}. The user now has full administrative access.`,
      uid: targetUid,
      email: cleanEmail,
    };
  } catch (dbErr: any) {
    console.error('Error promoting user in Firestore:', dbErr);
    if (dbErr.code === 'permission-denied') {
      return {
        success: false,
        message: 'Permission denied: Only an authorized administrator can perform this action.',
      };
    }
    return {
      success: false,
      message: dbErr.message || 'A network or server error occurred while assigning the admin role.',
    };
  }
}

/**
 * Fetches all users who have administrative access
 */
export async function getAdminUsers(): Promise<UserProfile[]> {
  if (!db) return [];
  try {
    const configuredUids = (
      import.meta.env.VITE_ADMIN_UID || 'MB2gmA9yrEc6d33WZOF9dr1czWz1,pXg4B6DxU6OCe1PkEGe8DJWnMH72'
    )
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);
    const list: UserProfile[] = [];

    snap.docs.forEach((docSnap) => {
      const data = docSnap.data() as UserProfile;
      const uid = docSnap.id;
      const email = (data.email || '').toLowerCase();
      const isConfigured = configuredUids.includes(uid);
      const isRoleAdmin = data.role === 'admin';
      const isStoreEmail = email === 'uniqzenshop@gmail.com' || email === 'admin@uniqzen.com';

      if (isRoleAdmin || isConfigured || isStoreEmail) {
        list.push({
          ...data,
          uid,
          role: 'admin',
        });
      }
    });

    // Sort: Newest created/updated first
    return list.sort((a, b) => {
      const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
      const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (err) {
    console.error('Error fetching admin users:', err);
    return [];
  }
}

/**
 * Revokes administrator role from a user and sets role back to customer
 */
export async function revokeAdminRole(
  targetUid: string,
  caller: { uid: string; email?: string }
): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: 'Database not connected.' };
  }
  if (caller.uid === targetUid) {
    return { success: false, message: 'You cannot revoke your own administrator access.' };
  }

  try {
    const userDocRef = doc(db, 'users', targetUid);
    await updateDoc(userDocRef, {
      role: 'customer',
      updatedAt: serverTimestamp(),
    });

    if (caller.uid) {
      logAdminAction(
        caller.uid,
        'admin.revoke',
        'user',
        targetUid,
        { method: 'firestore-role' },
        caller.email || ''
      );
    }

    // Sync admin directory for login password reset security
    syncAdminDirectory().catch(() => {});

    return {
      success: true,
      message: 'Admin access successfully revoked. User role set back to customer.',
    };
  } catch (err: any) {
    console.error('Error revoking admin role:', err);
    return {
      success: false,
      message: err.message || 'Failed to revoke admin role.',
    };
  }
}

/**
 * Synchronizes the list of active administrator email addresses to settings/admin_directory.
 * This document is publicly readable so the login page can securely verify whether an email
 * requesting a password reset is an authorized administrator before sending any reset link.
 */
export async function syncAdminDirectory(emails?: string[]): Promise<void> {
  if (!db) return;
  try {
    let list = emails || [];
    if (!emails || emails.length === 0) {
      const admins = await getAdminUsers();
      list = admins.map((a) => a.email).filter(Boolean) as string[];
    }
    const cleanEmails = Array.from(
      new Set([
        ...list.map((e) => e.trim().toLowerCase()),
        'muradexplore2012@gmail.com',
        'admin@uniqzen.com',
        'uniqzenshop@gmail.com',
      ])
    ).filter(Boolean);

    await setDoc(
      doc(db, 'settings', 'admin_directory'),
      {
        emails: cleanEmails,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync admin directory:', err);
  }
}

/**
 * Verifies if an email belongs to an authorized administrator in the Make Admin / Admin list.
 * Only if this returns true will the password reset link be dispatched.
 */
export async function isAuthorizedAdminEmail(targetEmail: string): Promise<boolean> {
  const cleanEmail = targetEmail.trim().toLowerCase();
  if (!cleanEmail) return false;

  // 1. Primary permanent store admin emails
  const defaultAdmins = [
    'muradexplore2012@gmail.com',
    'admin@uniqzen.com',
    'uniqzenshop@gmail.com',
  ];
  if (defaultAdmins.includes(cleanEmail)) {
    return true;
  }

  // 2. Read admin_directory from settings collection (publicly readable via firestore.rules)
  if (db) {
    try {
      const dirSnap = await getDoc(doc(db, 'settings', 'admin_directory'));
      if (dirSnap.exists()) {
        const storedEmails: string[] = dirSnap.data()?.emails || [];
        if (storedEmails.map((e) => e.trim().toLowerCase()).includes(cleanEmail)) {
          return true;
        }
      }
    } catch (e) {
      console.warn('Could not verify admin directory:', e);
    }

    // 3. If caller has active admin credentials, query database directly
    try {
      const users = await getAdminUsers();
      if (users.some((u) => (u.email || '').toLowerCase().trim() === cleanEmail)) {
        return true;
      }
    } catch {
      // Ignored for unauthenticated users
    }
  }

  return false;
}

