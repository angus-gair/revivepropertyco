
import React from 'react';
import { Home, Calendar, Users, MessageSquare, Menu, X, LayoutDashboard, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Book Online', path: '/book', icon: Calendar },
    { name: 'Contact', path: '/contact', icon: MessageSquare },
    { name: 'Admin CRM', path: '/admin', icon: LayoutDashboard },
    { name: 'Internal Strategy', path: '/admin/regrouting', icon: BookOpen },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Increased border contrast here (slate-300) */}
      <nav className="bg-white border-b border-slate-300 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <div className="h-7 w-7 bg-[#36453B] rounded-sm flex items-center justify-center mr-2 shadow-lg shadow-[#36453B]/20">
                  <span className="text-white font-black text-sm">R</span>
                </div>
                <span className="font-black text-lg text-[#121212] tracking-tighter uppercase">Revive</span>
              </Link>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`inline-flex items-center px-1 pt-1 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'text-[#36453B]'
                      : 'text-slate-400 hover:text-[#121212]'
                  }`}
                >
                  <link.icon className={`w-3.5 h-3.5 mr-2 ${isActive(link.path) ? 'text-[#36453B]' : 'text-slate-300'}`} />
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200">
            <div className="pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive(link.path)
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center">
                    <link.icon className="w-5 h-5 mr-3" />
                    {link.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Revive Property Co.</h3>
            <p className="text-sm leading-6 text-slate-400">
              Professional property maintenance services. We bring your property back to life.
            </p>
          </div>
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/pressure-washing" className="hover:text-white transition-colors">Pressure Washing</Link></li>
              <li><Link to="/regrouting" className="hover:text-white transition-colors">Re-grouting</Link></li>
              <li><Link to="/garden-maintenance" className="hover:text-white transition-colors">Garden Maintenance</Link></li>
              <li><Link to="/pool-maintenance" className="hover:text-white transition-colors">Pool Maintenance</Link></li>
              <li><Link to="/rubbish-removal" className="hover:text-white transition-colors">Rubbish Removal</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Serving the local area</li>
              <li>support@reviveproperty.co</li>
              <li>(555) 123-4567</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Revive Property Co. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
