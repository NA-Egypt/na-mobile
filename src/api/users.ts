import { apiClient } from './client';
import {
  UserProfile,
  UserQueryFilters,
  CreateUserPayload,
  UpdateUserPayload,
  ApiResponse,
  PaginatedResponse,
} from './types';

export const usersApi = {
  /**
   * Retrieves users list (Super admin / RSC role required).
   */
  async getUsers(filters?: UserQueryFilters): Promise<UserProfile[]> {
    const response = await apiClient.get<PaginatedResponse<UserProfile> | ApiResponse<UserProfile[]> | UserProfile[]>(
      '/users',
      { params: filters }
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray((response.data as any).data)) {
      return (response.data as any).data;
    }
    return [];
  },

  /**
   * Retrieves single user profile by ID.
   */
  async getUser(id: number | string): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile> | UserProfile>(`/users/${id}`);
    return (response.data as ApiResponse<UserProfile>).data || (response.data as UserProfile);
  },

  /**
   * Creates a new user account (Super admin / RSC required).
   */
  async createUser(payload: CreateUserPayload): Promise<UserProfile> {
    const response = await apiClient.post<ApiResponse<UserProfile> | UserProfile>('/users', payload);
    return (response.data as ApiResponse<UserProfile>).data || (response.data as UserProfile);
  },

  /**
   * Updates user account details / role / service body assignment.
   */
  async updateUser(id: number | string, payload: UpdateUserPayload): Promise<UserProfile> {
    const response = await apiClient.put<ApiResponse<UserProfile> | UserProfile>(`/users/${id}`, payload);
    return (response.data as ApiResponse<UserProfile>).data || (response.data as UserProfile);
  },

  /**
   * Deletes or deactivates a user account.
   */
  async deleteUser(id: number | string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
