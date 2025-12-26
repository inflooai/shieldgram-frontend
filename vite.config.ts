import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env.COGNITO_USER_POOL_ID': JSON.stringify(env.COGNITO_USER_POOL_ID || ''),
      'process.env.COGNITO_CLIENT_ID': JSON.stringify(env.COGNITO_CLIENT_ID || ''),
      'process.env.RAZORPAY_KEY_ID': JSON.stringify(env.RAZORPAY_KEY_ID || ''),
    },
    build: {
      outDir: 'dist',
    },
  };
});