import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read auth token cookie set by Zustand store login/checkSession
  const token = request.cookies.get('eduflow_token');
  const isAuthenticated = !!token;

  // Define protected paths
  const protectedRoutes = ['/learn', '/instructor', '/admin', '/my-courses', '/cart'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Define authentication paths
  const authRoutes = ['/login', '/register'];
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  if (isProtectedRoute && !isAuthenticated) {
    // Redirect unauthenticated users to login with a redirect parameter
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    // Redirect authenticated users trying to access login/register to homepage
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Config to specify matching paths
export const config = {
  matcher: [
    '/learn/:path*',
    '/instructor/:path*',
    '/admin/:path*',
    '/my-courses/:path*',
    '/cart',
    '/login',
    '/register',
  ],
};
