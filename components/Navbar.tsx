import React, { useState, useEffect } from 'react';
import { Shield, Menu, X, LayoutDashboard, Sun, Moon, LogOut } from 'lucide-react';

interface NavbarProps {
  onNavigate: (view: 'landing' | 'dashboard' | 'auth') => void;
  currentView: 'landing' | 'dashboard' | 'auth';
  isDarkMode: boolean;
  toggleTheme: () => void;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView, isDarkMode, toggleTheme, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('user-token'));
  }, [currentView]); // Re-check on view change

  const handleNavClick = (view: 'landing' | 'dashboard' | 'auth', sectionId?: string) => {
    onNavigate(view);
    setIsMenuOpen(false);
    if (view === 'landing' && sectionId) {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
            onClick={() => handleNavClick('landing')}
          >
            <div className="bg-brand-600 p-1.5 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">ShieldGram</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => handleNavClick('landing', 'features')} className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors">Features</button>
            <button onClick={() => handleNavClick('landing', 'demo')} className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors">Live Demo</button>
            <button onClick={() => handleNavClick('landing', 'pricing')} className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors">Pricing</button>
            
            <button 
              onClick={() => handleNavClick('dashboard')}
              className={`flex items-center gap-2 font-medium transition-colors ${currentView === 'dashboard' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isLoggedIn ? (
               <button 
                 onClick={onLogout}
                 className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-5 py-2 rounded-full font-medium transition-all"
               >
                 <LogOut className="w-4 h-4" />
                 Sign Out
               </button>
            ) : (
                <button 
                  onClick={() => handleNavClick('auth')}
                  className="bg-brand-600 hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500 text-white px-5 py-2 rounded-full font-medium transition-all shadow-sm hover:shadow-md"
                >
                  Get Started
                </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
             <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 absolute w-full shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <button onClick={() => handleNavClick('landing', 'features')} className="block w-full text-left px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md">Features</button>
            <button onClick={() => handleNavClick('landing', 'demo')} className="block w-full text-left px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md">Live Demo</button>
            <button onClick={() => handleNavClick('landing', 'pricing')} className="block w-full text-left px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md">Pricing</button>
            <button onClick={() => handleNavClick('dashboard')} className="block w-full text-left px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md">Dashboard</button>
            <div className="pt-4">
              {isLoggedIn ? (
                 <button 
                  onClick={onLogout}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white px-5 py-3 rounded-lg font-medium shadow-sm"
                 >
                   Sign Out
                 </button>
              ) : (
                <button 
                  onClick={() => handleNavClick('auth')}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-lg font-medium shadow-sm"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;