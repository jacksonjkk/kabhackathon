# BoviPulse IoT Simulation & ML Scoring Bridge

Simulates collar sensors (body temp, activity, ambient temp/humidity) sending to the
refactored BoviPulse backend, then scores the latest window with the trained models in
`../models/` and posts predictions back — the same contract a real edge gateway /
inference job would use.

> Scope note: this is **synthetic telemetry standing in for collars**. It demonstrates the
> end-to-end loop (ingest → store → feature → external-model inference → alert → dashboard),
> which is identical whether the bytes come from this script or real ESP32 collars later.
> The system is an **early-warning / decision-support** tool for abnormal health patterns,
> **not** a disease-diagnosis system.

## Layout

```
KABhackathon/
├── BoviPulse_Model_Training.ipynb      # training notebook (needs bovipulse_dataset.csv to retrain)
├── models/                             # trained artifacts (do NOT retrain at runtime)
│   ├── bovipulse_feature_list.pkl      # 17-feature order (plain list)
│   ├── bovipulse_feature_scaler.pkl    # StandardScaler (sklearn 1.6.1)
│   ├── bovipulse_rf_model.pkl          # RandomForestClassifier, n=300 (supervised path)
│   └── bovipulse_isolation_forest_model.pkl  # IsolationForest (unsupervised path)
├── scripts/
│   ├── simulate_iot.py                 # this simulator + scoring bridge
│   └── README.md                       # this file
└── bovi pulse/bovipulse-ai/
    ├── backend/                        # Express + Prisma API (ingest, store, alert, serve)
    └── Frontend/                       # React dashboard (Health Monitoring, Early Warnings, Herd)
```

## Prerequisites

1. Backend running:
   ```bash
   cd "bovi pulse/bovipulse-ai/backend"
   node src/server.js   # http://localhost:4000
   ```
2. Inference service running (auto-scores every new reading — preferred over
   the manual scoring pass below):
   ```bash
   cd inference
   pip install -r requirements.txt   # scikit-learn==1.6.1 to match the pickles
   uvicorn app:app --port 8000
   ```
   With it up, each `POST /api/thermaguard/readings` is scored automatically and
   "pending ML" disappears on its own. Without it, ingestion still works on the
   threshold fallback.
3. A user account (via frontend Sign Up + Farm Setup once), e.g.
   ```bash
   curl -X POST localhost:4000/api/auth/register \
     -H 'Content-Type: application/json' \
     -d '{"name":"Demo","email":"farmer@test.com","password":"password123"}'
   ```
4. Python deps — sklearn version **MUST** be 1.6.1 to match the pickles:
   ```bash
   pip install requests numpy scikit-learn==1.6.1 joblib
   ```

## Usage

```bash
cd scripts
# Full demo: one simulated day (96 x 15-min ticks) for 4 cows, then report verdicts
python simulate_iot.py --email farmer@test.com --password password123 --cows 4 --hours 24

# Quick smoke test: 3 simulated hours, 1 cow, no abnormal episode
python simulate_iot.py --email farmer@test.com --password password123 --cows 1 --hours 3 --scenario none

# Force a specific episode type
python simulate_iot.py --email farmer@test.com --password password123 --scenario lameness

# Sensors only, no verdict report (readings are still auto-scored server-side
# if the inference service is up, else they stay "pending ML")
python simulate_iot.py --email farmer@test.com --password password123 --score none

# Score locally with ../models/*.pkl instead of the server path
# (needs scikit-learn==1.6.1; fallback when the inference service is down)
python simulate_iot.py --email farmer@test.com --password password123 --score local
```

