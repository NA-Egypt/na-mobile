---
name: na-egypt-api
description: Comprehensive REST API reference, endpoints catalog, and integration guide for NA-Egypt backend services (Authentication, Meetings, Groups, Agendas, Events, Workgroups, Change Requests, Custom Forms, Helpline Calls, Committee Reports, and Service Bodies).
---

# NA-Egypt Backend REST API Reference & TypeScript Integration Guide

This skill provides a complete reference for integrating React Native / Expo mobile applications and external TypeScript clients with the NA-Egypt Laravel backend API (`naegypt.org` / `egyptna.org`).

---

## 1. General API Architecture & Conventions

- **Base URL:** `https://<domain>/api/v1` (e.g. `https://naegypt.org/api/v1`)
- **Content-Type:** `application/json` (or `multipart/form-data` for endpoints with file uploads)
- **Accept:** `application/json`
- **Localization Header / Query:** `X-Locale: ar | en` (or query param `?locale=ar|en` / `?lang=ar|en` on supported endpoints like `/home`, `/frontpage`, `/jft`).
- **Mobile Telemetry Headers (Recommended):**
  - `X-App-Platform`: `ios` | `android` | `web`
  - `X-App-Version`: e.g. `1.4.0`
  - `X-Device-Id`: Anonymous device UUID for telemetry analytics
- **Authentication Scheme:** `Bearer <sanctum_token>` via HTTP `Authorization` header.
- **HTTP Status Codes:**
  - `200 OK`: Successful read or update.
  - `201 Created`: Resource successfully created across all `store()` and public submission endpoints.
  - `204 No Content`: Resource deleted successfully or token revoked on logout.
  - `400 Bad Request`: Malformed request or missing OAuth attributes.
  - `401 Unauthorized`: Missing or invalid Bearer token / Azure OAuth token.
  - `403 Forbidden`: Insufficient role or permissions.
  - `404 Not Found`: Resource ID or slug does not exist.
  - `422 Unprocessable Content`: Validation failure (includes `{ message, errors }` dictionary in response body).

---

## 2. Summary of Recent API v1 Updates (2026)

1. **Bilingual JFT & Frontpage (`GET /api/v1/home`, `GET /api/v1/jft`):**
   - Added `locale` / `lang` query parameters (`ar` | `en`) and `X-Locale` header support.
   - Full English "Just For Today" (`jft_en`) daily meditation parsing alongside Arabic (`jft`).
2. **Hero Event & Organizer Validation (`GET /api/v1/home`, `/api/v1/calendar-events`):**
   - `GET /api/v1/home` now returns `hero_event: CalendarEvent | null` in addition to `upcoming_events: CalendarEvent[]`.
   - `CalendarEventResource` now exposes `is_hero: boolean`, `is_featured: boolean`, `location_info`, and `formatted_recurrence`.
   - `POST` and `PUT /api/v1/calendar-events` validate `organizer` against official service bodies/committees (`CalendarEvent::getValidOrganizerNames()`), and allow `super admin`, `rsc`, or users with `manage calendar events` permission to toggle `is_hero`.
3. **Privacy-Masked Group Contact Data (`/api/v1/groups`, `/api/v1/direct-online-groups`):**
   - Sensitive GSR fields (`ar_gsr_name`, `en_gsr_name`, `phone`, `user_id`, `user`) are automatically stripped from unauthenticated responses and AI/bot crawlers (`BotDetectionService`).
   - Authenticated mobile requests (`Authorization: Bearer <token>`) with a standard mobile User-Agent receive the full GSR contact details.
4. **Helpline Calls Schema & `call_date` Filtering (`/api/v1/helpline-calls`):**
   - Added `hospital_name` (`required_if:referral_source,لجنة المستشفيات`) and `poster_location` (`required_if:referral_source,ملصقات الزمالة`).
   - `call_brief` is now optional when `caller_type` is `"عضو حالي"` **or** `"مكالمة بالخطأ"`.
   - `GET /api/v1/helpline-calls` filters `start_date` and `end_date` against `call_date` (instead of `entry_time`) and orders by latest `call_date`.
