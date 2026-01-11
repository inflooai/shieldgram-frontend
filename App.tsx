import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import DemoSection from './components/DemoSection';
import Pricing from './components/Pricing';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import AuthPage from './components/AuthPage';
import LegalModal from './components/LegalModal';
import { removeAuthToken, getThemeCookie, setThemeCookie } from './utils/auth';
import { getValidToken } from './services/dashboardService';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = getThemeCookie() || localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
    }
    return false;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isRedirecting, setIsRedirecting] = useState(false);

  // Determine if we are on the 'dashboard' subdomain
  const isDashboardSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('dashboard.');

  // Check for login status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getValidToken();
        setIsLoggedIn(true);
      } catch (err) {
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Sync state with hash changes for routing
  const [, setHash] = useState(typeof window !== 'undefined' ? window.location.hash : '');
  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    setThemeCookie(theme);
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Construct URL for the dashboard subdomain
  const getDashboardUrl = () => {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    
    // If we are already on dashboard (shouldn't happen given logic below, but safety first)
    if (host.startsWith('dashboard.')) return `${protocol}//${host}${port}`;
    
    // Replace 'www.' if it exists, otherwise just prepend 'dashboard.'
    const rootDomain = host.replace(/^www\./, '');
    return `${protocol}//dashboard.${rootDomain}${port}`;
  };

  // Construct URL for the landing page (root)
  const getLandingUrl = () => {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    
    // Remove dashboard subdomain
    const rootDomain = host.replace(/^dashboard\./, '');
    return `${protocol}//${rootDomain}${port}`;
  };

  const handleNavigateToDashboard = () => {
    // If we are on landing, go to dashboard subdomain
    if (!isDashboardSubdomain) {
      window.location.href = getDashboardUrl();
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    // Reload to ensure state is clean or if we need to redirect within dashboard
    window.location.reload();
  };

  const handleLogout = () => {
    removeAuthToken();
    setIsLoggedIn(false);
    // If on dashboard, logout might show auth page or redirect to landing
    // Usually standard to redirect to landing or show auth
    if (isDashboardSubdomain) {
       setIsRedirecting(true);
       window.location.href = getLandingUrl();
    }
  };

  if (isLoading || isRedirecting) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"></div>; // Prevent flash
  }

  // ==========================================
  // LEGAL ROUTES (Simple Hash Handling)
  // ==========================================
  const currentHash = typeof window !== 'undefined' ? window.location.hash.toLowerCase() : '';
  
  if (currentHash === '#/privacy' || currentHash === '#/privacy-policy') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-white dark:bg-slate-950`}>
        <LegalModal 
          title="Privacy Policy" 
          contentPath="/privacy.txt" 
          onClose={() => window.location.hash = ''} 
        />
      </div>
    );
  }

  if (currentHash === '#/terms' || currentHash === '#/terms-of-service' || currentHash === '#/tos') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-white dark:bg-slate-950`}>
        <LegalModal 
          title="Terms of Service" 
          contentPath="/tos.txt" 
          onClose={() => window.location.hash = ''} 
        />
      </div>
    );
  }

  // ==========================================
  // DASHBOARD SUBDOMAIN RENDER
  // ==========================================
  if (isDashboardSubdomain) {
    if (!isLoggedIn) {
      return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
           <AuthPage 
              onLoginSuccess={handleLoginSuccess} 
              onCancel={() => window.location.href = getLandingUrl()} 
           />
        </div>
      );
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
            <Dashboard 
                onLogout={handleLogout}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
            />
        </div>
    );
  }

  // ==========================================
  // LANDING PAGE (ROOT) RENDER
  // ==========================================
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
      <Navbar 
        onNavigateDashboard={handleNavigateToDashboard}
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme}
        isLoggedIn={isLoggedIn} // Pass this so Navbar can show "Dashboard" vs "Login"
        onLogout={handleLogout}
      />
      <main className="flex-grow">
        <Hero onNavigateDashboard={handleNavigateToDashboard} />
        <DemoSection />
        <Features />
        <Pricing onNavigateDashboard={handleNavigateToDashboard} />
      </main>
      <Footer />
    </div>
  );
};

export default App;