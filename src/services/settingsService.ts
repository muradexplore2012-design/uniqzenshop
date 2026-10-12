import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StoreSettings, DeliveryZone, StaticPageContent } from '../types/settings';

const SETTINGS_COLLECTION = 'settings';
const PAGES_COLLECTION = 'pages';

export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'inside-dhaka',
    name: 'Inside Dhaka City',
    charge: 70,
    minOrderFreeShipping: 3000,
    estimatedDeliveryTime: '24–48 Hours',
    active: true,
  },
  {
    id: 'outside-dhaka',
    name: 'Outside Dhaka (All Over Bangladesh)',
    charge: 130,
    minOrderFreeShipping: 5000,
    estimatedDeliveryTime: '2–4 Working Days',
    active: true,
  },
];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Uniqzen Shop',
  tagline: 'Unique Finds, Just For You......',
  logoUrl: '/logo.png',
  faviconUrl: '/logo.png',
  phone: '01768534545',
  email: 'uniqzenshop@gmail.com',
  address: 'Dhaka, Bangladesh',
  whatsapp: '01768534545',
  currency: 'BDT',
  currencySymbol: '৳',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  tiktokUrl: '',
  twitterUrl: '',
  announcementBarText: '🎉 Welcome to Uniqzen Shop! Cash on Delivery Available Nationwide.',
  announcementBarEnabled: true,
  freeShippingThreshold: 5000,
  orderNotice: 'Orders placed before 4:00 PM are dispatched on the same day.',
  footerAbout:
    'Uniqzen Shop is Bangladesh’s trusted destination for authentic gadgets, premium audio, smart wearables, and mobile accessories. Quality guaranteed.',
  deliveryZones: DEFAULT_DELIVERY_ZONES,
  seoDefaultTitle: 'Uniqzen Shop — Authentic Gadgets & Electronics in Bangladesh',
  seoDefaultDescription:
    'Shop smartphones, smartwatches, earbuds, chargers and genuine gadget accessories at Uniqzen Shop with fast home delivery and cash on delivery.',
};

export async function getStoreSettings(): Promise<StoreSettings> {
  if (!db) return DEFAULT_STORE_SETTINGS;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'store');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_STORE_SETTINGS, ...snap.data() } as StoreSettings;
    }
    return DEFAULT_STORE_SETTINGS;
  } catch (e) {
    console.error('Error fetching settings:', e);
    return DEFAULT_STORE_SETTINGS;
  }
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
  if (!db) throw new Error('Database not connected');
  const docRef = doc(db, SETTINGS_COLLECTION, 'store');
  await setDoc(
    docRef,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getStaticPage(slug: string): Promise<StaticPageContent | null> {
  if (!db) return getDefaultStaticPage(slug);
  try {
    const docRef = doc(db, PAGES_COLLECTION, slug);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as StaticPageContent;
    }
    return getDefaultStaticPage(slug);
  } catch (e) {
    console.error(`Error fetching page ${slug}:`, e);
    return getDefaultStaticPage(slug);
  }
}

export async function updateStaticPage(slug: string, pageData: Partial<StaticPageContent>): Promise<void> {
  if (!db) throw new Error('Database not connected');
  const docRef = doc(db, PAGES_COLLECTION, slug);
  await setDoc(
    docRef,
    {
      slug,
      ...pageData,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

function getDefaultStaticPage(slug: string): StaticPageContent {
  const titles: Record<string, string> = {
    about: 'About Uniqzen Shop',
    contact: 'Contact Us',
    'privacy-policy': 'Privacy Policy',
    terms: 'Terms & Conditions',
    'shipping-policy': 'Shipping & Delivery Policy',
    'return-policy': 'Return & Refund Policy',
    'warranty-policy': 'Warranty Policy',
    faq: 'Frequently Asked Questions',
  };

  const title = titles[slug] || 'Information';
  return {
    slug,
    title,
    content: `Welcome to **${title}** at Uniqzen Shop.\n\nWe provide authentic gadgets and reliable customer service across Bangladesh. For any queries regarding this policy, please reach out to our support line at 01566088159 or email uniqzenshop@gmail.com.`,
  };
}
