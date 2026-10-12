# Uniqzen Shop — Complete Gadget E-Commerce Platform

A production-ready Bangladeshi gadget and electronics e-commerce store with full Firebase backend integration, customer storefront, and a feature-rich admin panel.

Built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Firebase** (Authentication, Firestore, Storage).

---

## 🌟 Key Highlights & Features

### 🛒 1. Customer-Facing Storefront
- **Responsive Modern UI**: Mobile-first architecture inspired by top electronics stores.
- **Brand Identity**: Features official **Uniqzen Shop** logo asset and centralized design token system.
- **Dynamic Catalog**: Full gadget catalog with real-time category, brand, stock, price, and specification filters.
- **Product Details & Hardware Specs**:
  - Interactive multi-image gallery with hover zoom magnification.
  - Flexible technical specifications table (Battery, Display, Processor, Bluetooth, Charging, etc.).
  - Configurable variants matrix (Color swatches, Storage/RAM options) with real-time price & stock updates.
  - Warranty badge, What's In The Box checklist, and Return policy.
- **Cart & Secure Checkout**:
  - Cash on Delivery (COD) workflow tailored for Bangladesh.
  - Address collection with 8 Divisions, 64 Districts, Thana/Upazila, and delivery notes.
  - Delivery charge calculation (Inside Dhaka ৳ 70, Outside Dhaka ৳ 130, or custom).
  - Discount promo coupon validation.
  - Server-side-like price & stock validation preventing browser manipulation.
- **Order Tracking**:
  - Live timeline tracking (`/track-order`) through stages: *Pending → Confirmed → Processing → Packed → Shipped → Delivered*.
- **Customer Account**:
  - Firebase Auth (Email/Password registration & login).
  - Order history with detailed item breakdowns and status badges.
  - Customer wishlist with one-click "Move to Cart".
- **Ratings & Reviews**:
  - 5-star customer review submission with verified buyer verification and admin moderation.
- **Editable Policy Pages**:
  - Dynamic content management for `/about`, `/contact`, `/shipping-policy`, `/return-policy`, `/warranty-policy`, `/faq`, `/terms`, and `/privacy-policy`.

---

### 🛡️ 2. Comprehensive Admin Management Suite (`/admin`)
- **Strict Authorization**: Guarded by Firebase Auth UID (`VITE_ADMIN_UID`), custom claims, or user role. Normal customers are locked out with a secure "Access Denied" screen.
- **Real Analytics Only**: 
  - Zero fake data, zero dummy products, zero fabricated revenues.
  - Displays real order counts, genuine revenue from completed orders, low-stock notifications, and real database status.
  - Built-in first-login onboarding checklist when database is initially empty.
- **Gadget Product CRUD**:
  - Add, edit, duplicate, and archive products.
  - Multi-image drag-and-drop uploader with automated browser client-side WebP compression.
  - Set primary cover photo.
  - Hardware specifications builder.
  - Multi-option variant generator with individual SKU, price, and stock levels.
- **Category Management**:
  - Create parent categories, upload icons, configure display sort orders, and add subcategory tags.
- **Order Processing & Printable Invoice**:
  - Search orders by ID, customer name, or phone.
  - Filter by lifecycle status.
  - Update status and append internal/courier tracking notes.
  - Print official PDF/Paper invoice (`#printable-invoice`) formatted for shipping.
- **Customer Directory**:
  - View registered customer records, lifetime spending, and order history.
  - Enable/disable customer accounts.
- **Coupon & Promo Campaign Manager**:
  - Percentage (%) or fixed (৳) discounts, minimum spend thresholds, max discount caps, and usage limits.
- **Delivery Zone Rates**:
  - Configure Inside Dhaka, Outside Dhaka, and regional delivery charges and free-shipping thresholds.
- **Hero Banner Manager**:
  - Create and control homepage hero banners and promo slides.
- **Store Settings & Branding**:
  - Store phone, WhatsApp hotline, email, office address, announcement bar banner, and SEO meta tags.
