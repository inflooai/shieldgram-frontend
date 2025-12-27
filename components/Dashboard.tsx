import React, { useState, useEffect } from 'react';
import { 
  BarChart3, ShieldCheck, ShieldAlert, Trash2, CheckCircle, Ban, 
  Shield, LogOut, Sun, Moon, LayoutDashboard, Sliders, Lock, Save, 
  Check, RefreshCw, CreditCard, Download, Zap, ChevronDown, Plus
} from 'lucide-react';
import { ModeratedCommentLog, CommentRiskLevel } from '../types';

interface DashboardProps {
  onLogout?: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

type Tab = 'overview' | 'controls' | 'plan';
type PlanType = 'standard' | 'plus' | 'premium' | 'max';

interface DashboardStats {
  scanned: number;
  moderated: number;
  protectionScore: number;
}

interface UserSettings {
  plan: PlanType;
  policies: {
    spam: boolean;
    hateSpeech: boolean;
    harassment: boolean;
    sexual: boolean;
    violence: boolean;
  };
  customInstructions: string;
}

interface Account {
  id: string;
  name: string;
  handle: string;
}

const MOCK_ACCOUNTS: Account[] = [
  { id: '1', name: 'ShieldGram HQ', handle: '@shieldgram_hq' },
  { id: '2', name: 'Personal Brand', handle: '@alex_creates' }
];

// Plan definitions for the billing tab
const PLANS = {
  standard: { price: 5, label: 'Standard', features: ['10k comments/mo', '1 social account', 'Standard Protection'] },
  plus: { price: 10, label: 'Plus', features: ['25k comments/mo', '5 social accounts', 'Faster Scanning'] },
  premium: { price: 25, label: 'Premium', features: ['100k comments/mo', '10 social accounts', 'Custom Policies'] },
  max: { price: 100, label: 'Max', features: ['Unlimited comments', 'Unlimited accounts', 'Priority Support'] }
};

// Helper to load Razorpay SDK
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const Dashboard: React.FC<DashboardProps> = ({ onLogout, isDarkMode, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // Account State
  const [accounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [currentAccount, setCurrentAccount] = useState<Account>(MOCK_ACCOUNTS[0]);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  
  // Payment State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Data States
  const [stats, setStats] = useState<DashboardStats>({ scanned: 0, moderated: 0, protectionScore: 0 });
  const [activity, setActivity] = useState<ModeratedCommentLog[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    plan: 'standard', // Default start plan
    policies: { spam: true, hateSpeech: true, harassment: false, sexual: false, violence: false },
    customInstructions: ''
  });

  // Load Data (Always Sample Data)
  const loadData = async () => {
    setIsLoading(true);
    // Simulate API latency
    await new Promise(r => setTimeout(r, 600));

    // Sample Data
    setStats({
      scanned: 452890,
      moderated: 12405,
      protectionScore: 98
    });
    setActivity([
      {
        id: '1',
        author: 'spambot_9000',
        text: 'Buy followers cheap! Link in bio!!!',
        riskLevel: CommentRiskLevel.SPAM,
        timestamp: '2 mins ago',
        actionTaken: 'HIDDEN'
      },
      {
        id: '2',
        author: 'angry_user',
        text: 'You are absolutely pathetic.',
        riskLevel: CommentRiskLevel.TOXIC,
        timestamp: '15 mins ago',
        actionTaken: 'HIDDEN'
      },
      {
        id: '3',
        author: 'scam_artist',
        text: 'DM me for investment opportunity',
        riskLevel: CommentRiskLevel.SPAM,
        timestamp: '1 hour ago',
        actionTaken: 'HIDDEN'
      },
      {
        id: '4',
        author: 'troll_account',
        text: 'Delete this garbage post.',
        riskLevel: CommentRiskLevel.HARASSMENT,
        timestamp: '3 hours ago',
        actionTaken: 'HIDDEN'
      }
    ]);
    // We do NOT overwrite settings here to preserve plan changes made in the session
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleAction = (id: string, action: string) => {
    // Optimistic update
    setActivity(prev => prev.filter(c => c.id !== id));
  };

  const handleSwitchAccount = (account: Account) => {
    if (account.id === currentAccount.id) return;
    setCurrentAccount(account);
    setIsAccountDropdownOpen(false);
    loadData(); // Re-fetch data for new account
  };

  const handleChangePlan = async (newPlan: PlanType) => {
    if (newPlan === settings.plan) return;
    
    setIsProcessingPayment(true);
    
    // 1. Load the Razorpay SDK
    const res = await loadRazorpayScript();

    if (!res) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      setIsProcessingPayment(false);
      return;
    }

    // 2. Define Razorpay Options
    // NOTE: In a production app, you should call your backend here to create an Order 
    // and pass the order_id in the options below.
    const options = {
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_PLACEHOLDER_KEY', // Allow env override for deployment
      amount: PLANS[newPlan].price * 100, // Amount is in smallest currency unit (e.g., paise/cents)
      currency: 'USD',
      name: 'ShieldGram',
      description: `Upgrade to ${PLANS[newPlan].label} Plan`,
      image: 'https://cdn-icons-png.flaticon.com/512/3233/3233515.png', // Placeholder logo
      handler: function (response: any) {
        // 3. Success Callback
        // In production, send response.razorpay_payment_id, response.razorpay_order_id, 
        // and response.razorpay_signature to your backend for verification.
        console.log('Payment ID: ', response.razorpay_payment_id);
        
        // Simulate backend verification success
        setSettings(prev => ({ ...prev, plan: newPlan }));
        setIsProcessingPayment(false);
        setSaveMessage(`Subscription updated to ${PLANS[newPlan].label}!`);
        setTimeout(() => setSaveMessage(null), 3000);
      },
      prefill: {
        name: "ShieldGram User",
        email: "user@example.com",
        contact: "9999999999"
      },
      notes: {
        address: "ShieldGram Corporate Office"
      },
      theme: {
        color: "#0284c7" // brand-600
      },
      modal: {
        ondismiss: function() {
            setIsProcessingPayment(false);
        }
      }
    };

    // 4. Open Razorpay
    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
  };

  const canEditCustomPolicy = settings.plan === 'premium' || settings.plan === 'max';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col">
      {/* Standalone Dashboard Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src="/logo.svg" alt="ShieldGram" className="h-8 w-auto" />
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight hidden sm:inline">ShieldGram <span className="text-slate-400 font-normal ml-1">Dashboard</span></span>
          </div>

          <div className="flex items-center gap-4">
             {/* Account Switcher */}
             <div className="relative">
                <button
                    onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:outline-none"
                >
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {currentAccount.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="hidden md:block text-left mr-1">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-none">{currentAccount.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-1.5">{currentAccount.handle}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAccountDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-fade-in ring-1 ring-black/5">
                        <div className="p-2 space-y-0.5">
                            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Account</div>
                            {accounts.map(account => (
                                <button
                                    key={account.id}
                                    onClick={() => handleSwitchAccount(account)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                                        currentAccount.id === account.id 
                                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium' 
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                                            currentAccount.id === account.id 
                                            ? 'bg-brand-200 dark:bg-brand-800 border-brand-300 dark:border-brand-700' 
                                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                                        }`}>
                                            {account.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                            <p>{account.name}</p>
                                            <p className="text-xs opacity-60 font-normal">{account.handle}</p>
                                        </div>
                                    </div>
                                    {currentAccount.id === account.id && <Check className="w-4 h-4 text-brand-600" />}
                                </button>
                            ))}
                        </div>
                        <div className="border-t border-slate-100 dark:border-slate-800 p-2">
                            <button 
                                onClick={() => {
                                   alert("Feature coming soon: Add Account Flow");
                                   setIsAccountDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium group"
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-600 group-hover:border-slate-400 dark:group-hover:border-slate-500 transition-colors">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <span>Add New Account</span>
                            </button>
                        </div>
                    </div>
                )}
             </div>

             <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>

             {toggleTheme && (
                <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Toggle Theme"
                >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
             )}
             
             {onLogout && (
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
             )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
               <button
                 onClick={() => setActiveTab('overview')}
                 className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === 'overview' 
                    ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                 }`}
               >
                  <LayoutDashboard className="w-4 h-4" /> Overview
               </button>
               <button
                 onClick={() => setActiveTab('controls')}
                 className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === 'controls' 
                    ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                 }`}
               >
                  <Sliders className="w-4 h-4" /> Controls
               </button>
               <button
                 onClick={() => setActiveTab('plan')}
                 className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === 'plan' 
                    ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                 }`}
               >
                  <CreditCard className="w-4 h-4" /> Plan & Billing
               </button>
            </div>
         </div>
      </div>

      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {isLoading ? (
             <div className="flex justify-center items-center h-64">
                <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
             </div>
          ) : (
            <>
              {/* --- OVERVIEW TAB --- */}
              {activeTab === 'overview' && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Overview</h1>
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
                       <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                         settings.plan === 'max' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                         settings.plan === 'premium' ? 'bg-brand-100 text-brand-700 border-brand-200' :
                         'bg-slate-100 text-slate-600 border-slate-200'
                       }`}>
                         {settings.plan} Plan
                       </span>
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Comments Scanned</p>
                          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.scanned.toLocaleString()}</h3>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                            <span className="font-bold">↑ 12%</span> this month
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <BarChart3 className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Threats Blocked</p>
                          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.moderated.toLocaleString()}</h3>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                            <span className="font-bold">↑ 5%</span> this month
                          </p>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Protection Score</p>
                          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.protectionScore}/100</h3>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                            Based on response time
                          </p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Automated Interventions</h2>
                    {activity.length === 0 ? (
                       <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 border-dashed">
                          <p className="text-slate-500">No activity logged yet.</p>
                       </div>
                    ) : (
                      <div className="grid gap-4">
                          {activity.map((comment) => (
                            <div key={comment.id} className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold shrink-0">
                                    {comment.author[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-slate-900 dark:text-slate-100">{comment.author}</span>
                                      <span className="text-xs text-slate-400 dark:text-slate-500">{comment.timestamp}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700 italic">
                                      "{comment.text}"
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      {comment.riskLevel !== CommentRiskLevel.SAFE && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                            comment.riskLevel === CommentRiskLevel.SPAM ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' :
                                            comment.riskLevel === CommentRiskLevel.TOXIC ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                                            'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
                                        }`}>
                                            {comment.riskLevel}
                                        </span>
                                      )}
                                      <span className={`text-[10px] uppercase font-medium ${comment.actionTaken === 'APPROVED' ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                          Action: {comment.actionTaken}
                                      </span>
                                    </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center">
                                <button 
                                    onClick={() => handleAction(comment.id, 'APPROVE')}
                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                    title="Approve (False Positive)"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => handleAction(comment.id, 'DELETE')}
                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete Permanently"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => handleAction(comment.id, 'BAN')}
                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Ban User"
                                >
                                    <Ban className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                    
                    <button className="w-full py-3 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 font-medium border border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all mt-4">
                        Load More History
                    </button>
                  </div>
                </div>
              )}

              {/* --- CONTROLS TAB --- */}
              {activeTab === 'controls' && (
                <div className="animate-fade-in max-w-4xl mx-auto">
                   <div className="flex items-center justify-between mb-8">
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Moderation Policy</h1>
                      
                      {saveMessage && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full animate-fade-in">
                           <Check className="w-4 h-4" /> {saveMessage}
                        </div>
                      )}
                   </div>

                   {/* Plan Warning Banner */}
                   {(!canEditCustomPolicy) && (
                     <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900 p-4 rounded-xl mb-8 flex items-start gap-3">
                        <Zap className="w-5 h-5 text-brand-600 dark:text-brand-400 mt-0.5 fill-current" />
                        <div>
                           <h3 className="font-semibold text-brand-900 dark:text-brand-100">Unlock Advanced Controls</h3>
                           <p className="text-sm text-brand-700 dark:text-brand-300 mt-1">
                              You are currently on the <span className="font-bold uppercase">{settings.plan}</span> plan. Upgrade to Premium or Max to define custom AI instructions and specific policy nuances.
                           </p>
                        </div>
                        <button 
                            onClick={() => setActiveTab('plan')}
                            className="ml-auto text-xs bg-brand-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-brand-700"
                        >
                           Upgrade
                        </button>
                     </div>
                   )}

                   <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
                      <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-brand-500" /> Standard Protection
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                         {Object.entries(settings.policies).map(([key, value]) => (
                            <label 
                                key={key} 
                                className={`
                                    group relative flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none
                                    ${value 
                                        ? 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800 ring-1 ring-brand-200 dark:ring-brand-800' 
                                        : 'bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                    }
                                `}
                            >
                                <input 
                                    type="checkbox" 
                                    checked={value}
                                    onChange={(e) => setSettings({...settings, policies: {...settings.policies, [key]: e.target.checked}})}
                                    className="sr-only"
                                />
                                
                                <div className={`
                                    w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 flex-shrink-0
                                    ${value 
                                        ? 'bg-brand-600 border border-brand-600 shadow-sm scale-100' 
                                        : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 scale-95 group-hover:scale-100 group-hover:border-slate-400'
                                    }
                                `}>
                                    <Check className={`w-3.5 h-3.5 text-white transition-all duration-200 ${value ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} strokeWidth={3} />
                                </div>

                                <div className="ml-3 flex flex-col">
                                    <span className={`font-semibold text-sm capitalize transition-colors ${value ? 'text-brand-900 dark:text-brand-100' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span className={`text-xs mt-0.5 ${value ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>
                                        {value ? 'Active' : 'Disabled'}
                                    </span>
                                </div>
                                
                                {value && <div className="absolute inset-0 rounded-xl bg-brand-400/5 dark:bg-brand-400/10 pointer-events-none" />}
                            </label>
                         ))}
                      </div>
                   </div>

                   <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 relative ${!canEditCustomPolicy ? 'opacity-70' : ''}`}>
                      {!canEditCustomPolicy && (
                         <div className="absolute inset-0 z-10 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center cursor-not-allowed">
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg">
                               <Lock className="w-6 h-6 text-slate-400" />
                            </div>
                         </div>
                      )}
                      
                      <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white flex items-center gap-2">
                         <Sliders className="w-5 h-5 text-purple-500" /> Custom Instructions
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                         Provide specific instructions to the AI about what constitutes a violation for your specific brand.
                      </p>
                      
                      <textarea
                         value={settings.customInstructions}
                         onChange={(e) => setSettings({...settings, customInstructions: e.target.value})}
                         disabled={!canEditCustomPolicy}
                         placeholder={canEditCustomPolicy ? "e.g. Treat comments mentioning 'competitor_name' as spam. Allow sarcasm." : "Upgrade to Premium to edit custom instructions."}
                         className="w-full h-32 p-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-800 dark:text-slate-200 resize-none disabled:cursor-not-allowed"
                      />
                   </div>

                   <div className="mt-8 flex justify-end">
                      <button 
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                         {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                         Save Changes
                      </button>
                   </div>
                </div>
              )}

              {/* --- PLAN & BILLING TAB --- */}
              {activeTab === 'plan' && (
                  <div className="animate-fade-in max-w-5xl mx-auto">
                    
                    {saveMessage && (
                        <div className="fixed top-24 right-8 z-50 flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/40 px-4 py-3 rounded-lg shadow-lg border border-green-200 dark:border-green-800 animate-slide-in">
                            <CheckCircle className="w-5 h-5" /> {saveMessage}
                        </div>
                    )}
                    
                    {/* Payment Overlay */}
                    {isProcessingPayment && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-slate-200 dark:border-slate-800">
                                <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Connecting to Razorpay</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    Securely loading checkout...<br/>Please wait.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-8">
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Plan & Billing</h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        {/* Current Subscription Card */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Current Subscription</h2>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{settings.plan} Plan</h3>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold uppercase rounded-full border border-green-200 dark:border-green-800">Active</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                                        Renews on <span className="font-medium text-slate-700 dark:text-slate-300">Nov 12, 2024</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">${PLANS[settings.plan].price}<span className="text-sm font-normal text-slate-500">/mo</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Payment Method</h2>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-8 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                    {/* Mock Visa Icon */}
                                    <div className="font-bold text-blue-600 italic text-xs">VISA</div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Visa ending in 4242</p>
                                    <p className="text-xs text-slate-500">Expires 12/2028</p>
                                </div>
                            </div>
                            <button className="w-full py-2 text-sm text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                Update Payment Method
                            </button>
                        </div>
                    </div>

                    {/* Available Plans */}
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Available Plans</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {(Object.keys(PLANS) as PlanType[]).map((planKey) => {
                            const plan = PLANS[planKey];
                            const isCurrent = settings.plan === planKey;
                            const isUpgrade = PLANS[planKey].price > PLANS[settings.plan].price;

                            return (
                                <div 
                                    key={planKey} 
                                    className={`relative flex flex-col p-6 rounded-xl border transition-all ${
                                        isCurrent 
                                        ? 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800 ring-1 ring-brand-500 dark:ring-brand-400' 
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md'
                                    }`}
                                >
                                    {isCurrent && (
                                        <div className="absolute top-0 right-0 -mt-3 -mr-3">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
                                                <Check className="w-4 h-4" />
                                            </span>
                                        </div>
                                    )}

                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">{plan.label}</h3>
                                    <div className="mt-2 mb-6">
                                        <span className="text-3xl font-bold text-slate-900 dark:text-white">${plan.price}</span>
                                        <span className="text-slate-500 text-sm">/mo</span>
                                    </div>

                                    <ul className="space-y-3 mb-8 flex-1">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleChangePlan(planKey)}
                                        disabled={isCurrent || isProcessingPayment}
                                        className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors text-sm ${
                                            isCurrent 
                                            ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 cursor-default'
                                            : isUpgrade
                                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm'
                                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        {isCurrent ? 'Current Plan' : isUpgrade ? 'Upgrade' : 'Downgrade'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Billing History */}
                    <div className="mt-12 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Billing History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Date</th>
                                        <th className="px-6 py-4 font-medium">Amount</th>
                                        <th className="px-6 py-4 font-medium">Status</th>
                                        <th className="px-6 py-4 font-medium text-right">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-900 dark:text-slate-300">Oct 12, 2024</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">$5.00</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                Paid
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 justify-end ml-auto">
                                                <Download className="w-4 h-4" /> PDF
                                            </button>
                                        </td>
                                    </tr>
                                     <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-900 dark:text-slate-300">Sep 12, 2024</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">$5.00</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                Paid
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 justify-end ml-auto">
                                                <Download className="w-4 h-4" /> PDF
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                  </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;