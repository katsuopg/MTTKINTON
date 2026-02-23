import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(request: NextRequest) {
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
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Authentication check
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Extract locale from the pathname
  const locale = pathname.split('/')[1] || 'ja';

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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
