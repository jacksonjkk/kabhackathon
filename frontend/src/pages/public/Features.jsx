import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Thermometer, Bell, BrainCircuit, BarChart3, PawPrint, Heart, AlertTriangle, Activity, Radio } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

// Demo figures illustrating the monitoring dashboard (not live data).
const stats = [
  { icon: PawPrint, label: 'Monitored Cattle', value: '128', sub: 'View herd', color: 'green' },
  { icon: Heart, label: 'Normal Pattern', value: '117', sub: '91.4%', color: 'green' },
  { icon: AlertTriangle, label: 'Needs Check', value: '11', sub: '8.6%', color: 'orange' },
  { icon: BrainCircuit, label: 'ML Abnormal (7d)', value: '6', sub: 'Early warnings', color: 'orange' },
  { icon: Radio, label: 'Sensors Online', value: '122', sub: '95.3%', color: 'green' },
]

const coreFeatures = [
  { icon: Thermometer, title: 'Continuous IoT Monitoring', desc: 'Body temperature, activity, and ambient conditions collected per animal over time.' },
  { icon: BrainCircuit, title: 'ML Pattern Detection', desc: 'Classification and anomaly detection flag deviation from each animal\u2019s own baseline.' },
  { icon: Bell, title: 'Early-Warning Alerts', desc: 'Severity-scored warnings with cooldown: a prompt to check the animal, never a diagnosis.' },
  { icon: Activity, title: 'Individual Baselines', desc: 'Rolling averages, variability, and change features capture how each cow evolves.' },
  { icon: BarChart3, title: 'Health Dashboard', desc: 'Live readings, historical trends, ML predictions, and alert history in one place.' },
]

export default function Features() {
  return (
    <div className="min-h-screen bg-white pt-20">
      <Navbar />

      <section className="relative min-h-[calc(100vh-80px)] grid lg:grid-cols-[420px_1fr_280px] overflow-hidden">
        {/* Mobile background (desktop shows the photo panel below) */}
        <div className="absolute inset-0 lg:hidden" aria-hidden="true">
          <img src="https://images.pexels.com/photos/10829198/pexels-photo-10829198.jpeg?auto=compress&cs=tinysrgb&w=800&dpr=1" alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/50 to-white" />
        </div>
        <div className="px-6 lg:px-12 lg:pl-20 py-16 lg:py-20 flex flex-col justify-center gap-4 z-10">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold tracking-[0.12em] text-green-600 uppercase flex items-center gap-2.5"
          >
            <span>FEATURES</span>
            <span className="w-8 h-0.5 rounded bg-green-600" />
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight"
          >
            One Problem, Solved in Depth:<br />Earlier Detection of Abnormal Patterns
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-gray-500 leading-relaxed"
          >
            BoviPulse continuously monitors cattle sensors and uses machine learning to surface
            abnormal health patterns early, so manual observation is backed by data, not replaced by claims.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2.5 bg-green-700 text-white px-7 py-3.5 rounded-xl text-sm font-bold hover:bg-green-800 transition-all hover:shadow-lg w-fit"
            >
              Explore All Features
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>

        <div className="relative overflow-hidden hidden lg:block">
          <img
            src="https://images.pexels.com/photos/10829198/pexels-photo-10829198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Holstein Friesian cows"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-16 left-16 w-28 h-24 border-2 border-dashed border-green-500 rounded-lg" />
          <div className="absolute bottom-28 right-12 w-28 h-24 border-2 border-dashed border-green-500 rounded-lg" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-green-400 shadow-[0_0_0_20px_rgba(76,175,80,0.08),0_0_0_40px_rgba(76,175,80,0.04)]" />
          <div className="absolute bottom-14 left-8 bg-white rounded-xl p-4 shadow-lg flex gap-3.5 min-w-[200px]">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <Activity size={20} className="text-green-600" />
            </div>
            <div>
              <div className="text-[11px] text-gray-500">Healthy Status</div>
              <div className="text-sm font-bold text-green-600">Normal</div>
              <div className="text-[10px] text-gray-400">Last Check</div>
              <div className="text-xs font-semibold text-gray-700">Today, 08:30 AM</div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col gap-2 p-5 border-l border-gray-200 bg-white justify-center shadow-md">
          {stats.map((s, i) => {
            const Icon = s.icon
            return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              className="flex items-center gap-3.5 p-3.5 rounded-xl border border-gray-200 hover:shadow-sm transition-shadow bg-white"
            >
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                s.color === 'green' ? 'bg-green-600' : s.color === 'orange' ? 'bg-orange-500' : 'bg-pink-500'
              } bg-opacity-15`}>
                <Icon size={20} className={`${s.color === 'green' ? 'text-green-600' : s.color === 'orange' ? 'text-orange-500' : 'text-pink-500'}`} />
              </span>
              <div>
                <div className="text-[11px] text-gray-500">{s.label}</div>
                <div className="text-xl font-extrabold text-gray-900">{s.value}</div>
                <div className={`text-[11px] font-semibold ${
                  s.color === 'green' ? 'text-green-600' : s.color === 'orange' ? 'text-orange-500' : 'text-pink-500'
                }`}>{s.sub}</div>
              </div>
            </motion.div>
            )
          })}
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[280px_1fr] gap-16 items-start">
          <div>
            <span className="text-xs font-bold tracking-[0.12em] text-green-600 uppercase flex items-center gap-2.5 mb-4">
              <span>OUR CORE FEATURES</span>
              <span className="w-8 h-0.5 rounded bg-green-600" />
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900 leading-tight mb-4">
              Everything Needed<br />for Early Health<br />Warnings
            </h2>
            <div className="w-10 h-0.5 rounded bg-green-600" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-0 bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            {coreFeatures.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="p-7 text-center border-r border-gray-200 last:border-r-0 hover:bg-green-50 transition-colors">
                  <div className="flex justify-center mb-3.5">
                    <Icon size={36} className="text-green-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed mb-3.5">{f.desc}</p>
                  <Link to="/features" className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:gap-2 transition-all">
                    Learn More <ArrowRight size={12} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
