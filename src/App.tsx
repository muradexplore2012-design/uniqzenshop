import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/authContext';
import { CartProvider } from './lib/cartContext';
import { WishlistProvider } from './lib/wishlistContext';

// Customer Layout & Pages
import { CustomerLayout } from './components/customer/CustomerLayout';
import { HomePage } from './pages/customer/HomePage';
import { ShopPage } from './pages/customer/ShopPage';
import { CategoryPage } from './pages/customer/CategoryPage';
import { ProductDetailPage } from './pages/customer/ProductDetailPage';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderConfirmationPage } from './pages/customer/OrderConfirmationPage';
import { AccountPage } from './pages/customer/AccountPage';
import { WishlistPage } from './pages/customer/WishlistPage';
import { OrderTrackingPage } from './pages/customer/OrderTrackingPage';
import { StaticContentPage } from './pages/customer/StaticContentPage';
import { NotFoundPage } from './pages/customer/NotFoundPage';

// Admin Layout & Pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminProductFormPage } from './pages/admin/AdminProductFormPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminOrderDetailPage } from './pages/admin/AdminOrderDetailPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminDeliveryPage } from './pages/admin/AdminDeliveryPage';
import { AdminBannersPage } from './pages/admin/AdminBannersPage';
import { AdminPagesManagementPage } from './pages/admin/AdminPagesManagementPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { ScrollToTop } from './components/common/ScrollToTop';

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Routes>

              {/* Customer Front-end routes */}
              <Route path="/" element={<CustomerLayout />}>
                <Route index element={<HomePage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="category/:slug" element={<CategoryPage />} />
                <Route path="product/:productId" element={<ProductDetailPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="order-confirmation/:id" element={<OrderConfirmationPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="wishlist" element={<WishlistPage />} />
                <Route path="track-order" element={<OrderTrackingPage />} />

                {/* Static & Policy Pages */}
                <Route path="about" element={<StaticContentPage />} />
                <Route path="contact" element={<StaticContentPage />} />
                <Route path="privacy-policy" element={<StaticContentPage />} />
                <Route path="terms" element={<StaticContentPage />} />
                <Route path="shipping-policy" element={<StaticContentPage />} />
                <Route path="return-policy" element={<StaticContentPage />} />
                <Route path="warranty-policy" element={<StaticContentPage />} />
                <Route path="faq" element={<StaticContentPage />} />

                {/* 404 Catch-All */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Admin Portal Authentication */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Admin Portal Secured Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="products/new" element={<AdminProductFormPage />} />
                <Route path="products/:id" element={<AdminProductFormPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="orders/:id" element={<AdminOrderDetailPage />} />
                <Route path="customers" element={<AdminCustomersPage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="coupons" element={<AdminCouponsPage />} />
                <Route path="delivery" element={<AdminDeliveryPage />} />
                <Route path="banners" element={<AdminBannersPage />} />
                <Route path="pages" element={<AdminPagesManagementPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="audit" element={<AdminAuditLogsPage />} />
              </Route>
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
