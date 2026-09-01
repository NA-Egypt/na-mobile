---
name: na-egypt-api
description: Comprehensive REST API reference, endpoints catalog, and integration guide for NA-Egypt backend services (Authentication, Meetings, Groups, Agendas, Events, and Service Bodies).
---

# NA-Egypt Backend REST API Reference & Integration Guide

This skill provides a complete reference for integrating mobile applications (and external clients) with the NA-Egypt Laravel backend API (`naegypt.org` / `egyptna.org`).

---

## 1. General API Architecture & Conventions

- **Base URL:** `https://<domain>/api/v1`
- **Content-Type:** `application/json`
- **Accept:** `application/json`
- **Authentication Scheme:** `Bearer <sanctum_token>` via HTTP `Authorization` header.
- **HTTP Status Codes:**
  - `200 OK`: Successful read or update.
  - `201 Created`: Resource successfully created across all `store()` endpoints.
  - `204 No Content`: Resource deleted successfully.
  - `400 Bad Request`: Malformed request or missing OAuth attributes.
  - `401 Unauthorized`: Missing or invalid Bearer token / Azure OAuth token.
  - `403 Forbidden`: Insufficient role or permissions.
  - `404 Not Found`: Resource ID does not exist.
  - `422 Unprocessable Content`: Validation failure (includes validation error dictionary in response body).

---

## 2. Authentication & Authorization Flow

### Azure Active Directory v2.0 Identity Discovery Endpoints
- **Authorization Endpoint:** `https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize`
- **Token Endpoint:** `https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token`
- **Logout / End Session Endpoint:** `https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/logout`
- **Required Scopes:** `openid profile email offline_access User.Read`
- **Redirect URIs:**
  - Android: `msauth://org.naegypt.app/Xo8WBi6jzSxKDVR4drqm84yr9iU%3D`
  - iOS: `msauth.org.naegypt.app://auth`
  - Custom App Scheme: `naegypt://auth-callback`

---

### Azure AD OAuth Login & Token Exchange

Mobile apps authenticate the user via Azure Active Directory / Microsoft Identity SDK (PKCE authorization code flow) to acquire an Azure `access_token`, then exchange it for a backend Laravel Sanctum personal access token.

#### `POST /api/v1/auth/azure/login` (or `/api/v1/login/azure`)
- **Access:** Public
- **Request Body:**
  ```json
  {
    "access_token": "<azure_oauth_access_token>"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "service_body_id": 2,
      "created_at": "2026-01-01T00:00:00.000000Z",
      "updated_at": "2026-01-01T00:00:00.000000Z"
    },
    "token": "1|AbCdEf1234567890..."
  }
  ```

#### `GET /auth/azure/redirect` *(Web Browser OAuth Fallback)*
- **Access:** Public
- **Query Parameters:**
  - `redirect_uri`: Target app callback (e.g., `naegypt://auth-callback`)
- **Behavior:** Redirects user through Microsoft login in browser and redirects back to `redirect_uri` with query parameters `?token=<sanctum_token>&user=<url_encoded_user_json>`.

