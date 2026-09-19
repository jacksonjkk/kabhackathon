import DashboardLayout from './DashboardLayout'
import { FileText } from 'lucide-react'

export default function Reports() {
  return <DashboardLayout title="Reports"><div className="bg-white rounded-xl border border-gray-200 p-10 text-center"><FileText size={32} className="mx-auto mb-3 text-gray-400" /><h2 className="text-sm font-bold text-gray-900">No reports available</h2><p className="mt-1 text-xs text-gray-500">Report generation is not configured for this farm yet.</p></div></DashboardLayout>
}
