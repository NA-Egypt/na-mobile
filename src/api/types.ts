export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

// User & Authentication
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  service_body_id?: number | null;
  roles?: string[];
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AzureLoginResponse {
  token: string;
  user: UserProfile;
}

// Lookup Models
export interface LookupItem {
  id: number;
  ar_name: string;
  en_name: string;
  code?: string;
  name?: string;
  name_ar?: string;
  name_en?: string;
}

export interface City extends LookupItem {}

export interface Neighborhood extends LookupItem {
  city_id?: number;
  city?: City;
}

export interface Day extends LookupItem {}

export interface Topic extends LookupItem {}

export interface Option extends LookupItem {}

export interface ServiceBody extends LookupItem {
  email?: string;
  phone?: string;
  area_name?: string;
}

export interface ServiceCommittee extends LookupItem {
  service_body_id?: number;
  description?: string;
}

export interface ScMeeting {
  id: number;
  service_committee_id?: number;
  day_id?: number;
  start_time?: string;
  end_time?: string;
  location?: string;
  notes?: string;
}

// Group
export interface Group {
  id: number;
  ar_name: string;
  en_name: string;
  ar_gsr_name?: string;
  en_gsr_name?: string;
  phone?: string;
  location?: string;
  ar_address?: string;
  en_address?: string;
  group_type?: 'in-person' | 'online' | 'hybrid' | string;
  service_body_id?: number;
  neighborhood_id?: number;
  capacity?: number;
  service_body?: ServiceBody;
  neighborhood?: Neighborhood;
  user?: UserProfile;
  created_at?: string;
  updated_at?: string;
}

export interface CreateGroupPayload {
  ar_name: string;
  en_name: string;
  ar_gsr_name?: string;
  en_gsr_name?: string;
  phone?: string;
  location?: string;
  ar_address?: string;
  en_address?: string;
  group_type?: string;
  service_body_id?: number;
  neighborhood_id?: number;
  capacity?: number;
}

export interface GroupQueryFilters {
  page?: number;
  per_page?: number;
  search?: string;
  service_body_id?: number;
}

// Meeting
export interface Meeting {
  id: number;
  group_id?: number;
  direct_online_group_id?: number;
  day_id?: number;
  start_time: string;
  end_time: string;
  formatted_start_time?: string;
  formatted_end_time?: string;
  duration?: string | number;
  type?: 'open' | 'closed' | string;
  lang?: 'arabic' | 'english' | 'both' | string;
  status?: 'available' | 'suspended' | 'temp_closed' | string;
  notes?: string;
  recurrence?: string[] | Record<string, any>;
  group?: Group;
  day?: Day;
  topics?: Topic[];
  options?: Option[];
  group_name_ar?: string;
  group_name_en?: string;
  group_type?: string;
  address_ar?: string;
  address_en?: string;
  location?: string;
  location_url?: string;
  city_name_ar?: string;
  city_name_en?: string;
  neighborhood_name_ar?: string;
  neighborhood_name_en?: string;
  topic?: string | Topic;
}

export interface MeetingQueryFilters {
  day?: string;
  city?: string;
  neighborhood?: string;
  serviceBody?: string;
  group?: string;
  type?: string;
  search?: string;
  virtualOnly?: string | number | boolean;
  englishOnly?: string | number | boolean;
  recurrence?: 'weekly' | 'monthly' | string;
  businessMeetingsOnly?: string | number | boolean;
}

export interface CreateMeetingPayload {
  group_id: number;
  day_id: number;
  start_time: string;
  end_time: string;
  type?: 'open' | 'closed' | string;
  lang?: 'arabic' | 'english' | string;
  status?: 'available' | 'suspended' | string;
  notes?: string;
  topics?: number[];
  options?: number[];
  recurrence?: string[];
}

export interface UpdateMeetingPayload extends Partial<CreateMeetingPayload> {}

