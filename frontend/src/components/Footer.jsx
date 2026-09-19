import { Link } from 'react-router-dom'
import logo from '../assets/logo11.png'

const footerLinks = {
  Product: [
    { label: 'Features', to: '/features' },
    { label: 'How It Works', to: '/how-it-works' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'FAQ', to: '#' },
  ],
  Company: [
    { label: 'About Us', to: '/about' },
    { label: 'Contact', to: '/contact' },
    { label: 'Careers', to: '#' },
    { label: 'Blog', to: '#' },
  ],
  Support: [
    { label: 'Help Center', to: '#' },
    { label: 'Documentation', to: '#' },
    { label: 'Community', to: '#' },
    { label: 'Status', to: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '#' },
    { label: 'Terms of Service', to: '#' },
    { label: 'Cookie Policy', to: '#' },
    { label: 'GDPR', to: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-green-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <img src={logo} alt="BoviPulse logo" className="w-16 h-16 rounded-xl object-contain" />
              <span className="text-xl font-extrabold tracking-tight">BoviPulse</span>
            </Link>
            <p className="text-green-300/80 text-sm leading-relaxed mb-5">
              IoT + ML early warnings for abnormal cattle health patterns.
            </p>
            <div className="flex gap-3">
              {['X', 'in', 'F', 'G'].map(s => (
                <span key={s} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-green-200 hover:bg-green-600 transition-colors cursor-pointer">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-green-200 mb-4 uppercase tracking-wider">{title}</h4>
              <ul className="flex flex-col gap-2.5">
                {links.map(l => (
                  <li key={l.label}>
                    {l.to === '#' ? (
                      <span className="text-sm text-green-300/70 hover:text-white transition-colors cursor-pointer">
                        {l.label}
                      </span>
                    ) : (
                      <Link to={l.to} className="text-sm text-green-300/70 hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-green-800/50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-green-300/60">
            &copy; {new Date().getFullYear()} BoviPulse. All rights reserved.
          </p>
          <p className="text-sm text-green-300/40">
            Smart Livestock. Healthier Future.
          </p>
        </div>
      </div>
    </footer>
  )
}
