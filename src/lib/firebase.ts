import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDHPo2Hy9zTsA46jTjHXpmWxTeYxA9V5Ac",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "uniqzenshop-8ee15.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "uniqzenshop-8ee15",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "uniqzenshop-8ee15.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "963957373578",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:963957373578:web:6b3cc4a6fca79d7f838b73",
};

// Check if credentials are valid and present
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY'
);

// Initialize Firebase without throwing unhandled exceptions if config is pending
let appInstance: any;
try {
  appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.warn('Firebase initialization notice:', error);
}

let firestoreDb: any = null;
if (appInstance) {
  try {
    firestoreDb = initializeFirestore(appInstance, {
      ignoreUndefinedProperties: true,
    });
  } catch {
    firestoreDb = getFirestore(appInstance);
  }
}

export const app = appInstance;
export const auth = appInstance ? getAuth(appInstance) : (null as any);
if (auth) {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Firebase auth persistence notice:', err);
  });
}
export const db = firestoreDb;
export const storage = appInstance ? getStorage(appInstance) : (null as any);
export const functions = appInstance ? getFunctions(appInstance) : (null as any);
