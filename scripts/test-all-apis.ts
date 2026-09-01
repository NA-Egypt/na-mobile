import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://naegypt.org/api/v1';

interface TestResult {
  endpoint: string;
  method: string;
  status: number | string;
  success: boolean;
  itemCount?: number;
  sampleKeys?: string[];
  notes?: string;
  error?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  url: string,
  validate?: (data: any) => { valid: boolean; notes?: string; itemCount?: number; sampleKeys?: string[] }
) {
  try {
    const res = await axios.get(`${BASE_URL}${url}`, {
      headers: {
        Accept: 'application/json',
      },
      timeout: 10000,
    });

    const body = res.data;
    let valid = res.status >= 200 && res.status < 300;
    let notes = '';
    let itemCount: number | undefined;
    let sampleKeys: string[] | undefined;

    const dataPayload = body?.data !== undefined ? body.data : body;

    if (Array.isArray(dataPayload)) {
      itemCount = dataPayload.length;
      if (dataPayload.length > 0 && typeof dataPayload[0] === 'object' && dataPayload[0] !== null) {
        sampleKeys = Object.keys(dataPayload[0]);
      }
    } else if (typeof dataPayload === 'object' && dataPayload !== null) {
      sampleKeys = Object.keys(dataPayload);
    }

    if (validate) {
      const valResult = validate(body);
      valid = valid && valResult.valid;
      if (valResult.notes) notes = valResult.notes;
      if (valResult.itemCount !== undefined) itemCount = valResult.itemCount;
      if (valResult.sampleKeys) sampleKeys = valResult.sampleKeys;
    }

    results.push({
      endpoint: url,
      method: 'GET',
      status: res.status,
      success: valid,
      itemCount,
      sampleKeys,
      notes,
    });
    console.log(`[PASS] ${name} -> ${url} (Status: ${res.status}${itemCount !== undefined ? `, Items: ${itemCount}` : ''})`);
  } catch (err: any) {
    const status = err.response?.status || 'ERR';
    const errorMsg = err.response?.data?.message || err.message;
    results.push({
      endpoint: url,
      method: 'GET',
      status,
      success: false,
      error: errorMsg,
    });
    console.error(`[FAIL] ${name} -> ${url} (Status: ${status}, Error: ${errorMsg})`);
  }
}

async function runAllApiTests() {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Full NA Egypt API Test Suite`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // 1. Home / Frontpage & Stats
  await testEndpoint('Home Aggregation', '/home', (body) => {
    const data = body?.data || body;
    const hasStats = !!data?.stats;
    const hasJft = !!data?.jft;
    const hasHelplines = Array.isArray(data?.helplines);
    return {
      valid: hasStats || hasJft || hasHelplines,
      notes: `Stats: ${hasStats ? 'YES' : 'NO'}, JFT: ${hasJft ? 'YES' : 'NO'}, Helplines: ${data?.helplines?.length || 0}`,
    };
  });

  await testEndpoint('Just For Today (JFT)', '/jft', (body) => {
    const data = body?.data || body;
    return {
      valid: !!data?.title || !!data?.page_date || !!data?.thought_for_the_day,
      notes: `Title: "${data?.title || 'N/A'}"`,
    };
  });

  await testEndpoint('Public Stats Counter', '/stats', (body) => {
    const data = body?.data || body;
    return {
      valid: data?.weekly_meetings !== undefined || data?.groups !== undefined || data?.total_meetings !== undefined,
      notes: `Weekly meetings: ${data?.weekly_meetings ?? data?.total_meetings ?? 'N/A'}, Groups: ${data?.groups ?? data?.total_groups ?? 'N/A'}`,
    };
  });

  // 2. Meetings & In-Person Address Fields
  let sampleMeetingId: number | string | null = null;
  await testEndpoint('Meetings (All)', '/meetings', (body) => {
    const list = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
    if (list.length > 0) {
      sampleMeetingId = list[0].id;
    }
    const withAddress = list.filter((m: any) => m.address_ar || m.address_en || m.group?.ar_address || m.group?.en_address);
    const withLocationUrl = list.filter((m: any) => m.location_url || m.meeting_url || m.group?.location);
    return {
      valid: list.length > 0,
      itemCount: list.length,
      notes: `Total: ${list.length}, With Address: ${withAddress.length}, With Location URL: ${withLocationUrl.length}`,
    };
  });

  if (sampleMeetingId) {
    await testEndpoint(`Single Meeting (${sampleMeetingId})`, `/meetings/${sampleMeetingId}`);
  }

  // 3. Meetings with query filters
  await testEndpoint('Meetings (Virtual Only)', '/meetings?virtualOnly=1');
  await testEndpoint('Meetings (City Filter: Cairo)', '/meetings?city=Cairo');

  // 4. Groups
  let sampleGroupId: number | string | null = null;
  await testEndpoint('Groups (All / Paginated)', '/groups', (body) => {
    const list = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
    if (list.length > 0) {
      sampleGroupId = list[0].id;
    }
    const withAddress = list.filter((g: any) => g.ar_address || g.en_address);
    return {
      valid: list.length > 0,
      itemCount: list.length,
      notes: `Total Groups: ${list.length}, With Address: ${withAddress.length}`,
    };
  });

  if (sampleGroupId) {
    await testEndpoint(`Single Group (${sampleGroupId})`, `/groups/${sampleGroupId}`);
  }

  // 5. Calendar Events & Announcements
  await testEndpoint('Calendar Events', '/calendar-events');
  await testEndpoint('Announcements & Events', '/events');

  // 6. Lookups & Directory Resources
  await testEndpoint('Cities Lookup', '/cities');
  await testEndpoint('Neighborhoods Lookup', '/neighborhoods');
  await testEndpoint('Days Lookup', '/days');
  await testEndpoint('Topics Lookup', '/topics');
  await testEndpoint('Options Lookup', '/options');
  await testEndpoint('Service Bodies', '/service-bodies');
  await testEndpoint('Service Committees', '/service-committees');
  await testEndpoint('Service Committee Meetings', '/sc-meetings');

  // Print Summary Table
  console.log(`\n======================================================`);
  console.log(`📊 API TEST SUMMARY RESULTS`);
  console.log(`======================================================`);
  console.table(
    results.map((r) => ({
      Endpoint: r.endpoint,
      Status: r.status,
      Success: r.success ? '✅ PASS' : '❌ FAIL',
      Items: r.itemCount ?? '-',
      Notes: r.notes || (r.error ? `Err: ${r.error}` : '-'),
    }))
  );

  const total = results.length;
  const passed = results.filter((r) => r.success).length;
  const failed = total - passed;

  console.log(`\nTotal Endpoints Tested: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}\n`);
}

runAllApiTests().catch((e) => {
  console.error('Fatal test runner failure:', e);
  process.exit(1);
});
