import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const returnUrl = requestUrl.searchParams.get('returnUrl') || '/'
  const origin = requestUrl.origin

  if (!code) {
    console.error('No code provided to auth callback')
    return NextResponse.redirect(new URL('/auth?error=no_code', origin))
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(error.message)}`, origin)
      )
    }

    if (!data.session) {
      console.error('No session returned from code exchange')
      return NextResponse.redirect(
        new URL('/auth?error=no_session', origin)
      )
    }

    // Create response with redirect
    const response = NextResponse.redirect(new URL(returnUrl, origin))

    // The session is already set by exchangeCodeForSession, no need to manually set cookies
    console.log('Auth callback successful, redirecting to:', returnUrl)

    return response
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(
      new URL('/auth?error=unexpected_error', origin)
    )
  }
} 