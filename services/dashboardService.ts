import { PolicyType } from "../types";
// @ts-ignore
import { CognitoUserPool, CognitoUser, CognitoIdToken, CognitoAccessToken, CognitoRefreshToken, CognitoUserSession } from 'amazon-cognito-identity-js';
import { getAuthTokens, setAuthTokens, removeAuthToken } from '../utils/auth';

const COGNITO_CONFIG = {
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID, 
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
};

const base = process.env.NEXT_PUBLIC_DASHBOARD_API_URL || "";
const DASHBOARD_API_URL = base.endsWith('/') ? base.slice(0, -1) : base;

const pgBase = process.env.LAMBDA_URL || process.env.NEXT_PUBLIC_LAMBDA_URL || "";
const PLAYGROUND_API_URL = pgBase.endsWith('/') ? pgBase.slice(0, -1) : pgBase;

export interface AccountInfo {
  account_id: string;
  account_name: string;
  owner_user_id: string;
  plan_type: string;
  policies: string;
  custom_policy: string;
  confidence_threshold: number;
  profile_picture_url: string;
  custom_policy_definitions?: { policy_name: string, description: string }[];
  is_deauthorized?: boolean;
  stats?: {
    comments_scanned: number;
    comments_moderated: number;
    processing_time?: number;
  };
}


export interface DashboardData {
  accounts: AccountInfo[];
  plan_type: string;
  status: string;
  subscription_details: any;
  created_at?: number;
}

/**
 * Ensures a valid session is available. Refreshes if access token is expired.
 */
export const getValidToken = async (): Promise<string> => {
  const { idToken, accessToken, refreshToken } = getAuthTokens();
  
  if (!idToken || !accessToken || !refreshToken) {
    throw new Error("No session found");
  }

  // If we are in mock mode, just return the dummy token
  if (!COGNITO_CONFIG.UserPoolId || COGNITO_CONFIG.UserPoolId.includes('xxx')) {
    return accessToken;
  }

  const userPool = new CognitoUserPool({
    UserPoolId: COGNITO_CONFIG.UserPoolId,
    ClientId: COGNITO_CONFIG.ClientId,
  });

  // Reconstruct session
  const cognitoIdToken = new CognitoIdToken({ IdToken: idToken });
  const cognitoAccessToken = new CognitoAccessToken({ AccessToken: accessToken });
  const cognitoRefreshToken = new CognitoRefreshToken({ RefreshToken: refreshToken });
  
  const session = new CognitoUserSession({
    IdToken: cognitoIdToken,
    AccessToken: cognitoAccessToken,
    RefreshToken: cognitoRefreshToken,
  });

  if (session.isValid()) {
    return accessToken;
  }

  // Session expired, attempt refresh
  console.log("Session expired, refreshing...");
  const user = new CognitoUser({
    Username: cognitoIdToken.decodePayload().email || "",
    Pool: userPool
  });

  return new Promise((resolve, reject) => {
    user.refreshSession(cognitoRefreshToken, (err: any, newSession: any) => {
      if (err) {
        console.error("Failed to refresh session", err);
        removeAuthToken(); // Logout on hard failure
        reject(err);
        return;
      }
      
      const newTokens = {
        accessToken: newSession.getAccessToken().getJwtToken(),
        idToken: newSession.getIdToken().getJwtToken(),
        refreshToken: newSession.getRefreshToken().getToken()
      };
      
      setAuthTokens(newTokens);
      resolve(newTokens.accessToken);
    });
  });
};

/**
 * Gets a CognitoUser instance with an active session attached.
 */
const getCognitoUser = async (): Promise<CognitoUser> => {
  const { idToken, accessToken, refreshToken } = getAuthTokens();
  if (!idToken || !accessToken || !refreshToken) throw new Error("No session found");

  const userPool = new CognitoUserPool({
    UserPoolId: COGNITO_CONFIG.UserPoolId,
    ClientId: COGNITO_CONFIG.ClientId,
  });

  const cognitoIdToken = new CognitoIdToken({ IdToken: idToken });
  const cognitoAccessToken = new CognitoAccessToken({ AccessToken: accessToken });
  const cognitoRefreshToken = new CognitoRefreshToken({ RefreshToken: refreshToken });

  const session = new CognitoUserSession({
    IdToken: cognitoIdToken,
    AccessToken: cognitoAccessToken,
    RefreshToken: cognitoRefreshToken,
  });

  const user = new CognitoUser({
    Username: cognitoIdToken.decodePayload().email || "",
    Pool: userPool
  });

  // IMPORTANT: Attach the session to the user
  user.setSignInUserSession(session);

  return user;
};