5. **Committee Reports Lifecycle & Audit Trail (`/api/v1/committee-reports`):**
   - Supports full report metadata (`parent_report_id`, `meeting_date`, `report_date`, `positions_status`, `status` in `draft|submitted|approved|returned|embedded`, `review_notes`, `is_exceptional`, `attended_members`, `footer`).
   - Automatically dispatches email/notification jobs when transitioning to `submitted` and records audit logs (`CommitteeReportLog`).
   - `DELETE /api/v1/committee-reports/{id}` is restricted to `super admin` and `draft` status (`422` otherwise), releasing any embedded workgroup reports back to `draft`.
6. **User Login Telemetry (`/api/v1/auth/azure/login`):**
   - Automatically records `last_login_at` timestamp on user authentication.

---

## 3. Authentication & Authorization Flow

### Azure Active Directory v2.0 Identity Discovery Endpoints
- **Authorization Endpoint:** `https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize`
- **Token Endpoint:** `https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token`
- **Logout / End Session Endpoint:** `https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/logout`
- **Required Scopes:** `openid profile email offline_access User.Read`
- **Redirect URIs:**
  - Android: `msauth://org.naegypt.app/Xo8WBi6jzSxKDVR4drqm84yr9iU%3D`
  - iOS: `msauth.org.naegypt.app://auth`
  - Custom App Scheme: `naegypt://auth-callback`

