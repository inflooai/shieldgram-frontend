import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfill for global, which is needed by amazon-cognito-identity-js dependency
if (typeof window !== 'undefined') {
  (window as any).global = window;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);