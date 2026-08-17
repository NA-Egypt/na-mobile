import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { authApi, UserProfile } from '../api/auth';
import { apiClient, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../api/client';
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

// NA Egypt Azure Single-Tenant Credentials
export const AZURE_TENANT_ID =
  process.env.EXPO_PUBLIC_AZURE_TENANT_ID || '478baa9e-715e-47cb-adb3-60cd287349ca';
export const AZURE_CLIENT_ID =
  process.env.EXPO_PUBLIC_AZURE_CLIENT_ID || '061b99c2-58ee-4d69-98cd-e637658b191d';

// Scopes required for Servant identification & backend validation
export const AZURE_SCOPES = ['openid', 'profile', 'email', 'offline_access', 'User.Read'];

// Azure Active Directory v2.0 endpoints for Single-Tenant
export const discoveryEndpoints: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`,
  revocationEndpoint: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/logout`,
  endSessionEndpoint: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/logout`,
};

export interface LoginResult {
  success: boolean;
  user?: UserProfile;
  sanctumToken?: string;
  cancelled?: boolean;
  error?: string;
}

/**
 * Returns the appropriate redirect URI based on platform and broker registration.
 */
export function getAzureRedirectUri(): string {
  if (Platform.OS === 'android') {
    return (
      process.env.EXPO_PUBLIC_AZURE_REDIRECT_URI ||
      'msauth://org.naegypt.app/Xo8WBi6jzSxKDVR4drqm84yr9iU%3D'
    );
  } else if (Platform.OS === 'ios') {
    return 'msauth.org.naegypt.app://auth';
  }
  return AuthSession.makeRedirectUri({
    scheme: 'naegypt',
    path: 'auth-callback',
  });
}

export const azureAuthService = {
  /**
   * Initiates Interactive Microsoft / Azure AD login with account chooser support.
   * Gracefully handles broker redirect, web browser popup, and token exchange with backend.
   */
  async loginInteractive(): Promise<LoginResult> {
    try {
      const redirectUri = getAzureRedirectUri();

      // Create Authorization Request with PKCE
      const authRequest = new AuthSession.AuthRequest({
        clientId: AZURE_CLIENT_ID,
        scopes: AZURE_SCOPES,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        prompt: AuthSession.Prompt.SelectAccount, // Account chooser prompt
        extraParams: {
          domain_hint: 'egyptna.org',
        },
      });

      // Prompt user with native broker / system browser
      const authResponse = await authRequest.promptAsync(discoveryEndpoints, {
        showInRecents: true,
      });

      if (authResponse.type === 'cancel' || authResponse.type === 'dismiss') {
        return { success: false, cancelled: true };
      }

      if (authResponse.type === 'error') {
        const errorMsg =
          (authResponse as any).error?.description ||
          (authResponse as any).error?.message ||
          (authResponse as any).params?.error_description ||
          'Authentication encountered an error.';
        return {
          success: false,
          error: errorMsg,
        };
      }

      if (authResponse.type === 'success' && authResponse.params.code) {
        // Exchange authorization code for Azure AD tokens (PKCE token exchange)
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: AZURE_CLIENT_ID,
            scopes: AZURE_SCOPES,
            redirectUri,
            code: authResponse.params.code,
            extraParams: {
              code_verifier: authRequest.codeVerifier || '',
            },
          },
          discoveryEndpoints
        );

        const azureAccessToken = tokenResult.accessToken || tokenResult.idToken;
        if (!azureAccessToken) {
          throw new Error('No access token received from Azure AD.');
        }

        // Exchange Azure access token for Laravel Sanctum session & servant profile
        const backendAuthData = await authApi.loginWithAzureToken(azureAccessToken);

        return {
          success: true,
          user: backendAuthData.user,
          sanctumToken: backendAuthData.token,
        };
      }

      // Fallback: If redirected with direct token in URL
      if (authResponse.type === 'success' && authResponse.params.access_token) {
        const backendAuthData = await authApi.loginWithAzureToken(
          authResponse.params.access_token
        );
        return {
          success: true,
          user: backendAuthData.user,
          sanctumToken: backendAuthData.token,
        };
      }

      return {
        success: false,
        error: 'Authentication did not return a valid authorization code.',
      };
    } catch (error: any) {
      console.warn('Azure Interactive Auth Error:', error);
      // If PKCE direct exchange fails (e.g. strict single-tenant client secret requirement),
      // attempt hybrid backend redirect fallback
      return await azureAuthService.loginWithBackendRedirect();
    }
  },

  /**
   * Fallback: Authenticates via the backend OAuth redirection route (GET /auth/azure/redirect).
   */
  async loginWithBackendRedirect(): Promise<LoginResult> {
    try {
      const redirectUri = 'naegypt://auth-callback';
      const authUrl = `https://egyptna.org/auth/azure/redirect?redirect_uri=${encodeURIComponent(
        redirectUri
      )}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { success: false, cancelled: true };
      }

      if (result.type === 'success' && result.url) {
        const urlParams = new URLSearchParams(result.url.split('?')[1] || '');
        const token = urlParams.get('token') || urlParams.get('access_token');
        const userJson = urlParams.get('user');

        if (token) {
          await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
          let userProfile: UserProfile | undefined;
          if (userJson) {
            try {
              userProfile = JSON.parse(decodeURIComponent(userJson));
              await SecureStore.setItemAsync(
                USER_STORAGE_KEY,
                JSON.stringify(userProfile)
              );
            } catch {
              // Ignore json parse error
            }
          }

          if (!userProfile) {
            userProfile = await authApi.getCurrentUser().catch(() => undefined);
          }

          return {
            success: true,
            user: userProfile,
            sanctumToken: token,
          };
        }
      }

      return {
        success: false,
        error: 'Failed to receive Sanctum authentication token from redirect URL.',
      };
    } catch (e: any) {
      console.warn('Backend OAuth Redirect Error:', e);
      return {
        success: false,
        error: e.message || 'Connection error during Microsoft Authentication.',
      };
    }
  },

  /**
   * Silent Auto-Login check on app startup.
   * Verifies if a stored Sanctum token exists and refreshes the user profile.
   */
  async checkSilentAuth(): Promise<UserProfile | null> {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      if (!token) {
        return null;
      }

      // Check cached user data first
      const storedUser = await authApi.getStoredUser();

      // Validate session with backend
      try {
        const freshUser = await authApi.getCurrentUser();
        return freshUser;
      } catch (err: any) {
        if (err.response?.status === 401) {
          // Token expired or invalidated
          await authApi.logout();
          return null;
        }
        // Return stored user if offline
        return storedUser;
      }
    } catch (error) {
      console.warn('Silent Auth Check failed:', error);
      return null;
    }
  },

  /**
   * Sign out servant.
   * @param fullBrokerSignOut If true, launches Microsoft logout to clear browser/broker account session.
   */
  async signOut(fullBrokerSignOut: boolean = false): Promise<void> {
    try {
      // 1. Invalidate Sanctum token on backend and clear SecureStore
      await authApi.logout();

      // 2. Clear Microsoft SSO browser session if full logout requested
      if (fullBrokerSignOut) {
        const logoutUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(
          'naegypt://auth-callback'
        )}`;
        await WebBrowser.openAuthSessionAsync(logoutUrl, 'naegypt://auth-callback');
      }
    } catch (e) {
      console.warn('Sign-out error:', e);
    }
  },
};
