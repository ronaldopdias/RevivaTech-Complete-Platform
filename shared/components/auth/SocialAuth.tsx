import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import { toast } from 'react-hot-toast';

/**
 * Enhanced Social Authentication Component
 * Supports multiple social providers with comprehensive error handling
 */

interface SocialProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
}

interface SocialAuthProps {
  providers?: string[];
  variant?: 'button' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
  redirectTo?: string;
  onSuccess?: (provider: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
}

const defaultProviders: SocialProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: 'https://developers.google.com/identity/images/g-logo.png',
    color: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
    enabled: true
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    color: 'bg-gray-900 text-white hover:bg-gray-800',
    enabled: true
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: 'bg-blue-600 text-white hover:bg-blue-700',
    enabled: true
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: '🐦',
    color: 'bg-blue-400 text-white hover:bg-blue-500',
    enabled: true
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-700 text-white hover:bg-blue-800',
    enabled: true
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    icon: '🏢',
    color: 'bg-blue-500 text-white hover:bg-blue-600',
    enabled: true
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: '🍎',
    color: 'bg-black text-white hover:bg-gray-800',
    enabled: true
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: '🎮',
    color: 'bg-indigo-600 text-white hover:bg-indigo-700',
    enabled: true
  }
];

export const SocialAuth: React.FC<SocialAuthProps> = ({
  providers = ['google', 'github', 'facebook'],
  variant = 'button',
  size = 'md',
  redirectTo = '/dashboard',
  onSuccess,
  onError,
  className = '',
  disabled = false
}) => {
  const { user, isLoading } = useUser();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // Filter enabled providers
  const enabledProviders = defaultProviders.filter(p => 
    providers.includes(p.id) && p.enabled
  );

  const handleSocialLogin = async (provider: string) => {
    if (disabled || loadingProvider) return;

    setLoadingProvider(provider);

    try {
      // Construct Auth0 social login URL
      const authUrl = new URL('/api/auth/login', window.location.origin);
      authUrl.searchParams.set('connection', provider);
      authUrl.searchParams.set('returnTo', redirectTo);

      // Redirect to Auth0 social login
      window.location.href = authUrl.toString();

      // Success callback (will be called after redirect)
      if (onSuccess) {
        onSuccess(provider);
      }

    } catch (error) {
      console.error(`${provider} login error:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(`${provider} login failed: ${errorMessage}`);
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-6 w-6';
      default:
        return 'h-5 w-5';
    }
  };

  // Don't render if user is already logged in
  if (user) {
    return null;
  }

  if (variant === 'icon') {
    return (
      <div className={`flex space-x-2 ${className}`}>
        {enabledProviders.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleSocialLogin(provider.id)}
            disabled={disabled || loadingProvider === provider.id}
            className={`
              ${getSizeClasses()}
              ${provider.color}
              border rounded-md font-medium
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center
              ${loadingProvider === provider.id ? 'opacity-50' : ''}
            `}
            title={`Login with ${provider.name}`}
          >
            {loadingProvider === provider.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <span className={getIconSize()}>{provider.icon}</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {enabledProviders.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleSocialLogin(provider.id)}
            disabled={disabled || loadingProvider === provider.id}
            className={`
              w-full ${getSizeClasses()}
              ${provider.color}
              border rounded-md font-medium
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center space-x-2
              ${loadingProvider === provider.id ? 'opacity-50' : ''}
            `}
          >
            {loadingProvider === provider.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <>
                <span className={getIconSize()}>{provider.icon}</span>
                <span>Continue with {provider.name}</span>
              </>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Default button variant
  return (
    <div className={`space-y-3 ${className}`}>
      {enabledProviders.map((provider) => (
        <button
          key={provider.id}
          onClick={() => handleSocialLogin(provider.id)}
          disabled={disabled || loadingProvider === provider.id}
          className={`
            w-full ${getSizeClasses()}
            ${provider.color}
            border rounded-md font-medium
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center space-x-2
            ${loadingProvider === provider.id ? 'opacity-50' : ''}
          `}
        >
          {loadingProvider === provider.id ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          ) : (
            <>
              {provider.icon.startsWith('http') ? (
                <img 
                  src={provider.icon} 
                  alt={provider.name}
                  className={getIconSize()}
                />
              ) : (
                <span className={getIconSize()}>{provider.icon}</span>
              )}
              <span>Continue with {provider.name}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
};

// Individual social provider components
interface SocialProviderButtonProps {
  provider: string;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
}

export const GoogleLoginButton: React.FC<SocialProviderButtonProps> = (props) => (
  <SocialAuth {...props} providers={['google']} />
);

export const GitHubLoginButton: React.FC<SocialProviderButtonProps> = (props) => (
  <SocialAuth {...props} providers={['github']} />
);

export const FacebookLoginButton: React.FC<SocialProviderButtonProps> = (props) => (
  <SocialAuth {...props} providers={['facebook']} />
);

export const TwitterLoginButton: React.FC<SocialProviderButtonProps> = (props) => (
  <SocialAuth {...props} providers={['twitter']} />
);

export const LinkedInLoginButton: React.FC<SocialProviderButtonProps> = (props) => (
  <SocialAuth {...props} providers={['linkedin']} />
);

export const MicrosoftLoginButton: React.FC<SocialProviderButtonProps> = (props) => (
  <SocialAuth {...props} providers={['microsoft']} />
);

export const AppleLoginButton: React.FC<SocialProviderButtonProps> = (props) => (
  <SocialAuth {...props} providers={['apple']} />
);

export const DiscordLoginButton: React.FC<SocialProviderButtonProps> = (props) => (
  <SocialAuth {...props} providers={['discord']} />
);

// Hook for social auth functionality
export const useSocialAuth = () => {
  const { user, isLoading } = useUser();
  const [connecting, setConnecting] = useState(false);

  const connectSocialAccount = async (provider: string) => {
    if (connecting || !user) return;

    setConnecting(true);

    try {
      const response = await fetch('/api/auth/connect-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect social account');
      }

      const data = await response.json();
      
      // Redirect to Auth0 for account linking
      window.location.href = data.authUrl;

    } catch (error) {
      console.error('Error connecting social account:', error);
      toast.error('Failed to connect social account');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectSocialAccount = async (provider: string) => {
    if (connecting || !user) return;

    setConnecting(true);

    try {
      const response = await fetch('/api/auth/disconnect-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect social account');
      }

      toast.success(`${provider} account disconnected successfully`);

    } catch (error) {
      console.error('Error disconnecting social account:', error);
      toast.error('Failed to disconnect social account');
    } finally {
      setConnecting(false);
    }
  };

  return {
    user,
    isLoading,
    connecting,
    connectSocialAccount,
    disconnectSocialAccount
  };
};

// Social account management component
interface SocialAccountsProps {
  onAccountConnected?: (provider: string) => void;
  onAccountDisconnected?: (provider: string) => void;
}

export const SocialAccountsManager: React.FC<SocialAccountsProps> = ({
  onAccountConnected,
  onAccountDisconnected
}) => {
  const { user, connecting, connectSocialAccount, disconnectSocialAccount } = useSocialAuth();
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);

  useEffect(() => {
    // Fetch connected social accounts
    const fetchConnectedAccounts = async () => {
      try {
        const response = await fetch('/api/auth/connected-accounts');
        if (response.ok) {
          const data = await response.json();
          setConnectedAccounts(data.connectedAccounts || []);
        }
      } catch (error) {
        console.error('Error fetching connected accounts:', error);
      }
    };

    if (user) {
      fetchConnectedAccounts();
    }
  }, [user]);

  const handleConnect = async (provider: string) => {
    await connectSocialAccount(provider);
    if (onAccountConnected) {
      onAccountConnected(provider);
    }
  };

  const handleDisconnect = async (provider: string) => {
    await disconnectSocialAccount(provider);
    setConnectedAccounts(prev => prev.filter(p => p !== provider));
    if (onAccountDisconnected) {
      onAccountDisconnected(provider);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Connected Accounts</h3>
      
      <div className="space-y-3">
        {defaultProviders.map((provider) => {
          const isConnected = connectedAccounts.includes(provider.id);
          
          return (
            <div
              key={provider.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{provider.icon}</span>
                <div>
                  <h4 className="font-medium">{provider.name}</h4>
                  <p className="text-sm text-gray-500">
                    {isConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => isConnected ? handleDisconnect(provider.id) : handleConnect(provider.id)}
                disabled={connecting}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isConnected
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {connecting ? 'Processing...' : isConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SocialAuth;