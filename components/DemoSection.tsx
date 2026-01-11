import React, { useState } from 'react';
import { analyzeCommentWithLambda } from '../services/lambdaService';
import { ModerationResult, CommentRiskLevel, PolicyType } from '../types';
import { ShieldAlert, ShieldCheck, ShieldBan, Wand2, Loader2, Send, CheckSquare, Square, AlertTriangle, Target, HelpCircle } from 'lucide-react';

const DemoSection: React.FC = () => {
  const [comment, setComment] = useState("");
  const [selectedPolicies, setSelectedPolicies] = useState<PolicyType[]>([]);
  const [result, setResult] = useState<ModerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(75); // Default: Aggressive

  const availablePolicies: PolicyType[] = [
    'Profanity', 
    'Sexual Content', 
    'Hate speech', 
    'Self harm', 
    'Violence', 
    'Negativity', 
    'Harassment', 
    'Spam'
  ];

  const togglePolicy = (policy: PolicyType) => {
    if (selectedPolicies.includes(policy)) {
      setSelectedPolicies(selectedPolicies.filter(p => p !== policy));
    } else {
      setSelectedPolicies([...selectedPolicies, policy]);
    }
  };

  const checkRateLimit = (): boolean => {
    // Developer bypass: set localStorage item to skip rate limiting
    const isDeveloperMode = localStorage.getItem('shieldgram_dev_mode') === 'true';
    if (isDeveloperMode) {
      return true; // Skip all rate limit checks
    }

    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    
    // 1. Check if user is currently blocked
    const blockedUntil = localStorage.getItem('shieldgram_blocked_until');
    if (blockedUntil) {
      const blockTime = parseInt(blockedUntil, 10);
      if (now < blockTime) {
        const minutesLeft = Math.ceil((blockTime - now) / 60000);
        setLimitError(`Playground limit exceeded. Please try again in ${minutesLeft} minutes.`);
        return false;
      } else {
        // Block expired, clear it
        localStorage.removeItem('shieldgram_blocked_until');
        localStorage.removeItem('shieldgram_demo_usage');
      }
    }

    // 2. Check usage count
    const usageStr = localStorage.getItem('shieldgram_demo_usage');
    let usage = usageStr ? JSON.parse(usageStr) : { count: 0, startTime: now };

    // If the 1-hour window from the first request has passed, reset
    if (now - usage.startTime > ONE_HOUR) {
      usage = { count: 0, startTime: now };
    }

    if (usage.count >= 10) {
      // Set block for 1 hour from the start time (or simply 1 hour from now for simplicity)
      const blockTime = now + ONE_HOUR;
      localStorage.setItem('shieldgram_blocked_until', blockTime.toString());
      setLimitError("You have reached the limit of 10 playground requests per hour.");
      return false;
    }

    // Update usage (increment happens only if we proceed, so we don't save yet, just return true)
    return true;
  };

  const incrementUsage = () => {
    const now = Date.now();
    const usageStr = localStorage.getItem('shieldgram_demo_usage');
    let usage = usageStr ? JSON.parse(usageStr) : { count: 0, startTime: now };
    
    // Safety check for reset
    if (now - usage.startTime > 60 * 60 * 1000) {
        usage = { count: 0, startTime: now };
    }

    usage.count += 1;
    localStorage.setItem('shieldgram_demo_usage', JSON.stringify(usage));
  };

  const handleAnalyze = async () => {
    if (!comment.trim()) return;

    // Reset previous errors
    setError(null);
    setLimitError(null);

    // Check rate limit
    if (!checkRateLimit()) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    // If no policies selected, mark as safe immediately without calling AI
    if (selectedPolicies.length === 0) {
      setTimeout(() => {
        setResult({
          riskLevel: CommentRiskLevel.SAFE,
          confidenceScore: 100,
          explanation: "No security policies are active. The comment is marked as safe by default.",
          suggestedAction: "APPROVE"
        });
        setIsLoading(false);
      }, 500);
      return;
    }

    const policiesToUse: PolicyType[] = selectedPolicies;

    try {
      const data = await analyzeCommentWithLambda(comment, policiesToUse);
      incrementUsage(); // Increment count on success
      
      // Apply confidence threshold filter
      if (data.riskLevel !== CommentRiskLevel.SAFE && data.confidenceScore < confidenceThreshold) {
        // Below threshold - mark as safe
        setResult({
          riskLevel: CommentRiskLevel.SAFE,
          confidenceScore: data.confidenceScore,
          explanation: `Detected ${data.riskLevel} with ${data.confidenceScore}% confidence, but below ${confidenceThreshold}% threshold.`,
          suggestedAction: 'APPROVE'
        });
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Failed to analyze comment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: CommentRiskLevel) => {
    switch (level) {
      case CommentRiskLevel.SAFE: return "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400";
      case CommentRiskLevel.SPAM: return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400";
      case CommentRiskLevel.TOXIC: return "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
      case CommentRiskLevel.INAPPROPRIATE: return "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400";
      case CommentRiskLevel.HATE_SPEECH: return "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400";
      case CommentRiskLevel.SEXUAL: return "text-pink-600 bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-400";
      case CommentRiskLevel.RACISM: return "text-red-800 bg-red-100 border-red-300 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400";
      case CommentRiskLevel.HARASSMENT: return "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400";
      case CommentRiskLevel.VIOLENCE: return "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400";
      case CommentRiskLevel.SELF_HARM: return "text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800 dark:text-teal-400";
      case CommentRiskLevel.PROFANITY: return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400";
      case CommentRiskLevel.NEGATIVITY: return "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800 dark:text-slate-400";
      default: return "text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const getRiskIcon = (level: CommentRiskLevel) => {
    switch (level) {
      case CommentRiskLevel.SAFE: return <ShieldCheck className="w-5 h-5" />;
      case CommentRiskLevel.SPAM: return <ShieldAlert className="w-5 h-5" />;
      default: return <ShieldBan className="w-5 h-5" />;
    }
  };

  const presetComments = [
    "OMG this looks amazing! 😍 Can't wait to try it.",
    "Click the link in my bio for free iPhone 📱💸!!",
    "You are so ugly, delete your account 🤮",
  ];

  return (
    <section id="playground" className="py-24 bg-white dark:bg-slate-950 relative transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl mb-4">AI Playground</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Experiment with our AI moderation engine live. Select policies and type a comment to see how it's classified.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row transition-colors duration-300">
          
          {/* Left: Interactive Input */}
          <div className="flex-1 p-8 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800">
            
            {/* Policy Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Active Policies</label>
              <div className="flex flex-wrap gap-2">
                {availablePolicies.map((policy) => {
                  const isActive = selectedPolicies.includes(policy);
                  return (
                    <button
                      key={policy}
                      onClick={() => togglePolicy(policy)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                        isActive 
                          ? 'bg-brand-100 text-brand-700 border-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:border-brand-700' 
                          : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-700'
                      }`}
                    >
                      {isActive ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      {policy}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Sensitivity Threshold */}
            <div className="mb-6 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Sensitivity</label>
                <div className="group relative">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-brand-500 transition-colors cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 leading-relaxed">
                    • <span className="text-brand-300 font-bold">Aggressive:</span> Flags more comments (75%+ confidence)
                    <br/>
                    • <span className="text-brand-300 font-bold">Balanced:</span> Moderate filtering (90%+ confidence)
                    <br/>
                    • <span className="text-brand-300 font-bold">Strict:</span> Only obvious violations (99%+ confidence)
                  </div>
                </div>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                {[
                  { label: 'Aggressive', value: 75 },
                  { label: 'Balanced', value: 90 },
                  { label: 'Strict', value: 99 }
                ].map((option) => {
                  const isActive = (
                    option.value === 75 && confidenceThreshold < 90
                  ) || (
                    option.value === 90 && confidenceThreshold >= 90 && confidenceThreshold < 99
                  ) || (
                    option.value === 99 && confidenceThreshold >= 99
                  );
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => setConfidenceThreshold(option.value)}
                      className={`
                        flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all
                        ${isActive 
                          ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Simulate an Instagram Comment</label>
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Type a comment here..."
                  className="w-full h-40 p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none shadow-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                />
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || !comment.trim()}
                  className="absolute bottom-4 right-4 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white p-2 rounded-lg shadow-sm transition-all"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Try Presets</p>
              <div className="flex flex-wrap gap-2">
                {presetComments.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => setComment(c)}
                    className="text-sm px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate max-w-xs text-left"
                  >
                    "{c}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: AI Analysis Result */}
          <div className="flex-1 p-8 bg-white dark:bg-slate-900 flex flex-col justify-center">
            
            {/* Rate Limit Error Message */}
            {limitError && (
               <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm border border-red-100 dark:border-red-900/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Access Limit Reached</p>
                    <p className="mt-1 opacity-90">{limitError}</p>
                  </div>
               </div>
            )}

            {!result && !isLoading && !error && !limitError && (
              <div className="text-center text-slate-400 dark:text-slate-600 py-12">
                <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Enter a comment to see the AI analysis</p>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                 <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
                 <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Analyzing sentiment and context...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm text-center border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}

            {result && !isLoading && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Classification Result</span>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500">AI Safety Model v3</span>
                </div>

                <div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getRiskColor(result.riskLevel)} mb-4`}>
                    {getRiskIcon(result.riskLevel)}
                    <span className="font-bold">{result.riskLevel}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confidence</span>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex-grow h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${result.riskLevel === CommentRiskLevel.SAFE ? 'bg-green-500' : 'bg-brand-500'}`} 
                            style={{ width: `${result.confidenceScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{result.confidenceScore}%</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Reasoning</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                        {result.explanation}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                       <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recommended Action</span>
                       <span className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                         {result.suggestedAction}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;