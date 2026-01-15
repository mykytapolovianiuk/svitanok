import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';
import CartDrawer from './components/cart/CartDrawer';
import AnalyticsProvider from './components/marketing/AnalyticsProvider';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';
import AuthProvider from './components/auth/AuthProvider';

// Direct imports for all pages
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductPage from './pages/ProductPage';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import PaymentPage from './pages/PaymentPage';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Auth from './pages/Auth';
import Account from './pages/Account';
import Favorites from './pages/Favorites';
import Admin from './pages/Admin';
import About from './pages/About';
import Contacts from './pages/Contacts';
import FAQ from './pages/FAQ';
import Delivery from './pages/Delivery';
import Returns from './pages/Returns';
import AutumnCare from './pages/AutumnCare';
import SkincareRegimen from './pages/SkincareRegimen';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import AdminOrders from './pages/admin/Orders';
import AdminProducts from './pages/admin/Products';
import AdminPromoCodes from './pages/admin/PromoCodes';
import AdminReviews from './pages/admin/Reviews';
import AdminCustomers from './pages/admin/Customers';
import AdminSettings from './pages/admin/Settings';
import Bestsellers from './pages/admin/Bestsellers';

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
            <AnalyticsProvider />
            <ScrollToTop />
            <CartDrawer />
            <Toaster position="top-right" />
            <Routes>
            {/* Checkout route without header/footer */}
            <Route path="/checkout" element={
              <CheckoutLayout>
                <Checkout />
              </CheckoutLayout>
            } />
            
            {/* Temporary test route */}
            <Route path="/ukrposhta-test" element={
              <CheckoutLayout>
                {React.createElement(() => {
                  const UkrposhtaTest = React.lazy(() => import('./test/UkrposhtaTest'));
                  return (
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <UkrposhtaTest />
                    </React.Suspense>
                  );
                })}
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
              <Route path="checkout/success" element={<CheckoutSuccess />} />
              <Route path="auth" element={<Auth />} />
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
          </HelmetProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;