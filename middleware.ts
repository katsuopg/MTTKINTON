import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(request: NextRequest) {
  // Create Supabase client for auth check
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Authentication check
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  
  // Extract locale from the pathname
  const locale = pathname.split('/')[1] || 'ja';
  
  // Set locale header for root layout
  response.headers.set('x-locale', locale);
  
  // Protected paths
  const protectedPaths = ['/dashboard', '/projects', '/work-orders', '/parts', '/purchase-requests'];
  const isProtectedPath = protectedPaths.some(path => pathname.includes(path));
  
  // Auth paths
  const authPaths = ['/auth/login', '/auth/signup'];
  const isAuthPath = authPaths.some(path => pathname.includes(path));
  
  // Redirect unauthenticated users from protected paths
  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }
  
  // Redirect authenticated users from auth pages
  if (user && isAuthPath) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return response;
}

export const config = {
  // Match only internationalized pathnames and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};