// Calendar & Events
export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  description?: string;
  color?: string;
  organizer?: string;
  location?: string;
  recurrence?: string[] | string;
  formatted_recurrence?: string;
  is_featured?: boolean;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CalendarEventQueryFilters {
  start?: string; // ISO-8601 Date
  end?: string;   // ISO-8601 Date
}

export interface CreateCalendarEventPayload {
  title: string;
  start: string;
  end: string;
  description?: string;
  color?: string;
  organizer?: string;
  location?: string;
  recurrence?: string[];
  is_featured?: boolean;
}

export interface UpdateCalendarEventPayload extends Partial<CreateCalendarEventPayload> {}

// Group Agendas
export interface AgendaTopic {
  title: string;
  content: string;
}

export interface GroupAgenda {
  id: number;
  group_id: number;
  meetings_per_week?: number;
  agenda_date: string;
  service_position?: string;
  submitter_name?: string;
  alt_gsr_position?: string;
  alt_gsr_name?: string;
  new_comers?: number;
  open_positions?: string;
  next_business_meeting?: string;
  recovery_meetings_changes?: boolean;
  recovery_atmosphere?: string;
  trusted_servants?: string;
  financial_issues?: string;
  other_topics?: AgendaTopic[];
  group?: Group;
  created_at?: string;
  updated_at?: string;
}

export interface CreateGroupAgendaPayload {
  group_id: number;
  meetings_per_week?: number;
  agenda_date: string;
  service_position?: string;
  submitter_name?: string;
  alt_gsr_position?: string;
  alt_gsr_name?: string;
  new_comers?: number;
  open_positions?: string;
  next_business_meeting?: string;
  recovery_meetings_changes?: boolean;
  recovery_atmosphere?: string;
  trusted_servants?: string;
  financial_issues?: string;
  other_topics?: AgendaTopic[];
}

export interface UpdateGroupAgendaPayload extends Partial<CreateGroupAgendaPayload> {}

// Service Body Agendas
export interface ServiceBodyAgenda {
  id: number;
  service_body_id?: number;
  title?: string;
  month?: string;
  year?: number;
  agenda_date?: string;
  questions?: Array<{ id: number; question: string; answer?: string }>;
  status?: string;
  service_body?: ServiceBody;
  created_at?: string;
  updated_at?: string;
}

export interface CreateServiceBodyAgendaPayload {
  service_body_id: number;
  title?: string;
  month?: string;
  year?: number;
  agenda_date?: string;
  questions?: Array<{ question: string; answer?: string }>;
}

// Committee Reports
export interface CommitteeReport {
  id: number;
  committee_id?: number;
  service_committee_id?: number;
  title: string;
  content?: string;
  file_url?: string;
  report_date?: string;
  author_name?: string;
  committee?: ServiceCommittee;
  service_committee?: ServiceCommittee;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCommitteeReportPayload {
  service_committee_id?: number;
  committee_id?: number;
  title: string;
  content?: string;
  report_date?: string;
  author_name?: string;
  file?: any;
}

// Contact Requests
export interface ContactRequestPayload {
  name?: string;
  email?: string;
  contact?: string;
  subject?: string;
  message: string;
  attachment_name?: string | null;
  attachment_uri?: string | null;
  submitted_at?: string;
}

export interface ContactRequest {
  id: number;
  name: string;
  email?: string;
  message: string;
  status?: 'pending' | 'resolved' | string;
  created_at?: string;
  updated_at?: string;
}

// Financial Transactions
export interface Transaction {
  id: number;
  group_id?: number;
  service_body_id?: number;
  type: 'credit' | 'debit';
  amount: number;
  currency?: string;
  description?: string;
  transaction_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTransactionPayload {
  group_id?: number;
  service_body_id?: number;
  type: 'credit' | 'debit';
  amount: number;
  description?: string;
  transaction_date?: string;
}

// Newsletter
export interface NewsletterMember {
  id: number;
  email: string;
  created_at?: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name?: string;
}

export interface Permission {
  id: number;
  name: string;
  guard_name?: string;
}
