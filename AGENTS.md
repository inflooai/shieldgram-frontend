# AGENTS.md - ShieldGram Frontend

Guidelines for AI coding agents working in this repository.

## Project Overview

ShieldGram is an Instagram comment moderation SaaS. This is the Next.js 16 frontend with:
- **Framework**: Next.js 16.1.1 (App Router), React 19
- **Auth**: AWS Cognito (amazon-cognito-identity-js)
- **Styling**: Tailwind CSS 3.4 with custom brand colors
- **Language**: TypeScript 5.8 (strict mode OFF)

## Build/Lint/Test Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint with Next.js config
```

**No test infrastructure exists.** If adding tests, prefer Vitest with `__tests__/` directories.

## Project Structure

```
shieldgram-frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout (fonts, metadata)
│   ├── page.tsx           # Landing page
│   └── dashboard/page.tsx # Dashboard page
├── components/            # React components (PascalCase)
├── services/              # API service functions
│   └── dashboardService.ts
├── utils/auth.ts          # Cookie-based auth utilities
├── types.ts               # Shared TypeScript types
└── middleware.ts          # Subdomain routing
```

## Code Style Guidelines

### Imports Order

```typescript
// 1. React and external libraries
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

// 2. Icons (lucide-react)
import { Menu, X, Shield } from 'lucide-react';

// 3. Internal imports using @/ path alias
import { getAuthTokens } from '@/utils/auth';
import { ModerationResult } from '@/types';
```

### Component Pattern

```typescript
interface ComponentProps {
  title: string;
  onAction: () => void;
  isActive?: boolean;
}

const Component: React.FC<ComponentProps> = ({ title, onAction, isActive = false }) => {
  const [state, setState] = useState<string>('');
  return <div className="...">{/* JSX */}</div>;
};

export default Component;
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Dashboard.tsx`, `AuthPage.tsx` |
| Utilities/Services | camelCase | `dashboardService.ts`, `auth.ts` |
| Functions | camelCase | `handleLogin`, `fetchUserData` |
| Types/Interfaces | PascalCase | `DashboardProps`, `UserSettings` |
| Enums | PascalCase + UPPER_SNAKE values | `CommentRiskLevel.SAFE` |
| Constants | UPPER_SNAKE_CASE | `COGNITO_CONFIG` |

### TypeScript

- **Strict mode is OFF** - be mindful of null/undefined
- Use explicit return types for exported functions
- Define shared interfaces in `types.ts`
- Use `@ts-ignore` sparingly

```typescript
export const fetchData = async (): Promise<DashboardData> => { ... };

export interface Account {
  account_id: string;
  account_name: string;
  is_token_expired?: boolean;
}
```

### Styling (Tailwind CSS)

- Tailwind utility classes exclusively
- Dark mode via `dark:` prefix (class-based)
- Custom brand colors: `brand-50` through `brand-950`

```tsx
<div className={`p-4 rounded-lg bg-white dark:bg-gray-800
  ${isActive ? 'border-brand-500' : 'border-gray-200'}`}>
```

### Error Handling

```typescript
// Service layer
try {
  const response = await authenticatedFetch(url, options);
  if (!response.ok) throw new Error(errorData.message || 'Request failed');
  return await response.json();
} catch (error) {
  console.error('API Error:', error);
  throw error;
}

// Component
const [error, setError] = useState<string | null>(null);
setError(err instanceof Error ? err.message : 'Unknown error');
```

### API Service Pattern

All API calls go through `services/dashboardService.ts`:

```typescript
const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const response = await fetch(url, options);
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error("Session expired");
  }
  return response;
};
```

### Client Components

Most pages use `'use client'` directive - this is intentional for client-side rendering.

## Environment Variables

Client-side variables use `NEXT_PUBLIC_` prefix:
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `NEXT_PUBLIC_INSTAGRAM_APP_ID`

## Key Files

| Purpose | File |
|---------|------|
| Root layout | `app/layout.tsx` |
| Dashboard | `components/Dashboard.tsx` |
| Auth (Cognito) | `components/AuthPage.tsx` |
| API layer | `services/dashboardService.ts` |
| Auth utils | `utils/auth.ts` |
| Types | `types.ts` |

## Notes for Agents

1. **Large components** - `Dashboard.tsx` is 1800+ lines; extract when modifying
2. **No tests** - Add tests for significant changes
3. **Subdomain routing** - `dashboard.*` subdomains route to `/dashboard`
4. **Token refresh** - Backend Lambda handles this; frontend shows re-auth UI when `is_token_expired` is true
5. **State management** - Local state only (`useState`/`useReducer`), no global store
6. **Auth flow** - Cognito with cookies; `getValidToken()` auto-refreshes expired tokens
