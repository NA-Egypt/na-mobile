import { apiClient } from './client';
import {
  City,
  Neighborhood,
  Day,
  Topic,
  Option,
  ServiceBody,
  ServiceCommittee,
  ScMeeting,
  ApiResponse,
} from './types';

const extractData = <T>(resData: any): T[] => {
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData?.data)) return resData.data;
  return [];
};

export const lookupsApi = {
  /**
   * Retrieves cities directory.
   */
  async getCities(): Promise<City[]> {
    const response = await apiClient.get<ApiResponse<City[]> | City[]>('/cities');
    return extractData<City>(response.data);
  },

  /**
   * Retrieves neighborhoods.
   */
  async getNeighborhoods(): Promise<Neighborhood[]> {
    const response = await apiClient.get<ApiResponse<Neighborhood[]> | Neighborhood[]>('/neighborhoods');
    return extractData<Neighborhood>(response.data);
  },

  /**
   * Retrieves days lookup.
   */
  async getDays(): Promise<Day[]> {
    const response = await apiClient.get<ApiResponse<Day[]> | Day[]>('/days');
    return extractData<Day>(response.data);
  },

  /**
   * Retrieves meeting topics lookup.
   */
  async getTopics(): Promise<Topic[]> {
    const response = await apiClient.get<ApiResponse<Topic[]> | Topic[]>('/topics');
    return extractData<Topic>(response.data);
  },

  /**
   * Retrieves meeting options / formats lookup.
   */
  async getOptions(): Promise<Option[]> {
    const response = await apiClient.get<ApiResponse<Option[]> | Option[]>('/options');
    return extractData<Option>(response.data);
  },

  /**
   * Retrieves Service Bodies / Areas directory.
   */
  async getServiceBodies(): Promise<ServiceBody[]> {
    const response = await apiClient.get<ApiResponse<ServiceBody[]> | ServiceBody[]>('/service-bodies');
    return extractData<ServiceBody>(response.data);
  },

  /**
   * Retrieves Service Committees (Subcommittees) directory.
   */
  async getServiceCommittees(): Promise<ServiceCommittee[]> {
    const response = await apiClient.get<ApiResponse<ServiceCommittee[]> | ServiceCommittee[]>(
      '/service-committees'
    );
    return extractData<ServiceCommittee>(response.data);
  },

  /**
   * Retrieves Service Committee schedule meetings.
   */
  async getScMeetings(): Promise<ScMeeting[]> {
    const response = await apiClient.get<ApiResponse<ScMeeting[]> | ScMeeting[]>('/sc-meetings');
    return extractData<ScMeeting>(response.data);
  },
};
