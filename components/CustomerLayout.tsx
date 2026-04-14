/**
 * Customer Portal Layout Component
 * Provides header, navigation, and footer for customer portal pages
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Menu, X } from 'lucide-react';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import CustomerNav from './CustomerNav';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const { customer, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/customer/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-outline-variant px-4 md:px-12 h-16 md:h-20 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-12">
          <a
            href="/"
            className="font-display font-bold text-sm md:text-xl tracking-tighter cursor-pointer hover:text-neutral-600 transition-colors whitespace-nowrap"
          >
            REVIVE_PROPERTY_CO.
          </a>
          <div className="hidden lg:block font-display text-[0.65rem] tracking-[0.3em] text-neutral-400">
            CUSTOMER_PORTAL_V1.0 // AUTHORIZED_ACCESS
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-2 md:gap-6">
          <CustomerNav variant="desktop" onNavigate={handleNavigation} />
          <div className="w-px h-6 bg-neutral-200"></div>
          <button className="p-1.5 md:p-2 hover:bg-surface-low transition-colors" title="Profile">
            <User size={16} className="md:w-5 md:h-5" />
          </button>
          <button className="p-1.5 md:p-2 hover:bg-surface-low transition-colors" title="Settings">
            <Settings size={16} className="md:w-5 md:h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="bg-black text-white px-3 md:px-6 py-1.5 md:py-2 font-display text-[0.55rem] md:text-xs font-bold tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center"
          >
            <span className="hidden sm:inline">LOGOUT</span>
            <LogOut size={12} className="sm:hidden" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 hover:bg-surface-low transition-colors"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white pt-20 px-4">
          <div className="flex flex-col space-y-4">
            <CustomerNav variant="mobile" onNavigate={handleNavigation} />
            <hr className="border-neutral-200" />
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-low rounded-full flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <div className="font-display text-sm font-bold">
                    {customer?.firstName} {customer?.lastName}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {customer?.email || customer?.mobile}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-black text-white font-display text-xs font-bold tracking-widest"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-outline-variant px-4 md:px-12 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="font-display text-[0.55rem] tracking-[0.2em] text-neutral-400 text-center md:text-left">
              REVIVE_PROPERTY_CO. // CUSTOMER_PORTAL // SECURE_ACCESS
            </div>
            <div className="font-display text-[0.5rem] tracking-[0.15em] text-neutral-300 text-center md:text-right">
              ©{new Date().getFullYear()} REVIVE_PROPERTY_CO. // ALL_RIGHTS_RESERVED
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
