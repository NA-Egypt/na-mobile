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
  CreateCityPayload,
  CreateNeighborhoodPayload,
  CreateTopicPayload,
  CreateOptionPayload,
  CreateServiceBodyPayload,
  CreateServiceCommitteePayload,
  CreateScMeetingPayload,
} from './types';

const extractData = <T>(resData: any): T[] => {
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData?.data)) return resData.data;
  return [];
};

const extractSingle = <T>(resData: any): T => {
  return (resData as ApiResponse<T>)?.data || (resData as T);
};

export const lookupsApi = {
  // --- Cities ---
  async getCities(): Promise<City[]> {
    const response = await apiClient.get<ApiResponse<City[]> | City[]>('/cities');
    return extractData<City>(response.data);
  },
  async getCity(id: number | string): Promise<City> {
    const response = await apiClient.get<ApiResponse<City> | City>(`/cities/${id}`);
    return extractSingle<City>(response.data);
  },
  async createCity(payload: CreateCityPayload): Promise<City> {
    const response = await apiClient.post<ApiResponse<City> | City>('/cities', payload);
    return extractSingle<City>(response.data);
  },
  async updateCity(id: number | string, payload: Partial<CreateCityPayload>): Promise<City> {
    const response = await apiClient.put<ApiResponse<City> | City>(`/cities/${id}`, payload);
    return extractSingle<City>(response.data);
  },
  async deleteCity(id: number | string): Promise<void> {
    await apiClient.delete(`/cities/${id}`);
  },

  // --- Neighborhoods ---
  async getNeighborhoods(): Promise<Neighborhood[]> {
    const response = await apiClient.get<ApiResponse<Neighborhood[]> | Neighborhood[]>('/neighborhoods');
    return extractData<Neighborhood>(response.data);
  },
  async getNeighborhood(id: number | string): Promise<Neighborhood> {
    const response = await apiClient.get<ApiResponse<Neighborhood> | Neighborhood>(`/neighborhoods/${id}`);
    return extractSingle<Neighborhood>(response.data);
  },
  async createNeighborhood(payload: CreateNeighborhoodPayload): Promise<Neighborhood> {
    const response = await apiClient.post<ApiResponse<Neighborhood> | Neighborhood>('/neighborhoods', payload);
    return extractSingle<Neighborhood>(response.data);
  },
  async updateNeighborhood(id: number | string, payload: Partial<CreateNeighborhoodPayload>): Promise<Neighborhood> {
    const response = await apiClient.put<ApiResponse<Neighborhood> | Neighborhood>(`/neighborhoods/${id}`, payload);
    return extractSingle<Neighborhood>(response.data);
  },
  async deleteNeighborhood(id: number | string): Promise<void> {
    await apiClient.delete(`/neighborhoods/${id}`);
  },

  // --- Days ---
  async getDays(): Promise<Day[]> {
    const response = await apiClient.get<ApiResponse<Day[]> | Day[]>('/days');
    return extractData<Day>(response.data);
  },
  async getDay(id: number | string): Promise<Day> {
    const response = await apiClient.get<ApiResponse<Day> | Day>(`/days/${id}`);
    return extractSingle<Day>(response.data);
  },
  async createDay(payload: { ar_name: string; en_name: string; code?: string }): Promise<Day> {
    const response = await apiClient.post<ApiResponse<Day> | Day>('/days', payload);
    return extractSingle<Day>(response.data);
  },
  async updateDay(id: number | string, payload: Partial<{ ar_name: string; en_name: string; code?: string }>): Promise<Day> {
    const response = await apiClient.put<ApiResponse<Day> | Day>(`/days/${id}`, payload);
    return extractSingle<Day>(response.data);
  },
  async deleteDay(id: number | string): Promise<void> {
    await apiClient.delete(`/days/${id}`);
  },

  // --- Topics ---
  async getTopics(): Promise<Topic[]> {
    const response = await apiClient.get<ApiResponse<Topic[]> | Topic[]>('/topics');
    return extractData<Topic>(response.data);
  },
  async getTopic(id: number | string): Promise<Topic> {
    const response = await apiClient.get<ApiResponse<Topic> | Topic>(`/topics/${id}`);
    return extractSingle<Topic>(response.data);
  },
  async createTopic(payload: CreateTopicPayload): Promise<Topic> {
    const response = await apiClient.post<ApiResponse<Topic> | Topic>('/topics', payload);
    return extractSingle<Topic>(response.data);
  },
  async updateTopic(id: number | string, payload: Partial<CreateTopicPayload>): Promise<Topic> {
    const response = await apiClient.put<ApiResponse<Topic> | Topic>(`/topics/${id}`, payload);
    return extractSingle<Topic>(response.data);
  },
  async deleteTopic(id: number | string): Promise<void> {
    await apiClient.delete(`/topics/${id}`);
  },

  // --- Options ---
  async getOptions(): Promise<Option[]> {
    const response = await apiClient.get<ApiResponse<Option[]> | Option[]>('/options');
    return extractData<Option>(response.data);
  },
  async getOption(id: number | string): Promise<Option> {
    const response = await apiClient.get<ApiResponse<Option> | Option>(`/options/${id}`);
    return extractSingle<Option>(response.data);
  },
  async createOption(payload: CreateOptionPayload): Promise<Option> {
    const response = await apiClient.post<ApiResponse<Option> | Option>('/options', payload);
    return extractSingle<Option>(response.data);
  },
  async updateOption(id: number | string, payload: Partial<CreateOptionPayload>): Promise<Option> {
    const response = await apiClient.put<ApiResponse<Option> | Option>(`/options/${id}`, payload);
    return extractSingle<Option>(response.data);
  },
  async deleteOption(id: number | string): Promise<void> {
    await apiClient.delete(`/options/${id}`);
  },

  // --- Service Bodies ---
  async getServiceBodies(): Promise<ServiceBody[]> {
    const response = await apiClient.get<ApiResponse<ServiceBody[]> | ServiceBody[]>('/service-bodies');
    return extractData<ServiceBody>(response.data);
  },
  async getServiceBody(id: number | string): Promise<ServiceBody> {
    const response = await apiClient.get<ApiResponse<ServiceBody> | ServiceBody>(`/service-bodies/${id}`);
    return extractSingle<ServiceBody>(response.data);
  },
  async createServiceBody(payload: CreateServiceBodyPayload): Promise<ServiceBody> {
    const response = await apiClient.post<ApiResponse<ServiceBody> | ServiceBody>('/service-bodies', payload);
    return extractSingle<ServiceBody>(response.data);
  },
  async updateServiceBody(id: number | string, payload: Partial<CreateServiceBodyPayload>): Promise<ServiceBody> {
    const response = await apiClient.put<ApiResponse<ServiceBody> | ServiceBody>(`/service-bodies/${id}`, payload);
    return extractSingle<ServiceBody>(response.data);
  },
  async deleteServiceBody(id: number | string): Promise<void> {
    await apiClient.delete(`/service-bodies/${id}`);
  },

  // --- Service Committees ---
  async getServiceCommittees(): Promise<ServiceCommittee[]> {
    const response = await apiClient.get<ApiResponse<ServiceCommittee[]> | ServiceCommittee[]>('/service-committees');
    return extractData<ServiceCommittee>(response.data);
  },
  async getServiceCommittee(id: number | string): Promise<ServiceCommittee> {
    const response = await apiClient.get<ApiResponse<ServiceCommittee> | ServiceCommittee>(`/service-committees/${id}`);
    return extractSingle<ServiceCommittee>(response.data);
  },
  async createServiceCommittee(payload: CreateServiceCommitteePayload): Promise<ServiceCommittee> {
    const response = await apiClient.post<ApiResponse<ServiceCommittee> | ServiceCommittee>('/service-committees', payload);
    return extractSingle<ServiceCommittee>(response.data);
  },
  async updateServiceCommittee(id: number | string, payload: Partial<CreateServiceCommitteePayload>): Promise<ServiceCommittee> {
    const response = await apiClient.put<ApiResponse<ServiceCommittee> | ServiceCommittee>(`/service-committees/${id}`, payload);
    return extractSingle<ServiceCommittee>(response.data);
  },
  async deleteServiceCommittee(id: number | string): Promise<void> {
    await apiClient.delete(`/service-committees/${id}`);
  },

  // --- Service Committee Schedule Meetings (sc-meetings) ---
  async getScMeetings(): Promise<ScMeeting[]> {
    const response = await apiClient.get<ApiResponse<ScMeeting[]> | ScMeeting[]>('/sc-meetings');
    return extractData<ScMeeting>(response.data);
  },
  async getScMeeting(id: number | string): Promise<ScMeeting> {
    const response = await apiClient.get<ApiResponse<ScMeeting> | ScMeeting>(`/sc-meetings/${id}`);
    return extractSingle<ScMeeting>(response.data);
  },
  async createScMeeting(payload: CreateScMeetingPayload): Promise<ScMeeting> {
    const response = await apiClient.post<ApiResponse<ScMeeting> | ScMeeting>('/sc-meetings', payload);
    return extractSingle<ScMeeting>(response.data);
  },
  async updateScMeeting(id: number | string, payload: Partial<CreateScMeetingPayload>): Promise<ScMeeting> {
    const response = await apiClient.put<ApiResponse<ScMeeting> | ScMeeting>(`/sc-meetings/${id}`, payload);
    return extractSingle<ScMeeting>(response.data);
  },
  async deleteScMeeting(id: number | string): Promise<void> {
    await apiClient.delete(`/sc-meetings/${id}`);
  },
};
