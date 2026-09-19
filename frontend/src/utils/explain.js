// Human-readable "likely driver" for a flagged reading. Mirrors the backend's
// driverFor() bands so every surface says WHY a point is red in the same words.
// Temp bands use the same fever line (39.5) and critical line (40.3) as the API.
// Activity collapse is baseline-relative: current < 35% of the mean of older
// points (never an absolute floor — night rest must not flag).
export const FEVER_LINE = 39.5
export const CRITICAL_LINE = 40.3

function mean(xs) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
}

/**
 * @param {object} r  { temperatureC, activityLevel, prediction, anomaly }
 * @param {number[]} pastActivity  older activity values for baseline (optional)
 * @returns {string|null} driver text, or null when nothing is wrong
 */
export function driverForReading(r, pastActivity = []) {
  if (!r) return null
  const t = r.temperatureC
  const abnormal = r.prediction === 'ABNORMAL' || r.anomaly
  if (t >= CRITICAL_LINE) return `Critical high temp (${t}°C)`
  if (t >= FEVER_LINE) return `Fever-range temp (${t}°C)`
  if (t < 37.0) return `Abnormally low temp (${t}°C)`
  const olds = pastActivity.filter(v => v != null)
  const m = olds.length >= 4 ? mean(olds) : null
  if (
    abnormal && r.activityLevel != null && m != null && m > 15 &&
    r.activityLevel < 0.35 * m
  ) {
    return `Low activity (${r.activityLevel} vs usual ~${Math.round(m)})`
  }
  if (abnormal) return `Pattern shift vs baseline (temp ${t}°C looks normal alone)`
  return null
}

// Backend alert titles ship in English with fixed prefixes; map them to the
// active language, keeping the cow tag. Unknown shapes fall back to English.
export function translateAlertTitle(title, t) {
  if (!title) return title
  const [head, ...rest] = title.split('·')
  const tag = rest.join('·').trim()
  const h = head.trim().toLowerCase()
  let key = null
  if (h.startsWith('possible estrus')) key = 'estrus'
  else if (h.startsWith('possible calving')) key = 'calving'
  else if (h.startsWith('low activity')) key = 'lameness'
  else if (h.startsWith('abnormal health pattern')) key = 'health'
  if (!key) return title
  const translated = t(`alertTypes.${key}`, { defaultValue: head.trim() })
  return tag ? `${translated} · ${tag}` : translated
}

// Stored driver/reason strings are English templates; translate the known
// shapes, pass anything else through untouched.
export function translateDriver(reason, t) {
  if (!reason) return reason
  const r = reason.toLowerCase()
  const num = (reason.match(/[\d.]+/g) || []).join(', ')
  if (r.startsWith('critical high temp')) return t('driver.critical', { v: num, defaultValue: reason })
  if (r.startsWith('fever-range temp')) return t('driver.fever', { v: num, defaultValue: reason })
  if (r.startsWith('abnormally low temp')) return t('driver.low', { v: num, defaultValue: reason })
  if (r.startsWith('activity collapse')) return t('driver.activity', { defaultValue: reason })
  if (r.startsWith('pre-calving')) return t('driver.calving', { defaultValue: reason })
  if (r.includes('likely heat')) return t('driver.heat', { defaultValue: reason })
  if (r.startsWith('combined pattern shift')) return t('driver.shift', { defaultValue: reason })
  return reason
}
