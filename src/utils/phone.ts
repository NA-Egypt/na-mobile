/**
 * Phone number and WhatsApp URL formatting helpers for NA Egypt mobile app.
 * Ensures all Egyptian WhatsApp numbers use the correct +20 country code
 * and guards against erroneous +220 (The Gambia) prefixes.
 */

/**
 * Normalizes an Egyptian phone number or international WhatsApp string into a valid https://wa.me/20... URL.
 *
 * Rules:
 * - Egypt country calling code is +20 (never +220).
 * - Standard Egyptian mobile numbers are 10 digits starting with 10, 11, 12, or 15.
 * - In international format with country code: 2010xxxxxxxx, 2011xxxxxxxx, 2012xxxxxxxx, 2015xxxxxxxx (12 digits).
 * - If an accidental leading 2 was prepended resulting in 2201..., the duplicate 2 is stripped.
 * - Preserves existing valid query parameters if a wa.me URL is passed.
 */
export function formatWhatsAppUrl(input?: string | null): string {
  if (!input) return '';

  const trimmed = input.trim();
  if (!trimmed) return '';

  // 1. If it's already a wa.me link
  if (trimmed.includes('wa.me/')) {
    const [baseUrl, query] = trimmed.split('?');
    const pathPart = baseUrl.substring(baseUrl.indexOf('wa.me/') + 6);
    let digits = pathPart.replace(/[^0-9]/g, '');

    // Fix accidentally doubled '2' (e.g. 2201... -> 201...)
    if (digits.startsWith('2201') && digits.length === 13) {
      digits = digits.substring(1);
    } else if (digits.startsWith('01') && digits.length === 11) {
      digits = `20${digits.substring(1)}`;
    } else if (/^1[0125]/.test(digits) && digits.length === 10) {
      digits = `20${digits}`;
    }

    const queryStr = query ? `?${query}` : '';
    return `https://wa.me/${digits}${queryStr}`;
  }

  // 2. If it's another URL format (e.g. api.whatsapp.com/send?phone=...)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('phone=')) {
      const match = trimmed.match(/phone=([0-9+]+)/);
      if (match && match[1]) {
        let digits = match[1].replace(/[^0-9]/g, '');
        if (digits.startsWith('2201') && digits.length === 13) {
          digits = digits.substring(1);
        } else if (digits.startsWith('01') && digits.length === 11) {
          digits = `20${digits.substring(1)}`;
        } else if (/^1[0125]/.test(digits) && digits.length === 10) {
          digits = `20${digits}`;
        }
        return `https://wa.me/${digits}`;
      }
    }
    return trimmed;
  }

  // 3. Raw phone number string (e.g. '+201060933888', '01060933888', '+20 150 388 4411')
  let digits = trimmed.replace(/[^0-9]/g, '');

  // Strip duplicate 2 if buggy Gambia prefix was passed
  if (digits.startsWith('2201') && digits.length === 13) {
    digits = digits.substring(1); // leaves 201...
  } else if (digits.startsWith('01') && digits.length === 11) {
    digits = `20${digits.substring(1)}`;
  } else if (/^1[0125]/.test(digits) && digits.length === 10) {
    digits = `20${digits}`;
  } else if (!digits.startsWith('20') && digits.length >= 9) {
    digits = `20${digits}`;
  }

  return `https://wa.me/${digits}`;
}

/**
 * Normalizes an Egyptian phone number for dialer tel: URI.
 * Removes duplicate 2 if starting with +220 for Egyptian mobiles.
 */
export function formatDialerNumber(phone?: string | null): string {
  if (!phone) return '';
  let trimmed = phone.trim();

  // If accidentally prefixed +220 or 220 for an Egyptian number (starting with 10, 11, 12, 15)
  if (trimmed.startsWith('+2201') && trimmed.replace(/[^0-9]/g, '').length === 13) {
    trimmed = `+201${trimmed.substring(5)}`;
  } else if (trimmed.startsWith('2201') && trimmed.replace(/[^0-9]/g, '').length === 13) {
    trimmed = `+201${trimmed.substring(4)}`;
  }

  return trimmed;
}