#### `GET /api/v1/user`
- **Access:** Authenticated (`Bearer <sanctum_token>`)
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "service_body_id": 2
  }
  ```

---

## 3. Public & Hybrid Endpoints

*Note: For all hybrid endpoints, `GET /api/v1/<resource>` and `GET /api/v1/<resource>/{id}` are publicly accessible. Write operations (`POST`, `PUT`, `PATCH`, `DELETE`) require `Authorization: Bearer <token>`.*

---

### 3.0 Frontpage & Content Endpoints

#### `GET /api/v1/home` (Alias: `GET /api/v1/frontpage`)
Fetches all aggregated frontpage data in one consolidated response (stats, daily reading, helplines, official social links, and upcoming events).
- **Access:** Public
- **Query Parameters:**
  - `date` *(optional)*: `YYYY-MM-DD`
- **Response (200 OK):**
  ```json
  {
    "data": {
      "stats": {
        "weekly_meetings": 142,
        "total_meetings": 160,
        "in_person_groups": 45,
        "online_groups": 12,
        "groups": 45,
        "total_groups": 57,
        "governorates": 14,
        "cities": 14,
        "upcoming_events": 3
      },
      "jft": {
        "date": "2026-08-17",
        "page_date": "17 أغسطس",
        "title": "الامتنان اليومي",
        "quote": "أنا ممتن جداً...",
        "quote_source": "النص الأساسي - ص.42",
        "content": ["الفقرة الأولى..."],
        "thought_for_the_day": "لليوم فقط: سأحافظ على صلتي الواعية بقوتي العظمى.",
        "content_html": "<p>...</p>"
      },
      "helplines": [
        {
          "region": "Egypt Region (General)",
          "region_ar": "إقليم مصر (عام)",
          "phones": ["+201006979198", "+201060933888"],
          "whatsapp": "https://wa.me/201060933888",
          "hours": "10 AM - 12 Midnight",
          "hours_ar": "١٠ ص - ١٢ منتصف الليل"
        },
        {
          "region": "Alexandria",
          "region_ar": "الإسكندرية",
          "phones": ["+201503884411"],
          "whatsapp": "https://wa.me/201503884411",
          "hours": "12 PM - 10 PM",
          "hours_ar": "١٢ م - ١٠ م"
        }
      ],
      "social_links": {
        "facebook": "https://www.facebook.com/OfficialNAEgyPage",
        "instagram": "https://www.instagram.com/narcoticsanonymousegy",
        "tiktok": "https://www.tiktok.com/@narcoticsanonymousegypt",
        "whatsapp": "https://wa.me/201060933888",
        "email": "pr@naegypt.org"
      },
      "upcoming_events": []
    }
  }
  ```

#### `GET /api/v1/jft`
Retrieves daily spiritual reflection (Just For Today) with structured parsed fields and clean HTML.
- **Access:** Public
- **Query Parameters:** `date` (`YYYY-MM-DD`, defaults to today)

#### `GET /api/v1/stats`
Retrieves platform statistics counter (weekly meetings, groups, governorates, events).
- **Access:** Public

---

### 3.1 Meetings (`/api/v1/meetings`)

#### Prioritized URL Resolution Hierarchy
Both `location_url` and `meeting_url` fields in `MeetingResource` are resolved following a prioritized fallback hierarchy:
1. `$meeting->location_url`
2. `$meeting->meeting_url`
3. `$group->location`
4. `$directOnlineGroup->location`
5. `$directOnlineGroup->meeting_url`
6. `$directOnlineGroup->zoom_url`
7. `$directOnlineGroup->url`
8. `$directOnlineGroup->link`

#### `GET /api/v1/meetings`
Query parameters for filtering meetings:
- `day`: Day name in Arabic (e.g., `الجمعة`) or English (`Friday`), or `all`
- `city`: City name (`ar_name` or `en_name`)
- `neighborhood`: Neighborhood name (`ar_name` or `en_name`)
- `serviceBody`: Service Body name (`ar_name` or `en_name`)
- `group`: Group name (`ar_name` or `en_name`)
- `type`: Meeting format / type code
- `search`: Keyword string matching group name or address
- `virtualOnly`: `1` or `true` to filter online/virtual meetings
- `englishOnly`: `1` or `true` to filter meetings conducted in English

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 10,
      "day_id": 1,
      "group_id": 3,
      "direct_online_group_id": null,
      "type": "open",
      "lang": "arabic",
      "status": "available",
      "start_time": "19:30:00",
      "end_time": "21:00:00",
      "formatted_start_time": "07:30 PM",
      "formatted_end_time": "09:00 PM",
      "duration": 90,
      "notes": "Wheelchair accessible",
      "recurrence": ["weekly"],

      "group_name_ar": "مجموعة الأمل",
      "group_name_en": "Hope Group",
      "group_type": "in_person",
      "address_ar": "وسط البلد، القاهرة",
      "address_en": "Downtown, Cairo",
      "location_url": "https://maps.google.com/?q=30.0444,31.2357",
      "meeting_url": "https://maps.google.com/?q=30.0444,31.2357",

      "neighborhood_id": 1,
      "neighborhood_name_ar": "وسط البلد",
      "neighborhood_name_en": "Downtown",
      "city_id": 1,
      "city_name_ar": "القاهرة",
      "city_name_en": "Cairo",

      "day": { "id": 1, "ar_name": "السبت", "en_name": "Saturday" },
      "topics": [{ "id": 1, "ar_name": "خطوة أولى", "en_name": "Step 1" }],
      "options": [{ "id": 2, "ar_name": "مفتوح", "en_name": "Open" }]
    }
  ]
}
```

#### `GET /api/v1/meetings/{id}`
Returns a single meeting object with loaded relations (`group`, `day`, `topics`, `options`).

#### `POST /api/v1/meetings` *(Auth Required)*
- **Body Schema:**
  ```json
  {
    "group_id": 3,
    "day_id": 1,
    "start_time": "19:30:00",
    "end_time": "21:00:00",
    "type": "open",
    "lang": "arabic",
    "status": "available",
    "notes": "Optional notes",
    "topics": [1, 2],
    "options": [3]
  }
  ```
