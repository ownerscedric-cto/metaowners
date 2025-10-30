'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  currency: string;
  account_status: string;
}

interface FacebookLoginProps {
  onLoginSuccess?: (user: User, adAccounts: AdAccount[], accessToken: string) => void;
  onLoginError?: (error: string) => void;
}

export default function FacebookLogin({ onLoginSuccess, onLoginError }: FacebookLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get Facebook OAuth URL from our API
      const authResponse = await fetch('http://localhost:3003/api/auth/facebook', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!authResponse.ok) {
        throw new Error('Failed to get Facebook auth URL');
      }

      const { authUrl } = await authResponse.json();

      // Step 2: Open popup for Facebook login
      const popup = window.open(
        authUrl,
        'facebook-login',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Step 3: Listen for popup messages
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'FACEBOOK_AUTH_SUCCESS') {
          const { code, state } = event.data;
          popup.close();

          try {
            // Step 4: Exchange code for access token
            const callbackResponse = await fetch('http://localhost:3003/api/auth/facebook/callback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code, state }),
            });

            if (!callbackResponse.ok) {
              const errorData = await callbackResponse.json();
              throw new Error(errorData.error || 'Authentication failed');
            }

            const data = await callbackResponse.json();

            if (data.success) {
              // Success! Save tokens and user data
              localStorage.setItem('facebook_access_token', data.accessToken);
              localStorage.setItem('user_info', JSON.stringify(data.user));
              localStorage.setItem('ad_accounts', JSON.stringify(data.adAccounts));

              onLoginSuccess?.(data.user, data.adAccounts, data.accessToken);

              // Redirect to dashboard
              router.refresh();
            } else {
              throw new Error(data.error || 'Authentication failed');
            }
          } catch (error) {
            console.error('Callback error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
            setError(errorMessage);
            onLoginError?.(errorMessage);
          }
        } else if (event.data.type === 'FACEBOOK_AUTH_ERROR') {
          popup.close();
          const errorMessage = event.data.error || 'Facebook authentication failed';
          setError(errorMessage);
          onLoginError?.(errorMessage);
        }

        window.removeEventListener('message', handleMessage);
      };

      window.addEventListener('message', handleMessage);

      // Step 5: Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
        }
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate Facebook login';
      setError(errorMessage);
      onLoginError?.(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={handleFacebookLogin}
        disabled={isLoading}
        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>연결 중...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Facebook으로 계정 연결하기</span>
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center max-w-md">
        <p className="text-sm text-gray-600">
          Facebook 광고 계정을 연결하면 실시간으로 광고 성과 데이터를 확인할 수 있습니다.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          안전한 OAuth 2.0 인증을 사용하며, 비밀번호는 저장되지 않습니다.
        </p>
      </div>
    </div>
  );
}