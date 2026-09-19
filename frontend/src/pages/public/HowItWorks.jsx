import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Thermometer, Cloud, Brain, Bell, ChevronRight, Shield, TrendingUp, Clock, Globe } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

const steps = [
  { num: '1', icon: Thermometer, title: 'Sense Continuously', desc: 'Collars or tags stream body temperature, activity, and ambient conditions with cow ID and timestamp.' },
  { num: '2', icon: Cloud, title: 'Ingest & Store', desc: 'Readings are validated, stored as per-cow time series, and cleaned for gaps and duplicates.' },
  { num: '3', icon: Brain, title: 'ML Pattern Detection', desc: 'Models compare each animal against its own baseline to flag abnormal health patterns.', highlight: true },
  { num: '4', icon: Bell, title: 'Early Warning', desc: 'Severity-scored alerts with cooldown prompt you to check the animal, never a diagnosis.' },
  { num: '5', icon: TrendingUp, title: 'Check & Follow Up', desc: 'Inspect the flagged animal, record your observation, and track its recovery in trends.' },
]

const advantages = [
  { icon: Shield, title: 'Earlier Detection', desc: 'Catch gradual abnormal changes that periodic manual checks can miss.' },
  { icon: TrendingUp, title: 'Focused Attention', desc: 'Spend time on the animals the data flags, instead of watching the whole herd.' },
  { icon: Clock, title: 'Timely Action', desc: 'Hours-earlier prompts to inspect give interventions a head start.' },
  { icon: Clock, title: 'Less Alert Fatigue', desc: 'Cooldowns and severity levels keep warnings meaningful, not noisy.' },
  { icon: Globe, title: 'Anytime, Anywhere', desc: 'Readings, trends, predictions, and warnings from any device.' },
]

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white pt-20">
      <Navbar />

      <section className="relative min-h-[40vh] flex items-center overflow-hidden">
        {/* Mobile background (desktop uses the side panel below) */}
        <div className="absolute inset-0 lg:hidden" aria-hidden="true">
          <img src="https://images.pexels.com/photos/5633452/pexels-photo-5633452.jpeg?auto=compress&cs=tinysrgb&w=800&dpr=1" alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/45 to-white" />
        </div>
        <div className="relative z-10 px-6 lg:pl-20 py-16 max-w-lg flex flex-col gap-3.5">
          <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-bold tracking-[0.12em] text-green-600 uppercase flex items-center gap-2.5">
            <span>HOW IT WORKS</span>
            <span className="w-8 h-0.5 rounded bg-green-600" />
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight">
            Intelligent Technology.<br />
            <span className="text-green-700">Simple Process.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-sm text-gray-500 leading-relaxed">
            BoviPulse turns continuous sensor data into early warnings for abnormal cattle health
            patterns: IoT ingestion, time-series processing, and ML scoring working as one loop.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="absolute right-0 top-0 bottom-0 w-[55%] hidden lg:block">
          <img src="https://images.pexels.com/photos/5633452/pexels-photo-5633452.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="Fresian cow" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent" />
        </motion.div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative p-6 text-center rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${
                s.highlight ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'
              }`}
            >
              <div className="absolute -top-3.5 left-4 w-7 h-7 rounded-full bg-green-700 text-white text-xs font-bold flex items-center justify-center">
                {s.num}
              </div>
              <div className="flex justify-center mb-4 mt-1">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${s.highlight ? 'bg-green-100' : 'bg-green-50'}`}>
                  <s.icon size={28} className="text-green-600" />
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 gap-1 z-10">
                  {[1, 2, 3].map(d => <div key={d} className="w-1.5 h-1.5 rounded-full bg-green-400" />)}
                </div>
              )}
              <h3 className={`text-sm font-bold mb-2 ${s.highlight ? 'text-green-700' : 'text-gray-900'}`}>{s.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[320px_1fr] gap-16 items-start">
          <div className="flex flex-col gap-3.5">
            <span className="text-xs font-bold tracking-[0.12em] text-green-600 uppercase flex items-center gap-2.5">
              <span>THE BOVIPULSE ADVANTAGE</span>
              <span className="w-8 h-0.5 rounded bg-green-600" />
            </span>
            <h2 className="text-3xl font-black text-gray-900 leading-tight">Better Insights.<br /><span className="text-green-700">Better Outcomes.</span></h2>
            <div className="w-10 h-0.5 rounded bg-green-600" />
            <p className="text-sm text-gray-500 leading-relaxed">Our platform empowers farmers and veterinarians with the tools they need to build healthier herds and more profitable operations.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {advantages.map((a, i) => (
              <div key={i} className="text-center p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                    <a.icon size={28} className="text-green-600" />
                  </div>
                </div>
                <h3 className="text-xs font-bold text-gray-900 mb-1.5">{a.title}</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-7 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
              <svg width="28" height="28" fill="none" stroke="#2E7D32" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Ready to Catch Health Changes Earlier?</h3>
              <p className="text-xs text-gray-500">Start monitoring your herd with continuous sensing and ML-backed early warnings.</p>
            </div>
          </div>
          <Link to="/signup" className="inline-flex items-center gap-2.5 bg-green-700 text-white px-7 py-3.5 rounded-xl text-sm font-bold hover:bg-green-800 transition-all hover:shadow-lg whitespace-nowrap">
            Get Started Today
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
