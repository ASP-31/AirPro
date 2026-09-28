

# 🌬️ Air Quality Intelligence System (AQIS)

> **AI-Powered Pollution Source Attribution & Geospatial Monitoring**

AQIS is a comprehensive environmental monitoring solution that transforms raw particulate matter data into actionable intelligence. By using a custom **AI Attribution Engine**, the system identifies potential industrial sources of pollution spikes, enabling data-driven accountability.

---

## Key Features

* **Real-Time Monitoring:** Live dashboard for **PM2.5, PM10, and AQI** across multiple urban centers (Ernakulam, Delhi, Mumbai).
* **AI Source Attribution:** Proprietary scoring engine that identifies "Suspect Sites" (factories, construction zones) based on pollution levels and proximity.
* **Live Incident Map:** Interactive Leaflet.js integration showing monitoring stations and flagged suspect sites with dynamic "Fly-To" navigation.
* **Admin Governance Panel:** Secure portal for environmental administrators to review crowdsourced reports and manage the suspect database.
* **Incident History & Log:** Persistent storage of past pollution violations for long-term trend analysis.

---

## System Architecture

The project utilizes a **Client-Server Architecture** optimized for low-latency updates:

1. **Data Layer:** Fetches real-time sensor feeds via the OpenWeatherMap API.
2. **Logic Layer (Next.js API routes):** Processes raw data through an AI-scoring algorithm to calculate suspect confidence levels.
3. **Persistence Layer:** Uses `localStorage` for session history, incident logs, and admin moderation queues.
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

4. **Start the dev server**
```bash
npm run dev
```

5. **Launch the Dashboard**

Open <http://localhost:3000> — this redirects to the dashboard at `/dashboard.html`.

| Page | Path |
| --- | --- |
| Dashboard | `/dashboard.html` |
| Landing page | `/index.html` |
| Live incident map | `/map.html` |
| City-wide spike scanner | `/incident.html` |
| AI suspect analysis | `/suspected.html` |
| Printable report | `/report.html` |
| Incident history | `/history.html` |
| Submit a suspect site | `/reporting.html` |
| Admin moderation | `/admin.html` → `/data.html` |

### Production build

```bash
npm run build
npm start
```

### API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/report?zone=<station>` | Pollution report + scored suspect sites for the matched station. Falls back to `scenarios.json` data with `"source": "MOCK_DATA"` if OpenWeather is unreachable or no API key is set. |

Station matching is case-insensitive and fuzzy; an unknown `zone` falls back to the first station in `data/scenarios.json`.

---

## 📈 Future Roadmap

* **Wind Correlation:** Integrating real-time wind speed/direction to track plume trajectories.
* **IoT Integration:** Connecting custom hardware sensor meshes (ESP32/Arduino).
* **Predictive AI:** Implementation of LSTM models to forecast AQI trends 24 hours in advance.


