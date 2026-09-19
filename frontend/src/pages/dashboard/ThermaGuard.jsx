import { useEffect, useState } from 'react'
import DashboardLayout from './DashboardLayout'
import { Thermometer, AlertTriangle, CheckCircle2, Activity, BrainCircuit, Radio } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { thermalApi } from '../../api/client'
import { driverForReading } from '../../utils/explain'

// MODULE 2 + 4 — IoT Monitoring + ML Health Pattern Detection (ThermaGuard core).
// Data arrives automatically from collars via POST /api/thermaguard/readings —
// there is intentionally NO manual entry form here. Humans contribute only
// follow-up observation notes on the cow page.
// Model is trained/served outside; this page shows sensor readings + ML predictions.
// Abnormal = early warning for a check, never a diagnosis.
export default function ThermaGuard() {
  const { t } = useTranslation()
  const [readings, setReadings] = useState([])
  const [predictions, setPredictions] = useState([])
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    thermalApi.readings({ limit: 100 }).then(r => setReadings(r.data)).catch(err => setError(err.message))
    thermalApi.predictions({ limit: 50 }).then(r => setPredictions(r.data)).catch(() => {})
    thermalApi.summary({ days: 7 }).then(setSummary).catch(() => {})
  }
  useEffect(load, [])

  return (
    <DashboardLayout title={t('health.title')}>
      <div className="space-y-5">
        <p className="text-xs text-gray-500">{t('health.subtitle')}</p>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
            <Radio size={20} className="text-green-600" />
          </div>
          <p className="text-xs text-gray-600">{t('health.autoNote')}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t('health.readings7d'), value: summary?.readings ?? '—' },
            { label: t('health.avgTemp'), value: summary?.avgTemperatureC != null ? `${summary.avgTemperatureC}°C` : '—' },
            { label: t('health.thresholdAnom'), value: summary?.anomalies ?? '—' },
            { label: t('health.mlAbnormal'), value: summary?.abnormalPatternsML ?? predictions.filter(p => p.label === 'ABNORMAL').length ?? '—' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-2xl font-black text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><BrainCircuit size={16} className="text-purple-600" /> {t('health.latestPred')}</h2>
            {!predictions.length && <p className="py-8 text-center text-sm text-gray-500">{t('health.noPred')}</p>}
            {!!predictions.length && (
              <div className="overflow-x-auto">
                <table className="r-table w-full text-sm">
                  <thead><tr className="text-left text-[11px] text-gray-500 uppercase border-b border-gray-100"><th className="py-2.5 pr-4">{t('health.colAnimal')}</th><th className="py-2.5 pr-4">{t('health.colPattern')}</th><th className="py-2.5 pr-4">{t('health.colScore')}</th><th className="py-2.5">{t('health.colModel')}</th></tr></thead>
                  <tbody>
                    {predictions.slice(0, 15).map(p => (
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

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Activity size={16} className="text-green-600" /> {t('health.sensorTitle')}</h2>
            <span className="text-xs text-gray-500">{t('health.last7')}</span>
          </div>
          {!readings.length && <p className="py-12 text-center text-sm text-gray-500">{t('health.noReadings')}</p>}
          {!!readings.length && (
            <div className="overflow-x-auto">
              <table className="r-table w-full text-sm">
                <thead><tr className="text-left text-[11px] text-gray-500 uppercase border-b border-gray-100"><th className="py-2.5 pr-4">{t('health.colAnimal')}</th><th className="py-2.5 pr-4">{t('health.colTemp')}</th><th className="py-2.5 pr-4">{t('health.colActivity')}</th><th className="py-2.5 pr-4">{t('health.colPattern')}</th><th className="py-2.5 pr-4">{t('health.colRisk')}</th><th className="py-2.5">{t('health.colWhen')}</th></tr></thead>
                <tbody>
                  {readings.map((reading, i) => {
                    const driver = driverForReading(
                      reading,
                      readings.slice(i + 1).filter(q => q.cattleId === reading.cattleId).map(q => q.activityLevel),
                    )
                    return (
                    <tr key={reading.id} className="border-b border-gray-50">
                      <td data-label={t('health.colAnimal')} className="py-3 pr-4 font-semibold">{reading.cattle?.tagNumber} {reading.cattle?.name || ''}</td>
                      <td data-label={t('health.colTemp')} className="py-3 pr-4 font-bold"><Thermometer size={15} className="inline mr-1" />{reading.temperatureC}°C</td>
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
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
