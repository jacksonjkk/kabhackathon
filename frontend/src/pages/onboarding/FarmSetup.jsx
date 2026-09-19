import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { farmApi } from '../../api/client'

export default function FarmSetup() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ farmName: '', herdSize: '', location: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    const herdSize = Number.parseInt(form.herdSize, 10)
    if (!Number.isFinite(herdSize) || herdSize < 1) {
      setError('Enter your herd size as a whole number of 1 or more.')
      return
    }
    setSubmitting(true)
    try {
      const signup = JSON.parse(sessionStorage.getItem('bovipulse_signup') || 'null')
      if (!signup) throw new Error('Your signup session expired. Please create your account again.')
      const roleMap = { farmer: 'FARMER', vet: 'VETERINARIAN', manager: 'WORKER', org: 'FARMER' }
      await register({ ...signup, role: roleMap[sessionStorage.getItem('bovipulse_role')] || 'FARMER' })
      await farmApi.create({
        name: form.farmName.trim(),
        location: form.location.trim() || null,
        capacity: herdSize,
      })
      sessionStorage.removeItem('bovipulse_signup')
      sessionStorage.removeItem('bovipulse_role')
      navigate('/preferences')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-800 relative flex">
      <img src="https://images.pexels.com/photos/10829198/pexels-photo-10829198.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1" alt="" className="fixed inset-0 w-full h-full object-cover opacity-20" />

      <div className="relative z-10 w-full max-w-2xl mx-auto flex items-center justify-center p-6 pt-16 pb-10">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          <button onClick={() => navigate('/role')} className="flex items-center gap-1.5 text-white/70 hover:text-white mb-6 transition-colors text-sm cursor-pointer">
            <ArrowLeft size={16} /> Back
          </button>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-white/50">
            <div className="flex items-center gap-3 mb-6">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-2 rounded-full flex-1 ${s <= 2 ? 'bg-green-600' : 'bg-gray-200'}`} />
              ))}
              <span className="text-[11px] text-gray-500 font-medium">Step 2 of 3</span>
            </div>

            <h1 className="text-2xl font-black text-gray-900 mb-1.5">Set Up Your Farm</h1>
            <p className="text-sm text-gray-600 mb-7">Tell us about your farm so we can tailor the experience.</p>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Farm Name</label>
                  <input name="farmName" value={form.farmName} onChange={handleChange} placeholder="e.g. Greenfield Farm" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/15 transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Herd Size</label>
                  <input name="herdSize" value={form.herdSize} onChange={handleChange} type="number" min="1" step="1" placeholder="e.g. 50" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/15 transition-all" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Location</label>
                <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Kabale, Uganda"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/15 transition-all" />
              </div>
              {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
              <button type="submit" disabled={submitting} className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-700 text-white text-sm font-bold rounded-xl hover:bg-green-800 transition-all hover:shadow-md active:scale-[0.97] mt-2 cursor-pointer disabled:opacity-60">
                {submitting ? 'Setting Up...' : 'Continue'} {!submitting && <ChevronRight size={18} />}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
