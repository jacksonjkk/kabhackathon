import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Circle, Phone, Sprout, Leaf, Star, Crown } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

const plans = [
  { icon: Sprout, name: 'Community', for: 'For individual farmers & smallholders', price: '$0', period: '/month', highlight: 'Free forever', features: ['Up to 10 Cattle', 'Basic Health Monitoring', 'Mobile App Access', 'Email Support'], popular: false },
  { icon: Leaf, name: 'Growth', for: 'For growing farms that need more insights', price: '$19', period: '/month', highlight: 'Billed annually', features: ['Up to 50 Cattle', 'Continuous Health Monitoring', 'ML Early Warnings', 'Health Trend History', 'Priority Email Support'], popular: false },
  { icon: Star, name: 'Professional', for: 'For professional farms seeking advanced tools', price: '$49', period: '/month', highlight: 'Billed annually', features: ['Up to 200 Cattle', 'All Growth Features', 'Per-Cow Baseline Analytics', 'Abnormal-Pattern Scoring', 'Data Export & Reports', 'Priority Support'], popular: true },
  { icon: Crown, name: 'Enterprise', for: 'For large farms and organizations', price: '$99', period: '/month', highlight: 'Billed annually', features: ['Unlimited Cattle', 'All Professional Features', 'Custom Integrations', 'Dedicated Account Manager', '24/7 Premium Support'], popular: false },
]

export default function Pricing() {
  return (
    <div className="min-h-screen bg-white pt-20">
      <Navbar />

      <section className="relative min-h-[35vh] flex items-center overflow-hidden">
        {/* Mobile background (desktop uses the side panel below) */}
        <div className="absolute inset-0 lg:hidden" aria-hidden="true">
          <img src="https://images.pexels.com/photos/66400/pexels-photo-66400.jpeg?auto=compress&cs=tinysrgb&w=800&dpr=1" alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/45 to-white" />
        </div>
        <div className="relative z-10 px-6 lg:pl-20 py-16 max-w-lg flex flex-col gap-4">
          <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-bold tracking-[0.12em] text-green-600 uppercase flex items-center gap-2.5">
            <span>PRICING</span>
            <span className="w-8 h-0.5 rounded bg-green-600" />
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight">
            Choose the Right Intelligence<br />for Your Farm
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-sm text-gray-500 leading-relaxed">
            Scale from smallholder operations to larger herds with continuous monitoring and ML-backed early warnings.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="absolute right-0 top-0 bottom-0 w-[50%] hidden lg:block">
          <img src="https://images.pexels.com/photos/66400/pexels-photo-66400.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="Dairy cows" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent" />
        </motion.div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((p, i) => {
            const Icon = p.icon
            return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative bg-white rounded-2xl border p-7 flex flex-col gap-2.5 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                p.popular ? 'border-green-500 shadow-lg' : 'border-gray-200'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-green-700 text-white text-[10px] font-bold px-4 py-1 rounded-full whitespace-nowrap tracking-wider">
                  MOST POPULAR
                </div>
              )}
              <Icon size={32} className={p.popular ? 'text-green-700' : 'text-green-600'} />
              <h3 className={`text-xl font-extrabold ${p.popular ? 'text-green-700' : 'text-gray-900'}`}>{p.name}</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">{p.for}</p>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-3xl font-black text-gray-900">{p.price}</span>
                <span className="text-xs text-gray-500">{p.period}</span>
              </div>
              <div className="text-[11px] font-semibold text-green-600 mb-1.5">{p.highlight}</div>
              <ul className="flex flex-col gap-2 my-2">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-green-600" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-auto w-full py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  p.popular
                    ? 'bg-green-700 text-white hover:bg-green-800'
                    : 'bg-white text-green-700 border-2 border-green-700 hover:bg-green-50'
                }`}
              >
                {i === 0 ? 'Get Started Free' : i === 3 ? 'Contact Sales' : `Choose ${p.name}`}
              </button>
            </motion.div>
            )
          })}
        </div>
      </section>

      <section className="relative overflow-hidden min-h-[100px]">
        <img src="https://images.pexels.com/photos/5633473/pexels-photo-5633473.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="Farm" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-green-900/90" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-9 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <Phone size={28} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Need a custom solution for your farm or organization?</h3>
              <p className="text-xs text-white/75">Our team is here to help you build a smarter, healthier herd.</p>
            </div>
          </div>
          <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-green-700 px-7 py-3.5 rounded-xl text-sm font-bold hover:bg-green-50 transition-all whitespace-nowrap">
            Talk to Sales Team
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
