---
name: na-egypt-api
description: Comprehensive REST API reference, endpoints catalog, and integration guide for NA-Egypt backend services (Authentication, Meetings, Groups, Agendas, Events, and Service Bodies).
---

# NA-Egypt Backend REST API Reference & Integration Guide

This skill provides a complete reference for integrating mobile applications (and external clients) with the NA-Egypt Laravel backend API.

---

## 1. General API Architecture & Conventions

- **Base URL:** `https://<domain>/api/v1`
- **Content-Type:** `application/json`
- **Accept:** `application/json`
- **Authentication Scheme:** `Bearer <sanctum_token>` via HTTP `Authorization` header.
- **HTTP Status Codes:**
  - `200 OK`: Successful read or update.
  - `201 Created`: Resource successfully created.
  - `204 No Content`: Resource deleted successfully.
  - `400 Bad Request`: Malformed request or missing OAuth attributes.
  - `401 Unauthorized`: Missing or invalid Bearer token / Azure OAuth token.
  - `403 Forbidden`: Insufficient role or permissions.
  - `404 Not Found`: Resource ID does not exist.
  - `422 Unprocessable Content`: Validation failure (includes validation error dictionary in response body).

---

## 2. Authentication & Authorization Flow

### Azure AD OAuth Login & Token Exchange

Mobile apps authenticate the user via Azure Active Directory / Microsoft Identity SDK to acquire an Azure `access_token`, then exchange it for a backend Laravel Sanctum personal access token.

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

#### `GET /api/v1/user`
- **Access:** Authenticated (`Bearer <sanctum_token>`)
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "service_body_id": 2,
    "roles": [...]
  }
  ```

---

## 3. Public & Hybrid Endpoints

*Note: For all hybrid endpoints, `GET /api/v1/<resource>` and `GET /api/v1/<resource>/{id}` are publicly accessible. Write operations (`POST`, `PUT`, `PATCH`, `DELETE`) require `Authorization: Bearer <token>`.*

---

### 3.1 Meetings (`/api/v1/meetings`)

#### `GET /api/v1/meetings`
Query parameters for filtering meetings:
- `day`: Day name in Arabic (e.g., `الاثنين`) or English (`Monday`), or `all`
- `city`: City name (`ar_name` or `en_name`)
- `neighborhood`: Neighborhood name (`ar_name` or `en_name`)
- `serviceBody`: Service Body name (`ar_name` or `en_name`)
- `group`: Group name (`ar_name` or `en_name`)
- `type`: Meeting format / type code
- `search`: Keyword string matching group name or address
- `virtualOnly`: `1` or `true` to filter online/virtual meetings
- `englishOnly`: `1` or `true` to filter meetings conducted in English
- `recurrence`: `weekly` or `monthly` or specific occurrence tag (`1st`, `2nd`, `3rd`, `4th`, `5th`, `last`)
- `businessMeetingsOnly`: `1` or `true` for Group Business Meetings

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 10,
      "group_id": 3,
      "day_id": 1,
      "start_time": "19:30:00",
      "end_time": "21:00:00",
      "type": "open",
      "lang": "arabic",
      "status": "available",
      "notes": "Wheelchair accessible",
      "group": {
        "id": 3,
        "ar_name": "مجموعة الأمل",
        "en_name": "Hope Group",
        "location": "30.0444,31.2357",
        "ar_address": "وسط البلد، القاهرة",
        "en_address": "Downtown, Cairo",
        "neighborhood": {
          "id": 1,
          "ar_name": "وسط البلد",
          "en_name": "Downtown",
          "city": { "id": 1, "ar_name": "القاهرة", "en_name": "Cairo" }
        }
      },
      "day": { "id": 1, "ar_name": "الاثنين", "en_name": "Monday" },
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
- **Response (201 Created):** Single MeetingResource object.

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
    "group_type": "in-person",
    "service_body_id": 1,
    "neighborhood_id": 2,
    "capacity": 50
  }
  ```

#### `PUT /api/v1/groups/{id}` *(Auth Required)*
- **Response (200 OK):** Updated GroupResource object.

#### `DELETE /api/v1/groups/{id}` *(Auth Required)*
- **Response (204 No Content)**

---

### 3.3 Calendar Events (`/api/v1/calendar-events`)

#### `GET /api/v1/calendar-events`
- **Query Params:**
  - `start`: ISO-8601 date string (e.g. `2026-08-01`)
  - `end`: ISO-8601 date string (e.g. `2026-08-31`)
  *(When both `start` and `end` are passed, recurring occurrences are automatically expanded into discrete instances)*

#### `GET /api/v1/calendar-events/{id}`
Returns a single calendar event.

#### `POST /api/v1/calendar-events` *(Auth Required)*
- **Body Schema:**
  ```json
  {
    "title": "Regional Committee Meeting",
    "start": "2026-09-01T10:00:00",
    "end": "2026-09-01T14:00:00",
    "description": "Monthly regional service committee meeting.",
    "color": "#00698f",
    "organizer": "Cairo Area",
    "location": "Community Hall, Cairo",
    "recurrence": ["monthly", "1st_sunday"],
    "is_featured": true
  }
  ```

