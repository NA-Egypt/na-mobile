import * as Location from 'expo-location';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface UserLocationResult {
  coordinates: GeoCoordinates | null;
  status: 'granted' | 'denied' | 'unavailable' | 'error';
  errorMessage?: string;
}

/**
 * Centroid coordinates for Egyptian cities, governorates and prominent neighborhoods
 * Used for precise proximity fallback when a meeting does not contain explicit GPS coordinates.
 */
export const EGYPT_CENTROIDS: Record<string, GeoCoordinates> = {
  // Major Governorates / Cities
  cairo: { latitude: 30.0444, longitude: 31.2357 },
  'القاهرة': { latitude: 30.0444, longitude: 31.2357 },
  giza: { latitude: 30.0131, longitude: 31.2089 },
  'الجيزة': { latitude: 30.0131, longitude: 31.2089 },
  alexandria: { latitude: 31.2001, longitude: 29.9187 },
  'الإسكندرية': { latitude: 31.2001, longitude: 29.9187 },
  'اسكندرية': { latitude: 31.2001, longitude: 29.9187 },
  mansoura: { latitude: 31.0409, longitude: 31.3785 },
  'المنصورة': { latitude: 31.0409, longitude: 31.3785 },
  tanta: { latitude: 30.7865, longitude: 31.0004 },
  'طنطا': { latitude: 30.7865, longitude: 31.0004 },
  zagazig: { latitude: 30.5877, longitude: 31.502 },
  'الزقازيق': { latitude: 30.5877, longitude: 31.502 },
  ismailia: { latitude: 30.5965, longitude: 32.2715 },
  'الإسماعيلية': { latitude: 30.5965, longitude: 32.2715 },
  'بور سعيد': { latitude: 31.2653, longitude: 32.3019 },
  'بورسعيد': { latitude: 31.2653, longitude: 32.3019 },
  'port said': { latitude: 31.2653, longitude: 32.3019 },
  suez: { latitude: 29.9668, longitude: 32.5498 },
  'السويس': { latitude: 29.9668, longitude: 32.5498 },
  assiut: { latitude: 27.1783, longitude: 31.1859 },
  'أسيوط': { latitude: 27.1783, longitude: 31.1859 },
  sohag: { latitude: 26.559, longitude: 31.6957 },
  'سوهاج': { latitude: 26.559, longitude: 31.6957 },
  minya: { latitude: 28.1099, longitude: 30.7503 },
  'المنيا': { latitude: 28.1099, longitude: 30.7503 },
  fayoum: { latitude: 29.3082, longitude: 30.8428 },
  'الفيوم': { latitude: 29.3082, longitude: 30.8428 },
  beni_suef: { latitude: 29.0661, longitude: 31.0994 },
  'بني سويف': { latitude: 29.0661, longitude: 31.0994 },
  qena: { latitude: 26.1551, longitude: 32.716 },
  'قنا': { latitude: 26.1551, longitude: 32.716 },
  luxor: { latitude: 25.6872, longitude: 32.6396 },
  'الأقصر': { latitude: 25.6872, longitude: 32.6396 },
  aswan: { latitude: 24.0889, longitude: 32.8998 },
  'أسوان': { latitude: 24.0889, longitude: 32.8998 },
  hurghada: { latitude: 27.2579, longitude: 33.8116 },
  'الغردقة': { latitude: 27.2579, longitude: 33.8116 },
  sharm: { latitude: 27.9158, longitude: 34.3299 },
  'شرم الشيخ': { latitude: 27.9158, longitude: 34.3299 },
  dahab: { latitude: 28.5097, longitude: 34.5137 },
  'دهب': { latitude: 28.5097, longitude: 34.5137 },
  damietta: { latitude: 31.4175, longitude: 31.8144 },
  'دمياط': { latitude: 31.4175, longitude: 31.8144 },

  // Prominent Greater Cairo Districts
  'downtown': { latitude: 30.0478, longitude: 31.2396 },
  'وسط البلد': { latitude: 30.0478, longitude: 31.2396 },
  'dokki': { latitude: 30.0384, longitude: 31.2125 },
  'الدقي': { latitude: 30.0384, longitude: 31.2125 },
  'mohandessin': { latitude: 30.0571, longitude: 31.2012 },
  'المهندسين': { latitude: 30.0571, longitude: 31.2012 },
  'zamalek': { latitude: 30.063, longitude: 31.2201 },
  'الزمالك': { latitude: 30.063, longitude: 31.2201 },
  'maadi': { latitude: 29.9602, longitude: 31.2569 },
  'المعادي': { latitude: 29.9602, longitude: 31.2569 },
  'nasr city': { latitude: 30.0566, longitude: 31.3458 },
  'مدينة نصر': { latitude: 30.0566, longitude: 31.3458 },
  'heliopolis': { latitude: 30.0898, longitude: 31.3285 },
  'مصر الجديدة': { latitude: 30.0898, longitude: 31.3285 },
  'new cairo': { latitude: 30.0074, longitude: 31.4913 },
  'القاهرة الجديدة': { latitude: 30.0074, longitude: 31.4913 },
  'التجمع': { latitude: 30.0074, longitude: 31.4913 },
  'التجمع الخامس': { latitude: 30.0074, longitude: 31.4913 },
  'rehab': { latitude: 30.0617, longitude: 31.496 },
  'الرحاب': { latitude: 30.0617, longitude: 31.496 },
  'madinaty': { latitude: 30.1158, longitude: 31.6288 },
  'مدينتي': { latitude: 30.1158, longitude: 31.6288 },
  'shubra': { latitude: 30.0833, longitude: 31.2461 },
  'شبرا': { latitude: 30.0833, longitude: 31.2461 },
  'shubra el kheima': { latitude: 30.1286, longitude: 31.2422 },
  'شبرا الخيمة': { latitude: 30.1286, longitude: 31.2422 },
  'helwan': { latitude: 29.8414, longitude: 31.3008 },
  'حلوان': { latitude: 29.8414, longitude: 31.3008 },
  'haram': { latitude: 29.9972, longitude: 31.1686 },
  'الهرم': { latitude: 29.9972, longitude: 31.1686 },
  'faisal': { latitude: 30.0055, longitude: 31.1764 },
  'فيصل': { latitude: 30.0055, longitude: 31.1764 },
  'agouza': { latitude: 30.0545, longitude: 31.2132 },
  'العجوزة': { latitude: 30.0545, longitude: 31.2132 },
  'october': { latitude: 29.9724, longitude: 30.9458 },
  '6th of october': { latitude: 29.9724, longitude: 30.9458 },
  'السادس من أكتوبر': { latitude: 29.9724, longitude: 30.9458 },
  '6 أكتوبر': { latitude: 29.9724, longitude: 30.9458 },
  'sheikh zayed': { latitude: 30.0469, longitude: 30.9856 },
  'الشيخ زايد': { latitude: 30.0469, longitude: 30.9856 },
  'mokattam': { latitude: 30.0167, longitude: 31.3 },
  'المقطم': { latitude: 30.0167, longitude: 31.3 },
  'sayeda zeinab': { latitude: 30.0306, longitude: 31.2389 },
  'السيدة زينب': { latitude: 30.0306, longitude: 31.2389 },
  'manial': { latitude: 30.0247, longitude: 31.2281 },
  'المنيل': { latitude: 30.0247, longitude: 31.2281 },
  'obour': { latitude: 30.2224, longitude: 31.4727 },
  'العبور': { latitude: 30.2224, longitude: 31.4727 },
  'sherouk': { latitude: 30.1384, longitude: 31.6212 },
  'الشروق': { latitude: 30.1384, longitude: 31.6212 },

  // Prominent Alexandria Districts
  'raml': { latitude: 31.2001, longitude: 29.9187 },
  'محطة الرمل': { latitude: 31.2001, longitude: 29.9187 },
  'smouha': { latitude: 31.2156, longitude: 29.9547 },
  'سموحة': { latitude: 31.2156, longitude: 29.9547 },
  'miami': { latitude: 31.2658, longitude: 30.0033 },
  'ميامي': { latitude: 31.2658, longitude: 30.0033 },
  'sidi gaber': { latitude: 31.2189, longitude: 29.9419 },
  'سيدي جابر': { latitude: 31.2189, longitude: 29.9419 },
  'sidi beshr': { latitude: 31.2583, longitude: 29.9889 },
  'سيدي بشر': { latitude: 31.2583, longitude: 29.9889 },
  'mandara': { latitude: 31.2778, longitude: 30.0167 },
  'المندرة': { latitude: 31.2778, longitude: 30.0167 },
  'agami': { latitude: 31.0942, longitude: 29.7497 },
  'العجمي': { latitude: 31.0942, longitude: 29.7497 },
  'ibrahimiya': { latitude: 31.2114, longitude: 29.9328 },
  'الإبراهيمية': { latitude: 31.2114, longitude: 29.9328 },
  'camp caesar': { latitude: 31.2081, longitude: 29.9272 },
  'كامب شيزار': { latitude: 31.2081, longitude: 29.9272 },
  'asafra': { latitude: 31.2711, longitude: 30.0108 },
  'العصافرة': { latitude: 31.2711, longitude: 30.0108 },
};

