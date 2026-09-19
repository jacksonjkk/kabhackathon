import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import logo from '../../assets/logo11.png'
import { Eye, EyeOff, ArrowRight, Activity, Lock, Cloud, BarChart3, Headphones, Users, ShieldCheck, Globe, User, Mail, Phone } from 'lucide-react'

const COUNTRY_CODES = [
  { code: '+260', label: '🇿🇲 +260' },
  { code: '+263', label: '🇿🇼 +263' },
  { code: '+265', label: '🇲🇼 +265' },
  { code: '+255', label: '🇹🇿 +255' },
  { code: '+254', label: '🇰🇪 +254' },
  { code: '+256', label: '🇺🇬 +256' },
  { code: '+27', label: '🇿🇦 +27' },
  { code: '+234', label: '🇳🇬 +234' },
  { code: '+233', label: '🇬🇭 +233' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+91', label: '🇮🇳 +91' },
]

export default function SignUp() {
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [code, setCode] = useState('+260')
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const [error, setError] = useState('')
  const handleSubmit = e => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    const national = form.phone.replace(/[\s()-]/g, '').replace(/^0+/, '')
    if (!/^\d{4,15}$/.test(national)) {
      setError('Enter a valid phone number')
      return
    }
    const fullPhone = `${code}${national}`
    if (fullPhone.length > 24) {
      setError('Phone number is too long')
      return
    }
    sessionStorage.setItem('bovipulse_signup', JSON.stringify({
      name: form.name, email: form.email, phone: fullPhone, password: form.password,
    }))
    navigate('/role')
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-900 to-green-800">
      <img src="https://images.pexels.com/photos/5633473/pexels-photo-5633473.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 to-green-800/80" />

      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4">
        <Link to="/" className="flex items-center gap-2.5 text-white">
          <img src={logo} alt="BoviPulse logo" className="w-16 h-16 rounded-xl object-contain" />
          <span className="text-lg font-extrabold tracking-tight">BoviPulse</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/80 hidden sm:inline">Already have an account?</span>
          <Link to="/signin" className="flex items-center gap-1.5 px-4 py-2 border border-white/60 rounded-lg text-sm font-semibold text-white hover:bg-white/15 transition-all">
            Sign In <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <div className="hidden lg:block fixed left-12 top-1/2 -translate-y-1/2 z-10 max-w-[260px] text-white">
        <h2 className="text-2xl font-black leading-tight mb-3">Smarter Farming<br /><span className="text-green-400">Starts Here</span></h2>
          <p className="text-sm text-white/80 mb-5">Continuous cattle health monitoring with machine-learning early warnings.</p>
        <div className="flex flex-col gap-3.5">
          {[
            { icon: Lock, title: 'Secure & Private', desc: 'Your data is encrypted and protected.' },
            { icon: Cloud, title: 'Cloud Sync', desc: 'Access your data anytime, anywhere.' },
            { icon: BarChart3, title: 'AI-Powered Insights', desc: 'Make smarter decisions with real-time analytics.' },
            { icon: Headphones, title: '24/7 Support', desc: 'We\'re here to help you succeed.' },
          ].map((f, i) => {
            const Icon = f.icon
            return (
            <div key={i} className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 backdrop-blur-sm"><Icon size={16} className="text-white" /></span>
              <div>
                <div className="text-xs font-bold text-white">{f.title}</div>
                <div className="text-[11px] text-white/70">{f.desc}</div>
              </div>
            </div>
            )
          })}
        </div>
      </div>

      <div className="hidden lg:block fixed right-12 bottom-16 z-10 bg-green-900/80 backdrop-blur-lg rounded-xl p-5 border border-white/15 min-w-[200px]">
        {[
          { icon: Activity, val: '24/7', label: 'Continuous sensing' },
          { icon: Users, val: 'Per-cow', label: 'Individual baselines' },
          { icon: ShieldCheck, val: 'Early', label: 'Warnings, not diagnoses' },
          { icon: Globe, val: 'Anywhere', label: 'Phone-friendly dashboard' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
          <div key={i} className={`flex items-center gap-3.5 ${i < 3 ? 'mb-4' : ''}`}>
            <span className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0"><Icon size={20} className="text-white" /></span>
            <div>
              <div className="text-lg font-black text-white">{s.val}</div>
              <div className="text-[11px] text-white/75">{s.label}</div>
            </div>
          </div>
          )
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 pt-20 pb-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-10 w-full max-w-[440px] shadow-2xl border border-white/50 text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="BoviPulse logo" className="w-12 h-12 rounded-full object-cover bg-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1.5">Create Account</h1>
          <p className="text-sm text-gray-600 mb-6">Join <span className="text-green-700 font-bold">BoviPulse</span> and start managing your herd smarter.</p>

          <form className="flex flex-col gap-3 text-left" onSubmit={handleSubmit}>
            {[
              { name: 'name', placeholder: 'Full Name', icon: User, autoComplete: 'name' },
              { name: 'email', placeholder: 'Email Address', type: 'email', icon: Mail, autoComplete: 'email' },
            ].map(f => {
              const Icon = f.icon
              return (
              <div key={f.name} className="relative flex items-center">
                <span className="absolute left-3.5 text-green-600 pointer-events-none z-10"><Icon size={18} /></span>
                <input name={f.name} value={form[f.name]} onChange={handleChange} type={f.type || 'text'} autoComplete={f.autoComplete} maxLength={f.maxLength} placeholder={f.placeholder} required
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-black/10 bg-white/70 text-sm text-gray-800 placeholder-gray-400 focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/15 transition-all" />
              </div>
              )
            })}
            <div className="relative flex items-center gap-2">
              <span className="absolute left-3.5 text-green-600 pointer-events-none z-10"><Phone size={18} /></span>
              <select value={code} onChange={e => setCode(e.target.value)} aria-label="Country code"
                className="pl-10 pr-2 py-3 rounded-xl border border-black/10 bg-white/70 text-sm text-gray-800 focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/15 transition-all max-w-[6.5rem]">
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <input name="phone" value={form.phone} onChange={handleChange} type="tel" autoComplete="tel" placeholder="971 234 567" required
                className="flex-1 min-w-0 px-3.5 py-3 rounded-xl border border-black/10 bg-white/70 text-sm text-gray-800 placeholder-gray-400 focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/15 transition-all" />
            </div>
            {[
              { name: 'password', placeholder: 'Password', show: showPwd, toggle: () => setShowPwd(v => !v) },
              { name: 'confirm', placeholder: 'Confirm Password', show: showConfirm, toggle: () => setShowConfirm(v => !v) },
            ].map(f => (
              <div key={f.name} className="relative flex items-center">
                <span className="absolute left-3.5 text-green-600 pointer-events-none z-10"><Lock size={18} /></span>
                <input name={f.name} value={form[f.name]} onChange={handleChange} type={f.show ? 'text' : 'password'} autoComplete="new-password" placeholder={f.placeholder} required
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-black/10 bg-white/70 text-sm text-gray-800 placeholder-gray-400 focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/15 transition-all" />
                <button type="button" onClick={f.toggle} className="absolute right-3 text-gray-400 hover:text-green-600 transition-colors cursor-pointer">
                  {f.show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            ))}
            {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
            <button type="submit" className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-green-700 text-white text-sm font-bold rounded-xl hover:bg-green-800 transition-all hover:shadow-md active:scale-[0.97] mt-1.5">
              Create Account <ArrowRight size={18} />
            </button>
          </form>
          <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
            Academic demo build. Use it to evaluate the monitoring workflow responsibly.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
