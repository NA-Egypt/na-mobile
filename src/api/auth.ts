import { apiClient, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './client';
import * as SecureStore from 'expo-secure-store';
import { UserProfile, AzureLoginResponse, Role, Permission } from './types';

export { UserProfile, AzureLoginResponse };

export const authApi = {
  /**
   * Exchanges an Azure AD OAuth access token for a backend Laravel Sanctum personal access token.
   * Tries POST /auth/azure/login first, then falls back to POST /login/azure.
   */
  async loginWithAzureToken(accessToken: string): Promise<AzureLoginResponse> {
    let responseData: AzureLoginResponse;

    try {
      const response = await apiClient.post<AzureLoginResponse>('/auth/azure/login', {
        access_token: accessToken,
      });
      responseData = response.data;
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        // Fallback endpoint
        const fallbackRes = await apiClient.post<AzureLoginResponse>('/login/azure', {
          access_token: accessToken,
        });
        responseData = fallbackRes.data;
      } else {
        throw err;
      }
    }

    const { token, user } = responseData;
    if (token) {
      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    }
    if (user) {
      await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(user));
    }
    return responseData;
  },

  /**
   * Fetches the currently authenticated user profile from GET /user
   */
  async getCurrentUser(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/user');
    const user = response.data;
    await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  /**
   * Fetches available roles (Super admin / RSC / ServiceBody)
   */
  async getRoles(): Promise<Role[]> {
    const response = await apiClient.get<Role[]>('/roles');
    return response.data;
  },

  /**
   * Fetches permissions matrix
   */
  async getPermissions(): Promise<Permission[]> {
    const response = await apiClient.get<Permission[]>('/permissions');
    return response.data;
  },

  /**
   * Logs out the user and destroys tokens locally and remotely
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.warn('Backend logout error (continuing local cleanup):', e);
    } finally {
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
      await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
    }
  },

  /**
   * Retrieves the stored Sanctum Bearer token
   */
  async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Retrieves the stored user profile
   */
  async getStoredUser(): Promise<UserProfile | null> {
    try {
      const raw = await SecureStore.getItemAsync(USER_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};
