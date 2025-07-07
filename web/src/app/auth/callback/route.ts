import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const returnUrl = requestUrl.searchParams.get('returnUrl');
    const origin = requestUrl.origin;

    if (!code) {
      console.error('No code provided to auth callback');
      return NextResponse.redirect(new URL('/auth?error=no_code', origin));
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        new URL(`/auth?error=${error.message}`, origin)
      );
    }

    // URL to redirect to after sign up process completes
    // Handle the case where returnUrl is 'null' (string) or actual null
    const redirectPath =
      returnUrl && returnUrl !== 'null'
        ? decodeURIComponent(returnUrl)
        : '/chat';

    // Ensure we have a valid URL by constructing it properly
    const redirectUrl = new URL(redirectPath, origin);
    
    console.log('Auth callback successful, redirecting to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Unexpected error in auth callback:', error);
    return NextResponse.redirect(
      new URL('/auth?error=unexpected_error', request.url)
    );
  }
} 