import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isDashboard = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, request) => {
  if (isDashboard(request)) await auth.protect();
  if (request.nextUrl.pathname === '/api/user/sync' && !(await auth()).userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
});

export const config = {
  // Match all dashboard paths, even those containing a file extension.
  // Webhooks bypass session middleware and authenticate with a Svix signature.
  matcher: ['/dashboard/:path*', '/api/user/sync', '/sign-in/:path*', '/sign-up/:path*'],
};
