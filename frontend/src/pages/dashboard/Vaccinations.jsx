import { useEffect, useState } from 'react'
import DashboardLayout from './DashboardLayout'
import { motion } from 'framer-motion'
import { Syringe, CheckCircle2, Clock, Plus } from 'lucide-react'
import { vaccinationApi } from '../../api/client'

export default function Vaccinations() {
  const [vaccines, setVaccines] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { vaccinationApi.list({ limit: 100 }).then(result => setVaccines(result.data)).catch(err => setError(err.message)) }, [])
  const upcoming = vaccines.filter(v => v.status === 'SCHEDULED').slice(0, 5)
  return (
    <DashboardLayout title="Vaccinations">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
            <Syringe size={22} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Vaccination Programs</h2>
            <p className="text-xs text-gray-500">Track and manage herd vaccinations</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-green-700 px-4 py-2.5 rounded-lg hover:bg-green-800 transition-all cursor-pointer">
          <Plus size={14} /> Log Vaccination
        </button>
      </div>
      {error && <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Program Status</h3>
          <div className="overflow-x-auto">
            <table className="r-table w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-2.5 pr-4">Vaccine</th>
                  <th className="py-2.5 pr-4">Dose</th>
                  <th className="py-2.5 pr-4">Schedule</th>
                  <th className="py-2.5 pr-4">Next Due</th>
                  <th className="py-2.5 pr-4">Coverage</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {vaccines.map(v => (
                  <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(0.05 * vaccines.indexOf(v), 0.25) }}
                    className="border-b border-gray-50 hover:bg-green-50/20 transition-colors">
                    <td data-label="Vaccine" className="py-3 pr-4 font-medium text-gray-900">{v.vaccineName}</td>
                    <td data-label="Dose" className="py-3 pr-4 text-gray-600">{new Date(v.doseDate).toLocaleDateString()}</td>
                    <td data-label="Schedule" className="py-3 pr-4 text-gray-500">{v.cattle?.tagNumber || '—'}</td>
                    <td data-label="Next Due" className="py-3 pr-4 text-gray-500">{v.nextDueDate ? new Date(v.nextDueDate).toLocaleDateString() : '—'}</td>
                    <td data-label="Coverage" className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-green-500" style={{ width: v.status === 'COMPLETED' ? '100%' : '0%' }} />
                        </div>
                        <span className="text-xs font-bold text-gray-800">{v.status === 'COMPLETED' ? '100%' : '—'}</span>
                      </div>
                    </td>
                    <td data-label="Status" className="py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${
                        v.status === 'COMPLETED' ? 'text-green-700 bg-green-50' : v.status === 'SCHEDULED' ? 'text-orange-600 bg-orange-50' : 'text-red-600 bg-red-50'
                      }`}>
                        {v.status === 'COMPLETED' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {v.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Upcoming</h3>
          <div className="space-y-3">
            {upcoming.map((u, i) => (
              <div key={i} className="p-3.5 rounded-xl border border-gray-100 hover:border-green-200 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-800">{u.vaccineName}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">{u.nextDueDate ? new Date(u.nextDueDate).toLocaleDateString() : 'No date'}</span>
                </div>
                <div className="text-[11px] text-gray-500">{u.cattle?.tagNumber || 'Cattle not recorded'}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 rounded-xl bg-green-50 border border-green-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-green-800">Herd Coverage</span>
              <span className="text-lg font-black text-green-700">{vaccines.length ? `${Math.round(vaccines.filter(v => v.status === 'COMPLETED').length / vaccines.length * 100)}%` : '0%'}</span>
            </div>
            <div className="h-2 rounded-full bg-green-100">
              <div className="h-full rounded-full bg-green-600" style={{ width: `${vaccines.length ? vaccines.filter(v => v.status === 'COMPLETED').length / vaccines.length * 100 : 0}%` }} />
            </div>
            <p className="text-[11px] text-green-700/70 mt-2">Overall vaccination coverage across all programs</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