- **Audit Logs**:
  - Records administrative changes with admin UID, action, and timestamps.

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 with TypeScript |
| Build Tool | Vite 5 (with manual vendor code-splitting) |
| Styling | Tailwind CSS (centralized CSS variable design tokens) |
| Icons | Lucide React |
| Database | Firebase Firestore |
| Authentication | Firebase Authentication (Email/Password) |
| File Storage | Firebase Storage (with client WebP compression) |

---

## 📁 Project Structure

```text
uniq-zen/
├── public/
│   └── logo.png                  # Official Uniqzen Shop logo asset
├── src/
│   ├── components/
│   │   ├── admin/                # Admin layout, sidebar, and image uploader
│   │   ├── common/               # Header, Footer, EmptyState, SkeletonLoader, SEO
│   │   └── customer/             # ProductCard, FilterDrawer, ZoomGallery, SpecsTable
│   ├── lib/
│   │   ├── authContext.tsx       # Auth provider & admin authorization check
│   │   ├── cartContext.tsx       # Cart provider, stock check & discount calculator
│   │   ├── wishlistContext.tsx   # Wishlist state with localStorage sync
│   │   ├── firebase.ts           # Firebase client initialization
│   │   └── utils.ts              # BDT ৳ currency formatter, BD divisions/districts
│   ├── pages/
│   │   ├── admin/                # Dashboard, Products, Orders, Categories, Coupons, etc.
│   │   └── customer/             # Home, Shop, ProductDetail, Cart, Checkout, Account, etc.
│   ├── services/                 # Firebase Firestore & Storage service layers
│   ├── types/                    # Strong TypeScript definitions
│   ├── App.tsx                   # Central router definition
│   ├── index.css                 # Global CSS tokens & print invoice styles
│   └── main.tsx                  # Application entry point
├── .env                          # Local environment configuration
├── .env.example                  # Environment variable reference template
├── firestore.rules               # Production Firestore Security Rules
├── firestore.indexes.json        # Composite indexes configuration
├── storage.rules                 # Production Firebase Storage Security Rules
├── tailwind.config.js            # Tailwind configuration
└── vite.config.ts                # Vite config with vendor chunk splitting
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 18+ (Node.js LTS 20+ recommended)
- npm 9+

### 2. Installation
```bash
# Clone or navigate into the directory
cd "uniq zen"

# Install dependencies
npm install
```

### 3. Environment Configuration
The `.env` file is pre-configured with the client Firebase credentials:
```env
VITE_FIREBASE_API_KEY=AIzaSyDHPo2Hy9zTsA46jTjHXpmWxTeYxA9V5Ac
VITE_FIREBASE_AUTH_DOMAIN=uniqzenshop-8ee15.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=uniqzenshop-8ee15
VITE_FIREBASE_STORAGE_BUCKET=uniqzenshop-8ee15.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=963957373578
VITE_FIREBASE_APP_ID=1:963957373578:web:6b3cc4a6fca79d7f838b73

# Initial Administrator UID
VITE_ADMIN_UID=MB2gmA9yrEc6d33WZOF9dr1czWz1

# Store Information
VITE_STORE_NAME="Uniqzen Shop"
VITE_STORE_PHONE="01566088159"
VITE_STORE_EMAIL="uniqzenshop@gmail.com"
VITE_STORE_WHATSAPP="01566088159"
```

### 4. Running the Development Server
```bash
npm run dev
```
Open `http://localhost:1767` in your web browser.

---

## 🔐 Admin Authentication Setup

1. Go to **Firebase Console** → **Authentication** → **Users**.
2. Click **Add User** and create an administrator user with your preferred email and password.
3. Copy the user's **UID**.
4. Set the `VITE_ADMIN_UID` in `.env` to this UID (or keep `MB2gmA9yrEc6d33WZOF9dr1czWz1`).
5. Open `/admin/login` on your website and sign in.
6. The app verifies the UID and grants access to `/admin`. Any regular customer attempting to access `/admin` will see **Access Denied**.

---

## 🔒 Deploying Firebase Security Rules

Deploy the included `firestore.rules` and `storage.rules`:

```bash
# Login to Firebase CLI
npx firebase login

# Deploy rules
npx firebase deploy --only firestore:rules,storage:rules
```

---

## 📦 Production Build

```bash
npm run build
```
The optimized production bundle will be created in the `dist/` directory with code splitting for fast load times across slower connections.
