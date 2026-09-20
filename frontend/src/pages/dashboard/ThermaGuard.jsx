import { useCallback, useEffect, useMemo, useState } from 'react'
import DashboardLayout from './DashboardLayout'
import { Thermometer, AlertTriangle, CheckCircle2, Activity, BrainCircuit, Radio, CalendarDays, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { thermalApi } from '../../api/client'
import { formatTemp, useUnits } from '../../utils/units'
import { driverForReading } from '../../utils/explain'

// Health Monitoring — Today (live) vs History (per-day archive).
// Today: auto-refreshing live stream for the current 24h window.
// History: pick any calendar day -> that day becomes a frozen record with
// its own summary + paginated readings. No endless scroll.
const toISODate = (d = new Date()) => d.toISOString().slice(0, 10)

export default function ThermaGuard() {
  const { t } = useTranslation()
  const units = useUnits()
  const [tab, setTab] = useState('today') // today | history
  const [error, setError] = useState('')

  // Today state
  const [todayReadings, setTodayReadings] = useState([])
  const [todayPreds, setTodayPreds] = useState([])
  const [todaySummary, setTodaySummary] = useState(null)
  const [live, setLive] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // History state
  const [date, setDate] = useState(toISODate())
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [pattern, setPattern] = useState('ALL') // ALL | NORMAL | ABNORMAL | PENDING | FLAGGED
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [histReadings, setHistReadings] = useState([])
  const [histSummary, setHistSummary] = useState(null)
  const [histLoading, setHistLoading] = useState(false)
  const LIMIT = 20

  useEffect(() => {
    const id = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 400)
    return () => clearTimeout(id)
  }, [search])

  const loadToday = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const [r, p, s] = await Promise.all([
        thermalApi.readings({ date: toISODate(), limit: 50 }),
        thermalApi.predictions({ date: toISODate(), limit: 15 }),
        thermalApi.summary({ date: toISODate() }),
      ])
      setTodayReadings(r.data ?? r ?? [])
      setTodayPreds(p.data ?? p ?? [])
      setTodaySummary(s)
      setError('')
    } catch (err) { setError(err.message) }
    finally { setRefreshing(false) }
  }, [])

  useEffect(() => {
    loadToday()
    if (!live) return undefined
    const id = setInterval(() => loadToday(true), 30000)
    return () => clearInterval(id)
  }, [loadToday, live])

  const loadHistory = useCallback(async () => {
    setHistLoading(true)
    try {
      const params = { date, limit: LIMIT, page }
      if (debouncedSearch) params.search = debouncedSearch
      if (pattern === 'NORMAL' || pattern === 'ABNORMAL') params.prediction = pattern
      if (pattern === 'FLAGGED') params.anomalyOnly = 'true'
      const [r, s] = await Promise.all([
        thermalApi.readings(params),
        thermalApi.summary({ date }),
      ])
      let rows = r.data ?? []
      if (pattern === 'PENDING') rows = rows.filter(x => !x.prediction)
      setHistReadings(rows)
      setMeta(r.meta ?? { total: rows.length, totalPages: 1 })
      setHistSummary(s)
      setError('')
    } catch (err) { setError(err.message) }
    finally { setHistLoading(false) }
  }, [date, page, debouncedSearch, pattern])

  useEffect(() => { if (tab === 'history') loadHistory() }, [tab, loadHistory])

  const summary = tab === 'today' ? todaySummary : histSummary
  const abnormalToday = useMemo(() => todayPreds.filter(p => p.label === 'ABNORMAL').length, [todayPreds])

  const pager = (
    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
      <span>{meta.total ?? 0} records · page {page} / {meta.totalPages ?? 1}</span>
      <div className="flex gap-2">
        <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40 cursor-pointer"><ChevronLeft size={14} /> Prev</button>
        <button disabled={page >= (meta.totalPages ?? 1)} onClick={() => setPage(p => p + 1)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40 cursor-pointer">Next <ChevronRight size={14} /></button>
      </div>
    </div>
  )

  const readingTable = (rows, emptyMsg) => (
    !rows.length
      ? <p className="py-10 text-center text-sm text-gray-500">{emptyMsg}</p>
      : (
        <div className="overflow-x-auto">
          <table className="r-table w-full text-sm">
            <thead><tr className="text-left text-[11px] text-gray-500 uppercase border-b border-gray-100"><th className="py-2.5 pr-4">{t('health.colAnimal')}</th><th className="py-2.5 pr-4">{t('health.colTemp')}</th><th className="py-2.5 pr-4">{t('health.colActivity')}</th><th className="py-2.5 pr-4">{t('health.colPattern')}</th><th className="py-2.5 pr-4">{t('health.colRisk')}</th><th className="py-2.5">{t('health.colWhen')}</th></tr></thead>
            <tbody>
              {rows.map((reading, i) => {
                const driver = driverForReading(reading, [])
                return (
                  <tr key={reading.id ?? i} className="border-b border-gray-50">
                    <td data-label={t('health.colAnimal')} className="py-3 pr-4 font-semibold">{reading.cattle?.tagNumber} {reading.cattle?.name || ''}</td>
                    <td data-label={t('health.colTemp')} className="py-3 pr-4 font-bold"><Thermometer size={15} className="inline mr-1" />{formatTemp(reading.temperatureC, units)}</td>
                    <td data-label={t('health.colActivity')} className="py-3 pr-4">{reading.activityLevel ?? '—'}</td>
                    <td data-label={t('health.colPattern')} className="py-3 pr-4">{reading.prediction === 'ABNORMAL' ? <span className="text-red-600 font-bold">{t('status.ABNORMAL')}{reading.anomalyScore != null ? ` (${reading.anomalyScore})` : ''}</span> : reading.prediction === 'NORMAL' ? <span className="text-green-600">{t('status.NORMAL')}</span> : <span className="text-gray-400">{t('health.pendingMl')}</span>}
                      {driver && <span className="block text-[10px] font-normal text-gray-500">{driver}</span>}
                    </td>
                    <td data-label={t('health.colRisk')} className="py-3 pr-4">{reading.anomaly ? <span className="text-red-600"><AlertTriangle size={13} className="inline mr-1" />{reading.riskLevel}</span> : <span className="text-green-600"><CheckCircle2 size={13} className="inline mr-1" />LOW</span>}</td>
                    <td data-label={t('health.colWhen')} className="py-3 text-gray-500">{new Date(reading.capturedAt).toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
  )

  return (
    <DashboardLayout title={t('health.title')}>
      <div className="space-y-5">
        <p className="text-xs text-gray-500">{t('health.subtitle')}</p>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        {/* Today / History switch */}
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 text-sm font-semibold">
          <button onClick={() => setTab('today')} className={`px-4 py-2 rounded-lg cursor-pointer ${tab === 'today' ? 'bg-green-700 text-white' : 'text-gray-600'}`}>
            <Radio size={14} className="inline mr-1.5" />Today · live
          </button>
          <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-lg cursor-pointer ${tab === 'history' ? 'bg-green-700 text-white' : 'text-gray-600'}`}>
            <CalendarDays size={14} className="inline mr-1.5" />History
          </button>
        </div>

        {/* Summary cards — always reflect the active day */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: tab === 'today' ? "Today's readings" : `Readings · ${date}`, value: summary?.readings ?? '—' },
            { label: t('health.avgTemp'), value: formatTemp(summary?.avgTemperatureC, units) },
            { label: t('health.thresholdAnom'), value: summary?.anomalies ?? '—' },
            { label: t('health.mlAbnormal'), value: tab === 'today' ? (summary?.abnormalPatternsML ?? abnormalToday) : (summary?.abnormalPatternsML ?? '—') },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-2xl font-black text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {tab === 'today' && (
          <>
            <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 p-4">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <Radio size={20} className="text-green-600" />
              </div>
              <p className="text-xs text-gray-600 flex-1 min-w-[200px]">{t('health.autoNote')}</p>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={live} onChange={e => setLive(e.target.checked)} className="accent-green-700" /> auto-refresh 30s
              </label>
              <button onClick={() => loadToday()} disabled={refreshing} className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-3 py-2 rounded-lg hover:bg-green-100 disabled:opacity-50 cursor-pointer">
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><BrainCircuit size={16} className="text-purple-600" /> {t('health.latestPred')} · today</h2>
              {!todayPreds.length && <p className="py-6 text-center text-sm text-gray-500">{t('health.noPred')}</p>}
              {!!todayPreds.length && (
                <div className="overflow-x-auto">
                  <table className="r-table w-full text-sm">
                    <thead><tr className="text-left text-[11px] text-gray-500 uppercase border-b border-gray-100"><th className="py-2.5 pr-4">{t('health.colAnimal')}</th><th className="py-2.5 pr-4">{t('health.colPattern')}</th><th className="py-2.5 pr-4">{t('health.colScore')}</th><th className="py-2.5">{t('health.colModel')}</th></tr></thead>
                    <tbody>
                      {todayPreds.slice(0, 15).map(p => (
                        <tr key={p.id} className="border-b border-gray-50">
                          <td data-label={t('health.colAnimal')} className="py-2.5 pr-4 font-semibold">{p.cattle?.tagNumber}</td>
                          <td data-label={t('health.colPattern')} className="py-2.5 pr-4">{p.label === 'ABNORMAL' ? <span className="text-red-600 font-bold">{t('health.checkAnimal')}</span> : <span className="text-green-600">{t('status.NORMAL')}</span>}
                            {p.reason && <span className="block text-[10px] font-normal text-gray-500">{p.reason}</span>}
                          </td>
                          <td data-label={t('health.colScore')} className="py-2.5 pr-4">{p.anomalyScore ?? '—'}</td>
                          <td data-label={t('health.colModel')} className="py-2.5 text-gray-500 text-xs">{p.modelVersion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Activity size={16} className="text-green-600" /> {t('health.sensorTitle')} · today</h2>
                <span className="text-xs text-gray-500">{todayReadings.length} readings</span>
              </div>
              {readingTable(todayReadings, t('health.noReadings'))}
            </div>
          </>
        )}

        {tab === 'history' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2"><CalendarDays size={16} className="text-green-700" /> Day archive</h2>
            <p className="text-[11px] text-gray-500 mb-4">Each day is frozen at midnight — pick a date to revisit exactly what the system saw. The live stream continues untouched.</p>
            <div className="flex flex-wrap gap-2.5 mb-4">
              <input type="date" value={date} max={toISODate()} onChange={e => { setDate(e.target.value); setPage(1) }} className="text-sm rounded-lg border border-gray-200 bg-gray-50 px-3 py-2" />
              <div className="relative flex-1 min-w-[160px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by tag e.g. KAB-001…" className="w-full text-sm rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2" />
              </div>
              <select value={pattern} onChange={e => { setPattern(e.target.value); setPage(1) }} className="text-sm rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 cursor-pointer">
                <option value="ALL">All patterns</option>
                <option value="ABNORMAL">ABNORMAL only</option>
                <option value="NORMAL">NORMAL only</option>
                <option value="FLAGGED">Flagged (threshold/ML)</option>
                <option value="PENDING">Pending ML</option>
              </select>
              <button onClick={loadHistory} disabled={histLoading} className="text-xs font-semibold text-white bg-green-700 px-4 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50 cursor-pointer">
                {histLoading ? 'Loading…' : 'Apply'}
              </button>
            </div>
            {readingTable(histReadings, `No readings stored for ${date}.`)}
            {pager}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
