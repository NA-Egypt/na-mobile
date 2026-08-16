import { apiClient } from './client';
import {
  ContactRequestPayload,
  ContactRequest,
  ApiResponse,
} from './types';

export const contactApi = {
  /**
   * Submits a contact request from member or public inquiry.
   * Tries POST /contact-requests with fallback to /contact-us.
   */
  async submitContact(payload: ContactRequestPayload): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any> | any>('/contact-requests', payload);
      return response.data;
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        const fallbackRes = await apiClient.post<ApiResponse<any> | any>('/contact-us', payload);
        return fallbackRes.data;
      }
      throw err;
    }
  },

  /**
   * Retrieves submitted contact requests (Authenticated).
   */
  async getContactRequests(): Promise<ContactRequest[]> {
    const response = await apiClient.get<ApiResponse<ContactRequest[]> | ContactRequest[]>(
      '/contact-requests'
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray((response.data as ApiResponse<ContactRequest[]>).data)) {
      return (response.data as ApiResponse<ContactRequest[]>).data;
    }
    return [];
  },

  /**
   * Retrieves single contact request by ID (Authenticated).
   */
  async getContactRequest(id: number | string): Promise<ContactRequest> {
    const response = await apiClient.get<ApiResponse<ContactRequest> | ContactRequest>(
      `/contact-requests/${id}`
    );
    return (
      (response.data as ApiResponse<ContactRequest>).data ||
      (response.data as ContactRequest)
    );
  },

  /**
   * Updates contact request status (Authenticated).
   */
  async updateContactRequest(id: number | string, payload: Partial<ContactRequest>): Promise<ContactRequest> {
    const response = await apiClient.put<ApiResponse<ContactRequest> | ContactRequest>(
      `/contact-requests/${id}`,
      payload
    );
    return (
      (response.data as ApiResponse<ContactRequest>).data ||
      (response.data as ContactRequest)
    );
  },

  /**
   * Deletes a contact request (Authenticated).
   */
  async deleteContactRequest(id: number | string): Promise<void> {
    await apiClient.delete(`/contact-requests/${id}`);
  },
};
