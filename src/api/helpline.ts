import { apiClient } from './client';
import {
  HelplineSchemaResponse,
  HelplineCallPayload,
  HelplineCallResponse,
  ApiResponse,
} from './types';

export const helplineApi = {
  /**
   * Retrieves the dynamic form schema for helpline call response logging.
   * Public endpoint: GET /helpline-calls/schema
   */
  async getSchema(): Promise<HelplineSchemaResponse> {
    const response = await apiClient.get<HelplineSchemaResponse>('/helpline-calls/schema');
    return response.data;
  },

  /**
   * Submits a helpline call response log.
   * Public endpoint: POST /helpline-calls
   */
  async submitCall(payload: HelplineCallPayload): Promise<HelplineCallResponse> {
    const response = await apiClient.post<ApiResponse<HelplineCallResponse> | HelplineCallResponse>(
      '/helpline-calls',
      payload
    );
    if ((response.data as ApiResponse<HelplineCallResponse>)?.data) {
      return (response.data as ApiResponse<HelplineCallResponse>).data;
    }
    return response.data as HelplineCallResponse;
  },

  /**
   * Retrieves paginated helpline call logs (requires authentication).
   * Authenticated endpoint: GET /helpline-calls
   */
  async getCalls(params?: {
    start_date?: string;
    end_date?: string;
    page?: number;
  }): Promise<HelplineCallResponse[]> {
    const response = await apiClient.get<ApiResponse<HelplineCallResponse[]> | HelplineCallResponse[]>(
      '/helpline-calls',
      { params }
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray((response.data as ApiResponse<HelplineCallResponse[]>).data)) {
      return (response.data as ApiResponse<HelplineCallResponse[]>).data;
    }
    return [];
  },
};
