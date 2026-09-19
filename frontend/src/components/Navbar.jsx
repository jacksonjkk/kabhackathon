import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowRight } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import logo from '../assets/logo11.png'

export default function Navbar() {
  const path = useLocation().pathname
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const links = [
    { label: t('pub.home'), to: '/' },
    { label: t('pub.features'), to: '/features' },
    { label: t('pub.how'), to: '/how-it-works' },
    { label: t('pub.about'), to: '/about' },
    { label: t('pub.pricing'), to: '/pricing' },
    { label: t('pub.contact'), to: '/contact' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-green-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="BoviPulse logo" className="w-11 h-11 sm:w-16 sm:h-16 rounded-xl object-contain flex-shrink-0" />
          <span className="hidden min-[400px]:inline text-xl font-extrabold text-green-700 tracking-tight whitespace-nowrap">BoviPulse</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                path === l.to
                  ? 'text-green-700 bg-green-50'
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50/50'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-800 transition-all hover:shadow-md active:scale-[0.97]"
          >
            {t('pub.getStarted')}
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitcher />
          <button className="p-2 text-gray-600" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-green-100/50 bg-white/95 backdrop-blur-lg"
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {links.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    path === l.to ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:text-green-700 hover:bg-green-50/50'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-2 bg-green-700 text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors"
              >
                {t('pub.getStarted')} <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
