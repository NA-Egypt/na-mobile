---
name: na-egypt-api
description: Comprehensive REST API reference, endpoints catalog, and integration guide for NA-Egypt backend services (Authentication, Meetings, Groups, Agendas, Events, Workgroups, Change Requests, Custom Forms, Helpline Calls, and Service Bodies).
---

# NA-Egypt Backend REST API Reference & Integration Guide

This skill provides a complete reference for integrating mobile applications (and external clients) with the NA-Egypt Laravel backend API (`naegypt.org` / `egyptna.org`).

---

## 1. General API Architecture & Conventions

- **Base URL:** `https://<domain>/api/v1`
- **Content-Type:** `application/json` (or `multipart/form-data` for endpoints with file uploads)
- **Accept:** `application/json`
- **Authentication Scheme:** `Bearer <sanctum_token>` via HTTP `Authorization` header.
- **HTTP Status Codes:**
  - `200 OK`: Successful read or update.
  - `201 Created`: Resource successfully created across all `store()` and public submission endpoints.
  - `204 No Content`: Resource deleted successfully or token revoked on logout.
  - `400 Bad Request`: Malformed request or missing OAuth attributes.
  - `401 Unauthorized`: Missing or invalid Bearer token / Azure OAuth token.
  - `403 Forbidden`: Insufficient role or permissions.
  - `404 Not Found`: Resource ID or slug does not exist.
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

#### `POST /api/v1/auth/logout` (or `/api/v1/logout`)
Revokes the current user's Sanctum personal access token.
- **Access:** Authenticated (`Bearer <sanctum_token>`)
- **Response (204 No Content)**

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

#### `GET /api/v1/meetings/{id}`
Returns a single meeting object with loaded relations (`group`, `day`, `topics`, `options`).

#### `POST /api/v1/meetings` *(Auth Required)*
- **Response (201 Created):** Single `MeetingResource` object.

#### `PUT /api/v1/meetings/{id}` *(Auth Required)*
Updates meeting attributes (`sometimes|required`).

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

### 3.3 Direct Online Groups (`/api/v1/direct-online-groups`)

Manages online fellowship recovery groups with virtual meeting links (Zoom, Google Meet, MS Teams).

#### `GET /api/v1/direct-online-groups`
- **Access:** Public
- **Query Params:** `per_page` (integer, default 15, max 100), `page` (integer)
- **Response (200 OK):** Paginated collection of direct online groups with loaded relations (`user`, `meetings`).

#### `GET /api/v1/direct-online-groups/{id}`
- **Access:** Public
- **Response (200 OK):** Single `DirectOnlineGroupResource`.

#### `POST /api/v1/direct-online-groups` *(Auth Required)*
- **Body Schema:**
  ```json
  {
    "ar_name": "مجموعة الأمل أونلاين",
    "en_name": "Hope Online Group",
    "ar_gsr_name": "أحمد",
    "en_gsr_name": "Ahmed",
    "phone": "+201011122233",
    "location": "https://zoom.us/j/123456789"
  }
  ```
- **Response (201 Created)**

#### `PUT /api/v1/direct-online-groups/{id}` *(Auth Required)*
- **Response (200 OK)**

#### `DELETE /api/v1/direct-online-groups/{id}` *(Auth Required)*
- **Response (204 No Content)**

---

### 3.4 Calendar Events (`/api/v1/calendar-events`)

#### `GET /api/v1/calendar-events`
- **Access:** Public
- **Query Params:**
  - `start`: ISO-8601 date string (e.g. `2026-08-01`)
  - `end`: ISO-8601 date string (e.g. `2026-08-31`)
- **Response (200 OK)**

#### `GET /api/v1/calendar-events/{id}`
- **Response (200 OK)**

#### `POST /api/v1/calendar-events` *(Auth Required)*
- **Response (201 Created):** Single `CalendarEventResource` object.

#### `PUT /api/v1/calendar-events/{id}` *(Auth Required)*
- **Response (200 OK)**

#### `DELETE /api/v1/calendar-events/{id}` *(Auth Required)*
- **Response (204 No Content)**

---

### 3.5 Announcements & Events (`/api/v1/events`)

- `GET /api/v1/events`: List announcements & events.
- `GET /api/v1/events/{id}`: Single event details.
- `POST /api/v1/events`: Create event (Returns `201 Created`).
- `PUT /api/v1/events/{id}`: Update event (Returns `200 OK`).
- `DELETE /api/v1/events/{id}`: Delete event (Returns `204 No Content`).

