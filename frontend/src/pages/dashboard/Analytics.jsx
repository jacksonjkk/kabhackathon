import { useEffect, useState } from 'react'
import DashboardLayout from './DashboardLayout'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Users, Activity } from 'lucide-react'
import { analyticsApi } from '../../api/client'
import { formatTemp, toDisplayTemp, tempUnitLabel, useUnits } from '../../utils/units'

export default function Analytics() {
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState('')
  const units = useUnits()
  useEffect(() => { analyticsApi.overview().then(setOverview).catch(err => setError(err.message)) }, [])
  const summary = overview?.summary
  const healthData = (overview?.temperatureTrend || []).map(item => ({ month: item.date, healthy: toDisplayTemp(item.avgTemperatureC || 0, units), atRisk: 0 }))
  const kpis = [
    { icon: TrendingUp, label: 'Total Cattle', value: summary?.cattleTotal ?? '—', sub: 'Current herd', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Activity, label: 'Average Temperature', value: summary?.avgTemperatureC ? formatTemp(summary.avgTemperatureC, units) : '—', sub: 'Last 7 days', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: TrendingDown, label: 'Temperature Anomalies', value: summary?.temperatureAnomalies7d ?? '—', sub: 'Last 7 days', color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: Users, label: 'Unread Alerts', value: summary?.unreadAlerts ?? '—', sub: 'Needs attention', color: 'text-blue-500', bg: 'bg-blue-50' },
  ]
  return (
    <DashboardLayout title="Analytics">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k, i) => {
          const Icon = k.icon
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <Icon size={20} className={k.color} />
                </div>
              </div>
              <div className="text-2xl font-black text-gray-900">{k.value}</div>
              <div className="text-xs text-gray-500">{k.label}</div>
              <div className={`text-[11px] font-semibold mt-0.5 ${k.color}`}>{k.sub}</div>
            </motion.div>
          )
        })}
      </div>
      {error && <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>}

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Herd Health Trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            {healthData.length ? <AreaChart data={healthData}>
              <defs>
                <linearGradient id="healthy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="risk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F57C00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F57C00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
              <Area type="monotone" dataKey="healthy" name="Healthy" stroke="#4CAF50" strokeWidth={2} fill="url(#healthy)" />
              <Area type="monotone" dataKey="atRisk" name="At Risk" stroke="#F57C00" strokeWidth={2} fill="url(#risk)" />
            </AreaChart> : <p className="py-28 text-center text-xs text-gray-500">No temperature history recorded yet.</p>}
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Production Performance</h2>
          <ResponsiveContainer width="100%" height={280}>
            <p className="py-28 text-center text-xs text-gray-500">Production metrics are not configured for this farm.</p>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
