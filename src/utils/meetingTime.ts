/**
 * Meeting Time & Online Schedule Utilities
 * Provides time awareness (Live Now, Upcoming, Day difference), Zoom link parsing,
 * and smart sorting for online meetings.
 */

export interface ParsedTime {
  hours: number;
  minutes: number;
  totalMinutes: number; // 0..1439
}

export type MeetingLiveStatus =
  | 'live' // Happening right now
  | 'starting_soon' // Starts within 60 minutes today
  | 'today_upcoming' // Later today (> 60 minutes)
  | 'upcoming_day' // Upcoming on future days (tomorrow ... next 6 days)
  | 'today_ended'; // Ended earlier today

export interface MeetingTimeInfo {
  status: MeetingLiveStatus;
  isLive: boolean;
  isToday: boolean;
  dayDiff: number; // 0 = today, 1 = tomorrow, ..., 6
  minutesUntilStart: number;
  minutesRemaining?: number;
  startMinutes: number;
  endMinutes: number;
  displayStatusText?: {
    ar: string;
    en: string;
  };
}

export interface ZoomDetails {
  joinUrl: string;
  meetingId?: string;
  passcode?: string;
  isZoom: boolean;
  platformName: string;
}

/**
 * Checks whether a meeting item is an Online/Virtual meeting
 */
export function isOnlineMeeting(meeting: {
  groupType?: string;
  locationUrl?: string;
  cityName?: string;
  neighborhoodName?: string;
  notes?: string;
}): boolean {
  if (!meeting) return false;

  const gType = (meeting.groupType || '').toLowerCase().trim();
  if (
    gType === 'online' ||
    gType === 'virtual' ||
    gType === 'direct_online' ||
    gType.includes('اونلاين') ||
    gType.includes('أونلاين') ||
    gType.includes('اون لاين') ||
    gType.includes('عبر الإنترنت')
  ) {
    return true;
  }

  const url = (meeting.locationUrl || '').toLowerCase();
  if (
    url.includes('zoom.us') ||
    url.includes('meet.google.com') ||
    url.includes('teams.microsoft.com') ||
    url.includes('teams.live.com') ||
    url.includes('skype.com')
  ) {
    return true;
  }

  const city = (meeting.cityName || '').toLowerCase();
  const neighborhood = (meeting.neighborhoodName || '').toLowerCase();
  if (
    city.includes('online') ||
    city.includes('أونلاين') ||
    city.includes('اونلاين') ||
    city.includes('عبر الإنترنت') ||
    neighborhood.includes('online') ||
    neighborhood.includes('أونلاين') ||
    neighborhood.includes('اونلاين')
  ) {
    return true;
  }

  const notes = (meeting.notes || '').toLowerCase();
  if (notes.includes('zoom.us') || notes.includes('zoom meeting') || notes.includes('زووم') || notes.includes('زوم')) {
    return true;
  }

  return false;
}

/**
 * Maps day name or ID to JavaScript Date.getDay() format (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getJsDayIndex(dayName: string, dayId?: string | number): number {
  const norm = (dayName || '').toLowerCase().trim();

  if (norm.includes('أحد') || norm.includes('احد') || norm.includes('sun') || String(dayId) === '1' || String(dayId) === 'sunday') return 0;
  if (norm.includes('إثنين') || norm.includes('اثنين') || norm.includes('mon') || String(dayId) === '2' || String(dayId) === 'monday') return 1;
  if (norm.includes('ثلاثاء') || norm.includes('tue') || String(dayId) === '3' || String(dayId) === 'tuesday') return 2;
  if (norm.includes('أربعاء') || norm.includes('اربعاء') || norm.includes('wed') || String(dayId) === '4' || String(dayId) === 'wednesday') return 3;
  if (norm.includes('خميس') || norm.includes('thu') || String(dayId) === '5' || String(dayId) === 'thursday') return 4;
  if (norm.includes('جمعة') || norm.includes('جمعه') || norm.includes('fri') || String(dayId) === '6' || String(dayId) === 'friday') return 5;
  if (norm.includes('سبت') || norm.includes('sat') || String(dayId) === '7' || String(dayId) === 'saturday') return 6;

  // Fallback if dayId is 0-6
  const num = Number(dayId);
  if (!isNaN(num) && num >= 0 && num <= 6) return num;

  return 0;
}

/**
 * Parses time string e.g. "19:30:00", "07:30 PM", "7:30 م", "20:00"
 */
