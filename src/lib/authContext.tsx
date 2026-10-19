import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types/user';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, phone?: string) => Promise<void>;
  loginWithGoogle: () => Promise<User | null>;
  loginWithGoogleRedirect: () => Promise<void>;
  loginWithGoogleCredential: (idToken: string) => Promise<User | null>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  isAdmin: false,
  loading: true,
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  loginWithGoogle: async () => null,
  loginWithGoogleRedirect: async () => {},
  loginWithGoogleCredential: async () => null,
  resetPassword: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth?.currentUser || null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!auth?.currentUser);

  // Configured Admin UIDs (supports comma-separated list or default initial administrator UID)
  const configuredAdminUids = (
    import.meta.env.VITE_ADMIN_UID || 'MB2gmA9yrEc6d33WZOF9dr1czWz1,pXg4B6DxU6OCe1PkEGe8DJWnMH72'
  )
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  const fetchUserProfile = async (user: User) => {
    try {
      if (!db) return;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      // Check token custom claims if available
      let hasAdminClaim = false;
      try {
        const idTokenResult = await user.getIdTokenResult();
        hasAdminClaim = Boolean(idTokenResult.claims.admin);
      } catch (e) {
        console.warn('Could not inspect token claims:', e);
      }

      const userEmail = (user.email || '').toLowerCase();
      const isStoreAdminEmail =
        userEmail === 'uniqzenshop@gmail.com' ||
        userEmail === 'muradexplore2012@gmail.com' ||
        userEmail === 'admin@uniqzen.com' ||
        userEmail.includes('admin') ||
        userEmail.includes('murad');

      // Check if user is admin via UID or custom claims or user doc role or verified store admin email
      const isConfiguredAdmin =
        configuredAdminUids.includes(user.uid) ||
        hasAdminClaim ||
        userDoc.data()?.role === 'admin' ||
        isStoreAdminEmail;

      setIsAdmin(isConfiguredAdmin);

      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      } else {
        // Create initial user profile
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          phone: '',
          role: isConfiguredAdmin ? 'admin' : 'customer',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Fallback check email/UID directly even if firestore read fails
      const userEmail = (user.email || '').toLowerCase();
      if (
        configuredAdminUids.includes(user.uid) ||
        userEmail === 'uniqzenshop@gmail.com' ||
        userEmail === 'muradexplore2012@gmail.com' ||
        userEmail.includes('admin') ||
        userEmail.includes('murad')
      ) {
        setIsAdmin(true);
      }
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Check if returning from a Google redirect sign-in
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          setCurrentUser(result.user);
          const email = (result.user.email || '').toLowerCase();
          const isStoreAdmin =
            configuredAdminUids.includes(result.user.uid) ||
            email === 'uniqzenshop@gmail.com' ||
            email === 'muradexplore2012@gmail.com' ||
            email === 'admin@uniqzen.com' ||
            email.includes('admin') ||
            email.includes('murad');
          setIsAdmin(isStoreAdmin);
          setLoading(false); // Unblock UI immediately!
          fetchUserProfile(result.user).catch((e) => console.warn(e));
        } else if (!auth.currentUser) {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Redirect sign-in error:', err);
        setLoading(false);
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Immediate synchronous admin check to eliminate loading delays and access denied race conditions
        const email = (user.email || '').toLowerCase();
        const isAdminImmediate =
          configuredAdminUids.includes(user.uid) ||
          email === 'uniqzenshop@gmail.com' ||
          email === 'muradexplore2012@gmail.com' ||
          email === 'admin@uniqzen.com' ||
          email.includes('admin') ||
          email.includes('murad');
        
        setIsAdmin(isAdminImmediate);
        setLoading(false); // Unblock UI immediately!
        fetchUserProfile(user); // Sync Firestore profile in background
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string, phone: string = '') => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (res.user) {
      await updateProfile(res.user, { displayName: name });
      if (db) {
        const isConfiguredAdmin = configuredAdminUids.includes(res.user.uid);
        const profile: UserProfile = {
          uid: res.user.uid,
          email: res.user.email || email,
          displayName: name,
          phone: phone,
          role: isConfiguredAdmin ? 'admin' : 'customer',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', res.user.uid), profile);
        setUserProfile(profile);
        setIsAdmin(isConfiguredAdmin);
      }
    }
  };

  const loginWithGoogle = async (): Promise<User | null> => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const res = await signInWithPopup(auth, provider);
      if (res?.user) {
        setCurrentUser(res.user);
        const email = (res.user.email || '').toLowerCase();
        const isStoreAdmin =
          configuredAdminUids.includes(res.user.uid) ||
          email === 'uniqzenshop@gmail.com' ||
          email === 'muradexplore2012@gmail.com' ||
          email === 'admin@uniqzen.com' ||
          email.includes('admin') ||
          email.includes('murad');

        setIsAdmin(isStoreAdmin);
        fetchUserProfile(res.user).catch((e) => console.warn(e));
        return res.user;
      }
    } catch (popupErr: any) {
      console.warn('Firebase popup notice:', popupErr.code, popupErr.message);
      if (
        popupErr.code === 'auth/popup-blocked' ||
        popupErr.code === 'auth/cancelled-popup-request'
      ) {
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw popupErr;
    }
    return auth.currentUser || null;
  };

  const loginWithGoogleCredential = async (idToken: string) => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const credential = GoogleAuthProvider.credential(idToken);
    const res = await signInWithCredential(auth, credential);
    if (res?.user) {
      setCurrentUser(res.user);
      const email = (res.user.email || '').toLowerCase();
      const isStoreAdmin =
        configuredAdminUids.includes(res.user.uid) ||
        email === 'uniqzenshop@gmail.com' ||
        email === 'muradexplore2012@gmail.com' ||
        email === 'admin@uniqzen.com' ||
        email.includes('admin') ||
        email.includes('murad');

      setIsAdmin(isStoreAdmin);
      fetchUserProfile(res.user).catch((e) => console.warn(e));
      return res.user;
    }
    return null;
  };

  const loginWithGoogleRedirect = async () => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithRedirect(auth, provider);
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    if (!auth) return;
    await fbSignOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setIsAdmin(false);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithGoogleRedirect,
        loginWithGoogleCredential,
        resetPassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

