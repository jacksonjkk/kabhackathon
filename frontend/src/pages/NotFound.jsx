import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPinOff, ArrowLeft, LayoutDashboard } from 'lucide-react'
import { getToken } from '../api/client'

export default function NotFound() {
  const loggedIn = Boolean(getToken())
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-900 to-green-800 px-6">
      <img src="https://images.pexels.com/photos/5633473/pexels-photo-5633473.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 to-green-800/80" />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 bg-white/90 backdrop-blur-xl rounded-3xl p-8 sm:p-12 w-full max-w-[440px] shadow-2xl border border-white/50 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <MapPinOff size={28} className="text-green-700" />
          </div>
        </div>
        <p className="text-xs font-black tracking-widest text-green-700 uppercase mb-2">404</p>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Lost in the pasture?</h1>
        <p className="text-sm text-gray-600 mb-7">This page wandered off. Let's get you back to the herd.</p>
        <div className="flex flex-col gap-3">
          <Link to={loggedIn ? '/dashboard' : '/'} className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-700 text-white text-sm font-bold rounded-xl hover:bg-green-800 transition-all active:scale-[0.97]">
            {loggedIn ? <><LayoutDashboard size={18} /> Back to Dashboard</> : <><ArrowLeft size={18} /> Back to Home</>}
          </Link>
          {!loggedIn && (
            <Link to="/signin" className="w-full py-3.5 border-2 border-green-700 text-green-700 text-sm font-bold rounded-xl hover:bg-green-50 transition-all active:scale-[0.97]">
              Sign In
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  )
}
