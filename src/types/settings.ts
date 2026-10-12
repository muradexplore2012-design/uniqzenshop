export interface DeliveryZone {
  id: string;
  name: string; // e.g. "Inside Dhaka", "Outside Dhaka", "Sub-Dhaka / Gazipur / Narayanganj"
  charge: number; // e.g. 70 BDT, 130 BDT
  minOrderFreeShipping?: number;
  estimatedDeliveryTime?: string; // e.g. "24-48 Hours", "3-5 Working Days"
  active: boolean;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  currency: string;
  currencySymbol: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  twitterUrl?: string;
  announcementBarText?: string;
  announcementBarEnabled: boolean;
  freeShippingThreshold?: number;
  orderNotice?: string;
  footerAbout?: string;
  deliveryZones: DeliveryZone[];
  seoDefaultTitle: string;
  seoDefaultDescription: string;
  updatedAt?: any;
}

export interface StaticPageContent {
  slug: string;
  title: string;
  content: string; // markdown or HTML
  metaTitle?: string;
  metaDescription?: string;
  updatedAt?: any;
}
