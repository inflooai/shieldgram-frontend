import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, ShieldCheck, ShieldAlert, Trash2, CheckCircle, Ban, 
  Shield, LogOut, Sun, Moon, LayoutDashboard, Sliders, Lock, Save, 
  Check, RefreshCw, CreditCard, Download, Zap, ChevronDown, Plus,
  AlertCircle, Target, Edit2, Loader2, HelpCircle
} from 'lucide-react';
import { ModeratedCommentLog, CommentRiskLevel } from '../types';
import logo from "../logo.svg";

import { getAuthTokens, removeAuthToken } from '../utils/auth';
import { 
  getDashboardInfo, 
  saveDashboardControls, 
  addInstagramAccount, 
  getInterventions, 
  AccountInfo,
  saveCustomPolicy as saveCustomPolicyApi,
  deleteCustomPolicy as deleteCustomPolicyApi,
  processIntervention,
  removeInstagramAccount,
  initiateMFASetup,
  finalizeMFASetup,
  disableMFA,
  getMFAStatus
} from '../services/dashboardService';

interface DashboardProps {
  onLogout?: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}


type Tab = 'overview' | 'controls' | 'plan' | 'security';
type PlanType = 'standard' | 'plus' | 'pro' | 'max';

interface DashboardStats {
  scanned: number;
  moderated: number;
  averageResponseTime: number;
}

interface UserSettings {
  plan: PlanType;
  policies: {
    profanity: boolean;
    sexualContent: boolean;
    hateSpeech: boolean;
    selfHarm: boolean;
    violence: boolean;
    negativity: boolean;
    harassment: boolean;
    spam: boolean;
  };
  customInstructions: string;
  confidenceThreshold: number;
  selectedCustomPolicies: string[];
  customPolicyDescriptions: Record<string, string>; // policy_name -> description
}

interface Account {
  id: string;
  name: string;
  handle: string;
  profilePictureUrl?: string;
  isDeauthorized?: boolean;
}

const MOCK_ACCOUNTS: Account[] = [];


