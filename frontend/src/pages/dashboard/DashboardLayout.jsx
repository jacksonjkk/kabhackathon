import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { alertApi } from '../../api/client'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import logo from '../../assets/logo11.png'
import { Home, Users, Thermometer, Bell, Settings, LogOut, Menu, ChevronDown, X } from 'lucide-react'

// REVISED scope: navigation exposes ONLY the health-monitoring core.
// Parked as Future Enhancements (routes still exist, but hidden):
// MuzzleID, GestaCheck, Vaccinations, Farm Map, Inventory, Analytics (generic), Reports.

export default function DashboardLayout({ title, children }) {
  const location = useLocation()
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)
  const [unread, setUnread] = useState(0)

  const alertsOn = user?.alertsEnabled ?? true
  const monitoringOn = user?.monitoringEnabled ?? true

  const sidebarLinks = [
    { section: t('nav.main'), items: [
      { label: t('nav.dashboard'), icon: Home, to: '/dashboard' },
      { label: t('nav.herd'), icon: Users, to: '/dashboard/herd' },
    ]},
    { section: t('nav.monitoring'), items: [
      { label: t('nav.health'), icon: Thermometer, to: '/dashboard/thermaguard', hide: !monitoringOn },
      { label: t('nav.warnings'), icon: Bell, to: '/dashboard/alerts', hide: !alertsOn },
    ]},
    { section: '', items: [
      { label: t('nav.settings'), icon: Settings, to: '/dashboard/settings' },
    ]},
  ]

  useEffect(() => {
    const onResize = () => setSidebarOpen(window.innerWidth >= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Live unread dot for the header bell (one tiny request per navigation).
  useEffect(() => {
    let cancelled = false
    if (!alertsOn) { setUnread(0); return () => { cancelled = true } }
    alertApi.list({ limit: 1 }).then(
      r => { if (!cancelled) setUnread(r.unreadCount ?? 0) },
      () => { if (!cancelled) setUnread(0) },
    )
    return () => { cancelled = true }
  }, [location.pathname, alertsOn])

  const closeMobile = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[35] bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:w-16 lg:translate-x-0'
      } lg:sticky lg:top-0 lg:h-screen`}>
        <div className="flex items-center gap-2.5 p-4 border-b border-gray-100 min-h-20">
          <img src={logo} alt="BoviPulse logo" className="w-16 h-16 rounded-xl object-contain flex-shrink-0" />
          {sidebarOpen && <span className="text-lg font-extrabold text-green-700 tracking-tight whitespace-nowrap">BoviPulse</span>}
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {sidebarLinks.map(section => (
            <div key={section.section}>
              {section.section && sidebarOpen && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">{section.section}</p>
              )}
              <div className="space-y-0.5">
                {section.items.filter(item => !item.hide).map(item => {
                  const Icon = item.icon
                  const active = location.pathname === item.to
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={closeMobile}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        active ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:text-green-700 hover:bg-green-50/50'
                      }`}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button onClick={() => { logout(); closeMobile() }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
            <LogOut size={18} />
            {sidebarOpen && <span>{t('nav.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-600 hover:text-green-700 transition-colors rounded-lg hover:bg-green-50 cursor-pointer">
              <Menu size={20} />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate min-w-0 max-w-[140px] sm:max-w-none">{title}</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <LanguageSwitcher />
            {alertsOn && (
            <Link to="/dashboard/alerts" aria-label={`Early warnings${unread ? `, ${unread} unread` : ''}`} className="relative p-2 text-gray-600 hover:text-green-700 transition-colors rounded-lg hover:bg-green-50 cursor-pointer">
              <Bell size={20} />
              {unread > 0 && <span className="absolute top-1.5 right-1.5 min-w-2 h-2 px-0.5 rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
            </Link>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">{user?.name?.slice(0, 2).toUpperCase()}</div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
                <div className="text-[11px] text-gray-500">{user?.role}</div>
              </div>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-6 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