---

### 3.6 Group Agendas (`/api/v1/agendas`)

- `GET /api/v1/agendas`: List group agenda submissions.
- `GET /api/v1/agendas/{id}`: Single agenda details.
- `POST /api/v1/agendas`: Submit group agenda report (Returns `201 Created`).
- `PUT /api/v1/agendas/{id}`: Update agenda (Returns `200 OK`).
- `DELETE /api/v1/agendas/{id}`: Delete agenda (Returns `204 No Content`).

---

### 3.7 Service Committee Workgroups (`/api/v1/workgroups`)

Manages sub-entities (workgroups) belonging to parent service committees (`parent_id != null`).

- **Scoping & Authorization:**
  - Public can read all active workgroups (`GET /api/v1/workgroups`, `GET /api/v1/workgroups/{id}`).
  - Non-superadmins with role `Committees` can only create/update/delete workgroups under their owned committee.
  - Officers with role `rsc` are strictly scoped to workgroups under Committee `83` (Regional Service Committee).
  - Workgroup users can only view and edit their own assigned workgroup details.

#### `GET /api/v1/workgroups`
- **Query Params:** `parent_id`, `status` (`active`/`inactive`), `per_page`
- **Response (200 OK):** Paginated `WorkgroupResource` collection with loaded `parent`, `user`, and `meetings`.

#### `POST /api/v1/workgroups` *(Auth Required)*
- **Body Schema:**
  ```json
  {
    "parent_id": 1,
    "workgroup_type": "standing",
    "status": "active",
    "ar_name": "مجموعة عمل السوشيال ميديا",
    "en_name": "Social Media Workgroup",
    "chairman_name": "محمد",
    "chairman_phone": "+201009988776"
  }
  ```
- **Response (201 Created)**

#### `PUT /api/v1/workgroups/{id}` *(Auth Required)*
- **Response (200 OK)**

#### `DELETE /api/v1/workgroups/{id}` *(Auth Required)*
- **Response (204 No Content)**

---

### 3.8 Lookups & Directory Resources (Public Read)

| Resource Endpoint | GET (Public) | POST/PUT/DELETE (Auth) | Description & Key Attributes |
| :--- | :--- | :--- | :--- |
| `/api/v1/cities` | List / Detail | Full CRUD (`201 Created`, `204 No Content`) | Cities directory (`ar_name`, `en_name`, `latitude`, `longitude`) |
| `/api/v1/neighborhoods` | List / Detail | Full CRUD (`201 Created`, `204 No Content`) | Neighborhoods (`ar_name`, `en_name`, `city_id`, `latitude`, `longitude`) |
| `/api/v1/days` | List / Detail | Full CRUD (`201 Created`, `204 No Content`) | Week days lookup (`ar_name`, `en_name`) |
| `/api/v1/topics` | List / Detail | Full CRUD (`201 Created`, `204 No Content`) | Meeting topics (`ar_name`, `en_name`) |
| `/api/v1/options` | List / Detail | Full CRUD (`201 Created`, `204 No Content`) | Meeting options (`ar_name`, `en_name`) |
| `/api/v1/sc-meetings` | List / Detail | Full CRUD (`201 Created`, `204 No Content`) | Service Committee schedule meetings (`service_committee_id`, `week_number`, `day_id`, `time`, `notes`) |
| `/api/v1/service-bodies` | List / Detail | Full CRUD (`201 Created`, `204 No Content`) | Areas / Service bodies (`ar_name`, `en_name`, `day_id`, `start_time`, `end_time`, `location`) |
| `/api/v1/service-committees` | List / Detail | Full CRUD (`201 Created`, `204 No Content`) | Subcommittees (`ar_name`, `en_name`, `ar_address`, `en_address`, `location`) |

---

## 4. Protected Endpoints (Strictly Authenticated)

*All requests to the following endpoints require `Authorization: Bearer <sanctum_token>`.*

---

### 4.1 Service Body Agendas (`/api/v1/service-body-agendas`)
- `GET /api/v1/service-body-agendas`: List available agendas with permission rules applied.
- `POST /api/v1/service-body-agendas`: Create monthly agenda (Returns `201 Created`).
- `GET /api/v1/service-body-agendas/{id}`: Single agenda with questions & answers.
- `PUT /api/v1/service-body-agendas/{id}`: Update agenda data.
- `DELETE /api/v1/service-body-agendas/{id}`: Delete agenda record (`204 No Content`).

