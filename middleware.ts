import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
  ],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Define allowed domains (localhost handled automatically mostly, but good to be explicit)
  // We assume 'dashboard.' prefix is the trigger.
  
  const isDashboard = hostname.startsWith("dashboard.");

  if (isDashboard) {
    // Rewrite requests to /dashboard/*
    // e.g. dashboard.example.com/ -> /dashboard
    // e.g. dashboard.example.com/settings -> /dashboard/settings
    
    // Maintain the path execution if it's not already in /dashboard (rewrite, not redirect)
    if (!url.pathname.startsWith('/dashboard')) {
        url.pathname = `/dashboard${url.pathname === '/' ? '' : url.pathname}`;
        return NextResponse.rewrite(url);
    }
  } else {
      // Landing page logic:
      // Prevent access to /dashboard routes via main domain
      // Allow access to /dashboard on main domain (e.g. for localhost)
      // if (url.pathname.startsWith('/dashboard')) {
      //    url.pathname = '/404';
      //    return NextResponse.rewrite(url);
      // }
  }

  return NextResponse.next();
}
