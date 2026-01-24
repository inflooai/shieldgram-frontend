
export const getAuthToken = (): string | null => {
  return getCookie('user-access-token');
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

export const setAuthTokens = (tokens: { accessToken: string; idToken: string; refreshToken?: string }) => {
  if (typeof window === 'undefined') return;
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname.endsWith('localhost') || hostname.includes('127.0.0.1');
  
  let domainAttribute = '';
  if (!isLocalhost) {
    const rootDomain = hostname.replace(/^(dashboard|www)\./, '');
    domainAttribute = `; domain=.${rootDomain}`;
  }

  const baseFlags = `; path=/; max-age=604800${domainAttribute}; SameSite=Lax; Secure`;

  // Store Access Token
  document.cookie = `user-access-token=${tokens.accessToken}${baseFlags}`;
  
  // Store ID Token
  document.cookie = `user-id-token=${tokens.idToken}${baseFlags}`;

  // Store Refresh Token if provided
  if (tokens.refreshToken) {
    document.cookie = `user-refresh-token=${tokens.refreshToken}${baseFlags}`;
  }
};

export const getAuthTokens = () => {
  return {
    accessToken: getCookie('user-access-token'),
    idToken: getCookie('user-id-token'),
    refreshToken: getCookie('user-refresh-token'),
  };
};

export const setAuthToken = (token: string) => {
  setAuthTokens({ accessToken: token, idToken: token }); // Fallback for single-token calls
};

export const removeAuthToken = () => {
  if (typeof window === 'undefined') return;
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname.endsWith('localhost') || hostname.includes('127.0.0.1');

  let domainAttribute = '';
  if (!isLocalhost) {
    const rootDomain = hostname.replace(/^(dashboard|www)\./, '');
    domainAttribute = `; domain=.${rootDomain}`;
  }
  
  const expireFlags = `; path=/; max-age=0${domainAttribute}; SameSite=Lax; Secure`;
  
  document.cookie = `user-access-token=${expireFlags}`;
  document.cookie = `user-id-token=${expireFlags}`;
  document.cookie = `user-refresh-token=${expireFlags}`;
  document.cookie = `user-token=${expireFlags}`; // Cleanup legacy cookie
};

export const setThemeCookie = (theme: 'light' | 'dark') => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname.endsWith('localhost') || hostname.includes('127.0.0.1');

  let domainAttribute = '';
  if (!isLocalhost) {
    const rootDomain = hostname.replace(/^(dashboard|www)\./, '');
    domainAttribute = `; domain=.${rootDomain}`;
  }

  // Set theme cookie for 1 year
  document.cookie = `sg-theme=${theme}; path=/; max-age=31536000${domainAttribute}; SameSite=Lax; Secure`;
};

export const getThemeCookie = (): 'light' | 'dark' | null => {
  return getCookie('sg-theme') as 'light' | 'dark' | null;
};