| Flag | Default | Meaning |
|---|---|---|
| `--email` / `--password` | required | Backend login |
| `--cows` | 4 | Cows to ensure (`SIM-001…` created if missing; suffixed on tag clash) |
| `--hours` | 24 | Simulated hours to stream |
| `--step-min` | 15 | Simulated minutes per tick |
| `--ticks` | — | Override: exact tick count instead of hours |
| `--start-hour` | 0.0 | Wall-clock hour the simulated day starts at |
| `--interval` | 0.05 | Real seconds between POSTs |
| `--scenario` | `mixed` | `mixed`/`fever`/`lameness`/`heatstress`/`none` |
| `--repro` | `auto` | `auto`: SIM-001 marked PREGNANT (~day 273, pre-calving drop → calving watch), SIM-002 cycles into standing heat mid-run (~10h spike + restlessness → "Possible estrus"), rest are background cyclers; `off`: all cows plain cycling |
| `--score` | `auto` | `auto`: report the system's own verdicts; `local`: score with `.pkl` in-script; `none`: stream only |
| `--base-url` | `http://localhost:4000` | Backend address |
| `--seed` | 42 | RNG seed (reproducible runs) |

## What the script does

1. **Login** — `POST /api/auth/login` → JWT.
2. **Ensure farm** — `GET /api/farms/me`, else `POST /api/farms`.
3. **Ensure cattle** — `GET /api/cattle`, else `POST /api/cattle` (unique tags, retried on 409).
4. **Stream the day** — per tick (15 simulated minutes) each cow advances its
   behavior state machine (REST/RUMINATE/GRAZE/WALK/DRINK with dawn + afternoon
   grazing bouts), physiology computes ground-truth temp/activity/ambient/
   humidity, and the collar layer applies its calibration bias + noise or drops
   the tick (connectivity gap). Sent as `POST /api/thermaguard/readings` with
   `deviceId: COLLAR-<tag>`. One cow gets the injected episode unless
   `--scenario none`.
5. **Report (default `--score auto`)** — queries the system's own
   `GET /thermaguard/predictions` + `GET /alerts` per cow and prints the
   verdicts. This is the real integration path: no local sklearn needed.
   `--score local` instead builds the 18 training features from the sent
   history and posts predictions directly (fallback when the inference service
   is down).

## Where to look

- **Health Monitoring** (`/dashboard/thermaguard`) — readings + ML pattern table.
- **Early Warnings** (`/dashboard/alerts`) — health alerts; acknowledge after checking the animal.
- **Cow Monitoring** (`/dashboard/cow/:id`) — per-animal sensor history, predictions, notes.

## Single manual reading (no script)

```bash
curl -X POST localhost:4000/api/thermaguard/readings \
  -H "Authorization: Bearer <TOKEN>" -H 'Content-Type: application/json' \
  -d '{"cattleId":"<COW_ID>","temperatureC":40.2,"activityLevel":8.5,"ambientC":26.1,"humidity":70}'
```

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `401 Invalid email or password` | Create the user first (see Prerequisites step 2) |
| `404 Cattle not found in your farm` | Log in as the user that owns the farm/cows |
| `ModuleNotFoundError: sklearn` / unpickle errors | Install exactly `scikit-learn==1.6.1` |
| Readings stuck on "pending ML" | Normal when run with `--no-score`; run without it to score |
| No alerts after a run | No injected episode won that seed, or cooldown suppressed a repeat — check ML pattern table for `ABNORMAL` rows |
| Notebook fails at cell 4 | `bovipulse_dataset.csv` is not in the folder — only needed to **retrain**, not to run this script |

## Advancing to real hardware

1. Replace `tick_value()` output with serial/MQTT reads from ESP32 + DS18B20 / SHT31 / MPU-6050.
2. Keep the payload schema identical (`POST /api/thermaguard/readings`) — backend needs no change.
3. Move the scoring block into a scheduled job (cron / worker) that queries recent readings,
   builds the same 17 features, and posts to `/api/thermaguard/predictions`.
4. Parked future modules (MuzzleID, GestaCheck, VaxiTrack, Inventory, Farm Map) stay out of
   scope until the health-monitoring core is evaluated.
