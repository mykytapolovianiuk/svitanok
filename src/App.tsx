import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';
import CartDrawer from './components/cart/CartDrawer';
import AnalyticsProvider from './components/marketing/AnalyticsProvider';
import GTM from './components/marketing/GTM';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';
import AuthProvider from './components/auth/AuthProvider';
import Spinner from './components/ui/Spinner';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Catalog = lazy(() => import('./pages/Catalog'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const Auth = lazy(() => import('./pages/Auth'));
const Account = lazy(() => import('./pages/Account'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Admin = lazy(() => import('./pages/Admin'));
const About = lazy(() => import('./pages/About'));
const Contacts = lazy(() => import('./pages/Contacts'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Delivery = lazy(() => import('./pages/Delivery'));
const Returns = lazy(() => import('./pages/Returns'));
const AutumnCare = lazy(() => import('./pages/AutumnCare'));
const SkincareRegimen = lazy(() => import('./pages/SkincareRegimen'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));

// Admin Components Lazy Loading
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminPromoCodes = lazy(() => import('./pages/admin/PromoCodes'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const Bestsellers = lazy(() => import('./pages/admin/Bestsellers'));

// Loading Fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] py-20">
    <Spinner size="lg" />
  </div>
);

// Simple layout without header/footer for checkout
const CheckoutLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-white">
    {children}
  </div>
);

/**
 * Головний компонент додатку
 * Містить маршрутизацію та основні провайдери
 */
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HelmetProvider>
            <GTM />
            <AnalyticsProvider />
            <ScrollToTop />
            <CartDrawer />
            <Toaster position="top-right" />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Checkout route without header/footer */}
                <Route path="/checkout" element={
                  <CheckoutLayout>
                    <Checkout />
                  </CheckoutLayout>
                } />

                {/* Admin routes without header/footer */}
                <Route
                  path="admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Admin />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="promocodes" element={<AdminPromoCodes />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="bestsellers" element={<Bestsellers />} />
                </Route>

                {/* All other routes with normal layout */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="catalog" element={<Catalog />} />
                  <Route path="catalog/:category" element={<Catalog />} />
                  <Route path="product/:slug" element={<ProductPage />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="order-success" element={<OrderSuccess />} />
                  <Route path="payment/:orderId" element={<PaymentPage />} />
                  <Route path="auth" element={<Auth />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                  <Route path="update-password" element={<UpdatePassword />} />
                  <Route path="favorites" element={<Favorites />} />
                  <Route path="about" element={<About />} />
                  <Route path="contacts" element={<Contacts />} />
                  <Route path="faq" element={<FAQ />} />
                  <Route path="delivery" element={<Delivery />} />
                  <Route path="returns" element={<Returns />} />
                  <Route path="autumn-care" element={<AutumnCare />} />
                  <Route path="skincare-regimen" element={<SkincareRegimen />} />
                  <Route path="privacy" element={<Privacy />} />
                  <Route path="terms" element={<Terms />} />

                  {/* Protected Routes */}
                  <Route
                    path="account"
                    element={
                      <ProtectedRoute>
                        <Account />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </HelmetProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;