---

### 4.2 IT & Data Change Requests (`/api/v1/change-requests`)

Allows trusted servants and members to submit change requests for meetings, groups, and committee information with file attachments.

#### `GET /api/v1/change-requests`
- **Access:** Authenticated. Regular users view their own requests; super admins view all requests across the fellowship.
- **Query Params:** `status` (`pending`, `in_progress`, `completed`, `rejected`), `per_page`
- **Response (200 OK):** Paginated `ChangeRequestResource` list.

#### `POST /api/v1/change-requests`
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `request_type`: `required|string|in:meetings_groups,committee_info,general,other`
  - `subject`: `required|string|max:255`
  - `description`: `required|string`
  - `attachment`: `nullable|file|mimes:pdf,png,jpg,jpeg,docx,xlsx|max:5120` (up to 5MB)
- **Response (201 Created):** Single `ChangeRequestResource`.

#### `GET /api/v1/change-requests/{id}`
- **Response (200 OK)**

#### `PATCH /api/v1/change-requests/{id}/status` *(Super Admin Only)*
- **Body Schema:**
  ```json
  {
    "status": "in_progress"
  }
  ```
- **Response (200 OK)**

#### `DELETE /api/v1/change-requests/{id}`
Deletes request and any associated file attachment. Allowed for owner (if `pending`) or super admin.
- **Response (204 No Content)**

---

### 4.3 Custom Forms & Public Submissions (`/api/v1/forms`)

#### Public Form Endpoints (Unauthenticated):
- `GET /api/v1/forms/public/{slug}`: Retrieves public form definition and active fields. Increments form views counter. Returns `404` if unpublished/archived.
- `POST /api/v1/forms/public/{slug}/submit`: Submits response data for an active form.
  - **Body Schema:** Pass field values using `field_{id}`:
    ```json
    {
      "field_1": "أحمد علي",
      "field_2": "ahmed@example.com",
      "field_3": "yes"
    }
    ```
  - **Response (201 Created):**
    ```json
    {
      "data": {
        "id": 10,
        "custom_form_id": 2,
        "user_id": null,
        "responses": {
          "1": "أحمد علي",
          "2": "ahmed@example.com"
        },
        "created_at": "2026-09-13T03:00:00.000000Z"
      }
    }
    ```

#### Form Management Endpoints (`auth:sanctum`):
- `GET /api/v1/forms`: List user's forms (or all forms if super admin).
- `POST /api/v1/forms`: Create custom form with embedded fields (Returns `201 Created`).
- `GET /api/v1/forms/{id}`: Single form details with fields and submission count.
- `PUT /api/v1/forms/{id}`: Update form properties.
- `DELETE /api/v1/forms/{id}`: Delete form and cascaded fields/submissions (`204 No Content`).
- `GET /api/v1/forms/{id}/submissions`: Paginated list of submissions for the specified form.

---

### 4.4 Helpline Calls & Volunteer Logging (`/api/v1/helpline-calls`)

Provides schema discovery, public call response logging, and authenticated administrative listing for the fellowship helpline service.

