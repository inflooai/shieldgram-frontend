import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import DemoSection from './components/DemoSection';
import Pricing from './components/Pricing';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import AuthPage from './components/AuthPage';

type ViewState = 'landing' | 'dashboard' | 'auth';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
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

  // Check for login status on mount
  useEffect(() => {
    const token = localStorage.getItem('user-token');
    if (token) {
      setCurrentView('dashboard');
    }
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

  // Helper to handle protected routes
  const handleProtectedNavigation = (targetView: ViewState) => {
    const token = localStorage.getItem('user-token');
    
    // If user is already logged in, go to dashboard regardless of target if target was auth-related
    if (token) {
        if (targetView === 'auth') {
            setCurrentView('dashboard');
        } else {
            setCurrentView('dashboard'); // Redirect to dashboard if logged in, unless explicit logout happens elsewhere
        }
        return;
    }

    // If no token and target is protected (dashboard), redirect to auth
    if (targetView === 'dashboard') {
        setCurrentView('auth');
        return;
    }

    // Otherwise navigate normally
    setCurrentView(targetView);
  };

  const handleLoginSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('user-token');
    setCurrentView('landing');
  };

  if (currentView === 'auth') {
    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
             <AuthPage 
                onLoginSuccess={handleLoginSuccess} 
                onCancel={() => setCurrentView('landing')} 
             />
        </div>
    );
  }

  // Dashboard Isolated View - No Navbar or Footer from Landing Page
  if (currentView === 'dashboard') {
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

  // Landing Page View
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
      <Navbar 
        onNavigate={handleProtectedNavigation} 
        currentView={currentView} 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
      />
      <main className="flex-grow">
        <Hero onNavigate={handleProtectedNavigation} />
        <DemoSection />
        <Features />
        <Pricing onNavigate={handleProtectedNavigation} />
      </main>
      <Footer />
    </div>
  );
};

export default App;