- **Response (201 Created):** Single `MeetingResource` object.

#### `PUT /api/v1/meetings/{id}` *(Auth Required)*
Updates meeting attributes (fields are `sometimes|required`).

#### `DELETE /api/v1/meetings/{id}` *(Auth Required)*
- **Response (204 No Content)**

---

### 3.2 Groups (`/api/v1/groups`)

#### `GET /api/v1/groups`
- **Query Params:** `per_page` (integer, default 15, max 100), `page` (integer)
- **Response (200 OK):** Paginated collection of groups with relations (`serviceBody`, `neighborhood`, `user`).

#### `GET /api/v1/groups/{id}`
Returns details of the specified group.

#### `POST /api/v1/groups` *(Auth Required)*
- **Body Schema:**
  ```json
  {
    "ar_name": "مجموعة الأمل",
    "en_name": "Hope Group",
    "ar_gsr_name": "أحمد",
    "en_gsr_name": "Ahmed",
    "phone": "+201000000000",
    "location": "https://maps.google.com/?q=...",
    "ar_address": "عنوان المجموعة بالعربية",
    "en_address": "Group Address in English",
    "group_type": "in_person",
    "service_body_id": 1,
    "neighborhood_id": 2,
    "capacity": 50
  }
  ```
- **Response (201 Created):** Group object.

#### `PUT /api/v1/groups/{id}` *(Auth Required)*
- **Response (200 OK):** Updated GroupResource object.

#### `DELETE /api/v1/groups/{id}` *(Auth Required)*
- **Response (204 No Content)**

---

### 3.3 Calendar Events (`/api/v1/calendar-events`)

#### `GET /api/v1/calendar-events`
- **Access:** Public
- **Query Params:**
  - `start`: ISO-8601 date string (e.g. `2026-08-01`)
  - `end`: ISO-8601 date string (e.g. `2026-08-31`)
  *(When both `start` and `end` are passed, recurring occurrences are automatically expanded into discrete instances)*
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": 1,
        "title": "Regional Committee Meeting",
        "start": "2026-09-01T10:00:00.000000Z",
        "end": "2026-09-01T14:00:00.000000Z",
        "description": "Monthly regional service committee meeting.",
        "user_id": 1,
        "color": "#00698f",
        "organizer": "Cairo Area",
        "location": "Community Hall, Cairo",
        "recurrence": ["monthly", "1st"],
        "formatted_recurrence": "First Tuesday",
        "is_featured": true,
        "created_at": "2026-08-20T00:00:00.000000Z",
        "updated_at": "2026-08-20T00:00:00.000000Z"
      }
    ]
  }
  ```

#### `GET /api/v1/calendar-events/{id}`
Returns a single calendar event object.

#### `POST /api/v1/calendar-events` *(Auth Required)*
- **Body Schema:**
  ```json
  {
    "title": "Regional Committee Meeting",
    "start": "2026-09-01 10:00:00",
    "end": "2026-09-01 14:00:00",
    "description": "Monthly regional service committee meeting.",
    "color": "#00698f",
    "organizer": "Cairo Area",
    "location": "Community Hall, Cairo",
    "recurrence": ["monthly", "1st"],
    "is_featured": true
  }
  ```
- **Response (201 Created):** Single `CalendarEventResource` object.

#### `PUT /api/v1/calendar-events/{id}` *(Auth Required)*
- **Response (200 OK):** Updated `CalendarEventResource` object.

#### `DELETE /api/v1/calendar-events/{id}` *(Auth Required)*
- **Response (200 OK):** `{"message": "Deleted successfully"}`

---

### 3.4 Announcements & Events (`/api/v1/events`)

#### `GET /api/v1/events`
- **Access:** Public
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": 1,
        "name": "Unity Convention",
        "description": "Annual convention gathering",
        "date": "2026-10-15",
        "service_body_id": 1,
        "service_body": {
          "id": 1,
          "ar_name": "لجنة مصر",
          "en_name": "Egypt RSC"
        },
        "day_id": 1,
        "day": {
          "id": 1,
          "ar_name": "السبت",
          "en_name": "Saturday"
        },
        "created_at": "2026-08-20T00:00:00.000000Z",
        "updated_at": "2026-08-20T00:00:00.000000Z"
      }
    ]
  }
  ```

#### `GET /api/v1/events/{id}`
Returns a single event object with loaded relations (`day`, `servicebody`).