### `POST /api/v1/auth/azure/login` (Alias: `POST /api/v1/login/azure`)
Exchanges an Azure AD `access_token` for a Laravel Sanctum personal access token and updates `last_login_at`.
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
      "email": "jane.doe@naegypt.org",
      "service_body_id": 2,
      "last_login_at": "2026-11-15T03:00:00.000000Z",
      "created_at": "2026-01-01T00:00:00.000000Z",
      "updated_at": "2026-11-15T03:00:00.000000Z"
    },
    "token": "1|AbCdEf1234567890..."
  }
  ```

### `POST /api/v1/auth/logout` (Alias: `POST /api/v1/logout`)
Revokes the current user's Sanctum personal access token.
- **Access:** Authenticated (`Bearer <sanctum_token>`)
- **Response:** `204 No Content`

### `GET /api/v1/user`
Returns the currently authenticated user profile.
- **Access:** Authenticated (`Bearer <sanctum_token>`)
- **Response:** `200 OK`

---

## 4. Public & Hybrid Endpoints

*Note: For all hybrid endpoints, `GET /api/v1/<resource>` and `GET /api/v1/<resource>/{id}` are publicly accessible. Write operations (`POST`, `PUT`, `PATCH`, `DELETE`) require `Authorization: Bearer <token>`.*

---

### 4.0 Frontpage & Content Endpoints

#### `GET /api/v1/home` (Alias: `GET /api/v1/frontpage`)
Fetches all aggregated frontpage data in one consolidated response (cached 30m per date & locale): stats, daily JFT reading, helplines, official social links, featured hero event, and up to 5 upcoming calendar events.
- **Access:** Public
- **Query Parameters:**
  - `date` *(optional)*: `YYYY-MM-DD`
  - `locale` / `lang` *(optional)*: `ar` | `en` (also reads `X-Locale` header; defaults to `ar`)
- **Response (200 OK):**
  ```json
  {
    "data": {
      "stats": {
        "weekly_meetings": 420,
        "total_meetings": 450,
        "in_person_groups": 135,
        "online_groups": 18,
        "groups": 135,
        "total_groups": 153,
        "governorates": 22,
        "cities": 22,
        "upcoming_events": 4
      },
      "jft": {
        "date": "2026-11-15",
        "page_date": "15 نوفمبر",
        "title": "...",
        "quote": "...",
        "quote_source": "...",
        "content": ["..."],
        "thought_for_the_day": "...",
        "content_html": "..."
      },
      "helplines": [
        {
          "region": "Egypt Region (General)",
          "region_ar": "إقليم مصر (عام)",
          "phones": ["+201006979198", "+201060933888"],
          "whatsapp": "https://wa.me/201060933888",
          "hours": "10 AM - 12 Midnight",
          "hours_ar": "١٠ ص - ١٢ منتصف الليل"
        }
      ],
      "social_links": {
        "facebook": "https://www.facebook.com/OfficialNAEgyPage",
        "instagram": "https://www.instagram.com/narcoticsanonymousegy",
        "tiktok": "https://www.tiktok.com/@narcoticsanonymousegypt",
        "whatsapp": "https://wa.me/201060933888",
        "email": "pr@naegypt.org"
      },
      "hero_event": null,
      "upcoming_events": []
    }
  }
  ```

#### `GET /api/v1/jft`
Retrieves the daily spiritual reflection (Just For Today) in Arabic or English with structured parsed fields and clean HTML.
- **Access:** Public
- **Query Parameters:**
  - `date` *(optional)*: `YYYY-MM-DD` (defaults to today in `Africa/Cairo`)
  - `locale` / `lang` *(optional)*: `ar` | `en` (also reads `X-Locale` header)

#### `GET /api/v1/stats`
Retrieves platform statistics counter (`weekly_meetings`, `total_meetings`, `in_person_groups`, `online_groups`, `groups`, `total_groups`, `governorates`, `cities`, `upcoming_events`).
- **Access:** Public

---

### 4.1 Meetings (`/api/v1/meetings`)

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
- `per_page`: Optional integer to paginate results (returns unpaginated list if omitted)

#### `GET /api/v1/meetings/{id}`
Returns a single `MeetingResource` object with loaded relations (`group`, `day`, `topics`, `options`).

#### `POST /api/v1/meetings` *(Auth Required)*
- **Body Schema:** `group_id` (required), `day_id` (required), `start_time` (required), `end_time` (required, after `start_time`), `type` (required), `lang` (`arabic` | `english`), `status` (`available` | `suspended`), `notes` (nullable), `topics` (nullable array of topic IDs, max 3), `options` (nullable array of option IDs).
- **Response:** `201 Created`

#### `PUT /api/v1/meetings/{id}` *(Auth Required)*
Updates meeting attributes (`sometimes|required`). Returns `200 OK`.

#### `DELETE /api/v1/meetings/{id}` *(Auth Required)*
Returns `204 No Content`.

---

### 4.2 Groups (`/api/v1/groups`)

> **Privacy Note:** GSR contact fields (`ar_gsr_name`, `en_gsr_name`, `phone`, `user_id`, `user`) are only returned when the request includes a valid Sanctum `Authorization: Bearer <token>` and a non-bot User-Agent.

- `GET /api/v1/groups`: Paginated list (`per_page` default 15, max 100; `page`).
- `GET /api/v1/groups/{id}`: Single `GroupResource`.
- `POST /api/v1/groups` *(Auth)*: Create group (`201 Created`).
- `PUT /api/v1/groups/{id}` *(Auth)*: Update group (`200 OK`).
- `DELETE /api/v1/groups/{id}` *(Auth)*: Delete group (`204 No Content`).

---

### 4.3 Direct Online Groups (`/api/v1/direct-online-groups`)

Manages online fellowship recovery groups with virtual meeting links (Zoom, Google Meet, MS Teams). Like physical groups, GSR contact fields (`ar_gsr_name`, `en_gsr_name`, `phone`, `user_id`, `user`) are masked for unauthenticated/bot requests.

- `GET /api/v1/direct-online-groups`: Paginated list (`per_page` default 15, max 100; `page`).
- `GET /api/v1/direct-online-groups/{id}`: Single `DirectOnlineGroupResource`.
- `POST /api/v1/direct-online-groups` *(Auth)*: Requires `ar_name`, `en_name`, `location` (`201 Created`).
- `PUT /api/v1/direct-online-groups/{id}` *(Auth)*: Update online group (`200 OK`).
- `DELETE /api/v1/direct-online-groups/{id}` *(Auth)*: Delete online group (`204 No Content`).

---

### 4.4 Calendar Events (`/api/v1/calendar-events`)

Supports recurring event expansion, organizer validation against official Service Bodies & Committees, and Hero Event promotion.

#### `GET /api/v1/calendar-events`
- **Access:** Public
- **Query Params:**
  - `start` *(optional)*: ISO-8601 date string (e.g. `2026-11-01`)
  - `end` *(optional)*: ISO-8601 date string (e.g. `2026-11-30`)
  - *(When both `start` and `end` are passed, recurring events are automatically expanded into individual occurrences within the window).*
- **Response Item Schema (`CalendarEventResource`):**
  ```json
  {
    "id": 12,
    "title": "ECCNA Convention",
    "start": "2026-11-20T10:00:00+02:00",
    "end": "2026-11-22T22:00:00+02:00",
    "description": "Annual convention...",
    "user_id": 1,
    "color": "#00698f",
    "organizer": "Egypt Regional Service Committee",
    "location": "https://maps.google.com/?q=...",
    "location_info": {
      "is_url": true,
      "url": "https://maps.google.com/?q=...",
      "label": "Google Maps"
    },
    "recurrence": ["once"],
    "formatted_recurrence": "Once",
    "is_featured": true,
    "is_hero": true,
    "created_at": "2026-11-01T12:00:00+02:00",
    "updated_at": "2026-11-13T10:00:00+02:00"
  }
  ```

#### `POST /api/v1/calendar-events` & `PUT /api/v1/calendar-events/{id}` *(Auth Required)*
- **Body Schema:**
  - `title`: `required|string|max:255`
  - `start`: `required|date`
  - `end`: `required|date|after_or_equal:start`
  - `organizer`: `required|string|max:255` *(Must match an existing Service Body, Service Committee, or RSC name via `CalendarEvent::getValidOrganizerNames()`)*
  - `description`: `nullable|string`
  - `color`: `nullable|string|max:50` (default `#00698f`)
  - `location`: `nullable|string|max:255`
  - `recurrence`: `nullable|array` of strings (default `["once"]`)
  - `is_featured`: `nullable|boolean`
  - `is_hero`: `nullable|boolean` *(Only applied if user has `super admin`, `rsc`, or `manage calendar events` permission; when set to `true`, automatically unsets `is_hero` on previous hero events)*

