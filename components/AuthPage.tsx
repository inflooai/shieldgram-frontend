import React, { useState } from 'react';
import { ArrowRight, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
// @ts-ignore - Importing from esm.sh
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { setAuthToken } from '../utils/auth';
import logo from '../logo.svg';
  
interface AuthPageProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

// =========================================================================
// AWS COGNITO BOILERPLATE CONFIGURATION
// Configured to use Environment Variables for easy Amplify Deployment
// =========================================================================
const COGNITO_CONFIG = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-1_ZzzjCk0xy', 
  ClientId: process.env.COGNITO_CLIENT_ID || '1b0v6afasbk0kbhp68dijl5s4c'
};

type AuthMode = 'signin' | 'signup' | 'verify';

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onCancel }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if we are running in mock mode (if env vars are missing or placeholders)
  const isMockMode = !process.env.COGNITO_USER_POOL_ID || COGNITO_CONFIG.UserPoolId.includes('ZzzjCk0xy');

  // Safe initialization of User Pool
  let userPool: any = null;
  if (!isMockMode) {
    try {
      userPool = new CognitoUserPool({
        UserPoolId: COGNITO_CONFIG.UserPoolId,
        ClientId: COGNITO_CONFIG.ClientId,
      });
    } catch (e) {
      console.error("Error initializing Cognito User Pool:", e);
    }
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (isMockMode) {
         console.warn('AWS Cognito Config missing or using placeholders. Using mock signup for demo.');
         setTimeout(() => {
             setIsLoading(false);
             setAuthMode('verify');
             setSuccessMessage('Mock verification code sent! (Use any code)');
         }, 1000);
         return;
    }

    if (!userPool) return;

    userPool.signUp(email, password, [], [], (err: any, result: any) => {
      setIsLoading(false);
      if (err) {
        console.error(err);
        setError(err.message || JSON.stringify(err));
        return;
      }
      setAuthMode('verify');
      setSuccessMessage('Account created! Please check your email for the verification code.');
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (isMockMode) {
        setTimeout(() => {
            setIsLoading(false);
            setAuthMode('signin');
            setSuccessMessage('Account verified! Please sign in.');
            setVerificationCode('');
        }, 1000);
        return;
    }

    const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
    });

    cognitoUser.confirmRegistration(verificationCode, true, (err: any, result: any) => {
        setIsLoading(false);
        if (err) {
            console.error(err);
            setError(err.message || 'Verification failed');
            return;
        }
        setAuthMode('signin');
        setSuccessMessage('Verification successful! You can now log in.');
        setVerificationCode('');
    });
  };

  const handleResendCode = () => {
      if (isMockMode) {
          setSuccessMessage('Mock code resent!');
          return;
      }

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
    });

    cognitoUser.resendConfirmationCode((err: any, result: any) => {
        if (err) {
            setError(err.message || 'Failed to resend code');
            return;
        }
        setSuccessMessage('Verification code resent successfully.');
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (isMockMode) {
         console.warn('AWS Cognito Config missing or using placeholders. Using mock login for demo.');
         setTimeout(() => {
             setAuthToken('shieldgram-dummy-jwt-token');
             setIsLoading(false);
             onLoginSuccess();
         }, 1000);
         return;
    }

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result: any) => {
        setIsLoading(false);
        const accessToken = result.getAccessToken().getJwtToken();
        setAuthToken(accessToken);
        onLoginSuccess();
      },
      onFailure: (err: any) => {
        setIsLoading(false);
        console.error(err);
        setError(err.message || 'Authentication failed');
      },
      newPasswordRequired: (userAttributes: any, requiredAttributes: any) => {
        setIsLoading(false);
        setError("New password required (Challenge not implemented in boilerplate)");
      }
    });
  };

  const getTitle = () => {
      switch(authMode) {
          case 'signin': return 'Welcome back';
          case 'signup': return 'Create an account';
          case 'verify': return 'Verify email';
      }
  };

  const getSubtitle = () => {
      switch(authMode) {
          case 'signin': return 'Sign in to access your dashboard';
          case 'signup': return 'Start your 7-day free trial';
          case 'verify': return 'Enter the code sent to your email';
      }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="flex justify-center mb-8">
            <img src={logo} alt="ShieldGram" className="h-16 w-auto" />
        </div>

        <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {getTitle()}
        </h2>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
          {getSubtitle()}
        </p>

        {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800 animate-fade-in">
                {error}
            </div>
        )}

        {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg border border-green-100 dark:border-green-800 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                {successMessage}
            </div>
        )}

        <form onSubmit={authMode === 'signin' ? handleLogin : authMode === 'signup' ? handleSignup : handleVerify} className="space-y-4">
          
          {authMode !== 'verify' && (
             <>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white"
                    placeholder="name@company.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                    <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white"
                    placeholder="••••••••"
                    />
                    {authMode === 'signup' && (
                        <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters with numbers and symbols.</p>
                    )}
                </div>
             </>
          )}

          {authMode === 'verify' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Verification Code</label>
                <input 
                  type="text" 
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white text-center text-xl tracking-widest"
                  placeholder="123456"
                />
                <div className="flex justify-end mt-2">
                    <button 
                        type="button" 
                        onClick={handleResendCode}
                        className="text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                        <RefreshCw className="w-3 h-3" /> Resend Code
                    </button>
                </div>
              </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                authMode === 'signin' ? 'Sign In' : 
                authMode === 'signup' ? 'Create Account' : 
                'Verify Account'
            }
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {authMode === 'signin' ? "Don't have an account? " : 
             authMode === 'signup' ? "Already have an account? " : 
             "Wrong email? "}
            
            <button 
              onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  if (authMode === 'verify') {
                      setAuthMode('signup');
                  } else {
                      setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                  }
              }}
              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              {authMode === 'signin' ? 'Sign up' : 
               authMode === 'signup' ? 'Log in' : 
               'Back'}
            </button>
          </p>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <button onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
