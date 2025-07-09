import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Simplified middleware - only protect specific routes
  let response = NextResponse.next();

  // Only protect specific routes for now
  const protectedRoutes = ['/chat', '/settings'];
  const isProtectedRoute = protectedRoutes.some((path) => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (!isProtectedRoute) {
    return response;
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.delete(name);
          },
        },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const returnUrl = request.nextUrl.pathname + request.nextUrl.search;
      return NextResponse.redirect(
        new URL(`/auth?returnUrl=${encodeURIComponent(returnUrl)}`, request.url)
      );
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // Don't redirect on error, just log it
    return response;
  }
}



export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 