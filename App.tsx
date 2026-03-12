
import * as React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import ContactPage from './pages/ContactPage';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminRegrouting from './pages/AdminRegrouting';
import AdminTeleQuote from './pages/AdminTeleQuote';
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
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';

const App: React.FC = () => {
  return (
    <AuthProvider>
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
          </Routes>
        </Layout>
        <FloatingBackButton />
        <ChatWidget />
      </Router>
    </AuthProvider>
  );
};

export default App;