#### `POST /api/v1/events` *(Auth Required)*
- **Body Schema:**
  ```json
  {
    "name": "Unity Convention",
    "description": "Annual convention gathering",
    "date": "2026-10-15",
    "service_body_id": 1,
    "day_id": 1
  }
  ```
- **Response (201 Created):** Single `EventResource` object.

#### `PUT /api/v1/events/{id}` *(Auth Required)*
- **Response (200 OK):** Updated `EventResource` object.

#### `DELETE /api/v1/events/{id}` *(Auth Required)*
- **Response (204 No Content)**

---

### 3.5 Group Agendas (`/api/v1/agendas`)

#### `GET /api/v1/agendas`
Returns all group agenda submissions.

#### `POST /api/v1/agendas` *(Auth Required)*
- **Body Schema:**
  ```json
  {
    "group_id": 1,
    "meetings_per_week": 4,
    "agenda_date": "2026-08-01",
    "service_position": "GSR",
    "submitter_name": "John Doe",
    "alt_gsr_position": "Alt. GSR",
    "alt_gsr_name": "Jane Smith",
    "new_comers": 5,
    "open_positions": "Treasurer, Secretary",
    "next_business_meeting": "2026-09-05",
    "recovery_meetings_changes": false,
    "recovery_atmosphere": "Strong and welcoming",
    "trusted_servants": "All positions active",
    "financial_issues": "Prudent reserve met",
    "other_topics": [
      { "title": "Literature Stock", "content": "Need more basic texts" }
    ]
  }
  ```
- **Response (201 Created):** Single `AgendaResource` object.

#### `GET /api/v1/agendas/{id}`
Returns single agenda item.

#### `PUT /api/v1/agendas/{id}` *(Auth Required)*
Updates agenda submission.

#### `DELETE /api/v1/agendas/{id}` *(Auth Required)*
- **Response (204 No Content)**

---

### 3.6 Lookups & Directory Resources (Public Read)

| Resource Endpoint | GET (Public) | POST/PUT/DELETE (Auth) | Description & Key Attributes |
| :--- | :--- | :--- | :--- |
| `/api/v1/cities` | List / Detail | Full CRUD (`201 Created`) | Cities directory (`ar_name`, `en_name`, `latitude`, `longitude`) |
| `/api/v1/neighborhoods` | List / Detail | Full CRUD (`201 Created`) | Neighborhoods (`ar_name`, `en_name`, `city_id`, `latitude`, `longitude`) |
| `/api/v1/days` | List / Detail | Full CRUD (`201 Created`) | Week days lookup (`ar_name`, `en_name`) |
| `/api/v1/topics` | List / Detail | Full CRUD (`201 Created`) | Meeting topics (`ar_name`, `en_name`) |
| `/api/v1/options` | List / Detail | Full CRUD (`201 Created`) | Meeting options (`ar_name`, `en_name`) |
| `/api/v1/sc-meetings` | List / Detail | Full CRUD (`201 Created`) | Service Committee schedule meetings (`service_committee_id`, `week_number`, `day_id`, `time`, `notes`) |
| `/api/v1/service-bodies` | List / Detail | Full CRUD (`201 Created`) | Areas / Service bodies (`ar_name`, `en_name`, `day_id`, `start_time`, `end_time`, `location`) |
| `/api/v1/service-committees` | List / Detail | Full CRUD (`201 Created`) | Subcommittees (`ar_name`, `en_name`, `ar_address`, `en_address`, `location`) |

---

## 4. Protected Endpoints (Strictly Authenticated)

*All requests to the following endpoints require `Authorization: Bearer <sanctum_token>`.*

---

### 4.1 Service Body Agendas (`/api/v1/service-body-agendas`)

Manages area/regional monthly agenda reports and voting topics. Filtered by role (`super admin`, `rsc`, `ServiceBody`).

- `GET /api/v1/service-body-agendas`: List available agendas with permission rules applied.
- `POST /api/v1/service-body-agendas`: Create monthly service body agenda (Returns `201 Created`).
- `GET /api/v1/service-body-agendas/{id}`: Single agenda with questions & answers.
- `PUT /api/v1/service-body-agendas/{id}`: Update agenda data.
- `DELETE /api/v1/service-body-agendas/{id}`: Delete agenda record (`204 No Content`).

---

### 4.2 Contact Requests (`/api/v1/contact-requests` & `/api/v1/contact-us`)

- `GET /api/v1/contact-requests` / `GET /api/v1/contact-us`: Retrieve member/public contact submissions.
- `POST /api/v1/contact-us`: (Returns `201 Created`)
  ```json
  {
    "name": "Member Name",
    "email": "member@example.com",
    "message": "Inquiry regarding area helpline..."
  }
  ```
