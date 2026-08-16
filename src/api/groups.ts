import { apiClient } from './client';
import {
  Group,
  GroupQueryFilters,
  CreateGroupPayload,
  ApiResponse,
  PaginatedResponse,
} from './types';

export const groupsApi = {
  /**
   * Retrieves groups collection with pagination & relations.
   */
  async getGroups(filters?: GroupQueryFilters): Promise<PaginatedResponse<Group> | Group[]> {
    const response = await apiClient.get<PaginatedResponse<Group> | Group[]>('/groups', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Retrieves a single group by ID.
   */
  async getGroup(id: number | string): Promise<Group> {
    const response = await apiClient.get<ApiResponse<Group> | Group>(`/groups/${id}`);
    return (response.data as ApiResponse<Group>).data || (response.data as Group);
  },

  /**
   * Creates a new group (requires authentication).
   */
  async createGroup(payload: CreateGroupPayload): Promise<Group> {
    const response = await apiClient.post<ApiResponse<Group> | Group>('/groups', payload);
    return (response.data as ApiResponse<Group>).data || (response.data as Group);
  },

  /**
   * Updates an existing group (requires authentication).
   */
  async updateGroup(id: number | string, payload: Partial<CreateGroupPayload>): Promise<Group> {
    const response = await apiClient.put<ApiResponse<Group> | Group>(`/groups/${id}`, payload);
    return (response.data as ApiResponse<Group>).data || (response.data as Group);
  },

  /**
   * Deletes a group (requires authentication).
   */
  async deleteGroup(id: number | string): Promise<void> {
    await apiClient.delete(`/groups/${id}`);
  },
};
