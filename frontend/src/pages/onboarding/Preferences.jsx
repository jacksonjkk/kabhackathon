import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, ArrowLeft, Settings } from 'lucide-react'

const toggles = [
  { id: 'health', label: 'Early-Warning Alerts', desc: 'Get notified when abnormal health patterns are detected.' },
  { id: 'trends', label: 'Health Trend History', desc: 'Keep per-animal sensor and prediction history for review.' },
  { id: 'monitoring', label: 'Continuous Monitoring', desc: 'Track body temperature and activity readings over time.' },
  { id: 'notes', label: 'Observation Notes', desc: 'Record follow-up checks on flagged animals.' },
]

export default function Preferences() {
  const navigate = useNavigate()
  const [prefs, setPrefs] = useState(toggles.reduce((a, t) => ({ ...a, [t.id]: false }), {}))
  const [lang, setLang] = useState('en')
  const [unit, setUnit] = useState('metric')
  const toggle = id => setPrefs(p => ({ ...p, [id]: !p[id] }))
  const handleSubmit = e => { e.preventDefault(); navigate('/dashboard') }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-800 relative flex">
      <img src="https://images.pexels.com/photos/5633452/pexels-photo-5633452.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1" alt="" className="fixed inset-0 w-full h-full object-cover opacity-20" />

      <div className="relative z-10 w-full max-w-2xl mx-auto flex items-center justify-center p-6 pt-16 pb-10">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          <button onClick={() => navigate('/farm-setup')} className="flex items-center gap-1.5 text-white/70 hover:text-white mb-6 transition-colors text-sm cursor-pointer">
            <ArrowLeft size={16} /> Back
          </button>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-white/50">
            <div className="flex items-center gap-3 mb-6">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-2 rounded-full flex-1 ${s <= 3 ? 'bg-green-600' : 'bg-gray-200'}`} />
              ))}
              <span className="text-[11px] text-gray-500 font-medium">Step 3 of 3</span>
            </div>

            <div className="flex items-center gap-4 mb-7">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
                <Settings size={26} className="text-green-700" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">Your Preferences</h1>
                <p className="text-sm text-gray-600">Customize your BoviPulse experience.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700">Language</label>
                    <select value={lang} onChange={e => setLang(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/15 transition-all">
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                      <option value="fr">French</option>
                      <option value="pt">Portuguese</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700">Units</label>
                    <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/15 transition-all">
                      <option value="metric">Metric (°C, kg)</option>
                      <option value="imperial">Imperial (°F, lbs)</option>
                    </select>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-gray-800 mb-3">Enable Features</h3>
                <div className="flex flex-col gap-3">
                  {toggles.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{t.label}</div>
                        <div className="text-[11px] text-gray-500">{t.desc}</div>
                      </div>
                      <button type="button" onClick={() => toggle(t.id)} className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer ${prefs[t.id] ? 'bg-green-600' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${prefs[t.id] ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-700 text-white text-sm font-bold rounded-xl hover:bg-green-800 transition-all hover:shadow-md active:scale-[0.97] cursor-pointer">
                Go to Dashboard <ChevronRight size={18} />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
