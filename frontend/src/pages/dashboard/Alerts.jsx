import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from './DashboardLayout'
import { motion } from 'framer-motion'
import { Bell, AlertTriangle, CheckCheck } from 'lucide-react'
import { alertApi } from '../../api/client'
import { translateAlertTitle } from '../../utils/explain'

// MODULE 5 — Early Warning & Alerts (health patterns only).
// Acknowledge = "checked the animal", not a diagnosis or treatment record.
// Titles ship from the backend in English and are mapped to the UI language here.
export default function Alerts() {
  const { t } = useTranslation()
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    alertApi.list({ limit: 100, type: 'HEALTH' }).then(result => setAlerts(result.data)).catch(err => setError(err.message))
  }, [])

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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <Bell size={22} className="text-red-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{t('alerts.heading')}</h2>
            <p className="text-xs text-gray-500">{urgent} · {t('alerts.sub')}</p>
          </div>
        </div>
        <button onClick={() => alertApi.markAllRead().then(() => setAlerts(current => current.map(alert => ({ ...alert, isRead: true })))).catch(err => setError(err.message))} className="inline-flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 px-4 py-2.5 rounded-lg hover:bg-green-100 transition-all cursor-pointer">
          <CheckCheck size={14} /> {t('common.acknowledgeAll')}
        </button>
      </div>

      <div className="space-y-3">
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        {!alerts.length && !error && <p className="py-12 text-center text-sm text-gray-500">{t('alerts.empty')}</p>}
        {alerts.map((a, i) => {
          const isRead = a.isRead
          return (
            <motion.div
              key={a.id ?? i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.25) }}
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
    </DashboardLayout>
  )
}
