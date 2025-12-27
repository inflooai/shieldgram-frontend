import React, { useState } from 'react';
import { Shield, Menu, X, LayoutDashboard, Sun, Moon, LogOut } from 'lucide-react';

interface NavbarProps {
  onNavigateDashboard: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigateDashboard, isDarkMode, toggleTheme, isLoggedIn, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    setIsMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="bg-brand-600 p-1.5 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">ShieldGram</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection('features')} className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors">Features</button>
            <button onClick={() => scrollToSection('demo')} className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors">Live Demo</button>
            <button onClick={() => scrollToSection('pricing')} className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors">Pricing</button>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isLoggedIn ? (
               <div className="flex items-center gap-4">
                 <button 
                  onClick={onNavigateDashboard}
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
                 >
                   <LayoutDashboard className="w-4 h-4" />
                   Dashboard
                 </button>
                 <button 
                   onClick={onLogout}
                   className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-5 py-2 rounded-full font-medium transition-all text-sm"
                 >
                   Sign Out
                 </button>
               </div>
            ) : (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={onNavigateDashboard}
                    className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={onNavigateDashboard}
                    className="bg-brand-600 hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500 text-white px-5 py-2 rounded-full font-medium transition-all shadow-sm hover:shadow-md"
                  >
                    Get Started
                  </button>
                </div>
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
            <button onClick={() => scrollToSection('features')} className="block w-full text-left px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md">Features</button>
            <button onClick={() => scrollToSection('demo')} className="block w-full text-left px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md">Live Demo</button>
            <button onClick={() => scrollToSection('pricing')} className="block w-full text-left px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md">Pricing</button>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
              {isLoggedIn ? (
                 <>
                   <button onClick={onNavigateDashboard} className="block w-full text-left px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md mb-2">
                      <div className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Go to Dashboard</div>
                   </button>
                   <button 
                    onClick={onLogout}
                    className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white px-5 py-3 rounded-lg font-medium shadow-sm"
                   >
                     Sign Out
                   </button>
                 </>
              ) : (
                <>
                  <button onClick={onNavigateDashboard} className="block w-full text-left px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md mb-2">Log In</button>
                  <button 
                    onClick={onNavigateDashboard}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-lg font-medium shadow-sm"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;