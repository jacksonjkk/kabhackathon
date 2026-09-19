import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Landing from './pages/public/Landing'
import Features from './pages/public/Features'
import HowItWorks from './pages/public/HowItWorks'
import About from './pages/public/About'
import Pricing from './pages/public/Pricing'
import Contact from './pages/public/Contact'
import SignUp from './pages/auth/SignUp'
import SignIn from './pages/auth/SignIn'
import ChooseRole from './pages/auth/ChooseRole'
import FarmSetup from './pages/onboarding/FarmSetup'
import Preferences from './pages/onboarding/Preferences'
import Dashboard from './pages/dashboard/Dashboard'
import Herd from './pages/dashboard/Herd'
import MuzzleID from './pages/dashboard/MuzzleID'
import ThermaGuard from './pages/dashboard/ThermaGuard'
import GestaCheck from './pages/dashboard/GestaCheck'
import Analytics from './pages/dashboard/Analytics'
import Reports from './pages/dashboard/Reports'
import Alerts from './pages/dashboard/Alerts'
import Vaccinations from './pages/dashboard/Vaccinations'
import FarmMap from './pages/dashboard/FarmMap'
import Inventory from './pages/dashboard/Inventory'
import CowProfile from './pages/dashboard/CowProfile'
import Settings from './pages/dashboard/Settings'
import NotFound from './pages/NotFound'
import RequireAuth from './context/RequireAuth'

// REVISED scope: sidebar exposes only Dashboard / Herd / Health Monitoring / Early Warnings / Cow / Settings.
// The MuzzleID / GestaCheck / Vaccinations / FarmMap / Inventory / Analytics / Reports routes below are
// parked as FUTURE ENHANCEMENTS (kept so deep links don't 404, but hidden from navigation).
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/features" element={<Features />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/about" element={<About />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/role" element={<ChooseRole />} />
      <Route path="/farm-setup" element={<FarmSetup />} />
      <Route path="/preferences" element={<Preferences />} />
      <Route path="*" element={<NotFound />} />

      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/herd" element={<Herd />} />
        <Route path="/dashboard/muzzleid" element={<MuzzleID />} />
        <Route path="/dashboard/thermaguard" element={<ThermaGuard />} />
        <Route path="/dashboard/gestacheck" element={<GestaCheck />} />
        <Route path="/dashboard/analytics" element={<Analytics />} />
        <Route path="/dashboard/reports" element={<Reports />} />
        <Route path="/dashboard/alerts" element={<Alerts />} />
        <Route path="/dashboard/vaccinations" element={<Vaccinations />} />
        <Route path="/dashboard/farm-map" element={<FarmMap />} />
        <Route path="/dashboard/inventory" element={<Inventory />} />
        <Route path="/dashboard/cow/:id" element={<CowProfile />} />
        <Route path="/dashboard/settings" element={<Settings />} />
      </Route>
      </Routes>
    </>
  )
}
