import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Activity, Heart, AlertTriangle, Thermometer, Bell, Users } from 'lucide-react'
import DashboardLayout from './DashboardLayout'
import { analyticsApi } from '../../api/client'
import { formatTemp, useUnits } from '../../utils/units'

// Revised core: dashboard answers "which animals need checking now?"
// No MuzzleID / GestaCheck / Vaccination actions (parked as future work).

export default function Dashboard() {
  const { t } = useTranslation()
  const units = useUnits()
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState('')

  const quickActions = [
    { icon: Thermometer, label: t('dashboard.qaMonitor'), to: '/dashboard/thermaguard', color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: Bell, label: t('dashboard.qaWarnings'), to: '/dashboard/alerts', color: 'text-red-500', bg: 'bg-red-50' },
    { icon: Users, label: t('dashboard.qaHerd'), to: '/dashboard/herd', color: 'text-green-600', bg: 'bg-green-50' },
  ]

  useEffect(() => {
    analyticsApi.overview().then(setOverview).catch(err => setError(err.message))
  }, [])

  const summary = overview?.summary
  const total = summary?.cattleTotal || 0
  const percentage = value => total ? `${((value / total) * 100).toFixed(1)}%` : '0%'
  const stats = [
    { icon: Activity, label: t('dashboard.total'), value: summary?.cattleTotal ?? '—', change: t('dashboard.totalSub'), color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Heart, label: t('dashboard.normal'), value: summary?.healthy ?? '—', change: percentage(summary?.healthy || 0), color: 'text-green-600', bg: 'bg-green-50' },
    { icon: AlertTriangle, label: t('dashboard.needsCheck'), value: summary?.atRisk ?? '—', change: percentage(summary?.atRisk || 0), color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: Bell, label: t('dashboard.unread'), value: summary?.unreadAlerts ?? '—', change: t('dashboard.unreadSub'), color: 'text-red-500', bg: 'bg-red-50' },
  ]
  const recentAlerts = (overview?.recentAlerts || []).map(alert => ({
    type: alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? 'warning' : 'info',
    msg: `${alert.cattle?.tagNumber ? `#${alert.cattle.tagNumber}: ` : ''}${alert.message}`,
    time: new Date(alert.createdAt).toLocaleString(),
  }))

  return (
    <DashboardLayout title={t('dashboard.title')}>
      <div className="space-y-6">
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <p className="text-xs text-gray-500 -mt-2">{t('dashboard.subtitle')}</p>
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="min-w-0 bg-white rounded-xl border border-gray-200 p-4 lg:p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <Icon size={20} className={s.color} />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className={`text-[11px] font-semibold mt-0.5 ${s.color}`}>{s.change}</div>
              </motion.div>
            )
          })}
        </div>

        {/* Two column */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 min-w-0 bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-sm font-bold text-gray-900 min-w-0">{t('dashboard.recent')}</h2>
              <Link to="/dashboard/alerts" className="text-xs font-semibold text-green-600 hover:text-green-700 flex-shrink-0">{t('common.viewAll')}</Link>
            </div>
            <div className="space-y-2">
              {recentAlerts.length === 0 && <p className="text-xs text-gray-500">{t('dashboard.emptyAlerts')}</p>}
              {recentAlerts.map((a, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border min-w-0 ${
                  a.type === 'warning' ? 'border-orange-100 bg-orange-50/50' :
                  a.type === 'info' ? 'border-blue-100 bg-blue-50/50' : 'border-green-100 bg-green-50/50'
                }`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    a.type === 'warning' ? 'bg-orange-500' : a.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 line-clamp-2">{a.msg}</p>
                    <p className="text-[10px] text-gray-400">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">{t('dashboard.overview')}</h2>
            <div className="space-y-4">
              {[
                { label: t('dashboard.normalRow'), count: summary?.healthy || 0, color: 'bg-green-500' },
                { label: t('dashboard.checkRow'), count: summary?.atRisk || 0, color: 'bg-orange-500' },
              ].map((h, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{h.label}</span>
                    <span className="font-bold text-gray-900">{total ? `${((h.count / total) * 100).toFixed(1)}%` : '—'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${h.color}`} style={{ width: `${total ? (h.count / total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{t('dashboard.avgTemp')}</span>
                <span className="text-lg font-black text-gray-900">{formatTemp(summary?.avgTemperatureC, units)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{t('dashboard.mlWeek')}</span>
                <span className="text-lg font-black text-gray-900">{summary?.abnormalPatternsML7d ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{t('dashboard.unreadRow')}</span>
                <span className="text-lg font-black text-gray-900">{summary?.unreadAlerts ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bell size={16} className="text-green-600" /> {t('dashboard.quick')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            {quickActions.map((a, i) => {
              const Icon = a.icon
              return (
                <Link
                  key={i}
                  to={a.to}
                  className={`min-w-0 flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl border border-gray-100 ${a.bg} hover:shadow-md transition-all text-left`}
                >
                  <Icon size={20} className={`${a.color} flex-shrink-0`} />
                  <span className="text-xs font-semibold text-gray-800 leading-snug">{a.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