// Plan definitions for the billing tab
const PLANS = {
  standard: { price: 5, label: 'Standard', features: ['5k comments/mo', '1 social account', 'Standard Protection'] },
  plus: { price: 15, label: 'Plus', features: ['20k comments/mo', '2 social accounts', 'Standard Protection'] },
  pro: { price: 30, label: 'Pro', features: ['50k comments/mo', '5 social accounts', 'Advanced Reasoning', 'Custom Policies'] },
  max: { price: 75, label: 'Max', features: ['200k comments/mo', 'Unlimited accounts', 'Advanced Reasoning', 'Custom Policies'] }
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
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as Tab;
    return (['overview', 'controls', 'plan', 'security'] as Tab[]).includes(tab) ? tab : 'overview';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInterventions, setIsLoadingInterventions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  // Account State
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  
  // MFA Setup State
  const [mfaStatus, setMfaStatus] = useState<boolean>(false);
  const [isMFASetupOpen, setIsMFASetupOpen] = useState(false);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaVerificationCode, setMfaVerificationCode] = useState('');
  const [isMFAInitLoading, setIsMFAInitLoading] = useState(false);
  const [isMFAVerifyLoading, setIsMFAVerifyLoading] = useState(false);
  
  // RAW Data for current account
  const [rawAccountInfo, setRawAccountInfo] = useState<AccountInfo | null>(null);

  // Payment State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);


  // Data States
  const [stats, setStats] = useState<DashboardStats>({ scanned: 0, moderated: 0, averageResponseTime: 0 });
  const [activity, setActivity] = useState<ModeratedCommentLog[]>([]);
  const [interventionsLimit, setInterventionsLimit] = useState(10);
  const [settings, setSettings] = useState<UserSettings>({
    plan: 'standard', // Default start plan
    policies: { 
        profanity: true, 
        sexualContent: true, 
        hateSpeech: true, 
        selfHarm: false, 
        violence: false, 
        negativity: false, 
        harassment: false, 
        spam: true 
    },
    customInstructions: '',
    confidenceThreshold: 80,
    selectedCustomPolicies: [],
    customPolicyDescriptions: {}
  });
  const [originalSettings, setOriginalSettings] = useState<UserSettings | null>(null);

  const isDirty = React.useMemo(() => {
    if (!originalSettings) return false;
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  const handleCancelChanges = () => {
    if (originalSettings) {
        setSettings(originalSettings);
        showToast('Changes reverted', 'success');
    }
  };

  // Custom Policy Form State
  const [isCustomPolicyFormOpen, setIsCustomPolicyFormOpen] = useState(false);
  const [editingPolicyName, setEditingPolicyName] = useState<string | null>(null);
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPolicyCondition, setNewPolicyCondition] = useState('');
  const [newPolicyAction, setNewPolicyAction] = useState('spam');

  // Account Removal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  // URL Sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let changed = false;

    if (params.get('tab') !== activeTab) {
        params.set('tab', activeTab);
        changed = true;
    }

    if (currentAccount && params.get('account') !== currentAccount.id) {
        params.set('account', currentAccount.id);
        changed = true;
    }

    if (changed) {
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }
  }, [activeTab, currentAccount]);

  // Account Dropdown Reference for click-outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };

    if (isAccountDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAccountDropdownOpen]);

  // Load Data
  const loadData = async (initialLoad = false, targetAccountId?: string) => {
    setIsLoading(true);
    try {
      const dashboardData = await getDashboardInfo();
      const { accounts: accountData, plan_type } = dashboardData;
      
      // Always update plan even if no accounts
      setSettings(prev => ({
          ...prev,
          plan: (plan_type || 'standard') as PlanType
      }));

      if (accountData.length > 0) {
        const mappedAccounts = accountData.map(acc => ({
            id: acc.account_id,
            name: acc.account_name,
            handle: acc.account_name.toLowerCase().replace(/\s+/g, '_'), // Remove mock '@' prefix
            profilePictureUrl: acc.profile_picture_url,
            isDeauthorized: acc.is_deauthorized || false
        }));
        setAccounts(mappedAccounts);

        // Find current or set default
        const params = new URLSearchParams(window.location.search);
        const urlAccountId = params.get('account');
        
        const effectiveAccountId = targetAccountId || urlAccountId || currentAccount?.id;
        let selected = accountData.find(a => a.account_id === effectiveAccountId) || accountData[0];
        
        setCurrentAccount({
            id: selected.account_id,
            name: selected.account_name,
            handle: selected.account_name.toLowerCase().replace(/\s+/g, '_'),
            profilePictureUrl: selected.profile_picture_url,
            isDeauthorized: selected.is_deauthorized || false
        });
        setRawAccountInfo(selected);

        // Map policies string to object
        const pList = selected.policies.split(',').map(s => s.trim());

        const newSettings: UserSettings = {
            plan: (plan_type || 'standard') as PlanType,
            policies: {
                profanity: pList.includes('profanity'),
                sexualContent: pList.includes('sexualContent'),
                hateSpeech: pList.includes('hateSpeech'),
                selfHarm: pList.includes('selfHarm'),
                violence: pList.includes('violence'),
                negativity: pList.includes('negativity'),
                harassment: pList.includes('harassment'),
                spam: pList.includes('spam')
            },
            customInstructions: selected.custom_policy || '',
            confidenceThreshold: selected.confidence_threshold || 80,
            selectedCustomPolicies: (() => {
                try {
                    const parsed = JSON.parse(selected.custom_policy || '[]');
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            })(),
            customPolicyDescriptions: (selected.custom_policy_definitions || []).reduce((acc: any, d: any) => {
                acc[d.policy_name] = d.description;
                return acc;
            }, {})
        };

        setSettings(newSettings);
        setOriginalSettings(newSettings);


        await fetchInterventions(selected.account_id, interventionsLimit);

        setStats({
          scanned: selected?.stats?.comments_scanned ?? 0,
          moderated: selected?.stats?.comments_moderated ?? 0,
          averageResponseTime: selected?.stats?.comments_moderated > 0 
            ? (selected?.stats?.processing_time ?? 0) / selected.stats.comments_moderated 
            : 0
        });
      } else {
          // No accounts found
          setAccounts([]);
          setCurrentAccount(null);
          
          setStats({
            scanned: 0,
            moderated: 0,
            averageResponseTime: 0
          });
      }
    } catch (error: any) {
        console.error("Failed to load dashboard data", error);
        if (error.status === 401 || error.status === 403) {
            showToast("Session expired. Logging out...", "error");
            setTimeout(() => onLogout?.(), 2000);
        } else {
            showToast("Failed to load dashboard data", "error");
        }
    } finally {
        setIsLoading(false);
    }
  };
  const fetchInterventions = async (accountId: string, limit: number) => {
    setIsLoadingInterventions(true);
    try {
        const interventionsData = await getInterventions(accountId, limit);
        const mappedActivity: ModeratedCommentLog[] = interventionsData.map(item => ({
            id: item.comment_id,
            author: item.username || 'Anonymous', 
            text: item.text,
            riskLevel: (item.riskLevel || 'SAFE') as CommentRiskLevel,
            timestamp: formatTimestamp(item.moderated_at),
            actionTaken: item.suggested_action || 'NONE',
            commenter_id: item.commenter_id
        }));
        setActivity(mappedActivity);
    } catch (err) {
        console.error("Failed to load interventions", err);
        showToast("Failed to load recent interventions", "error");
    } finally {
        setIsLoadingInterventions(false);
    }
  };

  const handleLoadMore = () => {
    if (!currentAccount) return;
    const newLimit = interventionsLimit + 10;
    setInterventionsLimit(newLimit);
    fetchInterventions(currentAccount.id, newLimit);
  };

  // Helper to format timestamp
  const formatTimestamp = (ts: number | string) => {
    if (!ts) return 'Unknown';
    const now = Math.floor(Date.now() / 1000);
    const diff = now - Number(ts);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };


  useEffect(() => {
    loadData(true);
    checkMFA();

    // Check for Instagram OAuth code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      handleInstagramCallback(code);
    } else {
        // but loadData is already called with true above
    }
  }, []);

  const checkMFA = async () => {
    try {
        const isEnabled = await getMFAStatus();
        setMfaStatus(isEnabled);
    } catch (error) {
        console.error("Failed to check MFA status", error);
    }
  };

  const handleInstagramCallback = async (code: string) => {
    setIsLoading(true);
    try {
      const result = await addInstagramAccount(code);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Refresh data
      await loadData();
      showToast('Account linked successfully!');
    } catch (error: any) {
      console.error("Failed to link Instagram account", error);
      if (error.status === 401 || error.status === 403) {
          showToast("Session expired. Logging out...", "error");
          setTimeout(() => onLogout?.(), 2000);
      } else {
          showToast(error.message || "Failed to link Instagram account", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleEnableMFA = async () => {
    setIsMFAInitLoading(true);
    try {
        const secret = await initiateMFASetup();
        setMfaSecret(secret);
        setIsMFASetupOpen(true);
    } catch (error: any) {
        showToast(error.message || "Failed to initiate MFA setup", "error");
    } finally {
        setIsMFAInitLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (!mfaVerificationCode) return;
    setIsMFAVerifyLoading(true);
    try {
        await finalizeMFASetup(mfaVerificationCode);
        setMfaStatus(true);
        setIsMFASetupOpen(false);
        setMfaSecret(null);
        setMfaVerificationCode('');
        showToast("MFA enabled successfully!");
    } catch (error: any) {
        showToast(error.message || "Invalid code", "error");
    } finally {
        setIsMFAVerifyLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    try {
        await disableMFA();
        setMfaStatus(false);
        showToast("MFA disabled");
    } catch (error: any) {
        showToast(error.message || "Failed to disable MFA", "error");
    }
  };

  const handleSaveSettings = async () => {
    if (!currentAccount || !rawAccountInfo) return;

    setIsSaving(true);
    try {
        const policiesStr = Object.entries(settings.policies)
            .filter(([_, v]) => v)
            .map(([k, _]) => k)
            .join(', ');

        await saveDashboardControls(
            currentAccount.id,
            rawAccountInfo.owner_user_id,
            policiesStr,
            settings.plan,
            JSON.stringify(settings.selectedCustomPolicies),
            settings.confidenceThreshold
        );
      
      // We assume custom policies are saved individually as they change, 
      // but for the sake of "Dirty State" we treat them as part of the whole snapshot.
      // Ideally custom policies save immediately, but if we want to batch them, we'd need bulk update API.
      // For now, let's assume 'saveDashboardControls' only does standard + threshold.
      // But we update originalSettings to match current settings to clear dirty state.
      
      setOriginalSettings(settings);
      showToast('Settings saved successfully!');
    } catch (error: any) {
        console.error("Failed to save settings", error);
        if (error.status === 401 || error.status === 403) {
            showToast("Session expired. Logging out...", "error");
            setTimeout(() => onLogout?.(), 2000);
        } else {
            showToast("Failed to save settings: " + (error.message || "Unknown error"), "error");
        }
    } finally {
        setIsSaving(false);
    }
  };

  const handleSaveCustomPolicy = async () => {
    if (!currentAccount || !newPolicyName || !newPolicyCondition) return;
    
    const structuredDescription = `Treat comments with ${newPolicyCondition} as ${newPolicyAction}`;
    if (structuredDescription.length > 100) {
        showToast("Description is too long (max 100 characters combined)", "error");
        return;
    }

    try {
        setIsSaving(true);
        await saveCustomPolicyApi(currentAccount.id, newPolicyName, structuredDescription);
        
        // Refresh local state
        setSettings(prev => ({
            ...prev,
            customPolicyDescriptions: {
                ...prev.customPolicyDescriptions,
                [newPolicyName]: structuredDescription
            }
        }));

        setIsCustomPolicyFormOpen(false);
        setNewPolicyName('');
        setNewPolicyCondition('');
        setNewPolicyAction('spam');
        setEditingPolicyName(null);
        showToast("Custom policy saved successfully");
    } catch (error: any) {
        if (error.status === 403 && settings.plan === 'pro') {
            showToast("Limit reached. Upgrade to Max for up to 20 custom policies.", "error");
        } else {
            showToast(error.message || "Failed to save custom policy", "error");
        }
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteCustomPolicy = async (policyName: string) => {
    if (!currentAccount) return;

    try {
        setIsSaving(true);
        await deleteCustomPolicyApi(currentAccount.id, policyName);
        
        // Refresh local state
        setSettings(prev => {
            const nextDefs = { ...prev.customPolicyDescriptions };
            delete nextDefs[policyName];
            return {
                ...prev,
                selectedCustomPolicies: prev.selectedCustomPolicies.filter(p => p !== policyName),
                customPolicyDescriptions: nextDefs
            };
        });

        showToast("Custom policy deleted");
    } catch (error: any) {
        showToast(error.message || "Failed to delete custom policy", "error");
    } finally {
        setIsSaving(false);
    }
  };

  const toggleCustomPolicy = (policyName: string) => {
      setSettings(prev => ({
          ...prev,
          selectedCustomPolicies: prev.selectedCustomPolicies.includes(policyName)
            ? prev.selectedCustomPolicies.filter(p => p !== policyName)
            : [...prev.selectedCustomPolicies, policyName]
      }));
  };


  const handleAction = async (id: string, action: 'SAFE' | 'DELETE' | 'RESTRICT') => {
    if (!currentAccount) return;
    
    // Find the comment in activity
    const comment = activity.find(c => c.id === id);
    if (!comment) return;

    try {
        // Match frontend action to API action_type
        const actionType = action === 'RESTRICT' ? 'USER' : 'COMMENT';

        await processIntervention(
            currentAccount.id, 
            id, 
            comment.commenter_id || null, 
            action, 
            actionType
        );
        
        showToast(`Action "${action}" queued. It will be synced in a few minutes.`);
    } catch (error) {
        console.error("Failed to process intervention", error);
        showToast("Failed to process intervention", "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    
    setIsSaving(true);
    try {
        await removeInstagramAccount(accountToDelete.id);
        showToast("Account removed successfully");
        setIsDeleteModalOpen(false);
        setAccountToDelete(null);
        
        // Refresh dashboard
        loadData(true);
    } catch (error: any) {
        showToast(error.message || "Failed to remove account", "error");
    } finally {
        setIsSaving(false);
    }
  };

  const handleSwitchAccount = (account: Account) => {
    if (currentAccount && account.id === currentAccount.id) {
        setIsAccountDropdownOpen(false);
        return;
    }
    setCurrentAccount(account);
    setIsAccountDropdownOpen(false);
    loadData(false, account.id); // Re-fetch data for new account
  };

  const handleChangePlan = async (newPlan: PlanType) => {
    if (newPlan === settings.plan) return;
    
    setIsProcessingPayment(true);
    
    // 1. Load the Razorpay SDK
    const res = await loadRazorpayScript();

    if (!res) {
      showToast('Razorpay SDK failed to load. Please check your internet connection.', 'error');
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
        showToast(`Subscription updated to ${PLANS[newPlan].label}!`);
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
        color: "#6bb8e6" // brand-600
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

  const canEditCustomPolicy = settings.plan === 'pro' || settings.plan === 'max';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col">
      {/* Standalone Dashboard Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <img src={logo} alt="ShieldGram" className="h-[44px] w-auto" />
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight hidden sm:inline">ShieldGram <span className="text-slate-400 font-normal ml-1">Dashboard</span></span>
          </div>

          <div className="flex items-center gap-4">
             {/* Account Switcher */}
              <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded-lg transition-all border border-transparent focus:outline-none ${
                        !currentAccount ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                >
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden shrink-0">
                        {currentAccount?.profilePictureUrl ? (
                            <img src={currentAccount.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            currentAccount ? currentAccount.name.substring(0,2).toUpperCase() : <Shield className="w-4 h-4" />
                        )}
                    </div>
                    <div className="hidden md:block text-left mr-1">
                        <p className={`text-sm font-semibold leading-none ${!currentAccount ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-200'}`}>
                            {currentAccount?.name || (isLoading ? 'Loading...' : 'Select Account')}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-1.5">
                            {currentAccount?.handle || (isLoading ? '' : 'None active')}
                        </p>
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
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border overflow-hidden ${
                                            currentAccount.id === account.id 
                                            ? 'bg-brand-200 dark:bg-brand-800 border-brand-300 dark:border-brand-700' 
                                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                                        }`}>
                                            {account.profilePictureUrl ? (
                                                <img src={account.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                account.name.substring(0,2).toUpperCase()
                                            )}
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
                                   const authUrl = import.meta.env.VITE_INSTAGRAM_AUTH_URL;
                                   if (authUrl) {
                                       window.location.href = authUrl;
                                   } else {
                                       showToast("Error: VITE_INSTAGRAM_AUTH_URL is not defined.", "error");
                                   }
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
               <button
                 onClick={() => setActiveTab('security')}
                 className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === 'security' 
                    ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                 }`}
               >
                  <Lock className="w-4 h-4" /> Security
               </button>
            </div>
         </div>
      </div>

      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {notification && (
            <div className={`fixed top-24 right-4 sm:right-8 z-50 flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-lg shadow-xl border animate-slide-in max-w-[calc(100vw-2rem)] sm:max-w-md ${
                notification.type === 'success'
                ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/90 border-green-200 dark:border-green-800'
                : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/90 border-red-200 dark:border-red-800'
            }`}>
                {notification.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />} 
                <span className="truncate">{notification.message}</span>
            </div>
          )}

          {isLoading ? (
             <div className="flex flex-col justify-center items-center h-96 gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-brand-100 dark:border-brand-900 rounded-full border-t-brand-600 animate-spin"></div>
                    <Shield className="w-6 h-6 text-brand-600 absolute inset-0 m-auto" />
                </div>
                <p className="text-slate-500 font-medium animate-pulse">Syncing your protection...</p>
             </div>
          ) : (accounts.length === 0 && activeTab !== 'plan') ? (
            <div className="max-w-4xl mx-auto text-center py-20 px-6 animate-fade-in">
                 <div className="w-24 h-24 bg-brand-50 dark:bg-brand-900/20 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-inner text-brand-600">
                    <ShieldCheck className="w-12 h-12" />
                 </div>
                 <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">Ready to Secure Your Growth?</h2>
                 <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
                    Link your Instagram account to start automated AI moderation. ShieldGram protects your brand from spam and toxicity 24/7.
                 </p>
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                        onClick={() => {
                            const authUrl = import.meta.env.VITE_INSTAGRAM_AUTH_URL;
                            if (authUrl) window.location.href = authUrl;
                            else showToast("Auth URL not configured", "error");
                        }}
                        className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center gap-2 group"
                    >
                         <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Connect Instagram
                    </button>
                    <button 
                        onClick={() => setActiveTab('plan')}
                        className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                         Manage Plan
                    </button>
                 </div>
                 <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 opacity-60">
                    <div className="flex items-center gap-3 justify-center">
                        <Zap className="w-5 h-5 text-brand-500" /> <span className="text-sm font-medium">Real-time AI</span>
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                        <Lock className="w-5 h-5 text-purple-500" /> <span className="text-sm font-medium">Spam-free feed</span>
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                        <ShieldAlert className="w-5 h-5 text-red-500" /> <span className="text-sm font-medium">Policy Enforced</span>
                    </div>
                 </div>
            </div>
          ) : (
            <>
              {/* --- OVERVIEW TAB --- */}
              {activeTab === 'overview' && (
                <div className="animate-fade-in relative">
                  {/* Deauthorization Warning Overlay */}
                  {currentAccount?.isDeauthorized && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm rounded-xl"></div>
                      <div className="relative bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md text-center shadow-xl">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ShieldAlert className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Account Disconnected</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                          You have de-authorized ShieldGram from your Instagram account. Please reconnect to resume protection.
                        </p>
                        <button
                          onClick={() => {
                              const redirectUri = `${window.location.origin}/dashboard`;
                              const clientId = import.meta.env.VITE_INSTAGRAM_CLIENT_ID;
                              const instagramAuthUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages`;
                              window.location.href = instagramAuthUrl;
                          }}
                          className="px-6 py-3 rounded-xl font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-all"
                        >
                          Reconnect Instagram
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Overview</h1>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => loadData()}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-200 dark:hover:border-brand-800 transition-all shadow-sm group"
                            title="Refresh Dashboard"
                        >
                            <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
                           <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                             settings.plan === 'max' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                             settings.plan === 'pro' ? 'bg-brand-100 text-brand-700 border-brand-200' :
                             'bg-slate-100 text-slate-600 border-slate-200'
                           }`}>
                             {settings.plan} Plan
                           </span>
                        </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Comments Scanned</p>
                          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.scanned.toLocaleString()}</h3>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Scanned</span>
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
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Moderated</span>
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
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Response Time</p>
                          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                             {stats.averageResponseTime === 0 ? '-' : 
                              stats.averageResponseTime < 1 ? '< 1s' : 
                              `${stats.averageResponseTime.toFixed(1)}s`}
                          </h3>
                          <p className="text-xs text-brand-600 dark:text-brand-400 mt-2 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> <span className="font-bold">Fast Protection</span>
                          </p>
                        </div>
                        <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
                          <Zap className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Automated Interventions</h2>
                    </div>
                    {activity.length === 0 ? (
                       <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 border-dashed">
                          <p className="text-slate-500">No activity logged yet.</p>
                       </div>
                    ) : (
                      <div className="grid gap-4">
                          {activity.map((comment) => (
                            <div key={comment.id} className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
                              <div className="flex items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-slate-900 dark:text-slate-100">{comment.author}</span>
                                      <span className="text-xs text-slate-400 dark:text-slate-500">{comment.timestamp}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                                      {comment.text}
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
                                    onClick={() => handleAction(comment.id, 'SAFE')}
                                    disabled={comment.actionTaken === 'DELETE'}
                                    className={`p-2 rounded-lg transition-colors ${
                                        comment.actionTaken === 'DELETE' 
                                        ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed' 
                                        : 'text-slate-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                    }`}
                                    title={comment.actionTaken === 'DELETE' ? "Cannot restore deleted comment" : "Mark as Safe (False Positive)"}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => handleAction(comment.id, 'DELETE')}
                                    disabled={comment.actionTaken === 'DELETE'}
                                    className={`p-2 rounded-lg transition-colors ${
                                        comment.actionTaken === 'DELETE' 
                                        ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed' 
                                        : 'text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    }`}
                                    title={comment.actionTaken === 'DELETE' ? "Permanently Deleted" : "Delete Comment"}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => handleAction(comment.id, 'RESTRICT')}
                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Restrict User"
                                >
                                    <Ban className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                    
                    <button 
                      onClick={handleLoadMore}
                      disabled={isLoadingInterventions}
                      className="w-full py-3 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 font-medium border border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all mt-4 flex items-center justify-center gap-2"
                    >
                        {isLoadingInterventions ? (
                          <>
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-brand-600 animate-spin rounded-full"></div>
                            Loading...
                          </>
                        ) : (
                          "Load More History"
                        )}
                    </button>
                  </div>
                </div>
              )}

              {/* --- CONTROLS TAB --- */}
              {activeTab === 'controls' && (
                <div className="animate-fade-in max-w-3xl mx-auto relative">
                   {/* Deauthorization Warning Banner */}
                   {currentAccount?.isDeauthorized && (
                     <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8 text-center">
                       <div className="flex items-center justify-center gap-3 mb-3">
                         <ShieldAlert className="w-6 h-6 text-red-500" />
                         <h3 className="font-bold text-red-600 dark:text-red-400">Account Disconnected</h3>
                       </div>
                       <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
                         Controls are disabled because you de-authorized ShieldGram. Reconnect your Instagram account or remove it below.
                       </p>
                       <button
                         onClick={() => {
                             const redirectUri = `${window.location.origin}/dashboard`;
                             const clientId = import.meta.env.VITE_INSTAGRAM_CLIENT_ID;
                             const instagramAuthUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages`;
                             window.location.href = instagramAuthUrl;
                         }}
                         className="px-5 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white text-sm transition-all"
                       >
                         Reconnect Instagram
                       </button>
                     </div>
                   )}
                   
                   <div className="flex items-center justify-between mb-8">
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Moderation Policy</h1>
                      
                      {notification && notification.type === 'success' && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full animate-fade-in">
                           <Check className="w-4 h-4" /> {notification.message}
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
                               You are currently on the <span className="font-bold uppercase">{settings.plan}</span> plan. Upgrade to Pro or Max to define custom AI instructions and specific policy nuances.
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


                    {/* Controls Section - Disabled when deauthorized */}
                    <div className={currentAccount?.isDeauthorized ? 'opacity-50 pointer-events-none select-none' : ''}>
                        {/* Standard Protection */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 py-10 px-6">
                            <h3 className="font-semibold text-lg mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-brand-500" /> Standard Protection
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {Object.entries(settings.policies).map(([key, value]) => {
                                    const labels: Record<string, string> = {
                                        profanity: 'Profanity',
                                        sexualContent: 'Sexual Content',
                                        hateSpeech: 'Hate Speech',
                                        selfHarm: 'Self-harm',
                                        violence: 'Violence',
                                        negativity: 'Negativity',
                                        harassment: 'Harassment',
                                        spam: 'Spam'
                                    };
                                    const label = labels[key] || key;

                                    return (
                                        <label 
                                            key={key} 
                                            className={`
                                                group relative flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200 select-none
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
                                                w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 flex-shrink-0
                                                ${value 
                                                    ? 'bg-brand-600 border border-brand-600 shadow-sm scale-100' 
                                                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 scale-95 group-hover:scale-100'
                                                }
                                            `}>
                                                <Check className={`w-3 h-3 text-white transition-all duration-200 ${value ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} strokeWidth={3} />
                                            </div>
                                            <span className={`ml-2 text-xs font-bold truncate ${value ? 'text-brand-900 dark:text-brand-100' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {label}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Policies */}
                        <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 py-10 px-6 relative ${!canEditCustomPolicy ? 'opacity-70' : ''}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sliders className="w-5 h-5 text-purple-500" /> Custom Policies
                                </h3>
                                {canEditCustomPolicy && (
                                    <button
                                        onClick={() => {
                                            setNewPolicyName('');
                                            setNewPolicyCondition('');
                                            setNewPolicyAction('spam');
                                            setEditingPolicyName(null);
                                            setIsCustomPolicyFormOpen(true);
                                        }}
                                        className="flex items-center gap-1.5 text-xs font-bold bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 px-3 py-2 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-all border border-brand-200 dark:border-brand-800/50 uppercase tracking-tight"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add New
                                    </button>
                                )}
                            </div>

                            {!canEditCustomPolicy ? (
                                <div className="bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center text-center justify-center">
                                    <Lock className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-3" />
                                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Pro Feature</p>
                                    <button 
                                        onClick={() => setActiveTab('plan')}
                                        className="text-xs font-bold text-brand-600 dark:text-brand-400 underline underline-offset-4"
                                    >
                                        View Plans
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {Object.keys(settings.customPolicyDescriptions).length === 0 ? (
                                        <div className="col-span-full text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">No custom policies</p>
                                        </div>
                                    ) : (
                                        Object.entries(settings.customPolicyDescriptions).map(([name, desc]) => {
                                            const isSelected = settings.selectedCustomPolicies.includes(name);
                                            return (
                                                <div 
                                                    key={name}
                                                    className={`group flex items-start gap-2.5 p-3 rounded-xl border transition-all duration-200 ${
                                                        isSelected 
                                                        ? 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/50' 
                                                        : 'bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
                                                    }`}
                                                >
                                                    <button 
                                                        onClick={() => toggleCustomPolicy(name)}
                                                        className={`w-4 h-4 rounded flex-shrink-0 border transition-all mt-0.5 ${
                                                            isSelected 
                                                            ? 'bg-purple-600 border-purple-600' 
                                                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        {isSelected && <Check className="w-2.5 h-2.5 text-white mx-auto" strokeWidth={4} />}
                                                    </button>
                                                    
                                                    <div className="flex-1 min-w-0 pointer-events-none sm:pointer-events-auto" onClick={() => toggleCustomPolicy(name)} style={{cursor: 'pointer'}}>
                                                        <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-purple-950 dark:text-purple-100' : 'text-slate-900 dark:text-white'}`}>
                                                            {name}
                                                        </h4>
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                                            {desc as string}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingPolicyName(name);
                                                                setNewPolicyName(name);
                                                                const match = (desc as string).match(/^Treat comments with (.*) as (.*)$/);
                                                                if (match) {
                                                                    setNewPolicyCondition(match[1]);
                                                                    setNewPolicyAction(match[2]);
                                                                } else {
                                                                    setNewPolicyCondition(desc as string);
                                                                    setNewPolicyAction('spam');
                                                                }
                                                                setIsCustomPolicyFormOpen(true);
                                                            }}
                                                            className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                                                        >
                                                            <Edit2 className="w-3 h-3" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteCustomPolicy(name);
                                                            }}
                                                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        {/* AI Sensitivity */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-brand-600 dark:text-brand-400">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-bold text-slate-900 dark:text-white">AI Sensitivity</label>
                                        <div className="group relative">
                                            <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-brand-500 transition-colors cursor-help" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 leading-relaxed font-medium">
                                                • <span className="text-brand-300 font-bold">Aggressive:</span> Flags more comments (potential false positives).
                                                <br/>
                                                • <span className="text-brand-300 font-bold">Strict:</span> Only flags very obvious violations.
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Configure how confident AI must be to flag a comment</p>
                                </div>
                                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block"></div>
                            </div>
                                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                                    {[
                                        { label: 'Aggressive', value: 75 },
                                        { label: 'Balanced', value: 90 },
                                        { label: 'Strict', value: 99 }
                                    ].map((option) => {
                                        const isActive = (
                                            option.value === 75 && settings.confidenceThreshold < 90
                                        ) || (
                                            option.value === 90 && settings.confidenceThreshold >= 90 && settings.confidenceThreshold < 99
                                        ) || (
                                            option.value === 99 && settings.confidenceThreshold >= 99
                                        );
                                        
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => setSettings({...settings, confidenceThreshold: option.value})}
                                                className={`
                                                    px-4 py-1.5 rounded-md text-xs font-bold transition-all
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

                        {/* Floating Action Bar - Persistent Save */}
                        {isDirty && (
                            <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                                <div className="bg-slate-900 text-white p-2 pl-5 pr-2 rounded-2xl shadow-2xl shadow-slate-900/40 flex items-center gap-6 border border-slate-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                                        <span className="text-sm font-medium">Unsaved changes</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={handleCancelChanges}
                                            className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                                        >
                                            Discard
                                        </button>
                                        <button 
                                            onClick={handleSaveSettings}
                                            disabled={isSaving}
                                            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="my-10 border-t border-slate-200 dark:border-slate-800"></div>

                    {/* Danger Zone */}
                    <div className="bg-red-50/30 dark:bg-red-900/5 rounded-xl border border-red-100 dark:border-red-900/30 p-6">
                        <h3 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
                            <Trash2 className="w-5 h-5" /> Danger Zone
                        </h3>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Remove Instagram Account</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Permanently disconnect <span className="font-bold">{currentAccount?.handle}</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => {
                                    setAccountToDelete(currentAccount);
                                    setIsDeleteModalOpen(true);
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-red-500/10"
                            >
                                Remove Account
                            </button>
                        </div>
                    </div>

                    {/* Custom Policy Form Modal */}
                    {isCustomPolicyFormOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {editingPolicyName ? 'Edit Policy' : 'Create Custom Policy'}
                                        </h3>
                                        <button 
                                            onClick={() => setIsCustomPolicyFormOpen(false)}
                                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            <AlertCircle className="w-5 h-5 rotate-45" />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Policy Name</label>
                                            <input 
                                                type="text"
                                                value={newPolicyName}
                                                onChange={(e) => setNewPolicyName(e.target.value)}
                                                disabled={!!editingPolicyName}
                                                placeholder="e.g. Scams, Competitors"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none disabled:opacity-50"
                                            />
                                        </div>
                                        
                                        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                                    <span>Treat comments with</span>
                                                </div>
                                                <textarea 
                                                    value={newPolicyCondition}
                                                    onChange={(e) => setNewPolicyCondition(e.target.value)}
                                                    className="w-full h-20 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none text-sm"
                                                />
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                                    <span>as</span>
                                                    <select 
                                                        value={newPolicyAction}
                                                        onChange={(e) => setNewPolicyAction(e.target.value)}
                                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold min-w-[120px]"
                                                    >
                                                        <option value="spam">Spam</option>
                                                        <option value="hateSpeech">Hate Speech</option>
                                                        <option value="harassment">Harassment</option>
                                                        <option value="violence">Violence</option>
                                                        <option value="sexualContent">Sexual Content</option>
                                                        <option value="selfHarm">Self Harm</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-3">
                                        <button onClick={() => setIsCustomPolicyFormOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
                                        <button onClick={handleSaveCustomPolicy} disabled={!newPolicyName || !newPolicyCondition || isSaving} className="flex-1 px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-brand-500/20 shadow-lg disabled:opacity-50">
                                            {isSaving ? 'Saving...' : 'Save Policy'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
              )}

              {/* --- PLAN & BILLING TAB --- */}
              {activeTab === 'plan' && (
                  <div className="animate-fade-in max-w-5xl mx-auto">
                    
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

              {/* --- SECURITY TAB --- */}
              {activeTab === 'security' && (
                  <div className="animate-fade-in max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Security Settings</h1>
                    </div>

                    {/* MFA Status Card - Hidden when setup wizard is active */}
                    {!isMFASetupOpen && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mfaStatus ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Multi-Factor Authentication (MFA)</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                    Secure your account with an extra layer of protection using your preferred authenticator app.
                                </p>
                            </div>
                        </div>

                        {!mfaStatus ? (
                            <div className="flex flex-col items-center py-6 text-center">
                                <Lock className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-4" />
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Authenticator App is Not Active</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mb-8">
                                    We recommend enabling MFA to protect your account from unauthorized access. You'll need an app like Google Authenticator or Authy.
                                </p>
                                <button 
                                    onClick={handleEnableMFA}
                                    disabled={isMFAInitLoading}
                                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isMFAInitLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <ShieldCheck className="w-4 h-4" />}
                                    Enable MFA
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col border border-slate-100 dark:border-slate-800 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-950/20">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Active Protection</span>
                                    </div>
                                    <button 
                                        onClick={handleDisableMFA}
                                        className="text-xs text-red-600 dark:text-red-400 font-bold hover:underline"
                                    >
                                        Disable MFA
                                    </button>
                                </div>
                                <div className="flex items-start gap-4">
                                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                    <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Your account is secured with 2FA. Every time you log in, you will be prompted for a 6-digit code from your authenticator app.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    )}

                    {/* MFA Setup Step-by-Step UI - Full width when active */}
                    {isMFASetupOpen && mfaSecret && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border-2 border-brand-500 dark:border-brand-500/50 p-8 animate-in slide-in-from-top-4 duration-300">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Configure Authenticator App</h3>
                            
                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-sm border border-slate-200 dark:border-slate-700">1</div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">Scan or Enter Secret</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                            Open your authenticator app (Google Authenticator, Authy, etc.) and scan the QR code below, or enter the secret manually.
                                        </p>
                                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 inline-block">
                                            {/* QR Code Placeholder - using a service for demo or just instructions */}
                                            <div className="w-48 h-48 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 mb-4">
                                                <img 
                                                    src={`https://quickchart.io/qr?text=${encodeURIComponent(`otpauth://totp/ShieldGram?secret=${mfaSecret}&issuer=ShieldGram`)}&size=200`} 
                                                    alt="QR Code" 
                                                    className="w-full h-full p-2"
                                                />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Manual Entry Code</p>
                                                <code className="text-sm font-mono text-brand-600 dark:text-brand-400 break-all bg-brand-50 dark:bg-brand-900/20 px-2 py-1 rounded select-all font-bold">
                                                    {mfaSecret}
                                                </code>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-sm border border-slate-200 dark:border-slate-700">2</div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">Verify Code</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                            Enter the 6-digit code currently shown in your app to confirm setup.
                                        </p>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text"
                                                maxLength={6}
                                                value={mfaVerificationCode}
                                                onChange={(e) => setMfaVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                className="w-full sm:w-48 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all text-center text-2xl font-bold tracking-[0.5em] text-slate-900 dark:text-white"
                                                placeholder="000000"
                                            />
                                            <button 
                                                onClick={handleVerifyMFA}
                                                disabled={isMFAVerifyLoading || mfaVerificationCode.length !== 6}
                                                className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 disabled:opacity-50 uppercase text-xs"
                                            >
                                                {isMFAVerifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Finish"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                <button 
                                    onClick={() => {
                                        setIsMFASetupOpen(false);
                                        setMfaSecret(null);
                                        setMfaVerificationCode('');
                                    }}
                                    className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    Cancel Setup
                                </button>
                            </div>
                        </div>
                    )}
                  </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && accountToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Remove Account?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Are you sure you want to remove <span className="font-bold text-slate-900 dark:text-white">{accountToDelete.handle}</span>? 
                All associated moderation history and statistics will be permanently deleted.
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isSaving}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Removing...' : 'Yes, Remove Account'}
                </button>
                <button 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setAccountToDelete(null);
                  }}
                  disabled={isSaving}
                  className="w-full py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
