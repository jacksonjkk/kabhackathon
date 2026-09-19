import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from './DashboardLayout'
import { User, Building2, Languages, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { farmApi } from '../../api/client'
import LanguageSwitcher from '../../components/LanguageSwitcher'

export default function Settings() {
  const { t } = useTranslation()
  const { user, updateProfile } = useAuth()
  const [farm, setFarm] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [units, setUnits] = useState('metric')
  const [features, setFeatures] = useState({ alerts: true, trends: true, monitoring: true, notes: true })
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setName(user?.name || '')
    setPhone(user?.phone || '')
    setUnits(user?.units || 'metric')
    setFeatures({
      alerts: user?.alertsEnabled ?? true,
      trends: user?.trendsEnabled ?? true,
      monitoring: user?.monitoringEnabled ?? true,
      notes: user?.notesEnabled ?? true,
    })
    farmApi.mine().then(setFarm).catch(err => setError(err.message))
  }, [user])

  const save = async event => {
    event.preventDefault()
    setError('')
    setSaved(false)
    try {
      await updateProfile({ name, phone: phone || null })
      setSaved(true)
    } catch (err) {
      setError(err.message)
    }
  }

  const savePrefs = async () => {
    setError('')
    setSaved(false)
    try {
      await updateProfile({
        units,
        alertsEnabled: features.alerts,
        trendsEnabled: features.trends,
        monitoringEnabled: features.monitoring,
        notesEnabled: features.notes,
      })
      setSaved(true)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <DashboardLayout title={t('settings.title')}>
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <form onSubmit={save} className="min-w-0 bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-5">
            <User size={22} className="text-green-600" />
            <h2 className="text-sm font-bold text-gray-900">{t('settings.profile')}</h2>
          </div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">{t('settings.name')}</label>
          <input value={name} onChange={event => setName(event.target.value)} className="w-full mb-4 px-3 py-2.5 rounded-lg border border-gray-200 text-sm" required />
          <label className="block text-xs font-semibold text-gray-700 mb-1">{t('settings.email')}</label>
          <input value={user?.email || ''} readOnly className="w-full mb-4 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm" />
          <label className="block text-xs font-semibold text-gray-700 mb-1">{t('settings.phone')}</label>
          <input value={phone} onChange={event => setPhone(event.target.value)} className="w-full mb-5 px-3 py-2.5 rounded-lg border border-gray-200 text-sm" />
          <button className="px-4 py-2.5 rounded-lg bg-green-700 text-white text-sm font-semibold cursor-pointer">{t('settings.saveProfile')}</button>
          {saved && <p className="mt-3 text-xs text-green-600">{t('settings.saved')}</p>}
          {error && <p className="mt-3 text-xs text-red-600" role="alert">{error}</p>}
        </form>

        <div className="min-w-0 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-5">
              <Building2 size={22} className="text-green-600" />
              <h2 className="text-sm font-bold text-gray-900">{t('settings.farm')}</h2>
            </div>
            {farm ? (
              <div className="space-y-3 text-sm">
                <div><p className="text-xs text-gray-500">{t('settings.farmName')}</p><p className="font-semibold">{farm.name}</p></div>
                <div><p className="text-xs text-gray-500">{t('settings.location')}</p><p className="font-semibold">{farm.location || t('settings.notRecorded')}</p></div>
                <div><p className="text-xs text-gray-500">{t('settings.cattle')}</p><p className="font-semibold">{farm._count?.cattle ?? 0}</p></div>
              </div>
            ) : !error ? (
              <p className="text-sm text-gray-500">{t('settings.loadingFarm')}</p>
            ) : null}
            {error && <p className="mt-3 text-xs text-red-600" role="alert">{error}</p>}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <Languages size={22} className="text-green-600" />
              <h2 className="text-sm font-bold text-gray-900">{t('settings.language')}</h2>
            </div>
            <LanguageSwitcher variant="settings" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <SlidersHorizontal size={22} className="text-green-600" />
              <h2 className="text-sm font-bold text-gray-900">Display & Features</h2>
            </div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Units</label>
            <select value={units} onChange={e => setUnits(e.target.value)} className="w-full mb-4 px-3 py-2.5 rounded-lg border border-gray-200 text-sm">
              <option value="metric">Metric (°C, kg)</option>
              <option value="imperial">Imperial (°F, lbs)</option>
            </select>
            {[
              { id: 'alerts', label: 'Early-Warning Alerts' },
              { id: 'trends', label: 'Health Trend History' },
              { id: 'monitoring', label: 'Continuous Monitoring' },
              { id: 'notes', label: 'Observation Notes' },
            ].map(f => (
              <button key={f.id} type="button" onClick={() => setFeatures(p => ({ ...p, [f.id]: !p[f.id] }))} className="flex items-center justify-between w-full py-2 text-sm">
                <span className="text-gray-700">{f.label}</span>
                <span className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${features[f.id] ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${features[f.id] ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`} />
                </span>
              </button>
            ))}
            <button onClick={savePrefs} className="mt-3 px-4 py-2.5 rounded-lg bg-green-700 text-white text-sm font-semibold cursor-pointer">Save Preferences</button>
            {saved && <p className="mt-3 text-xs text-green-600">{t('settings.saved')}</p>}
            {error && <p className="mt-3 text-xs text-red-600" role="alert">{error}</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
