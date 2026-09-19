import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import logo from '../../assets/logo11.png'
import { Shield, ChevronRight, Sprout, Stethoscope, Briefcase, Building2, Lock, Cloud, ShieldCheck, Users, ArrowRight } from 'lucide-react'

const roles = [
  { id: 'farmer', icon: Sprout, title: 'Farmer', titleColor: 'text-green-700', badge: 'Recommended', desc: 'Watch your herd around the clock and get early warnings.', features: ['Review abnormal-pattern warnings', 'Log signs you observe', 'Track each animal\u2019s trends'], btnLabel: "I'm a Farmer", bg: 'bg-green-700' },
  { id: 'vet', icon: Stethoscope, title: 'Veterinarian', titleColor: 'text-blue-500', desc: 'Follow up flagged animals with full sensor and note history.', features: ['See predictions + caretaker notes', 'Review warning history', 'Decide treatment yourself'], btnLabel: "I'm a Veterinarian", bg: 'bg-blue-500' },
  { id: 'manager', icon: Briefcase, title: 'Farm Manager', titleColor: 'text-purple-500', desc: 'Run daily checks and keep monitoring records tidy.', features: ['Register monitored animals', 'Acknowledge daily warnings', 'Log follow-up observations'], btnLabel: "I'm a Farm Manager", bg: 'bg-purple-500' },
  { id: 'org', icon: Building2, title: 'Farm Organization', titleColor: 'text-orange-500', desc: 'Coordinate monitoring across your team.', features: ['Shared herd overview', 'Team warning workflow', 'Observation records'], btnLabel: 'I represent an Organization', bg: 'bg-orange-500' },
]

export default function ChooseRole() {
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  const chooseRole = (role) => {
    setSelected(role.id)
    sessionStorage.setItem('bovipulse_role', role.id)
    navigate('/farm-setup')
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-green-900 to-green-800">
      <img src="https://images.pexels.com/photos/5633473/pexels-photo-5633473.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1" alt="" className="fixed inset-0 w-full h-full object-cover opacity-20" />

      <header className="relative z-10 flex items-center px-6 lg:px-16 py-4 border-b border-white/10 bg-white/95">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="BoviPulse logo" className="w-16 h-16 rounded-xl object-contain" />
          <span className="text-lg font-extrabold text-green-700 tracking-tight">BoviPulse</span>
        </Link>
      </header>

      <div className="relative z-10 px-6 lg:px-16 py-10 flex flex-col gap-7">
        <div className="flex flex-col gap-2.5 max-w-lg">
          <div className="inline-flex bg-white/80 border border-gray-300 rounded-full px-3.5 py-1 text-[11px] font-semibold text-gray-600 w-fit">Step 1 of 3</div>
          <div className="flex gap-1.5">
            <span className="w-8 h-1.5 rounded-full bg-green-600" />
            <span className="w-8 h-1.5 rounded-full bg-green-600" />
            <span className="w-8 h-1.5 rounded-full bg-gray-300" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight">Welcome to BoviPulse<br /><span className="text-green-700">Choose Your Role</span></h1>
          <p className="text-sm text-gray-600">Tell us who you are so we can personalize your BoviPulse experience.</p>
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 text-xs text-green-700 font-medium w-fit">
            <Shield size={14} /> Secure • Smart • Reliable • Built for Livestock Health
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {roles.map(r => {
            const Icon = r.icon
            return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: roles.indexOf(r) * 0.08 }}
              onClick={() => setSelected(r.id)}
              className={`bg-white rounded-2xl border-2 p-7 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                selected === r.id ? 'border-green-500 shadow-lg ring-3 ring-green-500/15' : 'border-gray-200'
              }`}
            >
              {r.badge && <div className="absolute top-3.5 right-3.5 bg-green-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{r.badge}</div>}
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-1"><Icon size={32} className={r.titleColor} /></div>
              <h3 className={`text-lg font-extrabold text-center ${r.titleColor}`}>{r.title}</h3>
              <p className="text-xs text-gray-600 text-center leading-relaxed">{r.desc}</p>
              <ul className="flex flex-col gap-2">
                {r.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
                    <svg width="15" height="15" fill="none" stroke="#2E7D32" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => chooseRole(r)} className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white transition-all active:scale-[0.97] cursor-pointer ${r.bg} hover:brightness-110`}>
                {r.btnLabel} <ChevronRight size={16} />
              </button>
            </motion.div>
            )
          })}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
          {[
            { icon: Lock, title: 'Your data is secure', sub: 'Signed-in accounts only' },
            { icon: Cloud, title: 'Always current', sub: 'Live sensor-driven data' },
            { icon: ShieldCheck, title: 'Honest AI', sub: 'Warnings, never diagnoses' },
            { icon: Users, title: 'Built for All Roles', sub: 'Tailored to your needs' },
          ].map((t, i) => {
            const Icon = t.icon
            return (
            <div key={i} className="flex items-center gap-3 p-5 border-r border-gray-200 last:border-r-0">
              <span className="text-xl"><Icon size={20} className="text-green-700" /></span>
              <div>
                <div className="text-xs font-bold text-gray-900">{t.title}</div>
                <div className="text-[11px] text-gray-500">{t.sub}</div>
              </div>
            </div>
            )
          })}
        </div>

        <div className="text-center text-sm text-gray-600 pb-4">
          Already have an account?{' '}
          <Link to="/signin" className="text-green-700 font-bold hover:underline inline-flex items-center gap-1">Sign In <ArrowRight size={14} /></Link>
        </div>
      </div>
    </div>
  )
}