#### `PUT /api/v1/calendar-events/{id}` *(Auth Required)*
Updates calendar event details.

#### `DELETE /api/v1/calendar-events/{id}` *(Auth Required)*
- **Response (200 OK):** `{"message": "Deleted successfully"}`

---

### 3.4 Group Agendas (`/api/v1/agendas`)

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

#### `GET /api/v1/agendas/{id}`
Returns single agenda item.

#### `PUT /api/v1/agendas/{id}` *(Auth Required)*
Updates agenda submission.

#### `DELETE /api/v1/agendas/{id}` *(Auth Required)*
- **Response (204 No Content)**

---

### 3.5 Lookups & Directory Resources (Public Read)

| Resource Endpoint | GET (Public) | POST/PUT/DELETE (Auth) | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/cities` | List / Detail | Full CRUD | Cities directory (`ar_name`, `en_name`) |
| `/api/v1/neighborhoods` | List / Detail | Full CRUD | Neighborhoods linked to cities |
| `/api/v1/days` | List / Detail | Full CRUD | Week days lookup (Saturday through Friday) |
| `/api/v1/topics` | List / Detail | Full CRUD | Meeting topics (Step, Tradition, Concept, etc.) |
| `/api/v1/options` | List / Detail | Full CRUD | Meeting options/formats (Open, Closed, Men, Women) |
| `/api/v1/events` | List / Detail | Full CRUD | General announcements & events |
| `/api/v1/sc-meetings` | List / Detail | Full CRUD | Service Committee schedule meetings |
| `/api/v1/service-bodies` | List / Detail | Full CRUD | Areas / Service bodies (e.g. Cairo ASC, Alexandria ASC) |
| `/api/v1/service-committees` | List / Detail | Full CRUD | Subcommittees (PI, H&I, Literature, Web) |

---

## 4. Protected Endpoints (Strictly Authenticated)

*All requests to the following endpoints require `Authorization: Bearer <sanctum_token>`.*

---

### 4.1 Service Body Agendas (`/api/v1/service-body-agendas`)

Manages area/regional monthly agenda reports and voting topics. Filtered by role (`super admin`, `rsc`, `ServiceBody`).

- `GET /api/v1/service-body-agendas`: List available agendas with permission rules applied.
- `POST /api/v1/service-body-agendas`: Create monthly service body agenda.
- `GET /api/v1/service-body-agendas/{id}`: Single agenda with questions & answers.
- `PUT /api/v1/service-body-agendas/{id}`: Update agenda data.
- `DELETE /api/v1/service-body-agendas/{id}`: Delete agenda record.

---

### 4.2 Contact Requests (`/api/v1/contact-requests` & `/api/v1/contact-us`)

- `GET /api/v1/contact-requests`: Retrieve member/public contact submissions.
- `POST /api/v1/contact-requests`:
  ```json
  {
    "name": "Member Name",
    "email": "member@example.com",
    "message": "Inquiry regarding area helpline..."
  }
  ```
- `GET /api/v1/contact-requests/{id}`
- `PUT /api/v1/contact-requests/{id}`
- `DELETE /api/v1/contact-requests/{id}`

---

### 4.3 Financial Transactions (`/api/v1/transactions`)

- `GET /api/v1/transactions`: Group 7th tradition donations and expenses.
- `POST /api/v1/transactions`: Record new credit/debit transaction.
- `GET /api/v1/transactions/{id}`
- `PUT /api/v1/transactions/{id}`
- `DELETE /api/v1/transactions/{id}`

---

### 4.4 Committee Reports (`/api/v1/committee-reports`)

- `GET /api/v1/committee-reports`: List sub-committee periodic reports.
- `POST /api/v1/committee-reports`: Upload/publish sub-committee report.
- `GET /api/v1/committee-reports/{id}`
- `PUT /api/v1/committee-reports/{id}`
- `DELETE /api/v1/committee-reports/{id}`

---

### 4.5 Newsletter & Subscribers

- `GET /api/v1/newsletter-members` *(Auth)*: Newsletter recipient directory.
- `POST /subscribers-api/subscriber` *(Public)*:
  ```json
  {
    "email": "user@example.com"
  }
  ```

---

### 4.6 User & Role Management

- `GET /api/v1/users`: List users (Super admin / RSC).
- `POST /api/v1/users`: Create user account.
- `GET /api/v1/users/{id}`: User profile.
- `PUT /api/v1/users/{id}`: Update user role / service body assignment.
- `DELETE /api/v1/users/{id}`: Deactivate/delete user account.
- `GET /api/v1/roles`: System roles (`super admin`, `rsc`, `ServiceBody`, etc.).
- `GET /api/v1/permissions`: Role permissions matrix.

---

## 5. Universal API Client Integration Snippet (Generic REST Pattern)

### Example cURL Request with Auth:
```bash
curl -X GET "https://na-egypt.org/api/v1/meetings?city=Cairo&day=Friday" \
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

  constructor(baseUrl: string = "https://na-egypt.org/api/v1") {
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

  // Fetch Meetings
  public async getMeetings(params?: Record<string, string>) {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<ApiResponse<any[]>>(`/meetings${queryString}`);
  }
}
```