export function parseMeetingTime(timeStr: string): ParsedTime {
  if (!timeStr) return { hours: 19, minutes: 0, totalMinutes: 19 * 60 };

  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM') || clean.includes('م') || clean.includes('مساء');
  const isAM = clean.includes('AM') || clean.includes('ص') || clean.includes('صباح');

  const digits = clean.replace(/[^0-9:]/g, '');
  const parts = digits.split(':').map((p) => parseInt(p, 10) || 0);

  let hours = parts[0] || 0;
  const minutes = parts[1] || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  hours = Math.min(Math.max(hours, 0), 23);
  const clampedMinutes = Math.min(Math.max(minutes, 0), 59);

  return {
    hours,
    minutes: clampedMinutes,
    totalMinutes: hours * 60 + clampedMinutes,
  };
}

/**
 * Evaluates real-time meeting schedule status against current time
 */
export function getMeetingTimeStatus(
  meeting: {
    dayName?: string;
    dayId?: string | number;
    startTime?: string;
    endTime?: string;
  },
  now: Date = new Date()
): MeetingTimeInfo {
  const currentJsDay = now.getDay(); // 0..6
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

  const meetingDayIndex = getJsDayIndex(meeting.dayName || '', meeting.dayId);
  const startParsed = parseMeetingTime(meeting.startTime || '');
  let endParsed = parseMeetingTime(meeting.endTime || '');

  // If endTime is missing or earlier/equal to start, assume 90-minute default duration
  if (!meeting.endTime || endParsed.totalMinutes <= startParsed.totalMinutes) {
    const defaultEndMinutes = (startParsed.totalMinutes + 90) % (24 * 60);
    endParsed = {
      hours: Math.floor(defaultEndMinutes / 60),
      minutes: defaultEndMinutes % 60,
      totalMinutes: defaultEndMinutes,
    };
  }

  // Calculate day difference (0 = today, 1 = tomorrow, ..., 6 = in 6 days)
  let dayDiff = (meetingDayIndex - currentJsDay + 7) % 7;
  const isToday = dayDiff === 0;

  if (isToday) {
    const isLive =
      currentTotalMinutes >= startParsed.totalMinutes &&
      currentTotalMinutes <= endParsed.totalMinutes;

    if (isLive) {
      const minutesRemaining = Math.max(0, endParsed.totalMinutes - currentTotalMinutes);
      return {
        status: 'live',
        isLive: true,
        isToday: true,
        dayDiff: 0,
        minutesUntilStart: 0,
        minutesRemaining,
        startMinutes: startParsed.totalMinutes,
        endMinutes: endParsed.totalMinutes,
        displayStatusText: {
          ar: 'جارٍ الآن',
          en: 'Live Now',
        },
      };
    }

    // Has it not started yet today?
    if (currentTotalMinutes < startParsed.totalMinutes) {
      const minutesUntilStart = startParsed.totalMinutes - currentTotalMinutes;
      const isStartingSoon = minutesUntilStart <= 60;

      const formatCountdownAr =
        minutesUntilStart < 60
          ? `يبدأ بعد ${minutesUntilStart} دقيقة`
          : `يبدأ بعد ${Math.floor(minutesUntilStart / 60)} ساعة`;
      const formatCountdownEn =
        minutesUntilStart < 60
          ? `Starts in ${minutesUntilStart}m`
          : `Starts in ${Math.floor(minutesUntilStart / 60)}h`;

      return {
        status: isStartingSoon ? 'starting_soon' : 'today_upcoming',
        isLive: false,
        isToday: true,
        dayDiff: 0,
        minutesUntilStart,
        startMinutes: startParsed.totalMinutes,
        endMinutes: endParsed.totalMinutes,
        displayStatusText: {
          ar: formatCountdownAr,
          en: formatCountdownEn,
        },
      };
    }

    // Otherwise meeting already ended today
    return {
      status: 'today_ended',
      isLive: false,
      isToday: true,
      dayDiff: 7, // Cycle to next week in priority
      minutesUntilStart: 7 * 24 * 60 + (startParsed.totalMinutes - currentTotalMinutes),
      startMinutes: startParsed.totalMinutes,
      endMinutes: endParsed.totalMinutes,
      displayStatusText: {
        ar: 'انتهى اليوم',
        en: 'Ended today',
      },
    };
  }

  // Future day this week (dayDiff 1..6)
  const totalMinutesUntilStart = dayDiff * 24 * 60 + (startParsed.totalMinutes - currentTotalMinutes);

  return {
    status: 'upcoming_day',
    isLive: false,
    isToday: false,
    dayDiff,
    minutesUntilStart: totalMinutesUntilStart,
    startMinutes: startParsed.totalMinutes,
    endMinutes: endParsed.totalMinutes,
  };
}

/**
 * Sorts Online Meetings intelligently:
 * 1. Live Now meetings first
 * 2. Today's starting soon / upcoming meetings (chronologically by start time)
 * 3. Future days meetings (chronologically: tomorrow -> day after -> etc.)
 * 4. Today's ended meetings (at the bottom of the cycle)
 */
