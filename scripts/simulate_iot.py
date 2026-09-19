"""
BoviPulse day-in-the-life IoT simulator.

Simulates collared cattle through a realistic 24-hour (or longer) routine and
streams the sensor telemetry to the backend exactly as physical collars would:
  POST /api/thermaguard/readings
    {cattleId, temperatureC, activityLevel, ambientC, humidity, deviceId, capturedAt}

No dataset is used — every value is generated from a stylized physiology +
behavior model (documented below; calibrated to Ankole/Zebu literature ranges,
NOT measured data). With the inference service running, the backend auto-scores
each reading, so this script exercises the full live loop:
  collar -> ingest -> store -> ML score -> alert -> dashboard.

Layers (kept separate on purpose, like real hardware + firmware):
  1. Behavior   — per-cow state machine: REST / RUMINATE / GRAZE / WALK / DRINK
                  with time-of-day transition odds (dawn + afternoon grazing
                  bouts, midday + night rest, occasional drinking).
  2. Physiology — body temp = personal baseline + diurnal wave (nadir ~05:00,
                  peak ~17:00) + activity heat + episode effects + noise.
                  Ambient = highland diurnal wave; humidity inverse to ambient.
  3. Sensor     — per-collar systematic bias + Gaussian noise + dropouts
                  (connectivity loss -> missing ticks, which the backend
                  tolerates as gaps). deviceId = COLLAR-<tag>.

Abnormal scenarios (one flagged cow per run unless --scenario none):
  fever      sustained climbing temp (+~1.8C over ~6h) + collapsed activity
  lameness   activity x0.3, temperature normal (tests activity-side detection)
  heatstress temp elevated while ambient/THI high, midday-weighted
  mixed      (default) randomly picks one of the above

Usage:
  # stream one full day (96 x 15-min ticks) for 4 cows, report ML outcome
  python simulate_iot.py --email farmer@test.com --password password123 --cows 4 --hours 24

  # quick smoke test: 3 simulated hours, no abnormal episode
  python simulate_iot.py --email farmer@test.com --password password123 --cows 1 --hours 3 --scenario none

  # sensors only (no ML verdict report; readings still auto-scored server-side
  # if the inference service is up, else they stay "pending ML")
  python simulate_iot.py --email farmer@test.com --password password123 --score none

  # score locally with the .pkl files instead of the server path
  # (needs scikit-learn==1.6.1; useful when the inference service is down)
  python simulate_iot.py --email farmer@test.com --password password123 --score local
"""
from __future__ import annotations

import argparse
import math
import random
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone

import requests

BASE = "http://localhost:4000"

# ------------------------------------------------------------------ API
class API:
    def __init__(self, base: str):
        self.base = base
        self.s = requests.Session()

    def login(self, email: str, password: str):
        r = self.s.post(f"{self.base}/api/auth/login", json={"email": email, "password": password})
        r.raise_for_status()
        self.s.headers["Authorization"] = f"Bearer {r.json()['token']}"

    def ensure_farm(self):
        r = self.s.get(f"{self.base}/api/farms/me")
        if r.status_code == 200:
            return r.json()
        r = self.s.post(f"{self.base}/api/farms", json={"name": "Demo Farm", "location": "Kabale",
                                                              "latitude": -1.25, "longitude": 29.99})
        r.raise_for_status()
        return r.json()

    def ensure_cattle(self, n: int):
        r = self.s.get(f"{self.base}/api/cattle", params={"limit": 100})
        r.raise_for_status()
        cows = r.json()["data"]
        i = len(cows)
        attempt = 0
        while len(cows) < n:
            # Tag numbers are globally unique; earlier runs may own SIM-00x,
            # so retry with a suffixed tag on 409 instead of crashing.
            tag = f"SIM-{i + 1:03d}" if attempt == 0 else f"SIM-{i + 1:03d}-{attempt}"
            c = self.s.post(
                f"{self.base}/api/cattle",
                json={"tagNumber": tag, "name": f"SimCow {i + 1}",
                      "breed": "Ankole", "gender": "FEMALE"},
            )
            if c.status_code == 409:
                attempt += 1
                if attempt > 20:
                    c.raise_for_status()
                continue
            c.raise_for_status()
            cows.append(c.json())
            i += 1
            attempt = 0
        return cows[:n]

    def update_cattle(self, cattle_id: str, data: dict):
        r = self.s.patch(f"{self.base}/api/cattle/{cattle_id}", json=data)
        r.raise_for_status()
        return r.json()

    def send_reading(self, payload: dict):
        r = self.s.post(f"{self.base}/api/thermaguard/readings", json=payload)
        r.raise_for_status()
        return r.json()

    def get(self, path: str, params: dict | None = None):
        r = self.s.get(f"{self.base}/api{path}", params=params or {})
        r.raise_for_status()
        return r.json()


