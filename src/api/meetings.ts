import { apiClient } from './client';
import {
  Meeting,
  MeetingQueryFilters,
  CreateMeetingPayload,
  UpdateMeetingPayload,
  ApiResponse,
} from './types';

export const meetingsApi = {
  /**
   * Retrieves meetings with optional filters.
   * Query params: day, city, neighborhood, serviceBody, group, type, search, virtualOnly, englishOnly, recurrence, businessMeetingsOnly.
   */
  async getMeetings(filters?: MeetingQueryFilters): Promise<Meeting[]> {
    const params: Record<string, any> = {};
    if (filters) {
      if (filters.day) params.day = filters.day;
      if (filters.city) params.city = filters.city;
      if (filters.neighborhood) params.neighborhood = filters.neighborhood;
      if (filters.serviceBody) params.serviceBody = filters.serviceBody;
      if (filters.group) params.group = filters.group;
      if (filters.type) params.type = filters.type;
      if (filters.search) params.search = filters.search;
      if (filters.virtualOnly) params.virtualOnly = filters.virtualOnly;
      if (filters.englishOnly) params.englishOnly = filters.englishOnly;
      if (filters.recurrence) params.recurrence = filters.recurrence;
      if (filters.businessMeetingsOnly) params.businessMeetingsOnly = filters.businessMeetingsOnly;
    }

    const response = await apiClient.get<ApiResponse<Meeting[]> | Meeting[]>('/meetings', { params });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray((response.data as ApiResponse<Meeting[]>).data)) {
      return (response.data as ApiResponse<Meeting[]>).data;
    }
    return [];
  },

  /**
   * Retrieves a single meeting by ID with loaded relations.
   */
  async getMeeting(id: number | string): Promise<Meeting> {
    const response = await apiClient.get<ApiResponse<Meeting> | Meeting>(`/meetings/${id}`);
    return (response.data as ApiResponse<Meeting>).data || (response.data as Meeting);
  },

  /**
   * Creates a new meeting (requires authentication).
   */
  async createMeeting(payload: CreateMeetingPayload): Promise<Meeting> {
    const response = await apiClient.post<ApiResponse<Meeting> | Meeting>('/meetings', payload);
    return (response.data as ApiResponse<Meeting>).data || (response.data as Meeting);
  },

  /**
   * Updates an existing meeting (requires authentication).
   */
  async updateMeeting(id: number | string, payload: UpdateMeetingPayload): Promise<Meeting> {
    const response = await apiClient.put<ApiResponse<Meeting> | Meeting>(`/meetings/${id}`, payload);
    return (response.data as ApiResponse<Meeting>).data || (response.data as Meeting);
  },

  /**
   * Deletes a meeting (requires authentication).
   */
  async deleteMeeting(id: number | string): Promise<void> {
    await apiClient.delete(`/meetings/${id}`);
  },
};
