# BoviPulse — AI livestock health monitoring

Hybrid Edge-Cloud platform: IoT collars → Node API → Python ML inference → React dashboard + USSD/SMS for feature phones.

## Structure

- `frontend/` — Vite React dashboard (judges / vets, smartphone)
- `backend/` — Node 20 Express API, Prisma ORM (`backend/prisma/schema.prisma`)
- `inference/` — FastAPI service serving `models/*.pkl` (RF + IsolationForest, sklearn==1.6.1)
- `models/` — 4 committed pickles (6MB total, under GitHub limit)
- `scripts/simulate_iot.py` — collar simulator for demo/seeding
- `notebooks/` — model training notebooks

## Local run

```bash
# 1. inference
cd inference && pip install -r requirements.txt && uvicorn app:app --port 8000
# 2. backend
cd backend && cp .env.example .env && npm install && npx prisma db push && npm run dev
# 3. frontend
cd frontend && npm install && npm run dev
```

## Deploy

Render Blueprint: `render.yaml` creates Postgres + 3 services. Push this folder to GitHub → Render → New Blueprint.

Raw datasets (>100MB) are NOT in git — see Drive link in docs.
