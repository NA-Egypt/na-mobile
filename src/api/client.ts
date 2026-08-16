import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse, FrontpageData, JftData, FrontpageStats, Meeting, MeetingQueryFilters } from './types';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://egyptna.org/api/v1';

export const TOKEN_STORAGE_KEY = 'na_egypt_sanctum_token';
export const USER_STORAGE_KEY = 'na_egypt_user_data';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to retrieve auth token from SecureStore', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
      await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
    }
    return Promise.reject(error);
  }
);

/**
 * Universal NA-Egypt API Client implementation matching Section 5 in na-egypt-api skill.
 */
export class NaEgyptApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15000,
    });
  }

  public setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, config: AxiosRequestConfig = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...((config.headers as Record<string, string>) || {}),
    };

    const response = await this.client.request<T>({
      url: endpoint,
      ...config,
      headers,
    });

    return response.data;
  }

  // Azure Token Exchange
  public async loginWithAzure(azureAccessToken: string) {
    const res = await this.request<{ user: any; token: string }>('/auth/azure/login', {
      method: 'POST',
      data: { access_token: azureAccessToken },
    });
    this.setToken(res.token);
    return res;
  }

  // Fetch Frontpage Consolidated Data
  public async getHomeData(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request<ApiResponse<FrontpageData>>(`/home${query}`);
  }

  // Fetch Just For Today Daily Reading
  public async getJft(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request<ApiResponse<JftData>>(`/jft${query}`);
  }

  // Fetch Public Stats
  public async getStats() {
    return this.request<ApiResponse<FrontpageStats>>('/stats');
  }

  // Fetch Meetings
  public async getMeetings(params?: MeetingQueryFilters) {
    return this.request<ApiResponse<Meeting[]>>('/meetings', { params });
  }
}
