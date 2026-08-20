import { apiClient } from './client';
import { FrontpageData, JftData, FrontpageStats, ApiResponse } from './types';

export const homeApi = {
  /**
   * Fetches consolidated frontpage data (stats, JFT daily reading, helplines, social links, and upcoming events).
   * Tries GET /home, with fallback to GET /frontpage.
   */
  async getHomeData(date?: string): Promise<FrontpageData> {
    const params = date ? { date } : {};
    try {
      const response = await apiClient.get<ApiResponse<FrontpageData> | FrontpageData>('/home', { params });
      return (response.data as ApiResponse<FrontpageData>).data || (response.data as FrontpageData);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        const fallbackRes = await apiClient.get<ApiResponse<FrontpageData> | FrontpageData>('/frontpage', { params });
        return (fallbackRes.data as ApiResponse<FrontpageData>).data || (fallbackRes.data as FrontpageData);
      }
      throw err;
    }
  },

  /**
   * Retrieves daily spiritual reflection (Just For Today / لليوم فقط).
   * @param date Optional date in YYYY-MM-DD format (defaults to current date).
   */
  async getJft(date?: string): Promise<JftData> {
    const params = date ? { date } : {};
    const response = await apiClient.get<ApiResponse<JftData> | JftData>('/jft', { params });
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
  async getHelplines(): Promise<any[]> {
    try {
      const home = await this.getHomeData();
      return home.helplines || [];
    } catch {
      return [];
    }
  },
};