# ------------------------------------------------- behavior + physiology
REST, RUMINATE, GRAZE, WALK, DRINK = "REST", "RUMINATE", "GRAZE", "WALK", "DRINK"

# Mean activity index per behavioral state (stylized; dataset range 0-200).
STATE_ACTIVITY = {REST: 5.0, RUMINATE: 9.0, GRAZE: 42.0, WALK: 85.0, DRINK: 22.0}

# Time-of-day grazing drive 0..1 (dawn + late-afternoon bouts, midday lull).
def graze_drive(hour: float) -> float:
    dawn = math.exp(-((hour - 6.5) ** 2) / 3.0)
    afternoon = math.exp(-((hour - 16.0) ** 2) / 4.5)
    return min(1.0, dawn + afternoon)


class Cow:
    """Personal baselines + current behavioral state + episode + repro state."""

    def __init__(self, seed: int):
        rng = random.Random(seed)
        self.base_temp = rng.uniform(38.2, 38.8)   # healthy resting core range
        self.base_act = rng.uniform(0.85, 1.15)    # personal activity multiplier
        self.state = REST if rng.random() < 0.7 else RUMINATE
        self.rng = rng
        self.episode = None  # (kind, start_tick, duration_ticks)
        # Reproductive state, assigned later by assign_repro():
        #  {'cycling': days_since_estrus} or {'pregnant': days_in_pregnancy}.
        self.repro = {"cycling": rng.uniform(0, 21)}
        # Heat spike sized to stay sub-critical (research: 0.3-1.3C, ~39.3+):
        # above the fever line but below the critical line, so the guard can
        # legitimately call it estrus instead of a health scare.
        self.estrus_rise = rng.uniform(0.3, 0.9)
        self.elapsed_h = 0.0

    def repro_effects(self):
        """Return (temp_delta, activity_gain, restless, in_heat) for this tick."""
        if "pregnant" in self.repro:
            d = self.repro["pregnant"] + self.elapsed_h / 24
            delta = 0.15 if d < 250 else 0.1          # early lift, then settles
            if d >= 268:
                # Pre-calving drop: up to ~1C over the final ~12-20h.
                delta -= min(1.0, 0.09 * max(0.0, self.elapsed_h - 2))
            return delta, 0.9, False, False
        cyc = (self.repro["cycling"] + self.elapsed_h / 24) % 21
        if cyc >= 20.55:
            # Standing heat: sharp rise for ~8-10h + restlessness, still eating.
            return self.estrus_rise, 1.4, True, True
        if cyc >= 18.5:
            return -0.15, 1.0, False, False            # 2-3 day pre-heat dip
        return 0.0, 1.0, False, False

    def step_behavior(self, hour: float):
        r = self.rng.random
        g = graze_drive(hour)
        night = hour < 5 or hour >= 20
        s = self.state
        if s == REST:
            self.state = RUMINATE if r() < 0.35 else (GRAZE if r() < 0.35 + 0.55 * g else REST)
        elif s == RUMINATE:
            self.state = REST if r() < 0.4 else (GRAZE if r() < 0.4 + 0.5 * g else RUMINATE)
        elif s == GRAZE:
            self.state = (RUMINATE if r() < 0.3 else
                          WALK if r() < 0.38 else
                          DRINK if r() < 0.42 else
                          (REST if (night or r() < 0.15) else GRAZE))
        elif s == WALK:
            self.state = GRAZE if r() < 0.6 else (REST if r() < 0.75 else WALK)
        elif s == DRINK:
            self.state = GRAZE if r() < 0.55 else REST
        return self.state

    def true_values(self, hour: float, tick: int):
        """Ground-truth physiology BEFORE sensor error. Returns (temp, act, amb, hum)."""
        state = self.step_behavior(hour)
        r_delta, r_gain, restless, in_heat = self.repro_effects()
        if restless and state in (REST, RUMINATE) and self.rng.random() < 0.55:
            state = GRAZE  # heat restlessness: can't settle
        # Ambient highland diurnal wave: min ~13C at 03:00, max ~23C at 15:00.
        ambient = 18.0 + 5.0 * math.sin(2 * math.pi * (hour - 9) / 24)
        humidity = min(100.0, max(30.0, 78.0 - 1.6 * (ambient - 18.0)))
        # Core temp: personal baseline + diurnal wave (nadir ~05:00, peak ~17:00)
        # + activity heat + small wander.
        temp = (self.base_temp
                + 0.35 * math.sin(2 * math.pi * (hour - 11) / 24)
                + 0.12 * (STATE_ACTIVITY[state] / 60.0)
                + r_delta
                + self.rng.gauss(0, 0.06))
        act = max(0.0, STATE_ACTIVITY[state] * self.base_act * r_gain + self.rng.gauss(0, 3.0))
        # Abnormal episode effects.
        if self.episode:
            kind, start, dur = self.episode
            k = tick - start
            if 0 <= k < dur:
                if kind == "fever":
                    temp += min(1.8, 0.3 * (k + 1))           # climbs over ~6h
                    act *= max(0.2, 1 - 0.13 * (k + 1))        # goes dull/stationary
                    if state == GRAZE and k > 2:
                        act *= 0.5
                elif kind == "lameness":
                    act *= 0.3                                  # moves little, temp normal
                elif kind == "heatstress" and 10 <= hour <= 16:
                    temp += 0.8
                    act *= 0.6
        if in_heat:
            # Keep heat sub-critical (<=40.0): research-plausible and lets the
            # backend legitimately label it estrus instead of a health scare.
            temp = min(temp, 40.0)
        return round(temp, 2), round(act, 2), round(ambient, 2), round(humidity, 2)


