import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import DemoSection from './components/DemoSection';
import Pricing from './components/Pricing';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import AuthPage from './components/AuthPage';
import { getAuthToken, removeAuthToken } from './utils/auth';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
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
    const token = getAuthToken();
    setIsLoggedIn(!!token);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
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