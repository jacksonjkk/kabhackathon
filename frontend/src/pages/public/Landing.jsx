import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Shield, Activity, Thermometer, Bell, BrainCircuit, BarChart3 } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

// Revised scope: every item serves the single core problem —
// delayed detection of abnormal cattle health patterns.
// (MuzzleID, GestaCheck, and other modules are parked as future enhancements.)
const features = [
  {
    icon: Thermometer,
    title: 'Continuous Sensing',
    desc: 'Body temperature, activity, and ambient conditions streamed per animal.',
  },
  {
    icon: BrainCircuit,
    title: 'ML Pattern Detection',
    desc: 'Models flag deviation from each animal\u2019s own baseline, not just fixed thresholds.',
  },
  {
    icon: Bell,
    title: 'Early Warnings',
    desc: 'Severity-scored alerts so you check the right animal in time.',
  },
  {
    icon: Activity,
    title: 'Individual Baselines',
    desc: 'Temporal features track how each cow changes over hours and days.',
  },
  {
    icon: BarChart3,
    title: 'Health Dashboard',
    desc: 'Live readings, trends, predictions, and alert history in one place.',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white pt-20">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-[calc(100vh-80px)] flex items-center overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-xl pt-24 pb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.05] tracking-tight mb-5"
            >
              Smart Livestock.<br />
              <span className="text-green-700">Healthier Future.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-lg text-black font-semibold leading-relaxed max-w-lg mb-8"
            >
              Continuous sensor monitoring and machine-learning detection of abnormal
              cattle health patterns. Early warnings help you check the right animal in time.
              Decision support only, never a diagnosis.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 mb-10"
            >
              <Link
                to="/signup"
                className="inline-flex items-center gap-2.5 bg-green-700 text-white px-7 py-3.5 rounded-xl text-sm font-bold hover:bg-green-800 transition-all hover:shadow-lg hover:shadow-green-700/20 active:scale-[0.97]"
              >
                Get Started
                <ArrowRight size={18} />
              </Link>
              <button className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-semibold text-green-700 border-2 border-green-700 hover:bg-green-50 transition-all active:scale-[0.97]">
                <span className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center">
                  <Play size={12} className="text-white fill-white" />
                </span>
                Watch Demo
              </button>
            </motion.div>
          </div>
        </div>

      {/* HERO IMAGE — desktop: side panel; mobile: full-bleed background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute inset-0 z-0 lg:hidden"
          aria-hidden="true"
        >
          <img
            src="https://images.pexels.com/photos/5633476/pexels-photo-5633476.jpeg?auto=compress&cs=tinysrgb&w=800&dpr=1"
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/45 to-white" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute right-0 top-0 bottom-0 w-[55%] lg:w-[60%] z-0 hidden lg:block"
        >
          <img
            src="https://images.pexels.com/photos/5633476/pexels-photo-5633476.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Holstein Friesian cows grazing"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
        </motion.div>
      </section>

      {/* FEATURES BAR */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-20 -mt-6"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-[0_-4px_32px_rgba(0,0,0,0.06),0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-gray-100">
              {features.map((f, i) => {
                const Icon = f.icon
                return (
                  <motion.div
                    key={i}
                    variants={item}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="p-6 md:p-8 text-center hover:bg-green-50/50 transition-colors group"
                  >
                    <div className="flex justify-center mb-3.5">
                      <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
                        <Icon size={24} />
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1.5">{f.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* BOTTOM BANNER */}
      <section className="mt-12 mb-0 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Secure. Reliable. Designed for Farmers.</p>
              <p className="text-xs text-gray-500">Early warnings for abnormal patterns. You stay in charge of every decision about your animals.</p>
            </div>
          </div>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:gap-3 transition-all flex-shrink-0"
          >
            Learn More
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
