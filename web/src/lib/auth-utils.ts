import { createClient } from '@/lib/supabase/server';
import { createClient as createClientClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

/**
 * Server-side authentication utilities for secure operations
 * 
 * These functions use getUser() which validates the JWT token with Supabase's servers,
 * making them secure for server-side operations like API routes and data access.
 */

/**
 * Get authenticated user on the server side (secure)
 * Use this for server-side operations, API routes, and security-critical contexts
 */
export async function getAuthenticatedUser(): Promise<{ user: User | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Authentication error:', error);
      return { user: null, error: error.message };
    }
    
    return { user, error: null };
  } catch (error) {
    console.error('Failed to get authenticated user:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

/**
 * Require authentication for server-side operations
 * Throws an error if user is not authenticated
 */
export async function requireAuth(): Promise<User> {
  const { user, error } = await getAuthenticatedUser();
  
  if (!user || error) {
    throw new Error(error || 'Authentication required');
  }
  
  return user;
}

/**
 * Client-side authentication utilities for UI state management
 * 
 * These functions use getSession() which is faster for UI purposes but less secure.
 * Only use these for display logic, not for security-critical operations.
 */

/**
 * Get current session on client side (for UI state only)
 * Use this for client-side UI state management and display logic
 */
export async function getCurrentSession() {
  try {
    const supabase = createClientClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      return { session: null, error: error.message };
    }
    
    return { session, error: null };
  } catch (error) {
    console.error('Failed to get current session:', error);
    return { session: null, error: 'Session retrieval failed' };
  }
}

/**
 * Verify user authentication on client side (more secure)
 * Use this when you need to verify authentication on the client side
 */
export async function verifyClientAuth(): Promise<{ user: User | null; error: string | null }> {
  try {
    const supabase = createClientClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Client auth verification error:', error);
      return { user: null, error: error.message };
    }
    
    return { user, error: null };
  } catch (error) {
    console.error('Failed to verify client authentication:', error);
    return { user: null, error: 'Authentication verification failed' };
  }
} 