class CollarSensor:
    """Firmware-flavored sensor layer: bias + noise + dropouts."""

    def __init__(self, tag: str, seed: int, dropout_p: float = 0.03):
        rng = random.Random(seed)
        self.device_id = f"COLLAR-{tag}"
        self.temp_bias = rng.uniform(-0.15, 0.15)  # per-unit calibration offset
        self.act_gain = rng.uniform(0.94, 1.06)    # per-unit sensitivity
        self.dropout_p = dropout_p
        self.rng = rng
        self.sent = 0
        self.dropped = 0

    def observe(self, temp: float, act: float):
        """Return measured payload values, or None on connectivity dropout."""
        if self.rng.random() < self.dropout_p:
            self.dropped += 1
            return None
        measured_temp = round(temp + self.temp_bias + self.rng.gauss(0, 0.12), 2)
        measured_act = round(max(0.0, act * self.act_gain + self.rng.gauss(0, 2.0)), 2)
        self.sent += 1
        return measured_temp, measured_act


# ------------------------------------------------------------------- main
def assign_repro(api: API, cows: list[dict], herd: list[Cow], seed: int):
    """Give the demo herd a whole picture: one near-term pregnancy plus
    staggered cyclers with one heat landing inside the run. Idempotent: cows
    already marked PREGNANT keep their role; only one new pregnancy is ever
    created. Returns the set of cow indexes reserved for repro storylines
    (fever episode avoids them). Prints the role table."""
    rng = random.Random(seed + 999)
    reserved = set()
    roles = {}
    preg_idx = next((i for i, c in enumerate(cows)
                     if (c.get("pregnancyStatus") or "").upper() == "PREGNANT"), None)
    if preg_idx is None and len(herd) >= 1:
        herd[0].repro = {"pregnant": 273.0}
        try:
            api.update_cattle(cows[0]["id"], {"pregnancyStatus": "PREGNANT"})
            preg_idx = 0
        except Exception as exc:
            print(f"  repro: could not mark pregnancy ({exc}) — calving path will not trigger")
    if preg_idx is not None:
        if herd[preg_idx].repro.get("pregnant") is None:
            herd[preg_idx].repro = {"pregnant": 273.0}
        roles[cows[preg_idx]["tagNumber"]] = "pregnant ~day 273 (calving watch expected)"
        reserved.add(preg_idx)
    heat_idx = next((i for i in range(len(herd)) if i not in reserved), None)
    if heat_idx is not None and len(herd) >= 2:
        # Day 20.2 -> enters the ~10h heat window ~8h into a 24h run.
        herd[heat_idx].repro = {"cycling": 20.2}
        roles[cows[heat_idx]["tagNumber"]] = "cycling, heat expected mid-run"
        reserved.add(heat_idx)
    for j in range(len(herd)):
        if j not in reserved:
            if isinstance(herd[j].repro, dict) and "cycling" in herd[j].repro:
                pass  # keep existing cycle state across runs
            else:
                herd[j].repro = {"cycling": rng.uniform(0, 18)}
            roles.setdefault(cows[j]["tagNumber"], "cycling background")
    for tag, role in roles.items():
        print(f"  repro: {tag} — {role}")
    return reserved


