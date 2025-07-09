'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, MailCheck } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const mode = searchParams.get('mode');
  const returnUrl = searchParams.get('returnUrl');
  const message = searchParams.get('message');

  const isSignUp = mode === 'signup';
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGoogleSignInLoading, setIsGoogleSignInLoading] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push(returnUrl || '/chat');
    }
  }, [user, isLoading, router, returnUrl]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Wait for session to be established
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Failed to establish session');
      }

      // Use replace instead of push to avoid navigation history issues
      router.replace(returnUrl || '/chat');
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Failed to sign in. Please try again.');
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback${returnUrl ? `?returnUrl=${returnUrl}` : ''}`,
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    setRegistrationEmail(email);
    setRegistrationSuccess(true);
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleSignInLoading) return;
    
    try {
      setIsGoogleSignInLoading(true);
      setError(null);
      
      const supabase = createClient();
      console.log('Starting Google sign-in flow');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          }
        }
      });

      if (error) {
        console.error('Google sign in error:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        setError(error.message);
      } else if (data?.url) {
        // Redirect to the OAuth provider
        window.location.href = data.url;
      } else {
        console.error('No URL returned from signInWithOAuth');
        setError('Failed to initiate sign in. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsGoogleSignInLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen w-full">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </main>
    );
  }

  if (registrationSuccess) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen w-full">
        <div className="w-full divide-y divide-border">
          <section className="w-full relative overflow-hidden">
            <div className="relative flex flex-col items-center w-full px-6">
              <div className="absolute inset-x-1/4 top-0 h-[600px] md:h-[800px] -z-20 bg-background rounded-b-xl"></div>

              <div className="relative z-10 pt-24 pb-8 max-w-xl mx-auto h-full w-full flex flex-col gap-2 items-center justify-center">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-full p-4 mb-6">
                    <MailCheck className="h-12 w-12 text-green-500 dark:text-green-400" />
                  </div>

                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tighter text-center text-balance text-primary mb-4">
                    Check your email
                  </h1>

                  <p className="text-base md:text-lg text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight max-w-md mb-2">
                    We've sent a confirmation link to:
                  </p>

                  <p className="text-lg font-medium mb-6">
                    {registrationEmail || 'your email address'}
                  </p>

                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50 rounded-lg p-6 mb-8 max-w-md w-full">
                    <p className="text-sm text-green-800 dark:text-green-400 leading-relaxed">
                      Click the link in the email to activate your account. If
                      you don't see the email, check your spam folder.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                    <Link
                      href="/"
                      className="flex h-12 items-center justify-center w-full text-center rounded-full border border-border bg-background hover:bg-accent/20 transition-all"
                    >
                      Return to home
                    </Link>
                    <Link
                      href="/auth"
                      className="flex h-12 items-center justify-center w-full text-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                    >
                      Back to sign in
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen w-full bg-background">
      <div className="w-full max-w-md mx-auto px-6">
        <div className="flex flex-col items-center space-y-6">
          <Link
            href="/"
            className="group border border-border/50 bg-background hover:bg-accent/20 rounded-full text-sm h-8 px-3 flex items-center gap-2 transition-all duration-200 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground text-xs tracking-wide">
              Back to home
            </span>
          </Link>

          <div className="text-center space-y-2">
            <h1 className="text-4xl font-medium tracking-tighter">Welcome Back</h1>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <div className="w-full space-y-4">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              variant="outline"
              disabled={isGoogleSignInLoading}
              className="w-full h-12 rounded-full flex items-center justify-center gap-2 bg-background hover:bg-accent/20 transition-all"
            >
              {isGoogleSignInLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 186.69 190.5"
                  className="shrink-0"
                >
                  <g transform="translate(1184.583 765.171)">
                    <path
                      clipPath="none"
                      mask="none"
                      d="M-1089.333-687.239v36.888h51.262c-2.251 11.863-9.006 21.908-19.137 28.662l30.913 23.986c18.011-16.625 28.402-41.044 28.402-70.052 0-6.754-.606-13.249-1.732-19.483z"
                      fill="#4285f4"
                    />
                    <path
                      clipPath="none"
                      mask="none"
                      d="M-1142.714-651.791l-6.972 5.337-24.679 19.223h0c15.673 31.086 47.796 52.561 85.03 52.561 25.717 0 47.278-8.486 63.038-23.033l-30.913-23.986c-8.486 5.715-19.31 9.179-32.125 9.179-24.765 0-45.806-16.712-53.34-39.226z"
                      fill="#34a853"
                    />
                    <path
                      clipPath="none"
                      mask="none"
                      d="M-1174.365-712.61c-6.494 12.815-10.217 27.276-10.217 42.689s3.723 29.874 10.217 42.689c0 .086 31.693-24.592 31.693-24.592-1.905-5.715-3.031-11.776-3.031-18.098s1.126-12.383 3.031-18.098z"
                      fill="#fbbc05"
                    />
                    <path
                      clipPath="none"
                      mask="none"
                      d="M-1089.333-727.244c14.028 0 26.497 4.849 36.455 14.201l27.276-27.276c-16.539-15.413-38.013-24.852-63.731-24.852-37.234 0-69.359 21.388-85.032 52.561l31.692 24.592c7.533-22.514 28.575-39.226 53.34-39.226z"
                      fill="#ea4335"
                    />
                  </g>
                </svg>
              )}
              <span className="text-foreground">
                {isGoogleSignInLoading ? 'Signing in...' : 'Continue with Google'}
              </span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="h-12 rounded-full bg-accent/10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password"
                  className="h-12 rounded-full bg-accent/10"
                  required
                />
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm Password"
                    className="h-12 rounded-full bg-accent/10"
                    required
                  />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </span>{' '}
              <Link
                href={`/auth?mode=${isSignUp ? 'signin' : 'signup'}${
                  returnUrl ? `&returnUrl=${returnUrl}` : ''
                }`}
                className="text-primary hover:underline"
              >
                {isSignUp ? 'Sign in' : 'Create one'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 