
import React from 'react';
import { Home, Calendar, LayoutDashboard, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { ThemedSocials } from './ThemedSocials';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Services', path: '/', icon: Home },
    { name: 'Book Inspection', path: '/book', icon: Calendar },
    { name: 'Contact', path: '/contact' },
    { name: 'Admin', path: '/admin', icon: LayoutDashboard },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCFB] text-[#121212] font-sans selection:bg-[#36453B] selection:text-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-20 lg:h-24">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-5 group">
                <BrandLogo variant="dark" className="h-10 w-10" />
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tighter leading-none uppercase">Revive</span>
                  <span className="text-[10px] font-black tracking-[0.4em] uppercase text-[#36453B]">Property Co.</span>
                </div>
              </Link>
            </div>
            
            <div className="hidden md:flex md:items-center md:space-x-12">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-[10px] font-black uppercase tracking-[0.5em] transition-all duration-300 py-1 border-b-2 ${
                    isActive(link.path)
                      ? 'border-[#36453B] text-[#121212]'
                      : 'border-transparent text-slate-400 hover:text-[#121212] hover:border-slate-200'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-[#121212]"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-10 space-y-8 animate-in fade-in slide-in-from-top-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block text-[11px] font-black uppercase tracking-[0.4em] transition-colors ${
                  isActive(link.path) ? 'text-[#36453B]' : 'text-slate-400'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#121212] text-white pt-24 pb-12 border-t-[12px] border-[#36453B]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-24">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-6 mb-10">
                <BrandLogo variant="light" className="h-12 w-12" />
                <h3 className="text-3xl font-black uppercase tracking-[0.2em] leading-none">Revive <br /><span className="text-slate-500">Property Co.</span></h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-500 max-w-sm font-medium italic mb-10">
                "Technical trade specialists serving the Eastern Suburbs corridor since inception."
              </p>
              <ThemedSocials />
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.6em] text-[#36453B] mb-10">Technical Lines</h4>
              <ul className="space-y-6 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">
                <li><Link to="/pressure-washing" className="hover:text-white transition-colors">Pressure Restoration</Link></li>
                <li><Link to="/regrouting" className="hover:text-white transition-colors">Epoxy Systems</Link></li>
                <li><Link to="/garden-maintenance" className="hover:text-white transition-colors">Estate Maintenance</Link></li>
                <li><Link to="/pool-maintenance" className="hover:text-white transition-colors">Pool Hydraulics</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.6em] text-[#36453B] mb-10">Communications</h4>
              <ul className="space-y-6 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">
                <li className="flex items-center gap-4">02 8201 3710</li>
                <li className="flex items-center gap-4">angus@gair.com.au</li>
                <li className="text-slate-600 mt-10">Randwick Base Matrix</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.5em]">
              &copy; {new Date().getFullYear()} Revive Property Co. Eastern Suburbs.
            </p>
            <div className="flex gap-10 text-[9px] font-black uppercase tracking-[0.5em] text-slate-600">
              <Link to="/admin" className="hover:text-white transition-colors">Internal Matrix</Link>
              <span className="opacity-10">|</span>
              <span>ISO 9001 Standard Compliance</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
