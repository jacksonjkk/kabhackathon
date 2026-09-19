import DashboardLayout from './DashboardLayout'
import { Map } from 'lucide-react'

export default function FarmMap() {
  return <DashboardLayout title="Farm Map"><div className="bg-white rounded-xl border border-gray-200 p-10 text-center"><Map size={32} className="mx-auto mb-3 text-gray-400" /><h2 className="text-sm font-bold text-gray-900">No map data available</h2><p className="mt-1 text-xs text-gray-500">Farm zones and location tracking have not been configured yet.</p></div></DashboardLayout>
}
