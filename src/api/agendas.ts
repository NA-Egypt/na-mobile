import { apiClient } from './client';
import {
  GroupAgenda,
  CreateGroupAgendaPayload,
  UpdateGroupAgendaPayload,
  ServiceBodyAgenda,
  CreateServiceBodyAgendaPayload,
  ApiResponse,
} from './types';

export const agendasApi = {
  // --- Group Agendas ---
  /**
   * Retrieves all group agendas.
   */
  async getGroupAgendas(): Promise<GroupAgenda[]> {
    const response = await apiClient.get<ApiResponse<GroupAgenda[]> | GroupAgenda[]>('/agendas');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray((response.data as ApiResponse<GroupAgenda[]>).data)) {
      return (response.data as ApiResponse<GroupAgenda[]>).data;
    }
    return [];
  },

  /**
   * Retrieves a single group agenda.
   */
  async getGroupAgenda(id: number | string): Promise<GroupAgenda> {
    const response = await apiClient.get<ApiResponse<GroupAgenda> | GroupAgenda>(`/agendas/${id}`);
    return (response.data as ApiResponse<GroupAgenda>).data || (response.data as GroupAgenda);
  },

  /**
   * Submits a new group agenda (requires authentication).
   */
  async createGroupAgenda(payload: CreateGroupAgendaPayload): Promise<GroupAgenda> {
    const response = await apiClient.post<ApiResponse<GroupAgenda> | GroupAgenda>('/agendas', payload);
    return (response.data as ApiResponse<GroupAgenda>).data || (response.data as GroupAgenda);
  },

  /**
   * Updates an existing group agenda (requires authentication).
   */
  async updateGroupAgenda(
    id: number | string,
    payload: UpdateGroupAgendaPayload
  ): Promise<GroupAgenda> {
    const response = await apiClient.put<ApiResponse<GroupAgenda> | GroupAgenda>(
      `/agendas/${id}`,
      payload
    );
    return (response.data as ApiResponse<GroupAgenda>).data || (response.data as GroupAgenda);
  },

  /**
   * Deletes a group agenda (requires authentication).
   */
  async deleteGroupAgenda(id: number | string): Promise<void> {
    await apiClient.delete(`/agendas/${id}`);
  },

  // --- Service Body Agendas ---
  /**
   * Retrieves available service body agendas (filtered by role on backend).
   */
  async getServiceBodyAgendas(): Promise<ServiceBodyAgenda[]> {
    const response = await apiClient.get<ApiResponse<ServiceBodyAgenda[]> | ServiceBodyAgenda[]>(
      '/service-body-agendas'
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray((response.data as ApiResponse<ServiceBodyAgenda[]>).data)) {
      return (response.data as ApiResponse<ServiceBodyAgenda[]>).data;
    }
    return [];
  },

  /**
   * Retrieves a single service body agenda with questions & answers.
   */
  async getServiceBodyAgenda(id: number | string): Promise<ServiceBodyAgenda> {
    const response = await apiClient.get<ApiResponse<ServiceBodyAgenda> | ServiceBodyAgenda>(
      `/service-body-agendas/${id}`
    );
    return (
      (response.data as ApiResponse<ServiceBodyAgenda>).data ||
      (response.data as ServiceBodyAgenda)
    );
  },

  /**
   * Creates a monthly service body agenda (requires authentication).
   */
  async createServiceBodyAgenda(
    payload: CreateServiceBodyAgendaPayload
  ): Promise<ServiceBodyAgenda> {
    const response = await apiClient.post<ApiResponse<ServiceBodyAgenda> | ServiceBodyAgenda>(
      '/service-body-agendas',
      payload
    );
    return (
      (response.data as ApiResponse<ServiceBodyAgenda>).data ||
      (response.data as ServiceBodyAgenda)
    );
  },

  /**
   * Updates a service body agenda (requires authentication).
   */
  async updateServiceBodyAgenda(
    id: number | string,
    payload: Partial<CreateServiceBodyAgendaPayload>
  ): Promise<ServiceBodyAgenda> {
    const response = await apiClient.put<ApiResponse<ServiceBodyAgenda> | ServiceBodyAgenda>(
      `/service-body-agendas/${id}`,
      payload
    );
    return (
      (response.data as ApiResponse<ServiceBodyAgenda>).data ||
      (response.data as ServiceBodyAgenda)
    );
  },

  /**
   * Deletes a service body agenda record (requires authentication).
   */
  async deleteServiceBodyAgenda(id: number | string): Promise<void> {
    await apiClient.delete(`/service-body-agendas/${id}`);
  },
};