/**
 * Calculates Haversine distance in kilometers between two geo coordinates.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Extracts latitude and longitude from location strings or Google Maps URLs.
 */
export function parseCoordinatesFromLocation(locationText?: string): GeoCoordinates | null {
  if (!locationText || typeof locationText !== 'string') return null;

  const trimmed = locationText.trim();

  // Pattern 1: Raw coordinates format "30.0444,31.2357" or "30.0444, 31.2357"
  const rawCoordMatch = trimmed.match(/^([-+]?\d{1,2}(?:\.\d+)?)\s*,\s*([-+]?\d{1,3}(?:\.\d+)?)$/);
  if (rawCoordMatch) {
    const lat = parseFloat(rawCoordMatch[1]);
    const lon = parseFloat(rawCoordMatch[2]);
    if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { latitude: lat, longitude: lon };
    }
  }

  // Pattern 2: Google Maps URL containing coordinates: @lat,lon or q=lat,lon or ll=lat,lon
  const urlCoordMatch = trimmed.match(/(?:@|[?&](?:q|ll)=)([-+]?\d{1,2}\.\d+)\s*,\s*([-+]?\d{1,3}\.\d+)/);
  if (urlCoordMatch) {
    const lat = parseFloat(urlCoordMatch[1]);
    const lon = parseFloat(urlCoordMatch[2]);
    if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { latitude: lat, longitude: lon };
    }
  }

  return null;
}