export function sortOnlineMeetings<T extends { dayName?: string; dayId?: string | number; startTime?: string; endTime?: string }>(
  meetings: T[],
  now: Date = new Date()
): (T & { timeInfo: MeetingTimeInfo })[] {
  const withTimeInfo = meetings.map((m) => ({
    ...m,
    timeInfo: getMeetingTimeStatus(m, now),
  }));

  return withTimeInfo.sort((a, b) => {
    const statusWeight: Record<MeetingLiveStatus, number> = {
      live: 0,
      starting_soon: 1,
      today_upcoming: 2,
      upcoming_day: 3,
      today_ended: 4,
    };

    const weightA = statusWeight[a.timeInfo.status];
    const weightB = statusWeight[b.timeInfo.status];

    if (weightA !== weightB) {
      return weightA - weightB;
    }

    // If both are live, sort by earliest start time
    if (a.timeInfo.status === 'live' && b.timeInfo.status === 'live') {
      return a.timeInfo.startMinutes - b.timeInfo.startMinutes;
    }

    // If both are today upcoming, sort by start time
    if (
      (a.timeInfo.status === 'starting_soon' || a.timeInfo.status === 'today_upcoming') &&
      (b.timeInfo.status === 'starting_soon' || b.timeInfo.status === 'today_upcoming')
    ) {
      return a.timeInfo.startMinutes - b.timeInfo.startMinutes;
    }

    // If both are future days, sort by dayDiff, then start time
    if (a.timeInfo.status === 'upcoming_day' && b.timeInfo.status === 'upcoming_day') {
      if (a.timeInfo.dayDiff !== b.timeInfo.dayDiff) {
        return a.timeInfo.dayDiff - b.timeInfo.dayDiff;
      }
      return a.timeInfo.startMinutes - b.timeInfo.startMinutes;
    }

    return a.timeInfo.startMinutes - b.timeInfo.startMinutes;
  });
}

/**
 * Extracts Zoom / Virtual meeting URL, meeting ID, and passcode from locationUrl and notes
 */
export function extractZoomDetails(locationUrl?: string, notes?: string): ZoomDetails {
  const combined = `${locationUrl || ''} ${notes || ''}`;

  // 1. Check for standard URLs
  let joinUrl = '';
  const urlMatch = combined.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    joinUrl = urlMatch[0].replace(/[),;.]+$/, '');
  } else if (locationUrl && (locationUrl.startsWith('http://') || locationUrl.startsWith('https://'))) {
    joinUrl = locationUrl.trim();
  }

  const isZoom =
    joinUrl.toLowerCase().includes('zoom.us') ||
    combined.toLowerCase().includes('zoom') ||
    combined.includes('زووم') ||
    combined.includes('زوم');

  // Extract Zoom Meeting ID
  let meetingId: string | undefined;
  // Match zoom URL meeting ID: zoom.us/j/1234567890
  const zoomUrlIdMatch = joinUrl.match(/zoom\.us\/j\/(\d+)/i);
  if (zoomUrlIdMatch) {
    meetingId = zoomUrlIdMatch[1];
  } else {
    // Match Meeting ID in text: Meeting ID: 123 456 7890 or ID: 1234567890 or رقم الاجتماع / معرف
    const idRegex = /(?:meeting\s*id|id|معرف|رقم\s*الاجتماع)[:\s]*([0-9\s-]{9,13})/i;
    const idMatch = combined.match(idRegex);
    if (idMatch) {
      meetingId = idMatch[1].replace(/[\s-]/g, '');
    }
  }

  // Extract Passcode / Password
  let passcode: string | undefined;
  // Match ?pwd= in URL
  const pwdUrlMatch = joinUrl.match(/[?&]pwd=([^&#\s]+)/i);
  if (pwdUrlMatch) {
    passcode = pwdUrlMatch[1];
  } else {
    // Match in text: Passcode: 1234 or Password: 1234 or الرقم السري / كلمة المرور
    const passRegex = /(?:passcode|pwd|password|كلمة\s*المرور|الرقم\s*السري|الباسورد)[:\s]*([a-zA-Z0-9!@#$%^&*]+)/i;
    const passMatch = combined.match(passRegex);
    if (passMatch) {
      passcode = passMatch[1];
    }
  }

  // Determine platform name
  let platformName = 'Zoom';
  if (joinUrl.includes('meet.google.com')) platformName = 'Google Meet';
  else if (joinUrl.includes('teams.microsoft.com') || joinUrl.includes('teams.live.com')) platformName = 'Microsoft Teams';
  else if (joinUrl.includes('skype.com')) platformName = 'Skype';

  // If no URL found but we have a meeting ID, construct direct Zoom URL
  if (!joinUrl && meetingId) {
    joinUrl = `https://zoom.us/j/${meetingId}${passcode ? `?pwd=${passcode}` : ''}`;
  }

  return {
    joinUrl,
    meetingId,
    passcode,
    isZoom,
    platformName,
  };
}
