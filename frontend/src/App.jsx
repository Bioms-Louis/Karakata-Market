import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Route Guards
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

// Public Pages
import HomePage from './pages/public/HomePage';
import ProductsPage from './pages/public/ProductsPage';
import ProductDetailPage from './pages/public/ProductDetailPage';


// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Customer Pages
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrdersPage from './pages/customer/OrdersPage';
import OrderDetailPage from './pages/customer/OrderDetailPage';
import ProfilePage from './pages/customer/ProfilePage';
import NotificationsPage from './pages/customer/NotificationsPage';
import PaymentCallbackPage from './pages/customer/PaymentCallbackPage';
import WishlistPage from './pages/customer/WishlistPage';
import FAQPage from './pages/customer/FAQPage';
import ContactPage from './pages/customer/ContactPage';
import RetrunPolicyPage from './pages/customer/ReturnPolicyPage';
import ShippingPolicyPage from './pages/customer/ShippingPolicyPage';
import VendorTermsPage from './pages/customer/VendortermsPage';
import TermsPage from './pages/customer/TermsPage';
import PrivacyPolicyPage from './pages/customer/PrivacyPolicyPage';

// Vendor Pages
import VendorDashboardPage from './pages/vendor/VendorDashboardPage';
import VendorProductsPage from './pages/vendor/VendorProductsPage';
import VendorOrdersPage from './pages/vendor/VendorOrdersPage';
import VendorRegisterPage from './pages/vendor/VendorRegisterPage';
import VendorAddProductPage from './pages/vendor/VendorAddProductPage';
import VendorEditProductPage from './pages/vendor/VendorEditProductPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminVendorsPage from './pages/admin/AdminVendorsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminEditProductPage from './pages/admin/AdminEditProductPage';
import AdminCarouselPage from './pages/admin/AdminCarouselPage';
import ScrollToTop from './components/common/ScrollToTop';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/payment/callback" element={<PaymentCallbackPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/faqs" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/return-policy" element={<RetrunPolicyPage />} />
          <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/vendor-terms" element={<VendorTermsPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />


          {/* Customer routes — must be logged in */}
          <Route path="/cart" element={
            <ProtectedRoute><CartPage /></ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute><CheckoutPage /></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute><OrdersPage /></ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute><OrderDetailPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          
        <Route path="/become-vendor" element={<VendorRegisterPage />} />

        <Route path="/notifications" element={<NotificationsPage />} />

          {/* Vendor registration — any logged-in user */}
          <Route path="/become-vendor" element={
            <ProtectedRoute><VendorRegisterPage /></ProtectedRoute>
          } />
        </Route>

        {/* AUTH ROUTES */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* VENDOR DASHBOARD (sidebar layout) */}
        <Route path="/vendor" element={
          <RoleRoute role="vendor">
            <DashboardLayout role="vendor" />
          </RoleRoute>
        }>
          <Route path="dashboard" element={<VendorDashboardPage />} />
          <Route path="products" element={<VendorProductsPage />} />
          <Route path="products/new" element={<VendorAddProductPage />} />
          <Route path="orders" element={<VendorOrdersPage />} />
          <Route path="products/:id/edit" element={<VendorEditProductPage />} />
        </Route>

        {/* ADMIN DASHBOARD (sidebar layout) */}
        <Route path="/admin" element={
          <RoleRoute role="admin">
            <DashboardLayout role="admin" />
          </RoleRoute>
        }>
          <Route path="dashboard"      element={<AdminDashboardPage />} />
          <Route path="products"       element={<AdminProductsPage />} />
          <Route path="categories"     element={<AdminCategoriesPage />} />
          <Route path="reviews"        element={<AdminReviewsPage />} />
          <Route path="vendors"        element={<AdminVendorsPage />} />
          <Route path="users"          element={<AdminUsersPage />} />
          <Route path="orders"         element={<AdminOrdersPage />} />
          <Route path="notifications"  element={<AdminNotificationsPage />} />
          <Route path="products/:id/edit" element={<AdminEditProductPage />} />
          <Route path="carousel" element={<AdminCarouselPage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;