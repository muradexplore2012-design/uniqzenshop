import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { Loader2 } from 'lucide-react';

const GOOGLE_CLIENT_ID = '963957373578-2mo24a13sr1hma3rgd5lud535c1jik1c.apps.googleusercontent.com';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
  className?: string;
  theme?: 'light' | 'dark';
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  className = '',
  theme = 'light',
}) => {
  const { loginWithGoogle, loginWithGoogleRedirect, loginWithGoogleCredential } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [gisLoaded, setGisLoaded] = useState<boolean>(false);
  const gsiContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const handleCredentialResponse = async (response: any) => {
      if (!response?.credential) return;
      setLoading(true);
      try {
        const user = await loginWithGoogleCredential(response.credential);
        if (user && isMounted) {
          if (onSuccess) onSuccess();
        }
      } catch (err: any) {
        console.error('Google Sign-In Error:', err);
        if (onError && isMounted) {
          onError(err?.message || 'Google authentication failed.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const setupGsi = () => {
      if ((window as any).google?.accounts?.id && gsiContainerRef.current) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          gsiContainerRef.current.innerHTML = '';
          const parentWidth = gsiContainerRef.current.parentElement?.clientWidth || 360;
          const buttonWidth = Math.min(Math.max(parentWidth, 240), 400);

          (window as any).google.accounts.id.renderButton(gsiContainerRef.current, {
            type: 'standard',
            theme: theme === 'dark' ? 'filled_black' : 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: buttonWidth,
          });
          setGisLoaded(true);
        } catch (e) {
          console.warn('GIS init notice:', e);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      setupGsi();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(interval);
          setupGsi();
        }
      }, 100);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [theme]);

  const handleFallbackClick = async () => {
    setLoading(true);
    try {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            loginWithGoogle()
              .then((u) => {
                if (u && onSuccess) onSuccess();
              })
              .catch((err) => {
                if (onError) onError(err?.message || 'Failed to sign in with Google');
              })
              .finally(() => setLoading(false));
          }
        });
        return;
      }
      const user = await loginWithGoogle();
      if (user && onSuccess) onSuccess();
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        try {
          await loginWithGoogleRedirect();
          return;
        } catch (redirErr: any) {
          if (onError) onError(redirErr?.message || 'Google Sign-In failed.');
        }
      } else {
        if (onError) onError(err?.message || 'Google Sign-In failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative w-full flex items-center justify-center min-h-[44px] ${className}`}>
      {/* Official Google Identity Services Button Container - Stays permanently mounted */}
      <div
        ref={gsiContainerRef}
        className={`w-full flex justify-center transition-opacity duration-150 ${
          loading ? 'opacity-40 pointer-events-none' : 'opacity-100'
        } ${gisLoaded ? 'flex' : 'hidden'}`}
      />

      {/* Smooth, perfectly centered loading overlay - Never shifts or distorts the button */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-xl z-10">
          <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
        </div>
      )}

      {/* Fallback button shown only if GIS script is still loading */}
      {!gisLoaded && !loading && (
        <button
          type="button"
          onClick={handleFallbackClick}
          className={`w-full py-2.5 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-3 shadow-2xs transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-700 hover:border-slate-600 hover:bg-slate-850 text-slate-200'
              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700'
          }`}
        >
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
        </button>
      )}
    </div>
  );
};
