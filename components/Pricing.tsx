import React from 'react';
import { Check, Users, Shield } from 'lucide-react';

interface PricingProps {
  onNavigateDashboard: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onNavigateDashboard }) => {
  
  const handlePlanClick = () => {
      onNavigateDashboard();
  };

  return (
    <section id="pricing" className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl mb-4">Simple, transparent pricing</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Start with a <span className="font-semibold text-brand-600 dark:text-brand-400">1-month free trial</span>. No credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Standard Plan */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-brand-300 dark:hover:border-brand-700 transition-colors flex flex-col bg-white dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Standard</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">For aspiring creators</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">$5</span>
              <span className="text-slate-500 dark:text-slate-400">/mo</span>
            </div>
            <ul className="mt-6 space-y-4 flex-1">
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> <strong>5k</strong> comments / mo
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <Users className="w-5 h-5 text-brand-500 dark:text-brand-400 flex-shrink-0" /> <strong>1</strong> social account
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Standard Spam Protection
              </li>
            </ul>
            <button 
              onClick={handlePlanClick}
              className="mt-8 w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              Get Standard
            </button>
          </div>

          {/* Plus Plan */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-brand-300 dark:hover:border-brand-700 transition-colors flex flex-col bg-white dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Plus</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">For growing influencers</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">$15</span>
              <span className="text-slate-500 dark:text-slate-400">/mo</span>
            </div>
            <ul className="mt-6 space-y-4 flex-1">
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" /> <strong>20k</strong> comments / mo
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <Users className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" /> <strong>2</strong> social accounts
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" /> Standard Spam Protection
              </li>
            </ul>
            <button 
              onClick={handlePlanClick}
              className="mt-8 w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              Get Plus
            </button>
          </div>

          {/* Premium Plan */}
          <div className="rounded-2xl border-2 border-brand-600 dark:border-brand-500 p-6 shadow-xl relative bg-white dark:bg-slate-900 flex flex-col">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-600 dark:bg-brand-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
               Most Popular
             </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Premium</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">For agencies & brands</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">$30</span>
              <span className="text-slate-500 dark:text-slate-400">/mo</span>
            </div>
            <ul className="mt-6 space-y-4 flex-1">
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> <strong>50k</strong> comments / mo
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <Users className="w-5 h-5 text-brand-500 dark:text-brand-400 flex-shrink-0" /> <strong>5</strong> social accounts
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <Shield className="w-5 h-5 text-brand-500 dark:text-brand-400 flex-shrink-0" /> Multi-model AI inference
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Custom Moderation Policies
              </li>
            </ul>
            <button 
              onClick={handlePlanClick}
              className="mt-8 w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 dark:hover:bg-brand-500 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              Start Free Trial
            </button>
          </div>

          {/* Max Plan */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-brand-300 dark:hover:border-brand-700 transition-colors flex flex-col bg-white dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Max</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">For large scale needs</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">$75</span>
              <span className="text-slate-500 dark:text-slate-400">/mo</span>
            </div>
            <ul className="mt-6 space-y-4 flex-1">
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> <strong>200k</strong> comments / mo
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <Users className="w-5 h-5 text-brand-500 dark:text-brand-400 flex-shrink-0" /> <strong>Unlimited</strong> accounts
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <Shield className="w-5 h-5 text-brand-500 dark:text-brand-400 flex-shrink-0" /> Multi-model AI inference
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Custom Moderation Policies
              </li>
            </ul>
            <button 
              onClick={handlePlanClick}
              className="mt-8 w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              Get Max
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;