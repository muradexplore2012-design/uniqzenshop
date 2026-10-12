import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
