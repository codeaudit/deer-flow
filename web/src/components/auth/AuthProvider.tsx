'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

type Account = {
  account_id: string;
  account_role: 'owner' | 'member';
  is_primary_owner: boolean;
  name: string | null;
  slug: string | null;
  personal_account: boolean;
  created_at: string;
  updated_at: string;
};

type AuthContextType = {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  account: Account | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabaseRef = useRef(
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true
        }
      }
    )
  );
  const supabase = supabaseRef.current;
  
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccount = async (userId: string) => {
    try {
      console.log('Fetching account for user:', userId);
      const { data, error } = await supabase.rpc('get_personal_account');
      
      if (error) {
        console.error('RPC error fetching account:', error);
        // For now, don't block if account fetching fails
        setAccount(null);
        return;
      }
      
      console.log('Account data received:', data);
      if (data) {
        setAccount(data);
        console.log('Account set successfully');
      } else {
        console.log('No account data returned');
        setAccount(null);
      }
    } catch (error) {
      console.error('Exception fetching account:', error);
      setAccount(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting initial session:', sessionError);
          setIsLoading(false);
          return;
        }
        
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          // Fetch account in background, don't block initial auth
          fetchAccount(initialSession.user.id).catch(error => {
            console.error('Initial account fetch failed:', error);
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setAccount(null);
        router.replace('/auth');
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch account in background, don't block auth flow
          fetchAccount(session.user.id).catch(error => {
            console.error('Background account fetch failed:', error);
          });
          if (pathname === '/auth') {
            router.replace('/chat');
          }
        }
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]); // Remove supabase and router from deps array since they're stable

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setAccount(null);
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    supabase,
    session,
    user,
    account,
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 