#### `DELETE /api/v1/calendar-events/{id}` *(Auth Required)*
- **Response:** `204 No Content`

---

### 4.5 Announcements & Events (`/api/v1/events`)

- `GET /api/v1/events`: List announcements & events ordered by `date asc` with `day` and `servicebody`.
- `GET /api/v1/events/{id}`: Single event details.
- `POST /api/v1/events` *(Auth)*: Requires `name`, `description`, `date`, `service_body_id`, `day_id` (`201 Created`).
- `PUT /api/v1/events/{id}` *(Auth)*: Update event (`200 OK`).
- `DELETE /api/v1/events/{id}` *(Auth)*: Delete event (`204 No Content`).

---

### 4.6 Group Agendas (`/api/v1/agendas`)

- `GET /api/v1/agendas`: List group agenda submissions.
- `GET /api/v1/agendas/{id}`: Single agenda details.
- `POST /api/v1/agendas` *(Auth)*: Submit monthly group agenda report (`201 Created`). Replaces any existing agenda for the same `group_id` in the same year/month.
- `PUT /api/v1/agendas/{id}` *(Auth)*: Update agenda (`200 OK`).
- `DELETE /api/v1/agendas/{id}` *(Auth)*: Delete agenda (`204 No Content`).

---

### 4.7 Service Body Agendas (`/api/v1/service-body-agendas`)

