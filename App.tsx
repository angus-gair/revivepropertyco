import * as React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import ContactPage from './pages/ContactPage';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminRegrouting from './pages/AdminRegrouting';
import AdminTeleQuote from './pages/AdminTeleQuote';
import HipagesLeadsNoAuthPage from './pages/admin/HipagesLeadsNoAuthPage';
import ServicePressureWashing from './pages/ServicePressureWashing';
import ServiceGardenMaintenance from './pages/ServiceGardenMaintenance';
import ServicePoolMaintenance from './pages/ServicePoolMaintenance';
import ServiceRubbishRemoval from './pages/ServiceRubbishRemoval';
import ServiceRegrouting from './pages/ServiceRegrouting';
import SuccessPage from './pages/SuccessPage';
import ChatWidget from './components/ChatWidget';
import FloatingBackButton from './components/FloatingBackButton';
import LoginPage from './pages/LoginPage';
import TeleQuoteLobby from './pages/TeleQuoteLobby';
import ReviewPage from './pages/ReviewPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ServiceAreasPage from './pages/ServiceAreasPage';
import ProjectsPage from './pages/ProjectsPage';
import BlogPage from './pages/BlogPage';
// Customer portal imports
import { CustomerAuthProvider } from './contexts/CustomerAuthContext';
import CustomerProtectedRoute from './components/CustomerProtectedRoute';
import CustomerLoginPage from './pages/customer/LoginPage';
import CustomerRegisterPage from './pages/customer/RegisterPage';
import CustomerLayout from './components/CustomerLayout';
import CustomerDashboardPage from './pages/customer/DashboardPage';
import CustomerDocumentsPage from './pages/customer/DocumentsPage';
import CustomerProfilePage from './pages/customer/ProfilePage';
import CustomerQuotesPage from './pages/customer/QuotesPage';
// Platform portal imports
import RegisterPage from './pages/platform/RegisterPage';
import LoginPlatformPage from './pages/platform/LoginPlatformPage';
import PlatformDashboard from './pages/platform/PlatformDashboard';
import PlatformProtectedRoute from './components/PlatformProtectedRoute';
import { TenantAuthProvider } from './contexts/TenantAuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CustomerAuthProvider>
        <TenantAuthProvider>
          <Router>
            <ScrollToTop />
            <Layout>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/pressure-washing" element={<ServicePressureWashing />} />
                <Route path="/garden-maintenance" element={<ServiceGardenMaintenance />} />
                <Route path="/pool-maintenance" element={<ServicePoolMaintenance />} />
                <Route path="/rubbish-removal" element={<ServiceRubbishRemoval />} />
                <Route path="/regrouting" element={<ServiceRegrouting />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/book" element={<BookingPage />} />
                <Route path="/success" element={<SuccessPage />} />
                <Route path="/review" element={<ReviewPage />} />
                <Route path="/service-areas" element={<ServiceAreasPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/session/:id" element={<TeleQuoteLobby />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/regrouting"
                  element={
                    <ProtectedRoute>
                      <AdminRegrouting />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/telequote"
                  element={
                    <ProtectedRoute>
                      <AdminTeleQuote />
                    </ProtectedRoute>
                  }
                />
                <Route path="/contractors/hp-leads" element={<HipagesLeadsNoAuthPage />} />
                {/* Customer Portal Routes */}
                <Route path="/customer/login" element={<CustomerLoginPage />} />
                <Route path="/customer/register" element={<CustomerRegisterPage />} />
                <Route
                  path="/customer/dashboard"
                  element={
                    <CustomerProtectedRoute>
                      <CustomerLayout>
                        <CustomerDashboardPage />
                      </CustomerLayout>
                    </CustomerProtectedRoute>
                  }
                />
                <Route
                  path="/customer/profile"
                  element={
                    <CustomerProtectedRoute>
                      <CustomerLayout>
                        <CustomerProfilePage />
                      </CustomerLayout>
                    </CustomerProtectedRoute>
                  }
                />
                <Route
                  path="/customer/documents"
                  element={
                    <CustomerProtectedRoute>
                      <CustomerLayout>
                        <CustomerDocumentsPage />
                      </CustomerLayout>
                    </CustomerProtectedRoute>
                  }
                />
                <Route
                  path="/customer/quotes"
                  element={
                    <CustomerProtectedRoute>
                      <CustomerLayout>
                        <CustomerQuotesPage />
                      </CustomerLayout>
                    </CustomerProtectedRoute>
                  }
                />
                {/* Platform Routes */}
                <Route path="/platform/register" element={<RegisterPage />} />
                <Route path="/platform/login" element={<LoginPlatformPage />} />
                <Route
                  path="/platform/dashboard"
                  element={
                    <PlatformProtectedRoute>
                      <PlatformDashboard />
                    </PlatformProtectedRoute>
                  }
                />
              </Routes>
            </Layout>
            <FloatingBackButton />
            <ChatWidget />
          </Router>
        </TenantAuthProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  );
};

export default App;
