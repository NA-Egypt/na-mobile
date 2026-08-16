import { apiClient } from './client';
import {
  CommitteeReport,
  CreateCommitteeReportPayload,
  ApiResponse,
} from './types';

export const reportsApi = {
  /**
   * Retrieves committee periodic reports.
   */
  async getCommitteeReports(): Promise<CommitteeReport[]> {
    const response = await apiClient.get<ApiResponse<CommitteeReport[]> | CommitteeReport[]>(
      '/committee-reports'
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray((response.data as ApiResponse<CommitteeReport[]>).data)) {
      return (response.data as ApiResponse<CommitteeReport[]>).data;
    }
    return [];
  },

  /**
   * Retrieves a single committee report by ID.
   */
  async getCommitteeReport(id: number | string): Promise<CommitteeReport> {
    const response = await apiClient.get<ApiResponse<CommitteeReport> | CommitteeReport>(
      `/committee-reports/${id}`
    );
    return (
      (response.data as ApiResponse<CommitteeReport>).data ||
      (response.data as CommitteeReport)
    );
  },

  /**
   * Uploads/publishes a new committee report (requires authentication).
   */
  async createCommitteeReport(payload: CreateCommitteeReportPayload): Promise<CommitteeReport> {
    const response = await apiClient.post<ApiResponse<CommitteeReport> | CommitteeReport>(
      '/committee-reports',
      payload
    );
    return (
      (response.data as ApiResponse<CommitteeReport>).data ||
      (response.data as CommitteeReport)
    );
  },

  /**
   * Updates an existing committee report (requires authentication).
   */
  async updateCommitteeReport(
    id: number | string,
    payload: Partial<CreateCommitteeReportPayload>
  ): Promise<CommitteeReport> {
    const response = await apiClient.put<ApiResponse<CommitteeReport> | CommitteeReport>(
      `/committee-reports/${id}`,
      payload
    );
    return (
      (response.data as ApiResponse<CommitteeReport>).data ||
      (response.data as CommitteeReport)
    );
  },

  /**
   * Deletes a committee report (requires authentication).
   */
  async deleteCommitteeReport(id: number | string): Promise<void> {
    await apiClient.delete(`/committee-reports/${id}`);
  },
};