- **Visibility Rules (`GET`):**
  - Unauthenticated or non-servant users only see `approved` agendas that are either `is_exceptional = true` or past their monthly release date (10th of the month).
  - `ServiceBody` users see all agendas belonging to their `service_body_id` plus released/approved agendas of other areas.
  - `rsc` and `super admin` users see all agendas across all service bodies.
- `GET /api/v1/service-body-agendas`: List visible service body agendas.
- `GET /api/v1/service-body-agendas/{id}`: Single agenda with `sections` (`body`) and `groups_joined`.
- `POST /api/v1/service-body-agendas` *(Auth)*: Create monthly agenda (`201 Created`).
- `PUT /api/v1/service-body-agendas/{id}` *(Auth)*: Update agenda (`200 OK`). Non-RSC users can only edit `draft` agendas for their own area.
- `DELETE /api/v1/service-body-agendas/{id}` *(Auth)*: Delete agenda (`204 No Content`).

---

### 4.8 Service Committee Workgroups (`/api/v1/workgroups`)

Manages sub-entities (workgroups) belonging to parent service committees (`parent_id != null`).

- **Scoping & Authorization:**
  - Public can read all workgroups (`GET /api/v1/workgroups`, `GET /api/v1/workgroups/{id}`).
  - Non-superadmins with role `Committees` can only create/update/delete workgroups under their owned committee.
  - Officers with role `rsc` are strictly scoped to workgroups under Committee `83` (Regional Service Committee).
  - Workgroup users (`Workgroups` role) can only view and edit their own assigned workgroup details.
- **Query Params (`GET /api/v1/workgroups`):** `parent_id`, `status` (`active` | `inactive`), `per_page` (default 15, max 100), `page`.
- **Write Payload (`POST` / `PUT`):** `parent_id`, `workgroup_type` (`standing` | `ad_hoc`), `status` (`active` | `inactive`), `start_date`, `end_date`, `ar_name`, `en_name`, `chairman_name`, `chairman_phone`, `email`, `location`, `ar_address` (nullable), `en_address` (nullable), `notes`, `user_id`.

---

### 4.9 Lookups & Directory Resources (Public Read, Auth Write)

| Resource Endpoint | GET (Public) | POST/PUT/DELETE (Auth) | Description & Key Attributes |
| :--- | :--- | :--- | :--- |
| `/api/v1/cities` | List / Detail | Full CRUD (`201`, `200`, `204`) | Cities directory (`ar_name`, `en_name`, `latitude`, `longitude`) |
| `/api/v1/neighborhoods` | List / Detail | Full CRUD (`201`, `200`, `204`) | Neighborhoods (`ar_name`, `en_name`, `city_id`, `latitude`, `longitude`) |
| `/api/v1/days` | List / Detail | Full CRUD (`201`, `200`, `204`) | Week days lookup (`ar_name`, `en_name`) |
| `/api/v1/topics` | List / Detail | Full CRUD (`201`, `200`, `204`) | Meeting topics (`ar_name`, `en_name`) |
| `/api/v1/options` | List / Detail | Full CRUD (`201`, `200`, `204`) | Meeting options (`ar_name`, `en_name`) |
| `/api/v1/sc-meetings` | List / Detail | Full CRUD (`201`, `200`, `204`) | Service Committee schedule meetings (`service_committee_id`, `week_number`, `day_id`, `time`, `notes`) |
| `/api/v1/service-bodies` | List / Detail | Full CRUD (`201`, `200`, `204`) | Areas / Service bodies (`ar_name`, `en_name`, `day_id`, `start_time`, `end_time`, `location`) |
| `/api/v1/service-committees` | List / Detail | Full CRUD (`201`, `200`, `204`) | Subcommittees (`ar_name`, `en_name`, `ar_address`, `en_address`, `location`, `parent_id`) |

---

## 5. Public Forms, Helpline & Webhook Endpoints

