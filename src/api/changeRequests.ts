import { apiClient } from './client';
import {
  ChangeRequest,
  CreateChangeRequestPayload,
  ApiResponse,
} from './types';
import { addOutboxAction } from '../database/outboxWorker';

export interface ChangeRequestsQueryFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'rejected' | string;
  per_page?: number;
  page?: number;
}

export const changeRequestsApi = {
  /**
   * Retrieves change requests for the authenticated servant.
   * Super admins view fellowship-wide requests; servants view their own submissions.
   */
  async getChangeRequests(filters?: ChangeRequestsQueryFilters): Promise<ChangeRequest[]> {
    const response = await apiClient.get<ApiResponse<ChangeRequest[]> | ChangeRequest[]>(
      '/change-requests',
      { params: filters }
    );

    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray((response.data as ApiResponse<ChangeRequest[]>).data)) {
      return (response.data as ApiResponse<ChangeRequest[]>).data;
    }
    return [];
  },

  /**
   * Retrieves single change request by ID.
   */
  async getChangeRequest(id: number | string): Promise<ChangeRequest> {
    const response = await apiClient.get<ApiResponse<ChangeRequest> | ChangeRequest>(
      `/change-requests/${id}`
    );
    return (
      (response.data as ApiResponse<ChangeRequest>).data ||
      (response.data as ChangeRequest)
    );
  },

  /**
   * Submits a new IT & Data Change Request.
   * Handles multipart/form-data when an attachment is present, and falls back to offline outbox if network fails.
   */
  async submitChangeRequest(payload: CreateChangeRequestPayload): Promise<{ success: boolean; data?: any; queued?: boolean }> {
    try {
      if (payload.attachment_uri) {
        const formData = new FormData();
        formData.append('request_type', payload.request_type);
        formData.append('subject', payload.subject);
        formData.append('description', payload.description);

        const filename = payload.attachment_name || payload.attachment_uri.split('/').pop() || 'attachment';
        let mimeType = payload.attachment_type;
        if (!mimeType) {
          const ext = filename.split('.').pop()?.toLowerCase();
          if (ext === 'pdf') mimeType = 'application/pdf';
          else if (ext === 'png') mimeType = 'image/png';
          else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
          else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          else if (ext === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          else mimeType = 'application/octet-stream';
        }

        formData.append('attachment', {
          uri: payload.attachment_uri,
          name: filename,
          type: mimeType,
        } as any);

        const res = await apiClient.post('/change-requests', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return { success: true, data: res.data };
      } else {
        const res = await apiClient.post('/change-requests', {
          request_type: payload.request_type,
          subject: payload.subject,
          description: payload.description,
        });
        return { success: true, data: res.data };
      }
    } catch (error: any) {
      // If it's a network error or server is temporarily unreachable, queue to local outbox
      if (!error.response || error.code === 'ECONNABORTED' || error.message?.includes('Network Error')) {
        await addOutboxAction('/change-requests', 'POST', {
          request_type: payload.request_type,
          subject: payload.subject,
          description: payload.description,
          attachment_name: payload.attachment_name || null,
          attachment_uri: payload.attachment_uri || null,
          submitted_at: payload.submitted_at || new Date().toISOString(),
        });
        return { success: true, queued: true };
      }
      throw error;
    }
  },

  /**
   * Deletes a pending change request.
   */
  async deleteChangeRequest(id: number | string): Promise<void> {
    await apiClient.delete(`/change-requests/${id}`);
  },
};