/**
 * Resolves coordinates for a meeting using:
 * 1. Direct locationUrl / location coordinate string
 * 2. Neighborhood centroid lookup
 * 3. City centroid lookup
 * 4. Default Cairo center fallback
 */
export function getMeetingCoordinates(meeting: {
  locationUrl?: string;
  neighborhoodName?: string;
  cityName?: string;
}): GeoCoordinates {
  // 1. Direct parsed coordinates
  const parsed = parseCoordinatesFromLocation(meeting.locationUrl);
  if (parsed) return parsed;

  // 2. Neighborhood lookup
  if (meeting.neighborhoodName) {
    const cleanNeigh = meeting.neighborhoodName.trim().toLowerCase();
    for (const [key, coords] of Object.entries(EGYPT_CENTROIDS)) {
      if (cleanNeigh.includes(key.toLowerCase()) || key.toLowerCase().includes(cleanNeigh)) {
        return coords;
      }
    }
  }

  // 3. City lookup
  if (meeting.cityName) {
    const cleanCity = meeting.cityName.trim().toLowerCase();
    for (const [key, coords] of Object.entries(EGYPT_CENTROIDS)) {
      if (cleanCity.includes(key.toLowerCase()) || key.toLowerCase().includes(cleanCity)) {
        return coords;
      }
    }
  }

  // Default fallback: Cairo center
  return EGYPT_CENTROIDS.cairo;
}

/**
 * Requests device GPS location with safe timeout and error handling.
 */
export async function requestDeviceLocation(): Promise<UserLocationResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        coordinates: null,
        status: 'denied',
        errorMessage: 'Location permission not granted',
      };
    }

    // Try high accuracy with a 6 second timeout, fallback to balanced if slow
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        status: 'granted',
      };
    } catch {
      // Fallback to last known position
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        return {
          coordinates: {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          },
          status: 'granted',
        };
      }
      return {
        coordinates: null,
        status: 'unavailable',
        errorMessage: 'Could not fetch current device position',
      };
    }
  } catch (error: any) {
    return {
      coordinates: null,
      status: 'error',
      errorMessage: error?.message || 'Error obtaining location',
    };
  }
}

/**
 * Formats a distance in kilometers nicely in Arabic or English.
 */
export function formatDistance(km: number, isAr: boolean): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return isAr ? `${meters} م` : `${meters} m`;
  }
  const formatted = km < 10 ? km.toFixed(1) : Math.round(km).toString();
  return isAr ? `${formatted} كم` : `${formatted} km`;
}