export const initiateMFASetup = async (): Promise<string> => {
  const user = await getCognitoUser();
  await getValidToken(); // Ensure session is active

  return new Promise((resolve, reject) => {
    user.associateSoftwareToken({
      associateSecretCode: (secretCode: string) => {
        resolve(secretCode);
      },
      onFailure: (err: any) => {
        reject(err);
      }
    });
  });
};

export const finalizeMFASetup = async (code: string): Promise<void> => {
  const user = await getCognitoUser();
  await getValidToken();

  return new Promise((resolve, reject) => {
    user.verifySoftwareToken(code, 'ShieldGram', {
      onSuccess: (session: any) => {
        console.log("TOTP verified successfully", session);
        // After verifying, set TOTP as the preferred MFA method
        user.setUserMfaPreference(
          null, // SMS settings (null = no change)
          { PreferredMfa: true, Enabled: true }, // TOTP settings
          (err: any, result: any) => {
            if (err) {
              console.error("Failed to set MFA preference", err);
              reject(err);
            } else {
              console.log("MFA preference set successfully", result);
              resolve();
            }
          }
        );
      },
      onFailure: (err: any) => {
        console.error("TOTP verification failed", err);
        reject(err);
      }
    });
  });
};

export const disableMFA = async (): Promise<void> => {
  const user = await getCognitoUser();
  await getValidToken();

  return new Promise((resolve, reject) => {
    user.setUserMfaPreference(null, {
      PreferredMfa: false,
      Enabled: false
    }, (err: any) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const getMFAStatus = async (): Promise<boolean> => {
  const user = await getCognitoUser();
  await getValidToken();

  return new Promise((resolve) => {
    user.getUserData((err: any, data: any) => {
      if (err) {
        resolve(false);
        return;
      }
      const mfaSetting = data.UserMFASettingList || [];
      const preferredMFA = data.PreferredMfaSetting;
      resolve(mfaSetting.includes('SOFTWARE_TOKEN_MFA') || preferredMFA === 'SOFTWARE_TOKEN_MFA');
    }, { bypassCache: true }); // Always check fresh status
  });
};

export const getDashboardInfo = async (): Promise<DashboardData> => {
  const idToken = await getValidToken();

  try {
    const response = await fetch(`${DASHBOARD_API_URL}/dashboard-info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiError = new Error(errorData.error || `API error: ${response.status}`) as any;
      apiError.status = response.status;
      throw apiError;
    }

    const data = await response.json();
    return {
      accounts: data.accounts || [],
      plan_type: data.plan_type || 'standard',
      status: data.status || '',
      subscription_details: data.subscription_details || null,
      created_at: data.created_at
    };
  } catch (error) {
    console.error("Error fetching dashboard info:", error);
    throw error;
  }
};

export const saveDashboardControls = async (
  account_id: string,
  owner_user_id: string,
  policies: string,
  plan_type: string,
  custom_policy: string,
  confidence_threshold: number
): Promise<void> => {
  const idToken = await getValidToken();
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/save-controls`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id,
        owner_user_id,
        policies,
        plan_type,
        custom_policy,
        confidence_threshold
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiError = new Error(errorData.error || `API error: ${response.status}`) as any;
      apiError.status = response.status;
      throw apiError;
    }
  } catch (error) {
    console.error("Error saving dashboard controls:", error);
    throw error;
  }
};

export const addInstagramAccount = async (code: string): Promise<any> => {
  const idToken = await getValidToken();
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/add-account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiError = new Error(errorData.error || `API error: ${response.status}`) as any;
      apiError.status = response.status;
      throw apiError;
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding Instagram account:", error);
    throw error;
  }
};

export const getInterventions = async (account_id: string, limit: number = 10): Promise<any[]> => {
  const idToken = await getValidToken();
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/interventions?account_id=${account_id}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiError = new Error(errorData.error || `API error: ${response.status}`) as any;
      apiError.status = response.status;
      throw apiError;
    }

    const data = await response.json();
    return data.interventions || [];
  } catch (error) {
    throw error;
  }
};

export const saveCustomPolicy = async (
  account_id: string,
  policy_name: string,
  description: string
): Promise<void> => {
  const idToken = await getValidToken();
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/save-custom-policy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id,
        policy_name,
        description
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiError = new Error(errorData.error || `API error: ${response.status}`) as any;
      apiError.status = response.status;
      throw apiError;
    }
  } catch (error) {
    console.error("Error saving custom policy:", error);
    throw error;
  }
};

