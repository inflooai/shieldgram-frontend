import React from 'react';
import { Clock, Lock, Filter, BarChart3, Globe2, Settings } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <Filter className="w-6 h-6 text-brand-600 dark:text-brand-400" />,
      title: "Reasoning-Based Classification",
      description: "Our AI detects nuanced hate speech and threats through logical reasoning, moving beyond simple keyword filters."
    },
    {
      icon: <Lock className="w-6 h-6 text-brand-600 dark:text-brand-400" />,
      title: "Flexible Data Retention",
      description: "We store data for your analytics dashboard by default, but you can enable 'Zero-Retention Mode' for total privacy."
    },
    {
      icon: <Settings className="w-6 h-6 text-brand-600 dark:text-brand-400" />,
      title: "Brand-Specific Policies",
      description: "Fully supported custom policies that moderate even benign-looking comments if they violate your brand voice."
    },
    {
      icon: <Globe2 className="w-6 h-6 text-brand-600 dark:text-brand-400" />,
      title: "Multi-language Support",
      description: "ShieldGram supports 8 core languages including English, Portuguese, Spanish, French, German, Italian, Hindi, and Thai."
    },
    {
      icon: <Clock className="w-6 h-6 text-brand-600 dark:text-brand-400" />,
      title: "Instant Moderation",
      description: "Comments are scanned and moderated with an average response time of under 30 seconds across all plans."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-brand-600 dark:text-brand-400" />,
      title: "Actionable Analytics",
      description: "Track comments scanned, moderation rates, and response times. Review and override any moderation decisions easily."
    }
  ];

  return (
    <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-base font-semibold text-brand-600 dark:text-brand-400 tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Everything you need to moderate at scale
          </p>
          <p className="mt-4 max-w-2xl text-xl text-slate-500 dark:text-slate-400 mx-auto">
            Focus on creating content while we handle the noise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-brand-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;