#### `GET /api/v1/helpline-calls/schema`
- **Access:** Public
- **Description:** Returns the dynamic form schema, including localized field order, duration options, active shifts (incorporating the `8:00 PM - 10:00 PM` shift), caller types, referral sources, active volunteer directory, and dynamic conditional validation rules.
- **Response (200 OK):**
  ```json
  {
    "title": "Helpline Call Response Form",
    "locale": "ar",
    "shifts": [
      "10:00 AM - 12:00 PM",
      "12:00 PM - 2:00 PM",
      "2:00 PM - 4:00 PM",
      "4:00 PM - 6:00 PM",
      "6:00 PM - 8:00 PM",
      "8:00 PM - 10:00 PM",
      "10:00 PM - 12:00 AM"
    ],
    "caller_types": [
      "أعضاء محتملة",
      "عضو محتمل منعزل",
      "بيانات اجتماعات",
      "عضو حالي",
      "معلومات عن الزمالة",
      "أهالي وأقارب المدمنين",
      "عضو حالي منعزل",
      "معلومات عن زمالات أخرى",
      "مكالمة بالخطأ",
      "محولة للجنة العلاقات العامة",
      "أخرى"
    ],
    "referral_sources": [
      "جدول الاجتماعات",
      "صديق",
      "الموقع الالكتروني",
      "ملصقات الزمالة",
      "عضو حالي",
      "بحث جوجل",
      "طبيب",
      "مكان علاجي",
      "لجنة المستشفيات",
      "صانع محتوى",
      "Yellow Pages",
      "Facebook",
      "TikTok",
      "ChatGPT",
      "Instagram",
      "YouTube",
      "أخرى"
    ],
    "durations": [
      { "value": "less_than_5", "label": "أقل من 5 دقائق" },
      { "value": "more_than_5", "label": "أكثر من 5 دقائق" }
    ],
    "volunteers": [
      { "id": 1, "name": "محمد م.", "sort_order": 1 }
    ],
    "fields_order": [
      "duration",
      "call_date",
      "call_time_shift",
      "caller_type",
      "caller_type_other",
      "referral_source",
      "referral_source_other",
      "hospital_name",
      "poster_location",
      "volunteer_name",
      "volunteer_name_other",
      "is_step_12",
      "call_brief",
      "discuss_in_meeting",
      "additional_info"
    ],
    "conditional_fields": {
      "call_brief": {
        "rule": "optional_if",
        "field": "caller_type",
        "value": "عضو حالي",
        "description": "Call brief is optional when caller_type is \"عضو حالي\", required otherwise."
      },
      "hospital_name": {
        "rule": "required_if",
        "field": "referral_source",
        "value": "لجنة المستشفيات",
        "description": "Hospital name is required when referral_source is \"لجنة المستشفيات\"."
      },
      "poster_location": {
        "rule": "required_if",
        "field": "referral_source",
        "value": "ملصقات الزمالة",
        "description": "Poster location is required when referral_source is \"ملصقات الزمالة\"."
      }
    }
  }
  ```

#### `POST /api/v1/helpline-calls`
- **Access:** Public
- **Headers:** `Content-Type: application/json`, `Accept: application/json`
- **Body Schema:**
  - `duration`: `required|in:less_than_5,more_than_5`
  - `call_date`: `required|date` (Format `YYYY-MM-DD`)
  - `call_time_shift`: `required|string|max:100` (e.g., `"8:00 PM - 10:00 PM"`)
  - `caller_type`: `required|string|max:100`
  - `caller_type_other`: `nullable|string|max:255` (*Required with `422` validation failure if `caller_type === 'أخرى'`*)
  - `referral_source`: `required|string|max:100`
  - `referral_source_other`: `nullable|string|max:255` (*Required with `422` validation failure if `referral_source === 'أخرى'`*)
  - `hospital_name`: `nullable|string|max:255` (*Required with `422` validation failure if `referral_source === 'لجنة المستشفيات'`*)
  - `poster_location`: `nullable|string|max:255` (*Required with `422` validation failure if `referral_source === 'ملصقات الزمالة'`*)
  - `volunteer_name`: `required|string|max:150`
  - `volunteer_name_other`: `nullable|string|max:150` (*Required with `422` validation failure if `volunteer_name === 'أخرى'`*)
  - `is_step_12`: `required|boolean`
  - `call_brief`: `required_unless:caller_type,عضو حالي|nullable|string` (*Optional when `caller_type === 'عضو حالي'`, required otherwise*)
  - `discuss_in_meeting`: `required|boolean`
  - `additional_info`: `nullable|string`
- **Behavior:**
  - Automatically associates `volunteer_id` if `volunteer_name` matches an active `HelplineVolunteer` record.
  - Automatically records `entry_time` with the current timestamp.
