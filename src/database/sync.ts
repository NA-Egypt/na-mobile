import { database } from './index';
import { apiClient } from '../api/client';
import Meeting from './models/Meeting';
import Group from './models/Group';
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
  if (Array.isArray(res)) return res;
  return [];
};

export async function pullMasterData(): Promise<void> {
  try {
    const now = new Date();
    // Preload a 14-month rolling window (1 month past to 12 months ahead) so all recurring events are expanded
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 13, 0).toISOString().split('T')[0];

    const [
      meetingsRes,
      groupsRes,
      citiesRes,
      neighborhoodsRes,
      eventsRes,
      calendarEventsRes,
      topicsRes,
      optionsRes,
      daysRes,
      homeRes,
    ] = await Promise.allSettled([
      apiClient.get('/meetings'),
      apiClient.get('/groups', { params: { per_page: 100 } }),
      apiClient.get('/cities'),
      apiClient.get('/neighborhoods'),
      apiClient.get('/events'),
      apiClient.get('/calendar-events', { params: { start: startDate, end: endDate } }),
      apiClient.get('/topics'),
      apiClient.get('/options'),
      apiClient.get('/days'),
      apiClient.get('/home'),
    ]);

    await database.write(async () => {
      // 1. Days
      if (daysRes.status === 'fulfilled') {
        const days = extractArray(daysRes.value);
        const col = database.get<Day>('days');
        for (const item of days) {
          if (!item?.id) continue;
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
          if (!item?.id) continue;
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
          if (!item?.id) continue;
          const existing = await col.query(Q.where('remote_id', String(item.id))).fetch();
          const cityId = item.city_id ? String(item.city_id) : '';
          if (existing.length > 0) {
            await existing[0].update((n) => {
              n.cityId = cityId || n.cityId;
              n.arName = item.ar_name || n.arName;
              n.enName = item.en_name || n.enName;
              n.updatedAt = new Date();
            });
          } else {
            await col.create((n) => {
              n.remoteId = String(item.id);
              n.cityId = cityId;
              n.arName = item.ar_name || '';
              n.enName = item.en_name || '';
              n.updatedAt = new Date();
            });
          }
        }
      }

      // Standard NA topic translation map for English UI
      const STANDARD_TOPIC_EN_MAP: Record<string, string> = {
        'خطوة أولى': 'Step 1',
        'خطوة ثانية': 'Step 2',
        'خطوة ثالثة': 'Step 3',
        'خطوة رابعة': 'Step 4',
        'خطوة خامسة': 'Step 5',
        'خطوة سادسة': 'Step 6',
        'خطوة سابعة': 'Step 7',
        'خطوة ثامنة': 'Step 8',
        'خطوة تاسعة': 'Step 9',
        'خطوة عاشرة': 'Step 10',
        'خطوة حادية عشرة': 'Step 11',
        'خطوة ثانية عشرة': 'Step 12',
        'الخطوات الاثنتا عشرة': 'The 12 Steps',
        'الخطوات الاثنتي عشرة': 'The 12 Steps',
        'الخطوات': 'The Steps',
        'التقاليد الاثنا عشر': 'The 12 Traditions',
        'التقاليد': 'The Traditions',
        'المفاهيم الاثنا عشر': 'The 12 Concepts',
        'المفاهيم': 'The Concepts',
        'مفتوح': 'Open',
        'مغلق': 'Closed',
        'قراءة ومناقشة': 'Reading & Discussion',
        'مناقشة موضوع': 'Topic Discussion',
        'مشاركة حرة': 'Open Share',
        'قراءة النص الأساسي': 'Basic Text Reading',
        'النص الأساسي': 'Basic Text',
        'لليوم فقط': 'Just For Today',
        'جدد': 'Newcomers',
        'أعضاء جدد': 'Newcomers',
        'رجال': 'Men',
        'سيدات': 'Women',
        'اجتماع أعمال': 'Business Meeting',
        'اجتماع خدمي': 'Service Meeting',
      };

      // 4. Groups & Map for meetings hydration
      const groupLookupMap = new Map<string, any>();
      if (groupsRes.status === 'fulfilled') {
        const groups = extractArray(groupsRes.value);
        const col = database.get<Group>('groups');
        for (const item of groups) {
          if (!item?.id) continue;
          groupLookupMap.set(String(item.id), item);
          const existing = await col.query(Q.where('remote_id', String(item.id))).fetch();
          const name = item.ar_name || item.en_name || item.name || '';
          const groupType = item.group_type || '';
          const cityId = item.neighborhood?.city_id ? String(item.neighborhood.city_id) : '';
          const neighborhoodId = item.neighborhood_id ? String(item.neighborhood_id) : '';

          if (existing.length > 0) {
            await existing[0].update((g) => {
              g.name = name || g.name;
              g.groupType = groupType || g.groupType;
              g.cityId = cityId || g.cityId;
              g.neighborhoodId = neighborhoodId || g.neighborhoodId;
              g.updatedAt = new Date();
            });
          } else {
            await col.create((g) => {
              g.remoteId = String(item.id);
              g.name = name;
              g.groupType = groupType;
              g.cityId = cityId;
              g.neighborhoodId = neighborhoodId;
              g.updatedAt = new Date();
            });
          }
        }
      }

      // 5. Topics
      if (topicsRes.status === 'fulfilled') {
        const topics = extractArray(topicsRes.value);
        const col = database.get<Topic>('topics');
        for (const item of topics) {
          if (!item?.id) continue;
          const existing = await col.query(Q.where('remote_id', String(item.id))).fetch();
          const ar = item.ar_name || item.name_ar || item.name || '';
          const en = item.en_name || item.name_en || STANDARD_TOPIC_EN_MAP[ar] || (ar && !/[\u0600-\u06FF]/.test(ar) ? ar : '');
          if (existing.length > 0) {
            await existing[0].update((t) => {
              t.arName = ar || t.arName;
              t.enName = en || t.enName;
            });
          } else {
            await col.create((t) => {
              t.remoteId = String(item.id);
              t.arName = ar;
              t.enName = en;
            });
          }
        }
      }

      // 6. Options
      if (optionsRes.status === 'fulfilled') {
        const options = extractArray(optionsRes.value);
        const col = database.get<Option>('options');
        for (const item of options) {
          if (!item?.id) continue;
          const existing = await col.query(Q.where('remote_id', String(item.id))).fetch();
          if (existing.length > 0) {
            await existing[0].update((o) => {
              o.arName = item.ar_name || item.name_ar || o.arName;
              o.enName = item.en_name || item.name_en || o.enName;
            });
          } else {
            await col.create((o) => {
              o.remoteId = String(item.id);
              o.arName = item.ar_name || item.name_ar || '';
              o.enName = item.en_name || item.name_en || '';
            });
          }
        }
      }

      // 7. Meetings (Handles both nested group relation schema, groups lookup & flat fallbacks)
      if (meetingsRes.status === 'fulfilled') {
        const remoteMeetings = extractArray(meetingsRes.value);
        const col = database.get<Meeting>('meetings');
        for (const item of remoteMeetings) {
          if (!item?.id) continue;
          const existing = await col.query(Q.where('remote_id', String(item.id))).fetch();

          // Extract attributes considering relation hierarchy, lookup map, and flat keys
          const groupObj = item.group || {};
          const matchedGroup = item.group_id ? groupLookupMap.get(String(item.group_id)) : undefined;
          const groupNeighborhood = groupObj.neighborhood || matchedGroup?.neighborhood || {};
          const groupCity = groupNeighborhood.city || matchedGroup?.neighborhood?.city || {};

          const groupNameAr = groupObj.ar_name || matchedGroup?.ar_name || item.group_name_ar || '';
          const groupNameEn = groupObj.en_name || matchedGroup?.en_name || item.group_name_en || '';
          const groupType = groupObj.group_type || matchedGroup?.group_type || item.group_type || '';
          const addressAr = groupObj.ar_address || matchedGroup?.ar_address || item.address_ar || '';
          const addressEn = groupObj.en_address || matchedGroup?.en_address || item.address_en || '';
          const locationUrl =
            groupObj.location ||
            matchedGroup?.location ||
            item.location ||
            item.location_url ||
            item.meeting_url ||
            item.map_url ||
            item.google_maps_url ||
            '';

          const cityNameAr = groupCity.ar_name || item.city_name_ar || '';
          const cityNameEn = groupCity.en_name || item.city_name_en || '';
          const neighborhoodNameAr = groupNeighborhood.ar_name || item.neighborhood_name_ar || '';
          const neighborhoodNameEn = groupNeighborhood.en_name || item.neighborhood_name_en || '';

          // GSR Data Hydration
          const gsrNameAr =
            groupObj.ar_gsr_name ||
            matchedGroup?.ar_gsr_name ||
            item.ar_gsr_name ||
            item.gsr_name_ar ||
            '';
          const gsrNameEn =
            groupObj.en_gsr_name ||
            matchedGroup?.en_gsr_name ||
            item.en_gsr_name ||
            item.gsr_name_en ||
            '';
          const gsrPhone =
            groupObj.phone ||
            matchedGroup?.phone ||
            item.phone ||
            item.gsr_phone ||
            '';

          // Format topics bilingual
          let topicNameAr = '';
          let topicNameEn = '';

          if (Array.isArray(item.topics) && item.topics.length > 0) {
            topicNameAr = item.topics
              .map((t: any) => t.ar_name || t.name_ar || t.name || '')
              .filter(Boolean)
              .join(', ');
            topicNameEn = item.topics
              .map((t: any) => {
                if (t.en_name) return t.en_name;
                if (t.name_en) return t.name_en;
                const ar = t.ar_name || t.name_ar || t.name || '';
                return STANDARD_TOPIC_EN_MAP[ar] || (ar && !/[\u0600-\u06FF]/.test(ar) ? ar : '');
              })
              .filter(Boolean)
              .join(', ');
          } else if (typeof item.topic === 'object' && item.topic !== null) {
            const t = item.topic;
            topicNameAr = t.ar_name || t.name_ar || t.name || '';
            topicNameEn =
              t.en_name ||
              t.name_en ||
              STANDARD_TOPIC_EN_MAP[topicNameAr] ||
              (topicNameAr && !/[\u0600-\u06FF]/.test(topicNameAr) ? topicNameAr : '');
          } else if (item.topic || item.topic_name || item.topic_ar || item.topic_en) {
            topicNameAr = String(item.topic_ar || item.topic_name || item.topic || '');
            topicNameEn = String(
              item.topic_en ||
              STANDARD_TOPIC_EN_MAP[topicNameAr] ||
              (topicNameAr && !/[\u0600-\u06FF]/.test(topicNameAr) ? topicNameAr : '')
            );
          }

          const fallbackTopic = topicNameAr || topicNameEn;

          if (existing.length > 0) {
            await existing[0].update((m) => {
              m.groupId = item.group_id ? String(item.group_id) : m.groupId;
              m.directOnlineGroupId = item.direct_online_group_id ? String(item.direct_online_group_id) : m.directOnlineGroupId;
              m.dayId = item.day_id ? String(item.day_id) : m.dayId;
              m.groupNameAr = groupNameAr || m.groupNameAr;
              m.groupNameEn = groupNameEn || m.groupNameEn;
              m.groupType = groupType || m.groupType;
              m.addressAr = addressAr || m.addressAr;
              m.addressEn = addressEn || m.addressEn;
              m.locationUrl = locationUrl || m.locationUrl;
              m.topicName = fallbackTopic || m.topicName;
              m.topicNameAr = topicNameAr || m.topicNameAr;
              m.topicNameEn = topicNameEn || m.topicNameEn;
              m.cityNameAr = cityNameAr || m.cityNameAr;
              m.cityNameEn = cityNameEn || m.cityNameEn;
              m.neighborhoodNameAr = neighborhoodNameAr || m.neighborhoodNameAr;
              m.neighborhoodNameEn = neighborhoodNameEn || m.neighborhoodNameEn;
              m.gsrNameAr = gsrNameAr || m.gsrNameAr;
              m.gsrNameEn = gsrNameEn || m.gsrNameEn;
              m.gsrPhone = gsrPhone || m.gsrPhone;
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
              m.groupNameAr = groupNameAr;
              m.groupNameEn = groupNameEn;
              m.groupType = groupType;
              m.addressAr = addressAr;
              m.addressEn = addressEn;
              m.locationUrl = locationUrl;
              m.topicName = fallbackTopic;
              m.topicNameAr = topicNameAr;
              m.topicNameEn = topicNameEn;
              m.cityNameAr = cityNameAr;
              m.cityNameEn = cityNameEn;
              m.neighborhoodNameAr = neighborhoodNameAr;
              m.neighborhoodNameEn = neighborhoodNameEn;
              m.gsrNameAr = gsrNameAr;
              m.gsrNameEn = gsrNameEn;
              m.gsrPhone = gsrPhone;
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

      // 8. Events (Both /calendar-events and /home upcoming_events)
      const rawEvents: any[] = [];
      if (calendarEventsRes.status === 'fulfilled') {
        const calEvents = extractArray(calendarEventsRes.value);
        rawEvents.push(...calEvents);
      }
      if (eventsRes.status === 'fulfilled') {
        const standardEvents = extractArray(eventsRes.value);
        rawEvents.push(...standardEvents);
      }
      if (homeRes.status === 'fulfilled' && homeRes.value?.data?.data?.upcoming_events) {
        const homeEvents = homeRes.value.data.data.upcoming_events;
        if (Array.isArray(homeEvents)) {
          rawEvents.push(...homeEvents);
        }
      }

      const eventsCol = database.get<Event>('events');
      for (const item of rawEvents) {
        if (!item?.id && !item?.remote_id && !item?.title && !item?.name) continue;
        const start =
          item.start ||
          item.start_date ||
          item.date ||
          item.event_date ||
          item.start_time ||
          item.created_at ||
          '';

        const baseId = String(item.id || item.remote_id || Math.random().toString());
        const occurrenceDate = start ? start.slice(0, 10) : '';
        const remoteId = occurrenceDate && !baseId.includes('_') ? `${baseId}_${occurrenceDate}` : baseId;

        const title =
          item.title ||
          item.ar_title ||
          item.name ||
          item.name_ar ||
          item.en_title ||
          item.event_name ||
          'فعالية زمالة المدمنين المجهولين';

        const description =
          item.description ||
          item.ar_description ||
          item.en_description ||
          item.details ||
          item.content ||
          '';

        const existing = await eventsCol.query(Q.where('remote_id', remoteId)).fetch();

        const end =
          item.end ||
          item.end_date ||
          item.end_time ||
          start ||
          '';

        const location =
          item.location ||
          item.ar_location ||
          item.en_location ||
          item.address ||
          item.ar_address ||
          item.place ||
          '';

        const organizer =
          item.organizer ||
          item.organizer_name ||
          item.service_body?.name ||
          item.committee?.name ||
          '';

        const recurrence =
          item.formatted_recurrence ||
          (Array.isArray(item.recurrence) ? item.recurrence.join(', ') : item.recurrence || '');

        if (existing.length > 0) {
          await existing[0].update((ev) => {
            ev.title = title || ev.title;
            ev.description = description || ev.description;
            ev.startDate = start || ev.startDate;
            ev.endDate = end || ev.endDate;
            ev.location = location || ev.location;
            ev.organizer = organizer || ev.organizer;
            ev.recurrence = recurrence || ev.recurrence;
            ev.updatedAt = new Date();
          });
        } else {
          await eventsCol.create((ev) => {
            ev.remoteId = remoteId;
            ev.title = title;
            ev.description = description;
            ev.startDate = start;
            ev.endDate = end;
            ev.location = location;
            ev.organizer = organizer;
            ev.recurrence = recurrence;
            ev.updatedAt = new Date();
          });
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
