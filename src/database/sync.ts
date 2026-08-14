import { database } from './index';
import { apiClient } from '../api/client';
import Meeting from './models/Meeting';
import City from './models/City';
import Neighborhood from './models/Neighborhood';
import Day from './models/Day';
import Topic from './models/Topic';
import Option from './models/Option';
import Event from './models/Event';
import { Q } from '@nozbe/watermelondb';

const extractArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res.data?.data)) return res.data.data;
  if (Array.isArray(res.data)) return res.data;
  return [];
};

export async function pullMasterData(): Promise<void> {
  try {
    const [meetingsRes, citiesRes, neighborhoodsRes, eventsRes, calendarEventsRes, topicsRes, optionsRes, daysRes] = await Promise.allSettled([
      apiClient.get('/meetings'),
      apiClient.get('/cities'),
      apiClient.get('/neighborhoods'),
      apiClient.get('/events'),
      apiClient.get('/calendar-events'),
      apiClient.get('/topics'),
      apiClient.get('/options'),
      apiClient.get('/days'),
    ]);

    await database.write(async () => {
      // 1. Days
      if (daysRes.status === 'fulfilled') {
        const days = extractArray(daysRes.value);
        const col = database.get<Day>('days');
        for (const item of days) {
          const existing = await col.query(Q.where('remote_id', String(item.id))).fetch();
          if (existing.length > 0) {
            await existing[0].update((d) => {
              d.arName = item.ar_name || d.arName;
              d.enName = item.en_name || d.enName;
              d.code = item.code || d.code;
            });
          } else {
            await col.create((d) => {
              d.remoteId = String(item.id);
              d.arName = item.ar_name || '';
              d.enName = item.en_name || '';
              d.code = item.code || '';
            });
          }
        }
      }

      // 2. Cities
      if (citiesRes.status === 'fulfilled') {
        const cities = extractArray(citiesRes.value);
        const col = database.get<City>('cities');
        for (const item of cities) {
          const existing = await col.query(Q.where('remote_id', String(item.id))).fetch();
          if (existing.length > 0) {
            await existing[0].update((c) => {
              c.arName = item.ar_name || c.arName;
              c.enName = item.en_name || c.enName;
              c.updatedAt = new Date();
            });
          } else {
            await col.create((c) => {
              c.remoteId = String(item.id);
              c.arName = item.ar_name || '';
              c.enName = item.en_name || '';
              c.updatedAt = new Date();
            });
          }
        }
      }

      // 3. Neighborhoods
      if (neighborhoodsRes.status === 'fulfilled') {
        const neighborhoods = extractArray(neighborhoodsRes.value);
        const col = database.get<Neighborhood>('neighborhoods');
        for (const item of neighborhoods) {
          const existing = await col.query(Q.where('remote_id', String(item.id))).fetch();
          if (existing.length > 0) {
            await existing[0].update((n) => {
              n.cityId = String(item.city_id || n.cityId);
              n.arName = item.ar_name || n.arName;
              n.enName = item.en_name || n.enName;
              n.updatedAt = new Date();
            });
          } else {
            await col.create((n) => {
              n.remoteId = String(item.id);
              n.cityId = String(item.city_id || '');
              n.arName = item.ar_name || '';
              n.enName = item.en_name || '';
              n.updatedAt = new Date();
            });
          }
        }
      }

      // 4. Meetings with direct live API attributes
      if (meetingsRes.status === 'fulfilled') {
        const remoteMeetings = extractArray(meetingsRes.value);
        const col = database.get<Meeting>('meetings');
        for (const item of remoteMeetings) {
          const existing = await col.query(Q.where('remote_id', String(item.id))).fetch();
          if (existing.length > 0) {
            await existing[0].update((m) => {
              m.groupId = item.group_id ? String(item.group_id) : m.groupId;
              m.directOnlineGroupId = item.direct_online_group_id ? String(item.direct_online_group_id) : m.directOnlineGroupId;
              m.dayId = item.day_id ? String(item.day_id) : m.dayId;
              m.groupNameAr = item.group_name_ar ?? m.groupNameAr;
              m.groupNameEn = item.group_name_en ?? m.groupNameEn;
              m.groupType = item.group_type ?? m.groupType;
              m.addressAr = item.address_ar ?? m.addressAr;
              m.addressEn = item.address_en ?? m.addressEn;
              m.cityNameAr = item.city_name_ar ?? m.cityNameAr;
              m.cityNameEn = item.city_name_en ?? m.cityNameEn;
              m.neighborhoodNameAr = item.neighborhood_name_ar ?? m.neighborhoodNameAr;
              m.neighborhoodNameEn = item.neighborhood_name_en ?? m.neighborhoodNameEn;
              m.startTime = item.start_time ?? m.startTime;
              m.endTime = item.end_time ?? m.endTime;
              m.formattedStartTime = item.formatted_start_time ?? m.formattedStartTime;
              m.formattedEndTime = item.formatted_end_time ?? m.formattedEndTime;
              m.duration = item.duration ? String(item.duration) : m.duration;
              m.notes = item.notes ?? m.notes;
              m.type = item.type ?? m.type;
              m.lang = item.lang ?? m.lang;
              m.status = item.status ?? m.status;
              if (item.recurrence) m.recurrence = item.recurrence;
              m.updatedAt = new Date();
            });
          } else {
            await col.create((m) => {
              m.remoteId = String(item.id);
              m.groupId = item.group_id ? String(item.group_id) : '';
              m.directOnlineGroupId = item.direct_online_group_id ? String(item.direct_online_group_id) : undefined;
              m.dayId = item.day_id ? String(item.day_id) : '';
              m.groupNameAr = item.group_name_ar || '';
              m.groupNameEn = item.group_name_en || '';
              m.groupType = item.group_type || '';
              m.addressAr = item.address_ar || '';
              m.addressEn = item.address_en || '';
              m.cityNameAr = item.city_name_ar || '';
              m.cityNameEn = item.city_name_en || '';
              m.neighborhoodNameAr = item.neighborhood_name_ar || '';
              m.neighborhoodNameEn = item.neighborhood_name_en || '';
              m.startTime = item.start_time || '';
              m.endTime = item.end_time || '';
              m.formattedStartTime = item.formatted_start_time || '';
              m.formattedEndTime = item.formatted_end_time || '';
              m.duration = item.duration ? String(item.duration) : '';
              m.notes = item.notes || '';
              m.type = item.type || 'open';
              m.lang = item.lang || 'arabic';
              m.status = item.status || 'available';
              m.recurrence = item.recurrence || ['weekly'];
              m.updatedAt = new Date();
            });
          }
        }
      }

      // 5. Events: Combine /calendar-events and /events from live backend
      const rawEvents: any[] = [];
      if (calendarEventsRes.status === 'fulfilled') {
        const calEvents = extractArray(calendarEventsRes.value);
        rawEvents.push(...calEvents);
      }
      if (eventsRes.status === 'fulfilled') {
        const standardEvents = extractArray(eventsRes.value);
        rawEvents.push(...standardEvents);
      }

      const eventsCol = database.get<Event>('events');
      for (const item of rawEvents) {
        const existing = await eventsCol.query(Q.where('remote_id', String(item.id))).fetch();
        const start = item.start || item.start_date || '';
        const end = item.end || item.end_date || '';
        const organizer = item.organizer || '';
        const recurrence = item.formatted_recurrence || (Array.isArray(item.recurrence) ? item.recurrence.join(', ') : '');

        if (existing.length > 0) {
          await existing[0].update((ev) => {
            ev.title = item.title ?? ev.title;
            ev.description = item.description ?? ev.description;
            ev.startDate = start || ev.startDate;
            ev.endDate = end || ev.endDate;
            ev.location = item.location ?? ev.location;
            ev.organizer = organizer ?? ev.organizer;
            ev.recurrence = recurrence ?? ev.recurrence;
            ev.updatedAt = new Date();
          });
        } else {
          await eventsCol.create((ev) => {
            ev.remoteId = String(item.id);
            ev.title = item.title || '';
            ev.description = item.description || '';
            ev.startDate = start;
            ev.endDate = end;
            ev.location = item.location || '';
            ev.organizer = organizer;
            ev.recurrence = recurrence;
            ev.updatedAt = new Date();
          });
        }
      }

      // 6. Topics
      if (topicsRes.status === 'fulfilled') {
        const topics = extractArray(topicsRes.value);
        const col = database.get<Topic>('topics');
        for (const item of topics) {
          const existing = await col.query(Q.where('remote_id', String(item.id))).fetch();
          if (existing.length === 0) {
            await col.create((t) => {
              t.remoteId = String(item.id);
              t.arName = item.ar_name || item.name_ar || '';
              t.enName = item.en_name || item.name_en || '';
            });
          }
        }
      }

      // 7. Options
      if (optionsRes.status === 'fulfilled') {
        const options = extractArray(optionsRes.value);
        const col = database.get<Option>('options');
        for (const item of options) {
          const existing = await col.query(Q.where('remote_id', String(item.id))).fetch();
          if (existing.length === 0) {
            await col.create((o) => {
              o.remoteId = String(item.id);
              o.arName = item.ar_name || item.name_ar || '';
              o.enName = item.en_name || item.name_en || '';
            });
          }
        }
      }
    });
  } catch (error) {
    console.warn('Pull master data sync error:', error);
  }
}

export async function seedInitialLocalData() {
  await pullMasterData();
}
