import { apiClient, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './client';
import * as SecureStore from 'expo-secure-store';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  roles: string[]; // e.g. ['group_trusted_servant', 'service_body_member', 'admin']
}

export interface AzureLoginResponse {
  token: string;
  user: UserProfile;
}

export const authApi = {
  async loginWithAzureToken(accessToken: string): Promise<AzureLoginResponse> {
    const response = await apiClient.post<AzureLoginResponse>('/auth/azure/login', {
      access_token: accessToken,
    });
    
    const { token, user } = response.data;
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(user));
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.warn('Backend logout failed, clearing local tokens', e);
    } finally {
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
      await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
    }
  },

  async getStoredToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
  },

  async getStoredUser(): Promise<UserProfile | null> {
    const raw = await SecureStore.getItemAsync(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};
