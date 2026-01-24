'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import DemoSection from '@/components/DemoSection';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';
import LegalModal from '@/components/LegalModal';
import { getThemeCookie, setThemeCookie, removeAuthToken } from '@/utils/auth';
import { getValidToken, getPlans } from '@/services/dashboardService';

export default function LandingPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [razorpayPlans, setRazorpayPlans] = useState<any[]>([]);
  const [publicCurrency, setPublicCurrency] = useState<'USD' | 'INR'>('USD');
  const [modalPath, setModalPath] = useState<string | null>(null);

  // Initialize Theme
  useEffect(() => {
    // Check local storage or cookie
    const savedTheme = typeof window !== 'undefined' ? (getThemeCookie() || localStorage.getItem('theme')) : null;
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Theme Toggle
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

  // Auth Check
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

  // Load Data
  useEffect(() => {
    const loadLandingData = async () => {
        // 1. Detect Location
        let detected: 'USD' | 'INR' = 'USD';
        try {
            const res = await fetch('https://ipapi.co/json/');
            if (res.status === 429) throw new Error('429');
            const data = await res.json();
            detected = data.country_code === 'IN' ? 'INR' : 'USD';
        } catch (e) {
            try {
                const res = await fetch('http://ip-api.com/json/');
                const data = await res.json();
                detected = data.countryCode === 'IN' ? 'INR' : 'USD';
            } catch (e2) {
                console.error("Location detection failed, defaulting to USD");
                detected = 'USD';
            }
        }
        setPublicCurrency(detected);

        // 2. Fetch Plans
        try {
            const plans = await getPlans(detected); // Use detected value directly
            setRazorpayPlans(plans);
        } catch (err) {
            console.error("Error fetching plans:", err);
        }
    };
    loadLandingData();
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    setIsLoggedIn(false);
    // Reload/Redirect handled by state or user action
    window.location.reload();
  };

  const handleNavigateToDashboard = () => {
    // Check if we are already logged in via state or cookie to decide flow?
    // Actually, simple link to dashboard is fine, it handles the rest.
    window.location.href = '/dashboard';
  };

  // Legal Modals (Simulating hash routing for compat, or we can use real routes later)
  // For now, let's keep it simple. If we want to use /privacy route, we should link to it.
  // But component expects modal.
  // Let's implement modal logic if hash is present, for compatibility.
  useEffect(() => {
      const handleHash = () => {
          const hash = window.location.hash;
          if (hash === '#/privacy' || hash === '#/privacy-policy') setModalPath('/privacy.txt');
          else if (hash === '#/terms' || hash === '#/tos') setModalPath('/tos.txt');
          else if (hash === '#/faq') setModalPath('/faq.txt');
          else setModalPath(null);
      };
      window.addEventListener('hashchange', handleHash);
      handleHash(); // Initial check
      return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (modalPath) {
     return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-white dark:bg-slate-950`}>
          <LegalModal 
            title={modalPath.includes('privacy') ? "Privacy Policy" : modalPath.includes('faq') ? "Frequently Asked Questions" : "Terms of Service"} 
            contentPath={modalPath} 
            onClose={() => { window.location.hash = ''; setModalPath(null); }} 
          />
        </div>
      );
  }

  // Prevent hydration mismatch (optional, but good if theme is undetermined)
  // But we want SEO content visible.
  
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
      <Navbar 
        onNavigateDashboard={handleNavigateToDashboard}
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />
      <main className="flex-grow">
        <Hero onNavigateDashboard={handleNavigateToDashboard} />
        <DemoSection />
        <Features />
        <Pricing 
          onNavigateDashboard={handleNavigateToDashboard} 
          currency={publicCurrency} 
          razorpayPlans={razorpayPlans}
        />
      </main>
      <Footer />
    </div>
  );
}
