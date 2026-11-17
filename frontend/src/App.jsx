import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";

import HeroBanner from "./components/customer/HeroBanner";
import CategorySection from "./components/customer/CategorySection";
import ProductSection from "./components/customer/ProductSection";
import PromotionalBanner from "./components/customer/PromotionalBanner";


import LoginPage from "./pages/customer/LoginPage";
import RegisterPage from "./pages/customer/RegisterPage";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import OrderConfirmationPage from "./pages/customer/OrderConfirmationPage";
import MyOrdersPage from "./pages/customer/MyOrdersPage";
import OrderDetailsPage from "./pages/customer/OrderDetailsPage";
import ProductDetailsPage from "./pages/customer/ProductDetailsPage";
import ProfilePage from "./pages/customer/ProfilePage";
import AddressPage from "./pages/customer/AddressPage";



import AIAssistantWidget from "./components/customer/AIAssistantWidget";
import AdminInventoryAlertsPage from "./pages/admin/AdminInventoryAlertsPage";

import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/common/AdminRoute";

import GuestRoute from "./components/common/GuestRoute";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminVendorsPage from "./pages/admin/AdminVendorsPage";
import AdminInventoryPage from "./pages/admin/AdminInventoryPage";
import AdminProcurementPage from "./pages/admin/AdminProcurementPage";
import AdminDeliveryPage from "./pages/admin/AdminDeliveryPage";
import DeliveryRoute from "./components/common/DeliveryRoute";
import DeliveryLayout from "./layouts/DeliveryLayout";
import DeliveryDashboardPage from "./pages/delivery/DeliveryDashboardPage";
import MyDeliveriesPage from "./pages/delivery/MyDeliveriesPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminBulkImageUploadPage from "./pages/admin/AdminBulkImageUploadPage";
import AdminBannersPage from "./pages/admin/AdminBannersPage";
import AdminDeliveryStaffPage from "./pages/admin/AdminDeliveryStaffPage";
import AdminDutyMonitoringPage from "./pages/admin/AdminDutyMonitoringPage";


import { useAuth } from "./context/AuthContext";


function HomePage() {
  const { isAuthenticated, isLoadingUser, user, canAccessAdmin } = useAuth();

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (isAuthenticated && canAccessAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (isAuthenticated && user?.role === "DELIVERY") {
    return <Navigate to="/delivery" replace />;
  }

  return (
  <main className="w-full bg-white">
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <HeroBanner />
      <CategorySection />
      <ProductSection />
      <PromotionalBanner />
    </div>
  </main>
);
}

function AppContent() {
  const { pathname } = useLocation();

  const isAdminRoute = pathname.startsWith("/admin");
  const isDeliveryRoute = pathname.startsWith("/delivery");
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Customer Navbar */}
      {!isAdminRoute && !isDeliveryRoute && <Navbar />}

      <div className="flex-1">
        <Routes>
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="vendors" element={<AdminVendorsPage />} />
            <Route path="inventory" element={<AdminInventoryPage />} />
            <Route path="procurement" element={<AdminProcurementPage />} />
            <Route path="delivery" element={<AdminDeliveryPage />} />
            <Route path="delivery-staff" element={<AdminDeliveryStaffPage />} />
            <Route path="duty-monitoring" element={<AdminDutyMonitoringPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="banners" element={<AdminBannersPage />} />
            <Route
              path="inventory-alerts"
              element={<AdminInventoryAlertsPage />}
            />
            <Route
              path="bulk-image-upload"
              element={<AdminBulkImageUploadPage />}
            />
          </Route>
          {/* Delivery Staff Routes */}
          <Route
            path="/delivery"
            element={
              <DeliveryRoute>
                <DeliveryLayout />
              </DeliveryRoute>
            }
          >
            <Route index element={<DeliveryDashboardPage />} />
            <Route path="my-deliveries" element={<MyDeliveriesPage />} />
          </Route>
          {/* Customer Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/addresses"
            element={
              <ProtectedRoute>
                <AddressPage />
              </ProtectedRoute>
            }
          />

          {/* Customer Home */}
          <Route path="/" element={<HomePage />} />

          {/* Product Details */}
          <Route path="/products/:productId" element={<ProductDetailsPage />} />

          {/* Cart */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />

          {/* Checkout */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/order-confirmation"
            element={
              <ProtectedRoute>
                <OrderConfirmationPage />
              </ProtectedRoute>
            }
          />

          {/* Customer Orders */}
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-orders/:orderId"
            element={
              <ProtectedRoute>
                <OrderDetailsPage />
              </ProtectedRoute>
            }
          />

          {/* Authentication */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />

          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
        </Routes>
      </div>

      {/* Customer Footer */}
      {!isAdminRoute && !isDeliveryRoute && <Footer />}

      {/* Floating AI Shopping Assistant */}
      {!isAdminRoute && !isDeliveryRoute && <AIAssistantWidget />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