### 5.1 Custom Forms Public Access (`/api/v1/forms/public/{slug}`)
- `GET /api/v1/forms/public/{slug}` *(Public)*: Retrieves published form definition and fields; increments view counter. Returns `404` if not `published`.
- `POST /api/v1/forms/public/{slug}/submit` *(Public)*: Submits response data for a published form. Accepts keys as `field_{id}` or `{id}`. Returns `201 Created`.

### 5.2 Helpline Calls & Volunteer Logging (`/api/v1/helpline-calls`)

#### `GET /api/v1/helpline-calls/schema` *(Public)*
Returns the dynamic form schema, shifts, caller types, referral sources, active volunteers, field order, and conditional validation rules:
- `call_brief`: `optional_if` `caller_type` in `["عضو حالي", "مكالمة بالخطأ"]` (required otherwise).
- `hospital_name`: `required_if` `referral_source === "لجنة المستشفيات"`.
- `poster_location`: `required_if` `referral_source === "ملصقات الزمالة"`.

#### `POST /api/v1/helpline-calls` *(Public)*
Logs a helpline call response.
- **Validation Rules:**
  - `duration`: `required|in:less_than_5,more_than_5`
  - `call_date`: `required|date|before_or_equal:today` (`YYYY-MM-DD`)
  - `call_time_shift`: `required|string|max:100`
  - `caller_type`: `required|string|max:100`
  - `caller_type_other`: Required (`422`) when `caller_type === 'أخرى'`
  - `referral_source`: `required|string|max:100`
  - `referral_source_other`: Required (`422`) when `referral_source === 'أخرى'`
  - `hospital_name`: Required (`422`) when `referral_source === 'لجنة المستشفيات'`
  - `poster_location`: Required (`422`) when `referral_source === 'ملصقات الزمالة'`
  - `volunteer_name`: `required|string|max:150`
  - `volunteer_name_other`: Required (`422`) when `volunteer_name === 'أخرى'`
  - `is_step_12`: `required|boolean`
  - `call_brief`: `required_unless:caller_type,عضو حالي,مكالمة بالخطأ|nullable|string`
  - `discuss_in_meeting`: `required|boolean`
  - `additional_info`: `nullable|string`
- **Response:** `201 Created` (`HelplineCallResource`).

#### `GET /api/v1/helpline-calls` *(Auth Required)*
- **Query Params:**
  - `start_date` *(optional)*: `YYYY-MM-DD` (filters `call_date >= start_date`)
  - `end_date` *(optional)*: `YYYY-MM-DD` (filters `call_date <= end_date`)
  - `page` *(optional)*: Paginated at 25 records per page, ordered by `call_date desc, id desc`.

---

## 6. Strictly Protected Endpoints (`auth:sanctum`)

*All endpoints below require `Authorization: Bearer <sanctum_token>`.*

### 6.1 IT & Data Change Requests (`/api/v1/change-requests`)
- `GET /api/v1/change-requests`: Paginated list (`status`: `pending` | `in_progress` | `completed` | `rejected`, `per_page`). Regular users see their own; `super admin` sees all.
- `POST /api/v1/change-requests`: `multipart/form-data` with `request_type` (`meetings_groups` | `committee_info` | `general` | `other`), `subject`, `description`, and optional `attachment` (`pdf,png,jpg,jpeg,docx,xlsx` up to 5MB). Returns `201 Created`.
- `GET /api/v1/change-requests/{id}`: Single request (`ChangeRequestResource` with `attachment_url`).
- `PATCH /api/v1/change-requests/{id}/status` *(Super Admin Only)*: Update `status` (`200 OK`).
- `DELETE /api/v1/change-requests/{id}`: Allowed for owner (while `pending`) or `super admin` (`204 No Content`).

