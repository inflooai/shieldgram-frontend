import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import CommentSlideshow from './CommentSlideshow';
// import SEO from './SEO';

interface HeroProps {
  onNavigateDashboard: () => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigateDashboard }) => {
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ShieldGram",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Cloud",
    "description": "AI-powered Instagram comment moderation tool that auto-hides spam, crypto bots, and toxic comments 24/7.",
    "url": "https://www.shieldgram.com",
    "applicationSubCategory": "Social Media Management",
    "featureList": [
      "AI Instagram Comment Moderation",
      "Auto-Hide Spam Comments",
      "Stop Crypto Bots",
      "24/7 Smart Moderation",
      "Custom AI Policies"
    ],
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free trial available"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "50"
    }
  };

  return (
    <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 pt-16 pb-24 lg:pt-32 lg:pb-40 transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 dark:bg-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200 dark:bg-brand-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-pink-200 dark:bg-pink-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left max-w-2xl lg:max-w-none pl-4 sm:pl-6">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-6 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
               Coming Soon
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-8">
              The Smartest <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600 dark:from-brand-400 dark:to-purple-400">AI Instagram Comment Moderation</span> Tool
            </h1>

            <p className="font-outfit text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-normal">
              Stop crypto bots, harassment, and spam in their tracks. ShieldGram auto-hides toxic comments 24/7 so you can focus on growing your brand.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-16">
              <button 
                onClick={onNavigateDashboard}
                className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white rounded-full font-semibold text-lg hover:bg-brand-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                Standard Free Trial <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={scrollToPricing}
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full font-semibold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
              >
                View Pricing
              </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-6 sm:gap-12 text-sm text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                <span>Setup in 2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                <span>Meta Business Partner</span>
              </div>
            </div>
          </div>

          <div className="relative">
             {/* Slideshow Container */}
             <div className="relative z-10">
               <CommentSlideshow />
             </div>
             
             {/* Decor Elements behind slideshow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/50 dark:bg-slate-800/20 rounded-full filter blur-3xl -z-10 transition-colors duration-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;