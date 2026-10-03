

# 🌬️ Air Quality Intelligence System (AQIS)

> **AI-Powered Pollution Source Attribution & Geospatial Monitoring**

AQIS is a comprehensive environmental monitoring solution that transforms raw particulate matter data into actionable intelligence. By using a custom **AI Attribution Engine**, the system identifies potential industrial sources of pollution spikes, enabling data-driven accountability.

---

## Key Features

* **Real-Time Monitoring:** Live dashboard for **PM2.5, PM10, and AQI** across multiple urban centers (Ernakulam, Delhi, Mumbai).
* **AI Source Attribution:** Proprietary scoring engine that identifies "Suspect Sites" (factories, construction zones) based on pollution levels and proximity.
* **Crowd-Sourced Reporting:** Any user can report a potential pollution source (construction site, brick kiln, quarry, waste dump) with a map pin, photo-less description and optional distance.
* **Admin Moderation:** Reports stay invisible on the public site until an administrator verifies them — approved reports are published to the suspect list, the live map and the AI verdict with a "Verified" badge.
* **Live Incident Map:** Interactive Leaflet.js integration showing monitoring stations and flagged suspect sites with dynamic "Fly-To" navigation.
* **Admin Governance Panel:** Secure portal for environmental administrators to review crowdsourced reports and manage the suspect database.
* **Shared Site Navigation:** One `services/nav.js` drives the header, active-page highlighting, mobile hamburger menu and footer for every public page.
* **Incident History & Log:** Persistent storage of past pollution violations for long-term trend analysis.

---

## System Architecture

The project utilizes a **Client-Server Architecture** optimized for low-latency updates:

1. **Data Layer:** Fetches real-time sensor feeds via the OpenWeatherMap API.
2. **Logic Layer (Next.js API routes):** Processes raw data through an AI-scoring algorithm to calculate suspect confidence levels.
3. **Persistence Layer:** Reports are stored server-side in `data/submissions.json` (or Upstash Redis via REST when configured); incident history and the active incident selection stay in `localStorage`.
4. **Presentation Layer:** Responsive UI built with Tailwind CSS and dynamic mapping via Leaflet.js.

---

## Tech Stack

* Frontend: HTML5, Tailwind CSS, JavaScript (ES6+), Leaflet.js — served as static assets from `public/`
* Backend: Next.js 16 (App Router, route handlers)
* Data Source: OpenWeatherMap API
* Development AI: Google Gemini (Logic Optimization & Data Structuring)

---

## ⚙️ Installation

> Requires **Node.js 20.9+** (developed on 24.x).

1. Clone the repository
```bash
git clone https://github.com/ASP-31/AirPro
cd AirPro
```

2. **Install dependencies** — the Next.js app lives at the repo root
```bash
npm install
```

3. **Configure the API key** (optional — the app falls back to simulated data without it)
```bash
cp .env.example .env.local
# then set OPENWEATHER_API_KEY in .env.local
# get a key at https://home.openweathermap.org/api_keys
```

4. **Configure admin moderation** (required for approving reports)
```bash
# in .env.local
ADMIN_USERNAME=your_admin
ADMIN_PASSWORD=a_strong_password
AUTH_SECRET=<any long random string>   # optional, signs session tokens
```
Without these the portal falls back to `admin` / `admin123` for local development only.

5. **Start the dev server**
```bash
npm run dev
```

6. **Launch the Dashboard**

Open <http://localhost:3000> — this serves the landing page at `/index.html`.

| Page | Path |
| --- | --- |
| Landing page | `/index.html` (`/` serves this) |
| Dashboard | `/dashboard.html` |
| Live incident map | `/map.html` |
| City-wide spike scanner | `/incident.html` |
| AI suspect analysis | `/suspected.html` |
| Printable report | `/report.html` |
| Incident history | `/history.html` |
| Report a pollution source | `/reporting.html` |
| Admin login | `/admin.html` |
| Admin moderation queue | `/data.html` |

### Site navigation

All public pages render their header and footer from `public/services/nav.js` — one array of links, so navigation can never drift between pages. Each page only needs a `<div data-aqis-header></div>` and `<div data-aqis-footer></div>` placeholder plus the script tag.

```html
<script src="services/nav.js"></script>
...
<div data-aqis-header></div>
...
<div data-aqis-footer></div>
```

The component highlights the current page from `location.pathname`, collapses into a hamburger menu below `lg`, and injects the site-wide footer. The admin console (`admin.html`, `data.html`) intentionally keeps its own minimal chrome.

### Production build

```bash
npm run build
npm start
```

### Report moderation flow

1. Anyone opens `/reporting.html`, picks the monitoring zone, drops a pin (or types the distance from the station) and submits the site.
2. `POST /api/submissions` stores the report as `pending`. The browser keeps a *receipt* so the reporter can poll their own report's status.
3. An admin signs in at `/admin.html`, reviews the queue in `/data.html`, optionally fixes the coordinates on a map, then approves.
4. Approval flips the record to `approved`; it is immediately merged into `GET /api/report` (`crowdSources`) and therefore renders on `/map.html`, `/suspected.html` and `/report.html` for every visitor, marked "Admin Approved".

Unpublishing (approved → rejected) removes it from the public site again. Duplicate reports for the same site within 0.5 km are flagged in the admin queue instead of being published twice.

### API

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/report?zone=<station>` | public | Pollution report + scored suspects + `crowdSources` (admin-approved community reports) for the matched station. Falls back to `scenarios.json` data with `"source": "MOCK_DATA"` if OpenWeather is unreachable or no API key is set. |
| `GET` | `/api/report?stations=1` | public | List of monitoring stations (id, name, coordinates) used to populate dropdowns. |
| `POST` | `/api/submissions` | public | Submit a potential pollution source. Returns `{ id, receipt, status: "pending" }`. Rate limited to 10 per 10 minutes per IP. |
| `GET` | `/api/submissions?status=<all\|pending\|approved\|rejected>&zone=<station>` | public for `approved`, admin token for everything else | List submissions. Anonymous responses strip reporter contact details. |
| `GET` | `/api/submissions?id=<id>&receipt=<receipt>` | receipt | Status of one of your own reports, including the admin note. |
| `PATCH` | `/api/submissions/<id>` | admin | `{ status, adminNote?, verifiedLat?, verifiedLng? }` to approve, reject, reopen, or correct coordinates. |
| `DELETE` | `/api/submissions/<id>` | admin | Permanently delete a report. |
| `POST` | `/api/auth/admin` | public | `{ username, password }` → signed 8-hour admin token. |

Station matching is case-insensitive and fuzzy; an unknown `zone` falls back to the first station in `data/scenarios.json`.

### Storage

Submissions are written to `data/submissions.json` with atomic writes. On read-only hosts (Vercel, most serverless platforms) set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` and the same API will store them in Redis over REST instead — no extra npm dependency.

---

## 📈 Future Roadmap

* **Wind Correlation:** Integrating real-time wind speed/direction to track plume trajectories.
* **IoT Integration:** Connecting custom hardware sensor meshes (ESP32/Arduino).
* **Predictive AI:** Implementation of LSTM models to forecast AQI trends 24 hours in advance.


