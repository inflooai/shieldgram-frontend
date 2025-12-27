
export const getAuthToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )user-token=([^;]+)'));
  return match ? match[2] : null;
};

export const setAuthToken = (token: string) => {
  // Determine root domain to allow sharing cookies between dashboard.site.com and site.com
  const hostname = window.location.hostname;
  
  // Logic to handle localhost vs production domains
  let domainAttribute = '';
  if (hostname !== 'localhost' && !hostname.includes('127.0.0.1')) {
    // Remove 'dashboard.' or 'www.' to get the root domain
    const rootDomain = hostname.replace(/^(dashboard|www)\./, '');
    domainAttribute = `; domain=.${rootDomain}`;
  }

  // Set cookie for 7 days
  document.cookie = `user-token=${token}; path=/; max-age=604800${domainAttribute}; SameSite=Lax; Secure`;
};

export const removeAuthToken = () => {
  const hostname = window.location.hostname;
  let domainAttribute = '';
  if (hostname !== 'localhost' && !hostname.includes('127.0.0.1')) {
    const rootDomain = hostname.replace(/^(dashboard|www)\./, '');
    domainAttribute = `; domain=.${rootDomain}`;
  }
  
  document.cookie = `user-token=; path=/; max-age=0${domainAttribute}; SameSite=Lax; Secure`;
};
