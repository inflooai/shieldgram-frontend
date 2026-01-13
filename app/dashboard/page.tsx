'use client';

import React, { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import AuthPage from '@/components/AuthPage';
import { getValidToken, getPlans } from '@/services/dashboardService';
import { removeAuthToken, getThemeCookie, setThemeCookie } from '@/utils/auth';

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize Theme (duplicated logic, should be in context)
  useEffect(() => {
    const savedTheme = typeof window !== 'undefined' ? (getThemeCookie() || localStorage.getItem('theme')) : null;
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      const theme = newMode ? 'dark' : 'light';
      if (newMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', theme);
      setThemeCookie(theme);
  };

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

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    window.location.reload();
  };

  const handleLogout = () => {
    removeAuthToken();
    setIsLoggedIn(false);
    window.location.href = '/'; // Go to landing page
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">Loading...</div>;
  }

  if (!isLoggedIn) {
     return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
           <AuthPage 
              onLoginSuccess={handleLoginSuccess} 
              onCancel={() => window.location.href = '/'} 
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
