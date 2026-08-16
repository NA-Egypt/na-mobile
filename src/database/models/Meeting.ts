import { Model } from '@nozbe/watermelondb';
import { field, text, date, json, relation } from '@nozbe/watermelondb/decorators';
import Group from './Group';
import Day from './Day';

const sanitizeRecurrence = (raw: any) => (typeof raw === 'object' ? raw : {});

export default class Meeting extends Model {
  static table = 'meetings';

  static associations = {
    groups: { type: 'belongs_to' as const, key: 'group_id' },
    days: { type: 'belongs_to' as const, key: 'day_id' },
  };

  @text('remote_id') remoteId?: string;
  @text('group_id') groupId?: string;
  @text('direct_online_group_id') directOnlineGroupId?: string;
  @text('day_id') dayId?: string;
  @text('group_name_ar') groupNameAr?: string;
  @text('group_name_en') groupNameEn?: string;
  @text('group_type') groupType?: string;
  @text('address_ar') addressAr?: string;
  @text('address_en') addressEn?: string;
  @text('location_url') locationUrl?: string;
  @text('topic_name') topicName?: string;
  @text('city_name_ar') cityNameAr?: string;
  @text('city_name_en') cityNameEn?: string;
  @text('neighborhood_name_ar') neighborhoodNameAr?: string;
  @text('neighborhood_name_en') neighborhoodNameEn?: string;
  @text('start_time') startTime?: string;
  @text('end_time') endTime?: string;
  @text('formatted_start_time') formattedStartTime?: string;
  @text('formatted_end_time') formattedEndTime?: string;
  @text('duration') duration?: string;
  @text('notes') notes?: string;
  @text('type') type?: string; // 'open' | 'closed'
  @text('lang') lang?: string; // 'arabic' | 'english' | 'both'
  @text('status') status?: string;
  @json('recurrence', sanitizeRecurrence) recurrence?: Record<string, any>;
  @date('updated_at') updatedAt?: Date;

  @relation('groups', 'group_id') group?: any;
  @relation('days', 'day_id') day?: any;
}
