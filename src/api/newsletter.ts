import { apiClient } from './client';
import { NewsletterMember, ApiResponse } from './types';

export const newsletterApi = {
  /**
   * Subscribes an email to the NA Egypt newsletter (Public).
   */
  async subscribe(email: string): Promise<any> {
    const response = await apiClient.post('/subscribers-api/subscriber', { email });
    return response.data;
  },

  /**
   * Retrieves newsletter members list (Authenticated).
   */
  async getMembers(): Promise<NewsletterMember[]> {
    const response = await apiClient.get<ApiResponse<NewsletterMember[]> | NewsletterMember[]>(
      '/newsletter-members'
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray((response.data as ApiResponse<NewsletterMember[]>).data)) {
      return (response.data as ApiResponse<NewsletterMember[]>).data;
    }
    return [];
  },
};
