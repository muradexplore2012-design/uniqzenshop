const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Hardcoded authorized administrator UIDs for initial bootstrapping
const BOOTSTRAP_ADMIN_UIDS = [
  'MB2gmA9yrEc6d33WZOF9dr1czWz1',
  'pXg4B6DxU6OCe1PkEGe8DJWnMH72',
];

/**
 * Callable Function: grantAdminRole
 * Only callable by an authenticated administrator.
 * Grants custom claim { admin: true } and syncs Firestore /users/{uid}.role = 'admin'.
 */
exports.grantAdminRole = functions.https.onCall(async (data, context) => {
  // Verify caller authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to invoke this function.'
    );
  }

  const callerUid = context.auth.uid;

  // Check caller authorization via claims, bootstrap list, or firestore role
  let isCallerAdmin =
    context.auth.token.admin === true ||
    BOOTSTRAP_ADMIN_UIDS.includes(callerUid);

  if (!isCallerAdmin) {
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    if (callerDoc.exists && callerDoc.data()?.role === 'admin') {
      isCallerAdmin = true;
    }
  }

  if (!isCallerAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only existing administrators can assign the admin role.'
    );
  }

  const rawEmail = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
  const rawUid = typeof data?.uid === 'string' ? data.uid.trim() : '';

  if (!rawEmail && !rawUid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'A valid email address or user UID must be provided.'
    );
  }

  try {
    // 1. Resolve user record securely in Firebase Authentication
    let user;
    try {
      if (rawEmail) {
        user = await admin.auth().getUserByEmail(rawEmail);
      } else {
        user = await admin.auth().getUser(rawUid);
      }
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found') {
        throw new functions.https.HttpsError(
          'not-found',
          'This user must register and log in to the website first.'
        );
      }
      throw authErr;
    }

    const targetUid = user.uid;

    // 2. Check if user has logged in and setup their account
    // Verify Firestore document exists or metadata indicates previous activity
    const userDocRef = admin.firestore().collection('users').doc(targetUid);
    const userDoc = await userDocRef.get();

    // Check if user is already an admin
    const alreadyAdmin =
      user.customClaims?.admin === true ||
      userDoc.data()?.role === 'admin';

    if (alreadyAdmin) {
      return {
        success: false,
        alreadyAdmin: true,
        message: `${user.email || targetUid} is already an administrator.`,
        uid: targetUid,
        email: user.email,
      };
    }

    // 3. Assign Custom User Claims on Firebase Auth Token
    const existingClaims = user.customClaims || {};
    await admin.auth().setCustomUserClaims(targetUid, {
      ...existingClaims,
      admin: true,
      role: 'admin',
    });

    // 4. Update Firestore Document with admin role
    await userDocRef.set(
      {
        uid: targetUid,
        email: user.email || rawEmail,
        displayName: user.displayName || userDoc.data()?.displayName || '',
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 5. Record Audit Log for the role promotion
    try {
      await admin.firestore().collection('audit_logs').add({
        adminUid: callerUid,
        adminEmail: context.auth.token.email || '',
        action: 'admin.promote',
        targetType: 'user',
        targetId: targetUid,
        details: {
          targetEmail: user.email || rawEmail,
          targetUid: targetUid,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (auditErr) {
      console.warn('Could not record audit log in function:', auditErr);
    }

    return {
      success: true,
      message: `Admin role successfully granted to ${user.email || targetUid}.`,
      uid: targetUid,
      email: user.email,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error('Error granting admin role:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Auth Trigger: onUserCreate
 * Automatically assigns admin custom claims if the newly created user's UID
 * matches one of the designated bootstrap admin UIDs.
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  if (BOOTSTRAP_ADMIN_UIDS.includes(user.uid)) {
    try {
      await admin.auth().setCustomUserClaims(user.uid, {
        admin: true,
        role: 'admin',
      });
      await admin.firestore().collection('users').doc(user.uid).set(
        {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          role: 'admin',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log(`Successfully bootstrapped admin privileges for UID: ${user.uid}`);
    } catch (err) {
      console.error(`Failed to bootstrap admin privileges for UID: ${user.uid}`, err);
    }
  }
});
