import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from './DashboardLayout'
import { motion } from 'framer-motion'
import { Bell, AlertTriangle, CheckCheck, CalendarDays, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { alertApi } from '../../api/client'
import { translateAlertTitle } from '../../utils/explain'

// Early Warnings — Today (needs checking now) vs History (archive by day).
const toISODate = (d = new Date()) => d.toISOString().slice(0, 10)

export default function Alerts() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('today') // today | history
  const [alerts, setAlerts] = useState([])
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState(toISODate())
  const [severity, setSeverity] = useState('ALL')
  const [status, setStatus] = useState('ALL') // ALL | UNREAD | READ
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: LIMIT, page, type: 'HEALTH' }
      if (tab === 'today') params.date = toISODate()
      else if (date) params.date = date
      if (severity !== 'ALL') params.severity = severity
      if (status === 'UNREAD') params.isRead = 'false'
      if (status === 'READ') params.isRead = 'true'
      const result = await alertApi.list(params)
      setAlerts(result.data ?? [])
      setMeta(result.meta ?? { total: (result.data ?? []).length, totalPages: 1 })
      setError('')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [tab, date, severity, status, page])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return alerts
    return alerts.filter(a =>
      (a.title ?? '').toLowerCase().includes(q) ||
      (a.message ?? '').toLowerCase().includes(q) ||
      (a.cattle?.tagNumber ?? '').toLowerCase().includes(q),
    )
  }, [alerts, search])

  const markRead = async id => {
    try {
      await alertApi.markRead(id)
      setAlerts(current => current.map(alert => alert.id === id ? { ...alert, isRead: true } : alert))
    } catch (err) {
      setError(err.message)
    }
  }

  const urgent = alerts.filter(a => !a.isRead && ['HIGH', 'CRITICAL'].includes(a.severity)).length

  return (
    <DashboardLayout title={t('alerts.title')}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <Bell size={22} className="text-red-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{t('alerts.heading')}</h2>
            <p className="text-xs text-gray-500">{urgent} · {t('alerts.sub')}</p>
          </div>
        </div>
        <button onClick={() => alertApi.markAllRead().then(() => setAlerts(current => current.map(alert => ({ ...alert, isRead: true })))).catch(err => setError(err.message))} className="inline-flex items-center justify-center gap-2 w-full sm:w-auto text-xs font-semibold text-green-700 bg-green-50 px-4 py-2.5 rounded-lg hover:bg-green-100 transition-all cursor-pointer">
          <CheckCheck size={14} /> {t('common.acknowledgeAll')}
        </button>
      </div>

      <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 text-sm font-semibold mb-4">
        <button onClick={() => { setTab('today'); setPage(1) }} className={`px-4 py-2 rounded-lg cursor-pointer ${tab === 'today' ? 'bg-red-600 text-white' : 'text-gray-600'}`}>
          Today · needs check
        </button>
        <button onClick={() => { setTab('history'); setPage(1) }} className={`px-4 py-2 rounded-lg cursor-pointer ${tab === 'history' ? 'bg-red-600 text-white' : 'text-gray-600'}`}>
          <CalendarDays size={14} className="inline mr-1.5" />History
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-4">
        {tab === 'history' && (
          <input type="date" value={date} max={toISODate()} onChange={e => { setDate(e.target.value); setPage(1) }} className="text-sm rounded-lg border border-gray-200 bg-white px-3 py-2" />
        )}
        <select value={severity} onChange={e => { setSeverity(e.target.value); setPage(1) }} className="text-sm rounded-lg border border-gray-200 bg-white px-3 py-2 cursor-pointer">
          <option value="ALL">All severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="text-sm rounded-lg border border-gray-200 bg-white px-3 py-2 cursor-pointer">
          <option value="ALL">Unread + checked</option>
          <option value="UNREAD">Needs check only</option>
          <option value="READ">Checked only</option>
        </select>
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tag or message…" className="w-full text-sm rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2" />
        </div>
      </div>

      <div className="space-y-3">
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        {loading && <p className="py-6 text-center text-sm text-gray-400">Loading…</p>}
        {!loading && !filtered.length && !error && <p className="py-12 text-center text-sm text-gray-500">{tab === 'today' ? 'Nothing needs checking today. Good work!' : `No warnings stored for ${date}.`}</p>}
        {filtered.map((a, i) => {
          const isRead = a.isRead
          return (
            <motion.div
              key={a.id ?? i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.2) }}
              onClick={() => markRead(a.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border bg-white transition-all hover:shadow-md cursor-pointer min-w-0 ${
                ['HIGH', 'CRITICAL'].includes(a.severity) && !isRead ? 'border-orange-200 bg-orange-50/40' : 'border-gray-200'
              } ${isRead ? 'opacity-60' : ''}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  ['HIGH', 'CRITICAL'].includes(a.severity) ? 'bg-orange-100 text-orange-500' : 'bg-blue-100 text-blue-500'
              }`}>
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                  <h3 className="text-sm font-bold text-gray-900 min-w-0 break-words">{translateAlertTitle(a.title, t)}</h3>
                  <span className="text-[11px] text-gray-400 flex-shrink-0 ml-auto">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed break-words">{a.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {t(`severity.${a.severity}`, { defaultValue: a.severity })} · {a.isRead ? t('alerts.checked') : t('alerts.needCheck')}
                </p>
              </div>
              {['HIGH', 'CRITICAL'].includes(a.severity) && !isRead && (
                <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded-full flex-shrink-0">!</span>
              )}
            </motion.div>
          )
        })}
      </div>

      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
        <span>{meta.total ?? 0} warnings · page {page} / {meta.totalPages ?? 1}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40 cursor-pointer"><ChevronLeft size={14} /> Prev</button>
          <button disabled={page >= (meta.totalPages ?? 1)} onClick={() => setPage(p => p + 1)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40 cursor-pointer">Next <ChevronRight size={14} /></button>
        </div>
      </div>
    </DashboardLayout>
  )
}