def assign_episodes(cows: list[Cow], scenario: str, start_tick: int, rng: random.Random,
                    skip: set | None = None):
    kinds = {"fever": ["fever"], "lameness": ["lameness"],
             "heatstress": ["heatstress"],
             "mixed": ["fever", "lameness", "heatstress"]}[scenario]
    if scenario == "none":
        return None
    skip = skip or set()
    pool = [i for i in range(len(cows)) if i not in skip] or list(range(len(cows)))
    idx = rng.choice(pool)
    kind = rng.choice(kinds)
    dur = rng.randint(20, 32)  # 5-8 simulated hours at 15-min steps
    cows[idx].episode = (kind, start_tick, dur)
    return idx, kind, dur


def main():
    ap = argparse.ArgumentParser(description="BoviPulse day-in-the-life IoT simulator")
    ap.add_argument("--email", required=True)
    ap.add_argument("--password", required=True)
    ap.add_argument("--cows", type=int, default=4)
    ap.add_argument("--hours", type=float, default=24, help="simulated hours to stream")
    ap.add_argument("--step-min", type=float, default=15, help="simulated minutes per tick")
    ap.add_argument("--ticks", type=int, default=None, help="override: exact tick count")
    ap.add_argument("--interval", type=float, default=0.05, help="real seconds between POSTs")
    ap.add_argument("--scenario", default="mixed",
                    choices=["mixed", "fever", "lameness", "heatstress", "none"])
    ap.add_argument("--repro", default="auto", choices=["auto", "off"],
                    help="auto: one near-term pregnancy (calving watch) + staggered "
                         "cyclers with a mid-run heat; off: all cows plain cycling")
    ap.add_argument("--score", default="auto", choices=["auto", "local", "none"],
                    help="auto: rely on backend+inference service and report its verdicts; "
                         "local: score with ../models/*.pkl in this script; none: stream only")
    ap.add_argument("--base-url", default=BASE)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--start-hour", type=float, default=0.0,
                    help="wall-clock hour the simulated day starts at (0=midnight)")
    args = ap.parse_args()

    ticks = args.ticks or max(4, int(args.hours * 60 / args.step_min))
    step = timedelta(minutes=args.step_min)
    rng = random.Random(args.seed)

    api = API(args.base_url)
    api.login(args.email, args.password)
    api.ensure_farm()
    cows = api.ensure_cattle(args.cows)
    # Deterministic roles: DB order is unstable for same-second rows, so sort
    # by tag -> SIM-001 pregnant, SIM-002 heat, episode pool {SIM-003, ...}.
    cows.sort(key=lambda c: c.get("tagNumber", ""))
    print(f"Streaming a {ticks * args.step_min / 60:.1f}h simulated day "
          f"({ticks} ticks x {len(cows)} cows): {[c['tagNumber'] for c in cows]}")

    herd = [Cow(args.seed + i * 7919) for i in range(len(cows))]
    collars = [CollarSensor(c["tagNumber"], args.seed + i * 104729) for i, c in enumerate(cows)]
    reserved = assign_repro(api, cows, herd, args.seed) if args.repro == "auto" else set()
    ep = assign_episodes(herd, args.scenario, start_tick=max(4, ticks // 3), rng=rng, skip=reserved)
    if ep:
        print(f"  injected episode: {ep[1]} on cow #{ep[0] + 1} "
              f"({cows[ep[0]]['tagNumber']}) for ~{ep[2] * args.step_min / 60:.1f}h")

    t0 = datetime.now(timezone.utc) - step * ticks
    run_start = datetime.now(timezone.utc)  # verdicts filtered to this run only
    histories: dict[str, list] = defaultdict(list)
    sent = 0
    for tick in range(ticks):
        hour = (args.start_hour + tick * args.step_min / 60) % 24
        ts = (t0 + step * tick).isoformat()
        for cow, sim, collar in zip(cows, herd, collars):
            sim.elapsed_h = tick * args.step_min / 60
            temp, act, amb, hum = sim.true_values(hour, tick)
            obs = collar.observe(temp, act)
            if obs is None:
                continue  # dropout: collar offline this tick -> gap in series
            m_temp, m_act = obs
            payload = {"cattleId": cow["id"], "temperatureC": m_temp,
                       "activityLevel": m_act, "ambientC": amb, "humidity": hum,
                       "deviceId": collar.device_id, "capturedAt": ts}
            res = api.send_reading(payload)
            histories[cow["id"]].append(payload)
            sent += 1
        if (tick + 1) % 24 == 0:
            print(f"  tick {tick + 1}/{ticks} ({sent} readings sent)")
        time.sleep(args.interval)

    drops = sum(c.dropped for c in collars)
    print(f"Done: {sent} readings stored, {drops} collar dropouts (gaps, by design).")

    if args.score == "none":
        print("Skipping verdict report. Readings are auto-scored server-side if the "
              "inference service is up, else they stay 'pending ML'.")
        return

    if args.score == "local":
        report_local(api, cows, histories)
        return

    # auto: ask the system itself what it concluded (real integration path)
    report_server(api, cows, run_start)


def report_server(api: API, cows: list[dict], run_start):
    print("\nSystem verdicts for THIS run (via backend predictions + alerts):")
    alerts = api.get("/alerts", {"type": "HEALTH", "limit": 100})["data"]
    by_cow = defaultdict(list)
    for a in alerts:
        ts = datetime.fromisoformat(a["createdAt"])
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        if a.get("cattleId") and ts >= run_start:
            by_cow[a["cattleId"]].append(a)
    for c in cows:
        preds = api.get("/thermaguard/predictions",
                        {"cattleId": c["id"], "limit": 3})["data"]
        latest = preds[0] if preds else None
        ptxt = (f"{latest['label']} (score {latest['anomalyScore']}, "
                f"{latest['modelVersion']})" if latest else "pending ML")
        a = by_cow.get(c["id"], [])
        aflags = f" -> {len(a)} warning(s)" if a else ""
        print(f"  {c['tagNumber']}: {ptxt}{aflags}")
    print("See Health Monitoring / Early Warnings in the dashboard.")


def report_local(api: API, cows: list[dict], histories: dict):
    """Score with ../models/*.pkl directly (fallback when inference service is down)."""
    import joblib
    import numpy as np

    FEATURES = list(joblib.load("../models/bovipulse_feature_list.pkl"))
    scaler = joblib.load("../models/bovipulse_feature_scaler.pkl")
    rf = joblib.load("../models/bovipulse_rf_model.pkl")

    def thi(t, rh):
        return (1.8 * t + 32) - (0.55 - 0.0055 * rh) * (1.8 * t - 26)

    print("\nLocal-model verdicts (scored in-script from sent history):")
    for c in cows:
        hist = histories[c["id"]]
        if len(hist) < 2:
            print(f"  {c['tagNumber']}: too few readings to score");
            continue
        pts = [(h["temperatureC"], h["activityLevel"],
                datetime.fromisoformat(h["capturedAt"])) for h in hist]
        now = pts[-1][2]
        w6 = [p for p in pts if (now - p[2]).total_seconds() <= 6 * 3600]
        w24 = [p for p in pts if (now - p[2]).total_seconds() <= 24 * 3600]
        t24 = np.array([p[0] for p in w24]); a24 = np.array([p[1] for p in w24])
        last = hist[-1]
        m, s = t24.mean(), (t24.std() if len(t24) > 1 else 0.0)
        am, as_ = a24.mean(), (a24.std() if len(a24) > 1 else 0.0)
        row = {
            "body_temp_C": last["temperatureC"], "activity_index": last["activityLevel"],
            "ambient_temp_C": last["ambientC"], "ambient_humidity_pct": last["humidity"],
            "THI": thi(last["ambientC"], last["humidity"]), "hour": now.hour,
            "is_night": 1 if (now.hour < 6 or now.hour >= 20) else 0,
            "heat_index": last["ambientC"] + 0.1 * last["humidity"],
            "body_temp_C_roll6h_mean": float(np.mean([p[0] for p in w6])),
            "body_temp_C_roll24h_mean": float(m),
            "body_temp_C_roll24h_std": float(s),
            "activity_index_roll6h_mean": float(np.mean([p[1] for p in w6])),
            "activity_index_roll24h_mean": float(am),
            "activity_index_roll24h_std": float(as_),
            "body_temp_dev": float((last["temperatureC"] - m) / s) if s else 0.0,
            "activity_dev": float((last["activityLevel"] - am) / as_) if as_ else 0.0,
            "body_temp_diff": float(pts[-1][0] - pts[-2][0]),
            "activity_diff": float(pts[-1][1] - pts[-2][1]),
        }
        x = scaler.transform(np.array([row[f] for f in FEATURES]).reshape(1, -1))
        proba = float(rf.predict_proba(x)[0][1])
        label = "ABNORMAL" if proba >= 0.5 else "NORMAL"
        posted = api.s.post(f"{api.base}/api/thermaguard/predictions", json={
            "cattleId": c["id"], "label": label, "anomalyScore": round(proba, 3),
            "modelVersion": "rf-300-sim-local-v1"})
        posted.raise_for_status()
        info = posted.json()
        print(f"  {c['tagNumber']}: {label} (score {proba:.3f})"
              + (" -> ALERT" if info.get("alertCreated") else ""))


if __name__ == "__main__":
    main()
