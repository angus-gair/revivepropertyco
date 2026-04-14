/**
 * Customer Portal Navigation Component
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings } from 'lucide-react';

interface CustomerNavProps {
  variant: 'desktop' | 'mobile';
  onNavigate: (path: string) => void;
}

const CustomerNav: React.FC<CustomerNavProps> = ({ variant, onNavigate }) => {
  const location = useLocation();

  const navItems = [
    {
      path: '/customer/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview and activity'
    },
    {
      path: '/customer/documents',
      label: 'Documents',
      icon: FileText,
      description: 'Upload and manage files'
    },
    {
      path: '/customer/quotes',
      label: 'Quotes',
      icon: FileText,
      description: 'View and approve quotes'
    },
    {
      path: '/customer/profile',
      label: 'Profile',
      icon: Settings,
      description: 'Account settings'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  if (variant === 'desktop') {
    return (
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`px-3 md:px-4 py-2 font-display text-[0.55rem] md:text-xs font-bold tracking-widest transition-all flex items-center gap-2 ${
                active
                  ? 'bg-black text-white'
                  : 'text-neutral-400 hover:text-black hover:bg-surface-low'
              }`}
              title={item.description}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{item.label.toUpperCase()}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Mobile variant
  return (
    <nav className="flex flex-col space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);

        return (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`w-full px-4 py-3 font-display text-sm font-bold tracking-wider transition-all flex items-center gap-3 border ${
              active
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-400 border-neutral-200 hover:border-black hover:text-black'
            }`}
          >
            <Icon size={18} />
            <div className="text-left">
              <div>{item.label.toUpperCase()}</div>
              <div className="text-[0.6rem] font-normal tracking-wide opacity-70">
                {item.description}
              </div>
            </div>
          </button>
        );
      })}
    </nav>
  );
};

export default CustomerNav;
