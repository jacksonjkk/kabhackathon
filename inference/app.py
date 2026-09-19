"""
BoviPulse inference service — serves the trained models in ../models/.

Loads the 4 .pkl artifacts once at startup (feature list, scaler,
RandomForest, IsolationForest) and scores incoming sensor readings with the
EXACT feature semantics used in training (BoviP_Model_Training.ipynb):
  - time-based per-cow rolling windows (6h / 24h, min_periods=1, incl. current)
  - baseline z-score deviations vs the cow's own 24h stats
  - hour-to-hour diffs vs the previous reading
  - THI = (1.8*T + 32) - (0.55 - 0.0055*RH) * (1.8*T - 26)

Endpoints:
  GET  /health      -> liveness + loaded-model summary
  GET  /model-info  -> feature order, versions, artifact mtimes
  POST /score       -> {label NORMAL|ABNORMAL, anomalyScore, modelVersion, ...}

Run:
  pip install -r requirements.txt   # scikit-learn==1.6.1 to match the pickles
  uvicorn app:app --port 8000       # from this directory

The Node backend calls POST /score automatically for readings that arrive
without an inline ML prediction (see INFERENCE_URL in backend .env).
"""
from __future__ import annotations

import os
import warnings
from datetime import datetime, timezone
from pathlib import Path

warnings.filterwarnings("ignore")

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = Path(os.environ.get("MODEL_DIR", BASE_DIR.parent / "models"))
RF_VERSION = os.environ.get("MODEL_VERSION", "rf-300-external-v1")
ISO_VERSION = os.environ.get("ISO_MODEL_VERSION", "iso-300-external-v1")
# Operating threshold for the supervised path. Default 0.4 (lowered from the
# notebook's 0.5 evaluation point) because field experience showed the model
# smoothing over single extreme spikes (e.g. a lone 40.5C scored 0.41 and was
# called NORMAL). At 0.4 those spikes flag ABNORMAL while the threshold
# fallback still owns the extremes. Override per-deploy with RF_THRESHOLD
# (notebook precision 1.00 / recall 0.52, ROC-AUC 0.996 at 0.5).
RF_THRESHOLD = float(os.environ.get("RF_THRESHOLD", "0.4"))

app = FastAPI(title="BoviPulse Inference", version="1.0.0")

FEATURES: list[str] = []
TRAINED_WITH_SKLEARN: str | None = None
_scaler = None
_rf = None
_iso = None


# ------------------------------------------------------------------ schemas
class HistoryPoint(BaseModel):
    temperatureC: float
    activityLevel: float | None = None
    ambientC: float | None = None
    humidity: float | None = None
    capturedAt: datetime


class ScoreRequest(BaseModel):
    temperatureC: float = Field(ge=25, le=45)
    activityLevel: float | None = Field(default=None, ge=0)
    ambientC: float | None = None
    humidity: float | None = None
    capturedAt: datetime | None = None
    # Prior readings for THIS cow, oldest -> latest (current reading excluded;
    # it is appended internally). Empty list = cold start, still scores.
    history: list[HistoryPoint] = Field(default_factory=list)
    model: str = Field(default="rf", description="'rf' or 'isolation_forest'")


class ScoreResponse(BaseModel):
    label: str
    anomalyScore: float | None
    modelVersion: str
    model: str
    featuresUsed: int


# ------------------------------------------------------------------ startup
@app.on_event("startup")
def load_models() -> None:
    global FEATURES, TRAINED_WITH_SKLEARN, _scaler, _rf, _iso
    try:
        FEATURES = list(joblib.load(MODEL_DIR / "bovipulse_feature_list.pkl"))
        _scaler = joblib.load(MODEL_DIR / "bovipulse_feature_scaler.pkl")
        _rf = joblib.load(MODEL_DIR / "bovipulse_rf_model.pkl")
        _iso = joblib.load(MODEL_DIR / "bovipulse_isolation_forest_model.pkl")
    except Exception as exc:
        raise RuntimeError(f"Failed to load models from {MODEL_DIR}: {exc}") from exc
    n = _scaler.n_features_in_
    if not (len(FEATURES) == n == _rf.n_features_in_ == _iso.n_features_in_):
        raise RuntimeError(
            f"Inconsistent artifacts: list={len(FEATURES)} scaler={n} "
            f"rf={_rf.n_features_in_} iso={_iso.n_features_in_}"
        )
    # Training-time sklearn version is stamped inside the pickle bytes.
    import re

    raw = (MODEL_DIR / "bovipulse_rf_model.pkl").read_bytes()
    m = re.search(rb"_sklearn_version.{1,12}?(\d+\.\d+\.\d+)", raw)
    TRAINED_WITH_SKLEARN = m.group(1).decode() if m else None


# ------------------------------------------------------------------ features
def _thi(t: float, rh: float) -> float:
    return (1.8 * t + 32) - (0.55 - 0.0055 * rh) * (1.8 * t - 26)


