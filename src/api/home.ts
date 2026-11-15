import { apiClient } from './client';
import { FrontpageData, JftData, FrontpageStats, ApiResponse } from './types';

export const homeApi = {
  /**
   * Fetches consolidated frontpage data (stats, JFT daily reading, helplines, social links, hero event, and upcoming events).
   * Tries GET /home, with fallback to GET /frontpage.
   * Supports bilingual locale (ar | en) via query params and X-Locale header per na-egypt-api spec.
   */
  async getHomeData(date?: string, locale?: string): Promise<FrontpageData> {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (locale) {
      params.locale = locale;
      params.lang = locale;
    }
    const headers = locale ? { 'X-Locale': locale } : undefined;

    try {
      const response = await apiClient.get<ApiResponse<FrontpageData> | FrontpageData>('/home', {
        params,
        headers,
      });
      return (response.data as ApiResponse<FrontpageData>).data || (response.data as FrontpageData);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        const fallbackRes = await apiClient.get<ApiResponse<FrontpageData> | FrontpageData>('/frontpage', {
          params,
          headers,
        });
        return (fallbackRes.data as ApiResponse<FrontpageData>).data || (fallbackRes.data as FrontpageData);
      }
      throw err;
    }
  },

  /**
   * Retrieves daily spiritual reflection (Just For Today / لليوم فقط).
   * @param date Optional date in YYYY-MM-DD format (defaults to current date in Africa/Cairo).
   * @param locale Optional locale code ('ar' | 'en') - also sent via X-Locale header.
   */
  async getJft(date?: string, locale?: string): Promise<JftData> {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (locale) {
      params.locale = locale;
      params.lang = locale;
    }
    const headers = locale ? { 'X-Locale': locale } : undefined;

    const response = await apiClient.get<ApiResponse<JftData> | JftData>('/jft', {
      params,
      headers,
    });
    return (response.data as ApiResponse<JftData>).data || (response.data as JftData);
  },

  /**
   * Retrieves platform statistics counter (weekly meetings, groups, governorates, events).
   */
  async getStats(): Promise<FrontpageStats> {
    const response = await apiClient.get<ApiResponse<FrontpageStats> | FrontpageStats>('/stats');
    return (response.data as ApiResponse<FrontpageStats>).data || (response.data as FrontpageStats);
  },

  /**
   * Retrieves regional helplines.
   */
  async getHelplines(locale?: string): Promise<any[]> {
    try {
      const home = await this.getHomeData(undefined, locale);
      return home.helplines || [];
    } catch {
      return [];
    }
  },
};
