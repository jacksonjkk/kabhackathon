// Location-aware weather backfill (Open-Meteo, no API key).
//
// Why this layer: the backend is the only place that sees all three inputs
// together — farm coordinates (DB), collar payload (request), and the ML
// inference service. The Python inference service stays stateless (no DB),
// and collars bypass the frontend, so enriching here benefits every client.
//
// Priority per field: SENSOR value > WEATHER backfill > null (inference
// service then falls back to its 24C/65% training defaults). Sources are
// persisted on the reading (ambientSource/humiditySource) so the dashboard
// can badge weather-filled values and farmers are never misled.
import { env } from "../config/env.js";

const cache = new Map(); // key "lat,lon" -> { at, data }

export function clearWeatherCache() {
  cache.clear();
}

function cacheKey(lat, lon) {
  return `${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}`;
}

// Farm coordinates. No fallback: a farm without GPS gets no backfill —
// we'd rather persist an honest null (inference training defaults) than
// silently score against another town's weather.
export function resolveFarmCoords(farm) {
  const lat = Number(farm?.latitude);
  const lon = Number(farm?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { latitude: lat, longitude: lon };
}

async function fetchCurrent(latitude, longitude) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
    `&longitude=${longitude}&current=temperature_2m,relative_humidity_2m&timezone=auto`;
  const res = await fetch(url, { signal: AbortSignal.timeout(env.weatherTimeoutMs) });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const json = await res.json();
  const ambientC = Number(json?.current?.temperature_2m);
  const humidity = Number(json?.current?.relative_humidity_2m);
  if (!Number.isFinite(ambientC) || !Number.isFinite(humidity)) {
    throw new Error("Open-Meteo missing fields");
  }
  return { ambientC, humidity };
}

export async function getFarmWeather(farm) {
  if (!env.weatherEnabled) return null;
  const coords = resolveFarmCoords(farm);
  if (!coords) return null;

  const key = cacheKey(coords.latitude, coords.longitude);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < env.weatherCacheTtlMs) return hit.data;

  // One retry: collar ingest is async telemetry, so a few extra seconds
  // here are worth complete ML features. Stale cache stays the last resort.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const data = await fetchCurrent(coords.latitude, coords.longitude);
      cache.set(key, { at: Date.now(), data });
      return data;
    } catch {
      if (attempt === 1) return hit?.data ?? null;
    }
  }
  return hit?.data ?? null;
}