- `GET /api/v1/contact-us/{id}`
- `PUT /api/v1/contact-us/{id}`
- `DELETE /api/v1/contact-us/{id}` (`204 No Content`)

---

### 4.3 Audit & Financial Transactions (`/api/v1/transactions`)

- `GET /api/v1/transactions`: Audit ledger recording system and model actions.
- `POST /api/v1/transactions`: Record audit transaction (Returns `201 Created`).
  ```json
  {
    "model": "Group",
    "operation": "create",
    "details": { "name": "Hope Group", "city": "Cairo" },
    "old_values": null,
    "new_values": { "id": 1, "name": "Hope Group" }
  }
  ```
- `GET /api/v1/transactions/{id}`
- `PUT /api/v1/transactions/{id}`
- `DELETE /api/v1/transactions/{id}` (`204 No Content`)

---

### 4.4 Committee Reports (`/api/v1/committee-reports`)

- `GET /api/v1/committee-reports`: List sub-committee periodic reports.
- `POST /api/v1/committee-reports`: Upload/publish sub-committee report (Returns `201 Created`).
  ```json
  {
    "service_committee_id": 1,
    "meeting_date": "2026-09-01",
    "report_date": "2026-09-01",
    "body": "Report summary content",
    "status": "approved"
  }
  ```
- `GET /api/v1/committee-reports/{id}`
- `PUT /api/v1/committee-reports/{id}`
- `DELETE /api/v1/committee-reports/{id}` (`204 No Content`)

---

### 4.5 Newsletter & Subscribers

- `GET /api/v1/newsletter-members` *(Auth)*: Newsletter recipient directory.
- `POST /api/v1/newsletter-members` *(Auth)*: (Returns `201 Created`)
  ```json
  {
    "email": "user@example.com",
    "subscribe": true
  }
  ```
- `DELETE /api/v1/newsletter-members/{id}` (`204 No Content`)

---

### 4.6 User & Role Management

- `GET /api/v1/users`: List users (Super admin / RSC).
- `POST /api/v1/users`: Create user account (Returns `201 Created`).
- `GET /api/v1/users/{id}`: User profile.
- `PUT /api/v1/users/{id}`: Update user role / service body assignment.
- `DELETE /api/v1/users/{id}`: Deactivate/delete user account (`204 No Content`).
- `GET /api/v1/roles`: System roles (`super admin`, `rsc`, `ServiceBody`, etc.).
- `GET /api/v1/permissions`: Role permissions matrix.

---

## 5. Universal API Client Integration Snippet (Generic REST Pattern)

### Example cURL Request with Auth:
```bash
curl -X GET "https://naegypt.org/api/v1/meetings?city=Cairo&day=Friday" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 1|your_sanctum_token_here"
```

### TypeScript / JavaScript Request Helper Example:
```typescript
interface ApiResponse<T> {
  data: T;
}

export class NaEgyptApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = "https://naegypt.org/api/v1") {
    this.baseUrl = baseUrl;
  }

  public setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(this.token ? { "Authorization": `Bearer ${this.token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return null as unknown as T;
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP Error ${response.status}`);
    }

    return data;
  }

  // Azure Token Exchange
  public async loginWithAzure(azureAccessToken: string) {
    const res = await this.request<{ user: any; token: string }>("/auth/azure/login", {
      method: "POST",
      body: JSON.stringify({ access_token: azureAccessToken }),
    });
    this.setToken(res.token);
    return res;
  }

  // Fetch Frontpage Consolidated Data
  public async getHomeData(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    return this.request<ApiResponse<any>>(`/home${query}`);
  }

  // Fetch Just For Today Daily Reading
  public async getJft(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    return this.request<ApiResponse<any>>(`/jft${query}`);
  }

  // Fetch Public Stats
  public async getStats() {
    return this.request<ApiResponse<any>>("/stats");
  }

  // Fetch Meetings
  public async getMeetings(params?: Record<string, string>) {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<ApiResponse<any[]>>(`/meetings${queryString}`);
  }
}
```

---

## 6. Automated QA & Testing Reference

Run the comprehensive PHPUnit automated test suite across all 25 endpoints:
```bash
php vendor/bin/phpunit tests/Feature/Api/
```
All feature test suites (`AuthApiTest`, `CompositeApiTest`, `MeetingApiTest`, `DirectoryApiTest`, `AgendaApiTest`, `ProtectedManagementApiTest`, `CalendarEventApiTest`, `EventApiTest`) validate status codes (200/201/204/401/403/422), JSON payloads, filtering, and authorization barriers with 100% test passing.