def build_vector(req: ScoreRequest) -> list[float]:
    """Rebuild the 18 training features. Mirrors the notebook exactly."""
    now = req.capturedAt or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    pts = [
        {
            "t": p.temperatureC,
            "a": p.activityLevel if p.activityLevel is not None else 0.0,
            "ts": p.capturedAt if p.capturedAt.tzinfo else p.capturedAt.replace(tzinfo=timezone.utc),
        }
        for p in req.history
    ]
    cur = {
        "t": req.temperatureC,
        "a": req.activityLevel if req.activityLevel is not None else 0.0,
        "ts": now,
    }
    pts.append(cur)

    amb = req.ambientC if req.ambientC is not None else 24.0
    hum = req.humidity if req.humidity is not None else 65.0

    w6 = [p for p in pts if (now - p["ts"]).total_seconds() <= 6 * 3600]
    w24 = [p for p in pts if (now - p["ts"]).total_seconds() <= 24 * 3600]
    t6 = np.array([p["t"] for p in w6], float)
    t24 = np.array([p["t"] for p in w24], float)
    a24 = np.array([p["a"] for p in w24], float)

    t24_mean = float(t24.mean())
    t24_std = float(t24.std()) if len(t24) > 1 else 0.0
    a24_mean = float(a24.mean())
    a24_std = float(a24.std()) if len(a24) > 1 else 0.0
    prev = pts[-2] if len(pts) > 1 else cur

    row = {
        "body_temp_C": cur["t"],
        "activity_index": cur["a"],
        "ambient_temp_C": amb,
        "ambient_humidity_pct": hum,
        "THI": _thi(amb, hum),
        "hour": now.hour,
        "is_night": 1 if (now.hour < 6 or now.hour >= 20) else 0,
        "heat_index": amb + 0.1 * hum,
        "body_temp_C_roll6h_mean": float(t6.mean()),
        "body_temp_C_roll24h_mean": t24_mean,
        "body_temp_C_roll24h_std": t24_std,
        "activity_index_roll6h_mean": float(np.array([p["a"] for p in w6]).mean()),
        "activity_index_roll24h_mean": a24_mean,
        "activity_index_roll24h_std": a24_std,
        "body_temp_dev": (cur["t"] - t24_mean) / t24_std if t24_std else 0.0,
        "activity_dev": (cur["a"] - a24_mean) / a24_std if a24_std else 0.0,
        "body_temp_diff": float(cur["t"] - prev["t"]),
        "activity_diff": float(cur["a"] - prev["a"]),
    }
    return [row[f] for f in FEATURES]


# ------------------------------------------------------------------ routes
@app.get("/health")
def health():
    import sklearn

    return {
        "status": "ok",
        "service": "bovipulse-inference",
        "modelsLoaded": bool(FEATURES and _scaler is not None),
        "nFeatures": len(FEATURES),
        "sklearnRuntime": sklearn.__version__,
    }


@app.get("/model-info")
def model_info():
    files = {}
    for name in (
        "bovipulse_feature_list.pkl",
        "bovipulse_feature_scaler.pkl",
        "bovipulse_rf_model.pkl",
        "bovipulse_isolation_forest_model.pkl",
    ):
        p = MODEL_DIR / name
        files[name] = {"exists": p.exists(), "mtime": p.stat().st_mtime if p.exists() else None}
    rf_ver = TRAINED_WITH_SKLEARN
    return {
        "modelDir": str(MODEL_DIR),
        "rfVersion": RF_VERSION,
        "isoVersion": ISO_VERSION,
        "rfThreshold": RF_THRESHOLD,
        "trainedWithSklearn": rf_ver,
        "nFeatures": len(FEATURES),
        "featureOrder": FEATURES,
        "files": files,
    }


@app.post("/score", response_model=ScoreResponse)
def score(req: ScoreRequest):
    if not FEATURES:
        raise HTTPException(status_code=503, detail="Models not loaded")
    try:
        x = np.array(build_vector(req)).reshape(1, -1)
        xs = _scaler.transform(x)
    except KeyError as exc:
        raise HTTPException(status_code=500, detail=f"Feature mismatch: {exc}") from exc

    key = req.model.lower()
    if key in ("isolation_forest", "iso", "iforest"):
        pred = int(_iso.predict(xs)[0])  # -1 = anomaly, 1 = normal
        label = "ABNORMAL" if pred == -1 else "NORMAL"
        return ScoreResponse(
            label=label, anomalyScore=None, modelVersion=ISO_VERSION,
            model="isolation_forest", featuresUsed=len(FEATURES),
        )
    if key in ("rf", "random_forest", "randomforest"):
        proba = float(_rf.predict_proba(xs)[0][1])
        label = "ABNORMAL" if proba >= RF_THRESHOLD else "NORMAL"
        return ScoreResponse(
            label=label, anomalyScore=round(proba, 4), modelVersion=RF_VERSION,
            model="rf", featuresUsed=len(FEATURES),
        )
    raise HTTPException(status_code=400, detail="model must be 'rf' or 'isolation_forest'")