export const deleteCustomPolicy = async (
  account_id: string,
  policy_name: string
): Promise<void> => {
  const idToken = await getValidToken();
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/delete-custom-policy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id,
        policy_name
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiError = new Error(errorData.error || `API error: ${response.status}`) as any;
      apiError.status = response.status;
      throw apiError;
    }
  } catch (error) {
    console.error("Error deleting custom policy:", error);
    throw error;
  }
};

export const removeInstagramAccount = async (account_id: string): Promise<void> => {
  const idToken = await getValidToken();
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/dashboard-info?account_id=${account_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiError = new Error(errorData.error || `API error: ${response.status}`) as any;
      apiError.status = response.status;
      throw apiError;
    }
  } catch (error) {
    console.error("Error removing Instagram account:", error);
    throw error;
  }
};

export const processIntervention = async (
  account_id: string,
  comment_id: string | null,
  commenter_id: string | null,
  action: 'HIDE' | 'DELETE' | 'RESTRICT' | 'SAFE',
  action_type: 'COMMENT' | 'USER' = 'COMMENT'
): Promise<void> => {
  const idToken = await getValidToken();
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/intervene`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id,
        comment_id,
        commenter_id,
        action,
        action_type
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiError = new Error(errorData.error || `API error: ${response.status}`) as any;
      apiError.status = response.status;
      throw apiError;
    }
  } catch (error) {
    console.error("Error processing intervention:", error);
    throw error;
  }
};

export const getPlans = async (currency: 'INR' | 'USD' = 'INR'): Promise<any[]> => {
  let idToken = null;
  try {
     idToken = await getValidToken();
  } catch (e) {
     // Ignore token error for public route
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const response = await fetch(`${PLAYGROUND_API_URL}/plans?currency=${currency}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiError = new Error(errorData.error || `API error: ${response.status}`) as any;
      apiError.status = response.status;
      throw apiError;
    }

    const data = await response.json();
    return data.plans || [];
  } catch (error) {
    console.error("Error fetching plans:", error);
    return [];
  }
};

export const createSubscription = async (plan_id: string): Promise<string | null> => {
  const idToken = await getValidToken();
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/create-subscription`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan_id })
    });

    if (!response.ok) {
      console.error("Failed to create subscription:", response.status);
      return null;
    }

    const data = await response.json();
    return data.subscription_id || null;
  } catch (error) {
    console.error("Error creating subscription:", error);
    return null;
  }
};

export const startFreeTrial = async (planType: 'standard' | 'pro'): Promise<string> => {
  const idToken = await getValidToken();
  const response = await fetch(`${DASHBOARD_API_URL}/start-free-trial`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan_type: planType })
  });

  const data = await response.json();
  if (!response.ok) {
    const apiError = new Error(data.error || `API error: ${response.status}`) as any;
    apiError.status = response.status;
    throw apiError;
  }
  return data.plan_type;
};

export const updateSubscription = async (plan_id: string): Promise<any> => {
  const idToken = await getValidToken();
  const response = await fetch(`${DASHBOARD_API_URL}/update-subscription`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan_id })
  });

  const data = await response.json();
  if (!response.ok) {
    const apiError = new Error(data.error || `API error: ${response.status}`) as any;
    apiError.status = response.status;
    throw apiError;
  }
  return data;
};

export const cancelSubscription = async (): Promise<any> => {
  const idToken = await getValidToken();
  const response = await fetch(`${DASHBOARD_API_URL}/cancel-subscription`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    }
  });

  const data = await response.json();
  if (!response.ok) {
    const apiError = new Error(data.error || `API error: ${response.status}`) as any;
    apiError.status = response.status;
    throw apiError;
  }
  return data;
};

export const getPaymentMethod = async (): Promise<any> => {
  const idToken = await getValidToken();
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/payment-method`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      const errorData = await response.json().catch(() => ({}));
      const apiError = new Error(errorData.error || `API error: ${response.status}`) as any;
      apiError.status = response.status;
      throw apiError;
    }

    const data = await response.json();
    return data.payment_method || null;
  } catch (error) {
    console.error("Error fetching payment method:", error);
    throw error;
  }
};

export const sendInvoice = async (email: string, year: number, month: number): Promise<void> => {
  const idToken = await getValidToken();
  const response = await fetch(`${DASHBOARD_API_URL}/send-invoice`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, year, month })
  });

  const data = await response.json();
  if (!response.ok) {
    const apiError = new Error(data.error || `API error: ${response.status}`) as any;
    apiError.status = response.status;
    throw apiError;
  }
};
