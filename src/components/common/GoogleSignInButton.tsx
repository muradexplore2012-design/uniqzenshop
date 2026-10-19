import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
  className?: string;
  theme?: 'light' | 'dark';
}

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = '963957373578-2mo24a13sr1hma3rgd5lud535c1jik1c.apps.googleusercontent.com';

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  className = '',
  theme = 'light',
}) => {
  const { loginWithGoogleCredential, loginWithGoogle } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [gisLoaded, setGisLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let checkInterval: any;

    const initGis = () => {
      if (window.google?.accounts?.id && buttonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response: any) => {
              if (response?.credential) {
                setLoading(true);
                try {
                  await loginWithGoogleCredential(response.credential);
                  if (onSuccess) onSuccess();
                } catch (err: any) {
                  console.error('GIS authentication error:', err);
                  if (onError) onError(err.message || 'Failed to authenticate with Google');
                } finally {
                  setLoading(false);
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render official native Google button
          buttonRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(buttonRef.current, {
            type: 'standard',
            shape: 'rectangular',
            theme: theme === 'dark' ? 'filled_blue' : 'outline',
            text: 'continue_with',
            size: 'large',
            logo_alignment: 'left',
            width: Math.min(buttonRef.current.parentElement?.clientWidth || 380, 400),
          });

          // Also trigger One Tap prompt for ultra-fast 1-tap sign-in
          try {
            window.google.accounts.id.prompt();
          } catch {
            // One Tap is optional
          }

          setGisLoaded(true);
          return true;
        } catch (e) {
          console.warn('Could not initialize Google Identity Services:', e);
        }
      }
      return false;
    };

    if (!initGis()) {
      checkInterval = setInterval(() => {
        if (initGis()) {
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [theme]);

  const handleFallbackClick = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (onError) onError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full flex flex-col items-center justify-center ${className}`}>
      {/* Container for Google's native rendered button */}
      <div
        ref={buttonRef}
        className={`w-full flex justify-center ${!gisLoaded ? 'hidden' : ''}`}
        style={{ minHeight: '44px' }}
      />

      {/* Fallback button if GIS script is still loading */}
      {!gisLoaded && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={loading}
          className={`w-full py-2.5 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-3 shadow-2xs transition-all disabled:opacity-50 ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-slate-200'
              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>
      )}

      {loading && gisLoaded && (
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Signing you in securely...</span>
        </div>
      )}
    </div>
  );
};
