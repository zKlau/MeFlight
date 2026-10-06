# MeFlight

Track your MSFS 2024 flights against uploaded flight plans: live position, the path you flew, progress through
multi-leg trips (e.g. round the world), and where you left the aircraft so you can resume with the same fuel.

```
MSFS ──SimConnect──▶ simconnect-server (local recorder + UI) ──HTTP──▶ backend (FastAPI + Postgres) ◀── client (website)
```

## Backend (`backend/`)

The container waits for Postgres, applies database migrations and then starts the API, so a fresh deploy works
without manual steps. Databases created before migrations existed are detected and stamped automatically.

### Local (API + Postgres)

```bash
cd backend
cp .env.example .env
docker compose up -d --build
```

Set `API_KEY` and `POSTGRES_PASSWORD` in `.env`. The API listens on `API_PORT` (default `8000`).

For development with auto-reload on code changes:

```bash
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up --build
```

### Coolify (API only, Coolify-managed Postgres)

1. In Coolify, create a **PostgreSQL** database resource on the same server and copy its **Postgres URL (internal)**.
2. Create a new resource → **Docker Compose** from this repository, with base directory `/backend` and compose file
   `docker-compose.coolify.yaml`.
3. Under **Configuration → Advanced**, enable **Connect To Predefined Network** so the API can reach the database.
4. Set the environment variables:
   - `DATABASE_URL`: the internal Postgres URL from step 1 (`postgres://…` is accepted).
   - `API_KEY`: a long random string, also used by the recorder.
5. Set the domain of the `api` service (Coolify generates one from `SERVICE_URL_API_8000`) and deploy.

Point the recorder's `API_BASE_URL` and the website's `VITE_ENDPOINT_URL` at that domain.

Main endpoints (writes need the `X-API-Key` header):

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/live` | Recorder sends one telemetry sample |
| `GET` | `/live` | Latest sample (live aircraft) |
| `GET` | `/track` | Path of the most recent flight |
| `POST` | `/flightplans/upload` | Upload an MSFS `.PLN` |
| `GET` | `/flightplans` | All flight plans |
| `GET` | `/flightplans/{id}/route` | Planned route |
| `GET` | `/flightplans/{id}/track` | Everything flown on this plan |
| `GET` | `/flightplans/{id}/progress` | Completion, distance, deviation, airports visited |
| `GET` | `/flightplans/{id}/last-state` | Last position, nearest airport and fuel tank levels |
| `GET` | `/flightplans/{id}/countries` | Countries landed in and flown over on this plan |
| `GET` | `/countries` | Countries landed in and flown over across all flights |
| `GET` | `/location?lat=…&lon=…` | Country and nearest airport for a position |
| `GET` | `/session` | Current flying session: start, distance and airborne time |
| `POST` | `/landings` | Recorder reports a touchdown rate |
| `GET` | `/landings` | Last and best landings (optionally `?flightplan_id=`) |
| `GET` | `/weather/metar?ident=…` | Live METAR from aviationweather.gov (cached 10 minutes) |
| `GET` | `/airports/names?idents=…` | Airport names for ICAO codes (map tooltips) |

Tests: `pytest` from `backend/`.

Country borders come from [Natural Earth](https://www.naturalearthdata.com/) (public domain), stored in
`backend/data/countries.geojson`.

## Recorder (`simconnect-server/`)

Runs on the PC with MSFS. It serves a local page where you upload plans, choose the active plan, start/stop
recording and restore the saved fuel when resuming.

```bash
cd simconnect-server
pip install -r requirements.txt
python index.py
```

Then open http://127.0.0.1:5050 (it opens automatically).

Environment (`simconnect-server/.env`):

| Variable | Default | Meaning |
| --- | --- | --- |
| `API_BASE_URL` | `http://localhost:8000` | Backend URL (the old `API_ENDPOINT=.../live` still works) |
| `API_KEY` | – | Same key as the backend |
| `INTERVAL` | `1.0` | Seconds between samples |
| `LOCAL_PORT` | `5050` | Port of the local recorder page |

### Resuming a trip

1. Select the plan on the recorder page — the **Resume** card shows the airport you stopped at and the saved fuel.
2. Spawn at that airport in MSFS and wait until you are in the cockpit.
3. Click **Restore saved fuel in MSFS**, then **Start recording**.

## Website (`client/`)

```bash
cd client
npm install
npm run dev
```

Environment (`client/.env`): `VITE_ENDPOINT_URL` pointing at the backend (used by `npm run dev`).

### Docker

The image builds the site and serves it with nginx. The backend URL is read when the container starts (`API_URL`),
so the same image works against any backend.

```bash
cd client
docker compose up -d --build
```

`API_URL` defaults to `http://localhost:8000` and the site listens on `WEB_PORT` (default `8080`).

### Coolify

Create a **Docker Compose** resource from this repository with base directory `/client` and compose file
`docker-compose.coolify.yaml`, set `API_URL` to the public URL of the backend (e.g. `https://api.example.com`), set
the domain of the `web` service and deploy. `API_URL` must be reachable from the visitor's browser, so use the
backend's public domain, not an internal hostname.

Pick **Latest flight** for the live view, or a flight plan to see its route, everything you flew on it, progress
statistics and where the aircraft is parked. The selected plan is kept in the URL (`#plan=<id>`) so it can be shared.

### Stream widgets (OBS)

Open `/widgets.html` (also linked at the bottom of the sidebar) to preview every widget and copy its URL. In OBS add a
**Browser** source with that URL and the recommended size; the page background is transparent.

`/widget.html?type=<type>` options:

| Parameter | Values | Default |
| --- | --- | --- |
| `type` | `strip`, `map`, `progress`, `time-left`, `distance`, `next`, `speed`, `altitude`, `heading`, `fuel` | – |
| `plan` | a flight plan id | the plan you are currently flying |
| `panel` | `0` hides the background panel | shown |
| `label` | `0` hides the labels | shown |
| `zoom` | map zoom level for `type=map` (2–16) | `9` |

Widgets fade when no live data has arrived for 30 seconds.
