import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Heart, AlertTriangle, PawPrint, X } from 'lucide-react'
import { cattleApi } from '../../api/client'
import { formatTemp, useUnits } from '../../utils/units'

// MODULE 1 + 6 — Animal registration (minimal) + herd-level monitoring.
// Pregnancy / vaccination columns removed (future enhancements, not core).
const emptyForm = { tagNumber: '', name: '', breed: '', gender: 'FEMALE', birthDate: '', weightKg: '' }

export default function Herd() {
  const { t } = useTranslation()
  const units = useUnits()
  const [herd, setHerd] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = () => {
    cattleApi.list({ limit: 100 }).then(result => setHerd(result.data)).catch(err => setError(err.message))
  }
  useEffect(load, [])

  const openForm = () => {
    setForm(emptyForm)
    setFormError('')
    setNotice('')
    setShowForm(true)
  }

  const submit = async e => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await cattleApi.create({
        tagNumber: form.tagNumber.trim(),
        name: form.name.trim() || null,
        breed: form.breed.trim() || null,
        gender: form.gender,
        birthDate: form.birthDate || null,
        weightKg: form.weightKg === '' ? null : Number(form.weightKg),
      })
      setShowForm(false)
      setNotice(`${form.tagNumber.trim()} ${t('herd.saved')}`)
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const counts = {
    healthy: herd.filter(cow => cow.healthStatus === 'HEALTHY').length,
    needsCheck: herd.filter(cow => ['SICK', 'UNDER_TREATMENT', 'QUARANTINED'].includes(cow.healthStatus)).length,
  }
  const summary = [
    { icon: Heart, label: t('herd.normal'), value: counts.healthy, color: 'text-green-600', bg: 'bg-green-50' },
    { icon: AlertTriangle, label: t('herd.needsCheck'), value: counts.needsCheck, color: 'text-red-500', bg: 'bg-red-50' },
  ]
  const visibleHerd = herd.filter(cow => `${cow.tagNumber} ${cow.name || ''} ${cow.breed || ''}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <DashboardLayout title={t('herd.title')}>
      <p className="text-xs text-gray-500 mb-4">{t('herd.subtitle')}</p>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {summary.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon size={20} className={s.color} />
                </div>
              </div>
              <div className="text-2xl font-black text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </motion.div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {error && <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>}
        {notice && <p className="mb-4 text-sm text-green-700" role="status">{notice}</p>}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
          <h3 className="text-sm font-bold text-gray-900">{t('herd.listTitle')}</h3>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 min-w-0 w-full sm:w-auto sm:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('herd.search')} className="pl-9 pr-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm w-full sm:w-52 focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/15 transition-all" />
            </div>
            <button onClick={openForm} className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-green-700 px-4 py-2.5 rounded-lg hover:bg-green-800 transition-all cursor-pointer">
              <Plus size={14} /> {t('herd.register')}
            </button>
          </div>
        </div>

        {!visibleHerd.length && !error && <p className="py-12 text-center text-sm text-gray-500">{t('herd.empty')}</p>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleHerd.map((c, i) => {
            const latest = c.latestReading
            const pred = c.latestPrediction
            return (
              <Link key={c.id} to={`/dashboard/cow/${c.id}`}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.24) }}
                  className="rounded-xl border border-gray-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                      <PawPrint size={22} className="text-green-600" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${c.healthStatus === 'HEALTHY' ? 'text-green-700 bg-green-50' : 'text-orange-700 bg-orange-50'}`}>{t('status.' + (pred?.label === 'ABNORMAL' ? 'ABNORMAL' : c.healthStatus), { defaultValue: c.healthStatus })}</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">{c.name || c.tagNumber}</div>
                  <div className="text-[11px] text-gray-500">{c.tagNumber} • {c.breed || t('settings.notRecorded')}</div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 text-center">
                    <div>
                      <div className="text-[10px] text-gray-400">{t('herd.lastTemp')}</div>
                      <div className="text-xs font-bold text-gray-800">{latest ? formatTemp(latest.temperatureC, units) : '—'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400">{t('herd.mlPattern')}</div>
                      <div className="text-xs font-bold text-gray-800">{pred ? t('status.'+pred.label, { defaultValue: pred.label }) : t('herd.pending')}</div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.form
              initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }}
              onClick={e => e.stopPropagation()} onSubmit={submit}
              className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">{t('herd.modalTitle')}</h2>
                <button type="button" onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-700 cursor-pointer"><X size={18} /></button>
              </div>
              <p className="text-xs text-gray-500">{t('herd.modalSub')}</p>
              {formError && <p className="text-sm text-red-600" role="alert">{formError}</p>}
              <input required value={form.tagNumber} onChange={e => setForm({ ...form, tagNumber: e.target.value })} placeholder={t('herd.tag')} className="w-full rounded-lg border border-gray-200 bg-gray-50 text-sm px-3 py-2.5" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('herd.name')} className="w-full rounded-lg border border-gray-200 bg-gray-50 text-sm px-3 py-2.5" />
                <input value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} placeholder={t('herd.breed')} className="w-full rounded-lg border border-gray-200 bg-gray-50 text-sm px-3 py-2.5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-gray-50 text-sm px-3 py-2.5">
                  <option value="FEMALE">{t('herd.female')}</option>
                  <option value="MALE">{t('herd.male')}</option>
                </select>
                <input type="number" step="0.1" min="0" value={form.weightKg} onChange={e => setForm({ ...form, weightKg: e.target.value })} placeholder={t('herd.weight')} className="w-full rounded-lg border border-gray-200 bg-gray-50 text-sm px-3 py-2.5" />
              </div>
              <input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-gray-50 text-sm px-3 py-2.5" />
              <button disabled={saving} className="w-full text-xs font-semibold text-white bg-green-700 px-4 py-3 rounded-lg hover:bg-green-800 disabled:opacity-60 cursor-pointer">
                {saving ? t('herd.submitting') : t('herd.submit')}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
