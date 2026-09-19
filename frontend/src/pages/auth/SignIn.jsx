import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Activity, Lock, Mail, Cloud, BarChart3, Headphones, Users, ShieldCheck, Globe } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo11.png'

export default function SignIn() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(true)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(form.email, form.password, remember)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
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
          <span className="text-sm text-white/80 hidden sm:inline">New to BoviPulse?</span>
          <Link to="/signup" className="flex items-center gap-1.5 px-4 py-2 border border-white/60 rounded-lg text-sm font-semibold text-white hover:bg-white/15 transition-all">
            Create Account <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <div className="hidden lg:block fixed left-12 top-1/2 -translate-y-1/2 z-10 max-w-[260px] text-white">
        <h2 className="text-2xl font-black leading-tight mb-3">Welcome Back to<br /><span className="text-green-400">Smarter Farming</span></h2>
        <p className="text-sm text-white/80 mb-5">Sign in to review sensor trends, ML predictions, and early warnings for your herd.</p>
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

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full flex justify-center px-4 pt-20 pb-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-10 w-full max-w-[440px] mx-auto shadow-2xl border border-white/50 text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="BoviPulse logo" className="w-12 h-12 rounded-full object-cover bg-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1.5">Welcome Back</h1>
          <p className="text-sm text-gray-600 mb-6">Sign in to continue managing your herd with <span className="text-green-700 font-bold">BoviPulse</span>.</p>

          <form className="flex flex-col gap-3 text-left" onSubmit={handleSubmit}>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-green-600 pointer-events-none z-10"><Mail size={18} /></span>
              <input name="email" value={form.email} onChange={handleChange} type="email" autoComplete="email" placeholder="Email Address" required
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-black/10 bg-white/70 text-sm text-gray-800 placeholder-gray-400 focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/15 transition-all" />
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-green-600 pointer-events-none z-10"><Lock size={18} /></span>
              <input name="password" value={form.password} onChange={handleChange} type={showPwd ? 'text' : 'password'} autoComplete="current-password" placeholder="Password" required
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-black/10 bg-white/70 text-sm text-gray-800 placeholder-gray-400 focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/15 transition-all" />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 text-gray-400 hover:text-green-600 transition-colors cursor-pointer">
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300 accent-green-700" />
                Remember me
              </label>
              <Link to="/contact" className="text-xs font-semibold text-green-700 hover:underline">Need help signing in?</Link>
            </div>
            {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
            <button type="submit" disabled={submitting} className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-green-700 text-white text-sm font-bold rounded-xl hover:bg-green-800 transition-all hover:shadow-md active:scale-[0.97] mt-1.5 disabled:opacity-60">
              {submitting ? 'Signing In...' : 'Sign In'} {!submitting && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <span className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">or</span>
            <span className="flex-1 h-px bg-gray-200" />
          </div>

          <button onClick={() => navigate('/signup')} className="w-full py-3.5 border-2 border-green-700 text-green-700 text-sm font-bold rounded-xl hover:bg-green-50 transition-all active:scale-[0.97] cursor-pointer">
            Create New Account
          </button>

          <p className="text-[11px] text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-green-700 font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
