'use client';

import { useEffect, useCallback, useState } from 'react';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from 'next-themes';

// Add type declarations for Google One Tap
declare global {
  interface Window {
    handleGoogleSignIn?: (response: GoogleSignInResponse) => void;
    google: {
      accounts: {
        id: {
          initialize: (config: GoogleInitializeConfig) => void;
          renderButton: (
            element: HTMLElement,
            options: GoogleButtonOptions,
          ) => void;
          prompt: (
            callback?: (notification: GoogleNotification) => void,
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

// Define types for Google Sign-In
interface GoogleSignInResponse {
  credential: string;
  clientId?: string;
  select_by?: string;
}

interface GoogleInitializeConfig {
  client_id: string | undefined;
  callback: ((response: GoogleSignInResponse) => void) | undefined;
  nonce?: string;
  use_fedcm?: boolean;
  context?: string;
  itp_support?: boolean;
}

interface GoogleButtonOptions {
  type?: string;
  theme?: string;
  size?: string;
  text?: string;
  shape?: string;
  logoAlignment?: string;
  width?: number;
}

interface GoogleNotification {
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
  isSkippedMoment: () => boolean;
  getSkippedReason: () => string;
  isDismissedMoment: () => boolean;
  getDismissedReason: () => string;
}

interface GoogleSignInProps {
  returnUrl?: string;
}

export function GoogleSignIn({ returnUrl }: GoogleSignInProps) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [isLoading, setIsLoading] = useState(false);
  const { resolvedTheme } = useTheme();

  const handleGoogleSignIn = useCallback(
    async (response: GoogleSignInResponse) => {
      try {
        setIsLoading(true);
        console.log('Starting Google sign in process');
        
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });

        if (error) {
          console.error('Error signing in with Google:', error);
          throw error;
        }

        console.log('Google sign in successful, preparing redirect');

        // Add a delay before redirecting to ensure session is properly saved
        setTimeout(() => {
          console.log('Executing redirect to:', returnUrl || '/dashboard');
          window.location.href = returnUrl || '/dashboard';
        }, 500);
      } catch (error) {
        console.error('Error in Google sign in process:', error);
        setIsLoading(false);
      }
    },
    [returnUrl],
  );

  useEffect(() => {
    // Assign the callback to window object so it can be called from the Google button
    window.handleGoogleSignIn = handleGoogleSignIn;

    if (window.google && googleClientId) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleSignIn,
        use_fedcm: true,
        context: 'signin',
        itp_support: true,
      });
    }

    return () => {
      // Cleanup
      delete window.handleGoogleSignIn;
      if (window.google) {
        window.google.accounts.id.cancel();
      }
    };
  }, [googleClientId, handleGoogleSignIn]);

  if (!googleClientId) {
    return (
      <button
        disabled
        className="w-full h-12 flex items-center justify-center gap-2 text-sm font-medium tracking-wide rounded-full bg-background border border-border opacity-60 cursor-not-allowed"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 186.69 190.5"
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
        <span>Google Sign-In Not Configured</span>
      </button>
    );
  }

  return (
    <>
      {/* Google One Tap container */}
      <div
        id="g_id_onload"
        data-client_id={googleClientId}
        data-context="signin"
        data-ux_mode="popup"
        data-auto_prompt="false"
        data-itp_support="true"
        data-callback="handleGoogleSignIn"
      />

      {/* Google Sign-In button container styled to match site design */}
      <div id="google-signin-button" className="w-full h-12">
        {/* The Google button will be rendered here */}
      </div>

      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.google && googleClientId) {
            // Style the button after Google script loads
            const buttonContainer = document.getElementById(
              'google-signin-button',
            );
            if (buttonContainer) {
              window.google.accounts.id.renderButton(buttonContainer, {
                type: 'standard',
                theme: resolvedTheme === 'dark' ? 'filled_black' : 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'pill',
                logoAlignment: 'left',
                width: buttonContainer.offsetWidth,
              });

              // Apply custom styles to match site design
              setTimeout(() => {
                const googleButton =
                  buttonContainer.querySelector('div[role="button"]');
                if (googleButton instanceof HTMLElement) {
                  googleButton.style.borderRadius = '9999px';
                  googleButton.style.width = '100%';
                  googleButton.style.height = '48px';
                  googleButton.style.border = '1px solid var(--border)';
                  googleButton.style.background = 'var(--background)';
                  googleButton.style.transition = 'all 0.2s';
                }
              }, 100);
            }
          }
        }}
      />
    </>
  );
} 