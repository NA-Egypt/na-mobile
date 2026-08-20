import { apiClient } from './client';
import {
  CalendarEvent,
  CalendarEventQueryFilters,
  CreateCalendarEventPayload,
  UpdateCalendarEventPayload,
  AnnouncementEvent,
  CreateAnnouncementEventPayload,
  UpdateAnnouncementEventPayload,
  ApiResponse,
} from './types';

export const eventsApi = {
  /**
   * Retrieves calendar events (with recurring expansion if start & end are passed).
   */
  async getCalendarEvents(filters?: CalendarEventQueryFilters): Promise<CalendarEvent[]> {
    const response = await apiClient.get<ApiResponse<CalendarEvent[]> | CalendarEvent[]>(
      '/calendar-events',
      { params: filters }
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray((response.data as ApiResponse<CalendarEvent[]>).data)) {
      return (response.data as ApiResponse<CalendarEvent[]>).data;
    }
    return [];
  },

  /**
   * Retrieves a single calendar event.
   */
  async getCalendarEvent(id: number | string): Promise<CalendarEvent> {
    const response = await apiClient.get<ApiResponse<CalendarEvent> | CalendarEvent>(
      `/calendar-events/${id}`
    );
    return (response.data as ApiResponse<CalendarEvent>).data || (response.data as CalendarEvent);
  },

  /**
   * Creates a calendar event (requires authentication).
   */
  async createCalendarEvent(payload: CreateCalendarEventPayload): Promise<CalendarEvent> {
    const response = await apiClient.post<ApiResponse<CalendarEvent> | CalendarEvent>(
      '/calendar-events',
      payload
    );
    return (response.data as ApiResponse<CalendarEvent>).data || (response.data as CalendarEvent);
  },

  /**
   * Updates a calendar event (requires authentication).
   */
  async updateCalendarEvent(
    id: number | string,
    payload: UpdateCalendarEventPayload
  ): Promise<CalendarEvent> {
    const response = await apiClient.put<ApiResponse<CalendarEvent> | CalendarEvent>(
      `/calendar-events/${id}`,
      payload
    );
    return (response.data as ApiResponse<CalendarEvent>).data || (response.data as CalendarEvent);
  },

  /**
   * Deletes a calendar event (requires authentication).
   */
  async deleteCalendarEvent(id: number | string): Promise<void> {
    await apiClient.delete(`/calendar-events/${id}`);
  },

  /**
   * Retrieves general announcement events (/events).
   */
  async getEvents(): Promise<AnnouncementEvent[]> {
    const response = await apiClient.get<ApiResponse<AnnouncementEvent[]> | AnnouncementEvent[]>('/events');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray((response.data as ApiResponse<AnnouncementEvent[]>).data)) {
      return (response.data as ApiResponse<AnnouncementEvent[]>).data;
    }
    return [];
  },

  /**
   * Retrieves a single announcement event (/events/{id}).
   */
  async getEvent(id: number | string): Promise<AnnouncementEvent> {
    const response = await apiClient.get<ApiResponse<AnnouncementEvent> | AnnouncementEvent>(
      `/events/${id}`
    );
    return (response.data as ApiResponse<AnnouncementEvent>).data || (response.data as AnnouncementEvent);
  },

  /**
   * Creates an announcement event (requires authentication).
   */
  async createEvent(payload: CreateAnnouncementEventPayload): Promise<AnnouncementEvent> {
    const response = await apiClient.post<ApiResponse<AnnouncementEvent> | AnnouncementEvent>(
      '/events',
      payload
    );
    return (response.data as ApiResponse<AnnouncementEvent>).data || (response.data as AnnouncementEvent);
  },

  /**
   * Updates an announcement event (requires authentication).
   */
  async updateEvent(
    id: number | string,
    payload: UpdateAnnouncementEventPayload
  ): Promise<AnnouncementEvent> {
    const response = await apiClient.put<ApiResponse<AnnouncementEvent> | AnnouncementEvent>(
      `/events/${id}`,
      payload
    );
    return (response.data as ApiResponse<AnnouncementEvent>).data || (response.data as AnnouncementEvent);
  },

  /**
   * Deletes an announcement event (requires authentication).
   */
  async deleteEvent(id: number | string): Promise<void> {
    await apiClient.delete(`/events/${id}`);
  },
};
