import { PolicyType } from "../types";

const base = import.meta.env.VITE_DASHBOARD_API_URL || "";
const DASHBOARD_API_URL = base.endsWith('/') ? base.slice(0, -1) : base;

export interface AccountInfo {
  account_id: string;
  account_name: string;
  owner_user_id: string;
  plan_type: string;
  policies: string;
  custom_policy: string;
  profile_picture_url: string;
}


export interface DashboardData {
  accounts: AccountInfo[];
  plan_type: string;
}

export const getDashboardInfo = async (idToken: string): Promise<DashboardData> => {

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
      plan_type: data.plan_type || 'standard'
    };
  } catch (error) {
    console.error("Error fetching dashboard info:", error);
    throw error;
  }
};

export const saveDashboardControls = async (
  idToken: string,
  account_id: string,
  owner_user_id: string,
  policies: string,
  plan_type: string,
  custom_policy: string
): Promise<void> => {
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
        custom_policy
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

export const addInstagramAccount = async (idToken: string, code: string): Promise<any> => {
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

export const getInterventions = async (idToken: string, account_id: string, limit: number = 10): Promise<any[]> => {
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
    console.error("Error fetching interventions:", error);
    throw error;
  }
};

