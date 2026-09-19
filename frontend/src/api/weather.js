// Browser-side weather display (Google-style: locate → show local weather).
// Calls Open-Meteo directly (free, no key, CORS-enabled). This is display
// only — the ML backfill still runs server-side in the backend so collars
// that bypass the browser get the same data.
export async function fetchLocalWeather(latitude, longitude, signal) {
  const lat = Number(latitude)
  const lon = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
    `&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`
  const res = await fetch(url, { signal })
  if (!res.ok) return null
  const json = await res.json()
  const ambientC = Number(json?.current?.temperature_2m)
  const humidity = Number(json?.current?.relative_humidity_2m)
  if (!Number.isFinite(ambientC) || !Number.isFinite(humidity)) return null
  return { ambientC, humidity, weatherCode: json?.current?.weather_code ?? null }
}

// Full Google-style payload: current + today's high/low + next hours.
export async function fetchForecast(latitude, longitude, signal) {
  const lat = Number(latitude)
  const lon = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
    `&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code` +
    `&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min` +
    `&timezone=auto&forecast_days=2`
  const res = await fetch(url, { signal })
  if (!res.ok) return null
  const json = await res.json()
  const ambientC = Number(json?.current?.temperature_2m)
  const humidity = Number(json?.current?.relative_humidity_2m)
  if (!Number.isFinite(ambientC) || !Number.isFinite(humidity)) return null
  const now = Date.parse(json?.current?.time ?? NaN)
  const times = json?.hourly?.time ?? []
  const temps = json?.hourly?.temperature_2m ?? []
  const codes = json?.hourly?.weather_code ?? []
  const hourly = []
  for (let i = 0; i < times.length && hourly.length < 8; i += 1) {
    if (Number.isFinite(now) && Date.parse(times[i]) < now) continue
    if (!Number.isFinite(Number(temps[i]))) continue
    hourly.push({ time: times[i], tempC: Number(temps[i]), code: codes[i] ?? null })
  }
  return {
    ambientC,
    humidity,
    weatherCode: json?.current?.weather_code ?? null,
    highC: Number(json?.daily?.temperature_2m_max?.[0]),
    lowC: Number(json?.daily?.temperature_2m_min?.[0]),
    hourly,
  }
}
// Resolves { latitude, longitude } or throws a human-readable Error.
// One-shot browser geolocation (the "Google asks for location" prompt).
// Resolves { latitude, longitude } or throws a human-readable Error.
export function askBrowserLocation({ timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('This browser does not support location. Enter GPS manually.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      err => {
        if (err?.code === 1) reject(new Error('Location blocked. Allow location in the browser, or enter GPS manually.'))
        else if (err?.code === 3) reject(new Error('Location timed out. Try again, or enter GPS manually.'))
        else reject(new Error('Could not get location. Enter GPS manually.'))
      },
      { timeout },
    )
  })
}