- **Example Payload:**
  ```json
  {
    "duration": "more_than_5",
    "call_date": "2026-09-17",
    "call_time_shift": "8:00 PM - 10:00 PM",
    "caller_type": "عضو حالي",
    "referral_source": "لجنة المستشفيات",
    "hospital_name": "مستشفى العباسية للصحة النفسية",
    "volunteer_name": "محمد م.",
    "is_step_12": true,
    "call_brief": "طلب مساعدة هاتفية لخطوة 12 من عضو حالي.",
    "discuss_in_meeting": false,
    "additional_info": "تمت إحالته لأقرب اجتماع حضوري."
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "data": {
      "id": 1,
      "duration": "more_than_5",
      "duration_label": "أكثر من 5 دقائق",
      "call_date": "2026-09-17",
      "call_time_shift": "8:00 PM - 10:00 PM",
      "caller_type": "عضو حالي",
      "caller_type_other": null,
      "effective_caller_type": "عضو حالي",
      "referral_source": "جدول الاجتماعات",
      "referral_source_other": null,
      "effective_referral_source": "جدول الاجتماعات",
      "volunteer_id": 1,
      "volunteer_name": "محمد م.",
      "volunteer_name_other": null,
      "effective_volunteer_name": "محمد م.",
      "is_step_12": true,
      "call_brief": "طلب مساعدة هاتفية لخطوة 12 من عضو حالي.",
      "discuss_in_meeting": false,
      "additional_info": "تمت إحالته لأقرب اجتماع حضوري.",
      "entry_time": "2026-09-17T12:00:00.000000Z",
      "created_at": "2026-09-17T12:00:00.000000Z"
    }
  }
  ```

#### `GET /api/v1/helpline-calls`
- **Access:** Authenticated (`Authorization: Bearer <sanctum_token>`)
- **Query Parameters:**
  - `start_date` *(optional)*: Filter calls recorded on or after `YYYY-MM-DD` (`entry_time >= start_date`)
  - `end_date` *(optional)*: Filter calls recorded on or before `YYYY-MM-DD` (`entry_time <= end_date`)
  - `page` *(optional)*: Page number for pagination (25 records per page)
- **Response (200 OK):** Paginated `HelplineCallResource` collection (`data`, `links`, `meta`).

---

### 4.5 Contact Requests (`/api/v1/contact-requests` & `/api/v1/contact-us`)
- `GET /api/v1/contact-requests` / `GET /api/v1/contact-us`: Retrieve member/public contact submissions.
- `POST /api/v1/contact-us`: Create contact request (Returns `201 Created`).
- `GET /api/v1/contact-us/{id}`
- `PUT /api/v1/contact-us/{id}`
- `DELETE /api/v1/contact-us/{id}` (`204 No Content`)

---

### 4.6 Audit Transactions (`/api/v1/transactions`)
- `GET /api/v1/transactions`: Audit ledger recording system and model actions.
- `POST /api/v1/transactions`: Record audit transaction (Returns `201 Created`).
- `GET /api/v1/transactions/{id}`
- `PUT /api/v1/transactions/{id}`
- `DELETE /api/v1/transactions/{id}` (`204 No Content`)

---

### 4.7 Committee Reports (`/api/v1/committee-reports`)
- `GET /api/v1/committee-reports`: List sub-committee periodic reports.
- `POST /api/v1/committee-reports`: Upload/publish sub-committee report (Returns `201 Created`).
- `GET /api/v1/committee-reports/{id}`
- `PUT /api/v1/committee-reports/{id}`
- `DELETE /api/v1/committee-reports/{id}` (`204 No Content`)

---

### 4.8 Newsletter & Subscribers
- `GET /api/v1/newsletter-members` *(Auth)*: Newsletter recipient directory.
- `POST /api/v1/newsletter-members` *(Auth)*: Add subscriber (Returns `201 Created`).
- `DELETE /api/v1/newsletter-members/{id}` (`204 No Content`)

---

### 4.9 User & Role Management
- `GET /api/v1/users`: List users (Super admin / RSC).
- `POST /api/v1/users`: Create user account (Returns `201 Created`).
- `GET /api/v1/users/{id}`: User profile.
- `PUT /api/v1/users/{id}`: Update user role / service body assignment.
- `DELETE /api/v1/users/{id}`: Deactivate/delete user account (`204 No Content`).
- `GET /api/v1/roles`: System roles (`super admin`, `rsc`, `ServiceBody`, etc.).
- `GET /api/v1/permissions`: Role permissions matrix.

---

## 5. Universal API Client Integration Snippet (TypeScript)

