import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const runtime = 'edge'

export async function createClient() {
  const cookieStore = await cookies()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables on server side');
  }
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({
            name,
            value,
            ...options,
            // Always set path to root to ensure cookies are accessible everywhere
            path: '/',
            // Use Lax by default as it's more secure than 'None' but still works for most cases
            sameSite: options.sameSite || 'lax',
            // Only use secure in production
            secure: process.env.NODE_ENV === 'production',
            // Set httpOnly for sensitive cookies
            httpOnly: name.includes('pkce') || name.includes('refresh')
          })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({
            name,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            ...options
          })
        }
      }
    }
  )
} 