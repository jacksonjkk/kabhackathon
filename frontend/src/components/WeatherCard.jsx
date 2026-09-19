import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, Snowflake, CloudLightning, CloudHail, Droplets, MapPin } from 'lucide-react'
import { fetchForecast } from '../api/weather'
import { toDisplayTemp, tempUnitLabel } from '../utils/units'

// Google-style farm weather card: big temp + condition, high/low +
// humidity, hourly strip. Display only — ML backfill runs server-side.
function iconFor(code) {
  if (code == null) return CloudSun
  if (code === 0) return Sun
  if (code <= 3) return CloudSun
  if (code <= 48) return CloudFog
  if (code <= 57) return CloudDrizzle
  if (code <= 67 || (code >= 80 && code <= 82)) return CloudRain
  if (code <= 77) return Snowflake
  if (code === 85 || code === 86) return CloudHail
  return CloudLightning
}

function labelFor(code) {
  if (code == null) return ''
  if (code === 0) return 'Clear sky'
  if (code === 1) return 'Mostly clear'
  if (code <= 3) return 'Cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 57) return 'Drizzle'
  if (code <= 67 || (code >= 80 && code <= 82)) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code === 85 || code === 86) return 'Hail showers'
  return 'Thunderstorm'
}

const fmtHour = iso => {
  const d = new Date(iso)
  const h = d.getHours()
  const suffix = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${suffix}`
}

export default function WeatherCard({ latitude, longitude, place, units }) {
  const [data, setData] = useState(null)
  const [state, setState] = useState(latitude != null ? 'loading' : 'idle')

  useEffect(() => {
    if (latitude == null || longitude == null) { setState('idle'); return }
    const ctrl = new AbortController()
    setState('loading')
    fetchForecast(latitude, longitude, ctrl.signal)
      .then(w => { if (!ctrl.signal.aborted) { setData(w); setState(w ? 'ok' : 'fail') } })
      .catch(() => { if (!ctrl.signal.aborted) setState('fail') })
    return () => ctrl.abort()
  }, [latitude, longitude])

  const unit = tempUnitLabel(units)
  const show = c => (c == null || Number.isNaN(c) ? null : `${Math.round(toDisplayTemp(c, units))}${unit}`)

  if (state === 'idle') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex items-center gap-3">
        <MapPin size={22} className="text-sky-600 flex-shrink-0" />
        <p className="text-xs text-gray-600">
          Save your farm GPS for live weather here.{' '}
          <Link to="/dashboard/settings" className="text-green-700 font-bold hover:underline">Go to Settings</Link>
        </p>
      </div>
    )
  }
  if (state === 'loading') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        <p className="text-xs text-gray-500">Loading farm weather…</p>
      </div>
    )
  }
  if (state === 'fail' || !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        <p className="text-xs text-gray-500">Farm weather unavailable while offline.</p>
      </div>
    )
  }

  const Icon = iconFor(data.weatherCode)
  const big = show(data.ambientC) ?? '—'
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{place || 'Farm weather'}</p>
          <div className="flex items-center gap-3 mt-1">
            <Icon size={44} className="text-sky-600 flex-shrink-0" strokeWidth={1.5} />
            <span className="text-5xl font-light text-gray-900 tracking-tight">{big}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1.5">
            {labelFor(data.weatherCode)}
            {show(data.highC) && show(data.lowC) ? ` · H:${show(data.highC)} L:${show(data.lowC)}` : ''}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 inline-flex items-center gap-1">
            <Droplets size={13} className="text-sky-600" /> Humidity {data.humidity}%
          </p>
        </div>
      </div>
      {!!data.hourly?.length && (
        <div className="flex gap-1 mt-4 pt-3 border-t border-gray-100 overflow-x-auto">
          {data.hourly.map(h => {
            const HIcon = iconFor(h.code)
            return (
              <div key={h.time} className="flex flex-col items-center gap-1 min-w-[3.25rem] py-1">
                <span className="text-[10px] text-gray-400 font-semibold">{fmtHour(h.time)}</span>
                <HIcon size={18} className="text-sky-600" strokeWidth={1.5} />
                <span className="text-xs font-bold text-gray-800">{show(h.tempC)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
