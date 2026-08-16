import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 6,
  tables: [
    tableSchema({
      name: 'meetings',
      columns: [
        { name: 'remote_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'group_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'direct_online_group_id', type: 'string', isOptional: true },
        { name: 'day_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'group_name_ar', type: 'string', isOptional: true, isIndexed: true },
        { name: 'group_name_en', type: 'string', isOptional: true, isIndexed: true },
        { name: 'group_type', type: 'string', isOptional: true },
        { name: 'address_ar', type: 'string', isOptional: true },
        { name: 'address_en', type: 'string', isOptional: true },
        { name: 'location_url', type: 'string', isOptional: true },
        { name: 'topic_name', type: 'string', isOptional: true },
        { name: 'city_name_ar', type: 'string', isOptional: true, isIndexed: true },
        { name: 'city_name_en', type: 'string', isOptional: true, isIndexed: true },
        { name: 'neighborhood_name_ar', type: 'string', isOptional: true, isIndexed: true },
        { name: 'neighborhood_name_en', type: 'string', isOptional: true, isIndexed: true },
        { name: 'start_time', type: 'string', isOptional: true },
        { name: 'end_time', type: 'string', isOptional: true },
        { name: 'formatted_start_time', type: 'string', isOptional: true },
        { name: 'formatted_end_time', type: 'string', isOptional: true },
        { name: 'duration', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'type', type: 'string', isOptional: true }, // 'open' | 'closed'
        { name: 'lang', type: 'string', isOptional: true, isIndexed: true }, // 'arabic' | 'english' | 'both'
        { name: 'status', type: 'string', isOptional: true }, // 'available' | 'suspended'
        { name: 'recurrence', type: 'string', isOptional: true }, // JSON string
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'groups',
      columns: [
        { name: 'remote_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'group_type', type: 'string', isOptional: true },
        { name: 'city_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'neighborhood_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'cities',
      columns: [
        { name: 'remote_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'ar_name', type: 'string' },
        { name: 'en_name', type: 'string' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'neighborhoods',
      columns: [
        { name: 'remote_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'city_id', type: 'string', isIndexed: true },
        { name: 'ar_name', type: 'string' },
        { name: 'en_name', type: 'string' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'days',
      columns: [
        { name: 'remote_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'ar_name', type: 'string' },
        { name: 'en_name', type: 'string' },
        { name: 'code', type: 'string', isIndexed: true, isOptional: true },
      ],
    }),
    tableSchema({
      name: 'topics',
      columns: [
        { name: 'remote_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'ar_name', type: 'string' },
        { name: 'en_name', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'options',
      columns: [
        { name: 'remote_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'ar_name', type: 'string' },
        { name: 'en_name', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'events',
      columns: [
        { name: 'remote_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'start_date', type: 'string' },
        { name: 'end_date', type: 'string', isOptional: true },
        { name: 'location', type: 'string', isOptional: true },
        { name: 'organizer', type: 'string', isOptional: true },
        { name: 'recurrence', type: 'string', isOptional: true },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'outbox_actions',
      columns: [
        { name: 'endpoint', type: 'string' },
        { name: 'method', type: 'string' },
        { name: 'payload', type: 'string' }, // JSON string
        { name: 'status', type: 'string', isIndexed: true }, // 'pending' | 'syncing' | 'synced' | 'failed'
        { name: 'retry_count', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
