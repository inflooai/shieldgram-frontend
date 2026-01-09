import React, { useState } from 'react';
import { Shield, Twitter, Instagram, Linkedin } from 'lucide-react';
import LegalModal from './LegalModal';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-brand-500" />
              <span className="font-bold text-xl text-white">ShieldGram</span>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              AI-powered protection for your social community. Build a safer internet with us.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-brand-400 transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-brand-400 transition-colors">Pricing</a></li>
              <li><a href="mailto:support@shieldgram.com" className="hover:text-brand-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/privacy" className="hover:text-brand-400 transition-colors text-left w-full">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-brand-400 transition-colors text-left w-full">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} ShieldGram Inc. All rights reserved.
        </div>
      </div>

    </footer>
  );
};

export default Footer;