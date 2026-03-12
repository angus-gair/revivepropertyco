import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const FloatingBackButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show the back button if we are not on the landing page
  if (location.pathname === '/') return null;

  return (
    <button
      onClick={() => navigate(-1)}
      className="fixed bottom-6 left-6 z-50 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Go back to previous page"
    >
      <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
      <span className="font-semibold hidden sm:inline">Back</span>
    </button>
  );
};

export default FloatingBackButton;