import { useAuth } from '../context/AuthContext'

// Backend stores temperatures in °C. This converts for display only;
// thresholds, ML features, and API payloads stay metric.
export const toDisplayTemp = (celsius, units) =>
  units === 'imperial' ? (celsius * 9) / 5 + 32 : celsius

export const tempUnitLabel = (units) => (units === 'imperial' ? '°F' : '°C')

export function formatTemp(celsius, units, digits = 1) {
  if (celsius == null || Number.isNaN(Number(celsius))) return '—'
  return `${toDisplayTemp(Number(celsius), units).toFixed(digits)}${tempUnitLabel(units)}`
}

export function useUnits() {
  const { user } = useAuth()
  return user?.units === 'imperial' ? 'imperial' : 'metric'
}