### 6.2 Custom Forms Management (`/api/v1/forms`)
- `GET /api/v1/forms`: Paginated list of user's forms (or all for `super admin`). Query params: `status` (`draft` | `published` | `archived`), `per_page`.
- `POST /api/v1/forms`: Create form with nested `fields` array (`201 Created`).
- `GET /api/v1/forms/{id}`: Form details with `fields` and `submissions_count`.
- `PUT /api/v1/forms/{id}`: Update form metadata (`200 OK`).
- `DELETE /api/v1/forms/{id}`: Delete form (`204 No Content`).
- `GET /api/v1/forms/{id}/submissions`: Paginated submissions for the form (`per_page`, `page`).

### 6.3 Committee Reports (`/api/v1/committee-reports`)
- `GET /api/v1/committee-reports`: Lists `submitted` and `approved` committee reports (`review_notes` is automatically hidden for `ServiceBody`/`gsr` roles).
- `POST /api/v1/committee-reports`: Create report (`201 Created`). Dispatches notification if `status === 'submitted'` and writes to `CommitteeReportLog`.
  - **Fields:** `service_committee_id` (required), `parent_report_id` (nullable), `meeting_date`, `report_date`, `meeting_day_description`, `body`, `positions_status` (array), `status` (`draft` | `submitted` | `approved` | `returned` | `embedded`), `review_notes`, `is_exceptional` (boolean), `attended_members`, `footer`.
- `GET /api/v1/committee-reports/{id}`: View `submitted` or `approved` report (`403` otherwise).
- `PUT /api/v1/committee-reports/{id}`: Update report (`200 OK`). Dispatches notification when transitioning from `draft` to `submitted`.
- `DELETE /api/v1/committee-reports/{id}` *(Super Admin Only)*: Deletes a `draft` report (`422` if status is not `draft`), releases any embedded workgroup reports back to `draft`, deletes physical attachments, and logs the deletion (`204 No Content`).

### 6.4 Contact Requests (`/api/v1/contact-requests` & `/api/v1/contact-us`)
- Full CRUD (`GET`, `POST` -> `201`, `GET /{id}`, `PUT /{id}` -> `200`, `DELETE /{id}` -> `204`).
- **Fields:** `name` (required), `email` (required), `phone` (nullable), `subject` (nullable), `message` (required).

### 6.5 Audit Transactions (`/api/v1/transactions`)
- Full CRUD (`GET`, `POST` -> `201`, `GET /{id}`, `PUT /{id}` -> `200`, `DELETE /{id}` -> `204`).

### 6.6 Newsletter Subscribers (`/api/v1/newsletter-members`)
- Full CRUD (`GET`, `POST` -> `201`, `GET /{id}`, `PUT /{id}` -> `200`, `DELETE /{id}` -> `204`).

### 6.7 Users, Roles & Permissions (`/api/v1/users`, `/api/v1/roles`, `/api/v1/permissions`)
- `/api/v1/users`: Paginated list (`GET`), create (`POST` -> `201`), show (`GET /{id}`), update (`PUT /{id}` -> `200`), delete (`DELETE /{id}` -> `204`).
- `/api/v1/roles`: Full CRUD for Spatie roles (`super admin`, `rsc`, `ServiceBody`, `Committees`, `Workgroups`, `gsr`).
- `/api/v1/permissions`: Full CRUD for Spatie permissions.

---

## 7. Complete React Native / Expo TypeScript SDK (`naEgyptApi.ts`)

See the standalone TypeScript SDK in section below or drop directly into `src/api/naEgyptApi.ts` in the mobile repository:

```typescript
export type Locale = 'ar' | 'en';
export type AppPlatform = 'ios' | 'android' | 'web';

export interface ApiResponse<T> {
  data: T;
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
  meta?: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

export class ApiValidationError extends Error {
  public status: number;
  public errors: Record<string, string[]>;

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiValidationError';
    this.status = status;
    this.errors = errors;
  }
}
```

---

## 8. Automated QA & Testing Reference

Run the comprehensive PHPUnit automated test suite across all API feature test suites:
```bash
php vendor/bin/phpunit tests/Feature/Api/
```