```typescript
interface ApiResponse<T> {
  data: T;
  links?: Record<string, any>;
  meta?: Record<string, any>;
}

export interface HelplineVolunteerItem {
  id: number;
  name: string;
  sort_order?: number;
}

export interface HelplineSchemaResponse {
  title: string;
  locale: string;
  shifts: string[];
  caller_types: string[];
  referral_sources: string[];
  durations: Array<{ value: string; label: string }>;
  volunteers: HelplineVolunteerItem[];
  fields_order: string[];
  conditional_fields?: Record<string, {
    rule: string;
    field: string;
    value: string;
    description: string;
  }>;
}

export interface HelplineCallPayload {
  duration: "less_than_5" | "more_than_5";
  call_date: string; // YYYY-MM-DD
  call_time_shift: string;
  caller_type: string;
  caller_type_other?: string | null;
  referral_source: string;
  referral_source_other?: string | null;
  hospital_name?: string | null;
  poster_location?: string | null;
  volunteer_name: string;
  volunteer_name_other?: string | null;
  is_step_12: boolean;
  call_brief?: string | null;
  discuss_in_meeting: boolean;
  additional_info?: string | null;
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
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
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

  // Logout (Token Revocation)
  public async logout() {
    await this.request<void>("/auth/logout", { method: "POST" });
    this.setToken(null);
  }

  // Fetch Frontpage Data
  public async getHomeData(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    return this.request<ApiResponse<any>>(`/home${query}`);
  }

  // Submit Public Form
  public async submitPublicForm(slug: string, payload: Record<string, any>) {
    return this.request<ApiResponse<any>>(`/forms/public/${slug}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Get Helpline Form Schema & Active Volunteers
  public async getHelplineSchema(): Promise<HelplineSchemaResponse> {
    return this.request<HelplineSchemaResponse>("/helpline-calls/schema");
  }

  // Submit Helpline Call Response Log
  public async submitHelplineCall(payload: HelplineCallPayload) {
    return this.request<ApiResponse<any>>("/helpline-calls", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Get Helpline Calls (Authenticated with Optional Date Filtering)
  public async getHelplineCalls(params?: { start_date?: string; end_date?: string; page?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append("start_date", params.start_date);
    if (params?.end_date) searchParams.append("end_date", params.end_date);
    if (params?.page) searchParams.append("page", params.page.toString());
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return this.request<ApiResponse<any[]>>(`/helpline-calls${query}`);
  }
}
```

---

## 6. Automated QA & Testing Reference

Run the comprehensive PHPUnit automated test suite across all 13 API feature test suites:
```bash
php vendor/bin/phpunit tests/Feature/Api/
```
All feature test suites (`AgendaApiTest`, `AuthApiTest`, `CalendarEventApiTest`, `ChangeRequestApiTest`, `CompositeApiTest`, `CustomFormApiTest`, `DirectOnlineGroupApiTest`, `DirectoryApiTest`, `EventApiTest`, `HelplineCallApiTest`, `MeetingApiTest`, `ProtectedManagementApiTest`, `WorkgroupApiTest`) validate status codes (200/201/204/401/403/422), mass-assignment validation guards, JSON payloads, filtering, file uploads, conditional validation rules, and authorization barriers with 100% test passing (84 tests, 493 assertions).

---

## 7. API Telemetry, Mobile Usage Tracking & Super Admin Analytics

All incoming `/api/v1/*` requests are intercepted by `App\Http\Middleware\TrackApiUsage` via a **zero-latency terminating hook (`terminate()`)** executed after the HTTP response has already flushed to the client.

### Telemetry Headers for Mobile Clients
Mobile apps (React Native / iOS / Android) are recommended to pass the following headers for granular analytics:
- `X-App-Platform`: `android` | `ios` (normalized; fallback automatically parses User-Agent for iOS, Android, or Web)
- `X-App-Version`: Current application release version (e.g., `1.0.4`)
- `X-Device-Id`: Optional anonymous device installation UUID

### Super Admin Analytics Module
- **Route:** `GET /admin/api-usage` (Protected by `role:super admin` or `permission:view api analytics`).
- **Features:**
  - KPI Cards: Total Calls, Mobile Traffic (% and Android vs iOS breakdown), Avg Latency (ms), Error Rate (%).
  - Visual Charts: Traffic Over Time (interactive line chart), Platform Distribution (doughnut), Top 10 API Endpoints, Status Code breakdown.
  - Live Request Logs Table: Search, pagination, filter by date preset (Today, 7D, 30D, Custom), and request inspection modal.
  - CSV Export: `GET /admin/api-usage/export`.
- **Data Retention:**
  - `api_logs`: Pruned automatically after 30 days via `model:prune` using `MassPrunable`.
  - `api_daily_stats`: Permanent daily aggregated counters generated via `php artisan api-logs:aggregate`.

