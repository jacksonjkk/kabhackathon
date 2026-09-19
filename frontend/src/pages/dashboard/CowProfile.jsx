import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import { PawPrint } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { cattleApi, thermalApi, observationApi } from '../../api/client'
import { driverForReading, FEVER_LINE } from '../../utils/explain'

// Caretaker quick-log: common visible signs, one tap each. Target: logged in
// under 10 seconds — tap signs, tap severity, Save. No typing required.
// Sign labels come from the active locale so caretakers log in their language.
// The backend stores the submitted (translated) text; matching is substring-based.
const SEVERITIES = ['Mild', 'Moderate', 'Severe']

// Cow-level monitoring: identity + sensor history + ML predictions + warnings + notes.
// Vaccination / reproduction histories removed (future enhancements).
export default function CowProfile() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [cattle, setCattle] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [signs, setSigns] = useState([])
  const [severity, setSeverity] = useState('Moderate')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = () => {
    cattleApi.get(id).then(setCattle).catch(err => setError(err.message))
    thermalApi.predictions({ cattleId: id, limit: 30 }).then(r => setPredictions(r.data)).catch(() => {})
  }
  useEffect(load, [id])

  const toggleSign = s => setSigns(cur => cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s])

  const logSigns = async e => {
    e.preventDefault()
    if (!signs.length && !note.trim()) {
      setError(t('cow.needSign'))
      return
    }
    setError('')
    setNotice('')
    setSaving(true)
    try {
      const parts = []
      if (signs.length) parts.push(`Signs: ${signs.join(', ')} (${severity})`)
      if (note.trim()) parts.push(note.trim())
      await observationApi.create({
        cattleId: id,
        note: parts.join('; '),
        action: signs.length ? `Signs logged (${severity})` : 'Note',
      })
      setSigns([])
      setNote('')
      setNotice(t('cow.thanks'))
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const readings = cattle?.thermalReadings ?? []
  const alerts = cattle?.alerts ?? []
  const observations = cattle?.observations ?? []
  const abnormal = predictions.filter(p => p.label === 'ABNORMAL').length

  // Oldest -> latest for the trend chart (backend returns newest first).
  const trend = [...readings].reverse().map(r => ({
    t: new Date(r.capturedAt).toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    full: new Date(r.capturedAt).toLocaleString(),
    temp: r.temperatureC,
    activity: r.activityLevel ?? null,
    label: r.prediction ?? null,
    score: r.anomalyScore ?? null,
    abnormal: r.prediction === 'ABNORMAL' || r.anomaly,
  }))
  const temps = trend.map(p => p.temp)
  const tMin = temps.length ? Math.min(...temps) : 0
  const tMax = temps.length ? Math.max(...temps) : 0
  const yPad = Math.max(0.5, (tMax - tMin) * 0.3 || 0.5)

  // Detail popup for every dot: tap/hover a point to see what happened then.
  // The driver line says WHY it is red (high/low temp, low activity, shift).
  const ChartTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const idx = trend.indexOf(payload[0].payload)
    const p = payload[0].payload
    const driver = driverForReading(
      { temperatureC: p.temp, activityLevel: p.activity, prediction: p.label, anomaly: p.abnormal },
      trend.slice(0, Math.max(0, idx - 1)).map(q => q.activity),
    )
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs max-w-[220px]">
        <p className="text-gray-400 text-[10px] mb-1">{p.full}</p>
        <p className="font-bold text-gray-900 text-sm">{p.temp}°C · activity {p.activity ?? '—'}</p>
        <p className={`font-semibold mt-0.5 ${p.abnormal ? 'text-red-600' : 'text-green-600'}`}>
          {p.label === 'ABNORMAL' ? `ABNORMAL${p.score != null ? ` (score ${p.score})` : ''}`
            : p.label === 'NORMAL' ? 'NORMAL pattern'
            : p.abnormal ? 'Flagged by threshold'
            : 'Not yet scored by ML'}
        </p>
        {driver && <p className="text-gray-600 mt-0.5">Why: {driver}</p>}
      </div>
    )
  }

  return (
    <DashboardLayout title={t('cow.title')}>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        {notice && <p className="text-sm text-green-700" role="status">{notice}</p>}
        {!cattle && !error && <p className="py-12 text-center text-sm text-gray-500">{t('cow.loading')}</p>}
        {cattle && (
          <>
            <div className="flex items-center gap-3 sm:gap-4 border-b border-gray-100 pb-5">
              <PawPrint size={40} className="text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-xl font-black text-gray-900">{cattle.name || 'Unnamed cattle'}</h2>
                <p className="text-sm text-gray-500">{cattle.tagNumber} · {cattle.breed || t('settings.notRecorded')} · {cattle.gender}</p>
                <p className="text-xs text-gray-500 mt-1">{t('status.' + cattle.healthStatus, { defaultValue: cattle.healthStatus })} · {t('cow.mlCount')}: <span className="font-bold">{abnormal}</span> · {t('cow.earlyNote')}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900">{t('cow.trendTitle')}</h3>
              <p className="text-[11px] text-gray-500 mt-0.5 mb-3">{t('cow.trendSub')}</p>
              {trend.length < 2 && <p className="text-xs text-gray-500">{t('cow.trendWait')}</p>}
              {trend.length >= 2 && (
                <div className="w-full h-56 sm:h-64 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" minTickGap={48} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} domain={[Math.floor(tMin - yPad), Math.ceil(tMax + yPad)]} />
                      <Tooltip
                        content={<ChartTip />}
                        cursor={{ stroke: '#9ca3af', strokeDasharray: '3 3' }}
                      />
                      <ReferenceLine y={FEVER_LINE} stroke="#E53935" strokeDasharray="5 4" label={{ value: `fever ${FEVER_LINE}`, fontSize: 10, fill: '#E53935', position: 'insideTopRight' }} />
                      <Line
                        type="monotone" dataKey="temp" stroke="#2E7D32" strokeWidth={2}
                        dot={p => {
                          const bad = p?.payload?.abnormal
                          return <circle key={p.key} cx={p.cx} cy={p.cy} r={bad ? 4.5 : 2.5} fill={bad ? '#E53935' : '#2E7D32'} stroke="#fff" strokeWidth={1} />
                        }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">{t('cow.readingsTitle')} ({readings.length})</h3>
              {!readings.length && <p className="text-xs text-gray-500">{t('cow.noReadings')}</p>}
              {!!readings.length && (
                <div className="overflow-x-auto -mx-1 px-1">
                  <table className="r-table w-full text-sm">
                    <thead><tr className="text-left text-[11px] text-gray-500 uppercase border-b border-gray-100"><th className="py-2 pr-4">Captured</th><th className="py-2 pr-4">Temp</th><th className="py-2 pr-4">Activity</th><th className="py-2">ML pattern</th></tr></thead>
                    <tbody>
                      {readings.slice(0, 12).map((r, i) => {
                        const driver = driverForReading(
                          r,
                          readings.slice(i + 1).map(q => q.activityLevel),
                        )
                        return (
                        <tr key={r.id} className="border-b border-gray-50">
                          <td data-label="Captured" className="py-2 pr-4 text-gray-500">{new Date(r.capturedAt).toLocaleString()}</td>
                          <td data-label="Temp" className="py-2 pr-4 font-bold">{r.temperatureC}°C</td>
                          <td data-label="Activity" className="py-2 pr-4">{r.activityLevel ?? '—'}</td>
                          <td data-label="ML pattern" className="py-2">{r.prediction === 'ABNORMAL' ? <span className="text-red-600 font-bold">ABNORMAL</span> : r.prediction === 'NORMAL' ? <span className="text-green-600">NORMAL</span> : <span className="text-gray-400">pending ML</span>}
                            {driver && <span className="block text-[10px] font-normal text-gray-500">{driver}</span>}
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">{t('cow.warningsTitle')} ({alerts.length})</h3>
              {!alerts.length && <p className="text-xs text-gray-500">{t('cow.noWarnings')}</p>}
              {alerts.slice(0, 10).map(a => (
                <div key={a.id} className="text-xs border border-gray-100 rounded-lg p-3 mb-2">
                  <span className="font-bold">{a.severity}</span> · {a.message} · <span className="text-gray-400">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <form onSubmit={logSigns} className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-bold text-gray-900">{t('cow.logTitle')} <span className="font-normal text-gray-400">· {t('cow.logFast')}</span></h3>
              <p className="text-[11px] text-gray-500 mt-0.5 mb-3">{t('cow.logSub')}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {(t('cow.signs', { returnObjects: true }) ).map(s => {
                  const on = signs.includes(s)
                  return (
                    <button key={s} type="button" onClick={() => toggleSign(s)}
                      className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
                        on ? 'bg-green-700 text-white border-green-700' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-green-500'
                      }`}>
                      {s}
                    </button>
                  )
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs text-gray-500">{t('cow.howBad')}</span>
                {SEVERITIES.map(v => (
                  <button key={v} type="button" onClick={() => setSeverity(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      severity === v
                        ? v === 'Severe' ? 'bg-red-600 text-white border-red-600' : 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}>
                    {t('severity.' + v, { defaultValue: v })}
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input value={note} onChange={e => setNote(e.target.value)} placeholder={t('cow.extra')} className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-gray-50 text-sm px-3 py-2.5" />
                <button disabled={saving} className="text-xs font-semibold text-white bg-green-700 px-5 py-3 sm:py-2.5 rounded-lg hover:bg-green-800 disabled:opacity-60 cursor-pointer whitespace-nowrap">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
              <div className="mt-4">
                <h4 className="text-xs font-bold text-gray-700 mb-2">{t('cow.recentLogs')}</h4>
                {!observations.length && <p className="text-xs text-gray-400">{t('cow.noLogs')}</p>}
                {observations.slice(0, 5).map(o => (
                  <p key={o.id} className="text-xs text-gray-600 mt-1.5">· {o.note} <span className="text-gray-400">({new Date(o.createdAt).toLocaleString()})</span></p>
                ))}
              </div>
            </form>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
