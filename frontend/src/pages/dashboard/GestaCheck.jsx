import { useEffect, useState } from 'react'
import DashboardLayout from './DashboardLayout'
import { Baby } from 'lucide-react'
import { gestaApi } from '../../api/client'

export default function GestaCheck() {
  const [exams, setExams] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { gestaApi.exams({ limit: 100 }).then(result => setExams(result.data)).catch(err => setError(err.message)) }, [])
  return <DashboardLayout title="GestaCheck"><div className="bg-white rounded-xl border border-gray-200 p-5"><div className="flex items-center gap-3 mb-5"><Baby size={22} className="text-green-600" /><div><h2 className="text-sm font-bold text-gray-900">Pregnancy Exams</h2><p className="text-xs text-gray-500">Results recorded in your farm</p></div></div>{error && <p className="text-sm text-red-600" role="alert">{error}</p>}{!exams.length && !error && <p className="py-12 text-center text-sm text-gray-500">No pregnancy exams recorded yet.</p>}{!!exams.length && <div className="overflow-x-auto"><table className="r-table w-full text-sm"><thead><tr className="text-left text-[11px] text-gray-500 uppercase border-b border-gray-100"><th className="py-2.5 pr-4">Cattle</th><th className="py-2.5 pr-4">Result</th><th className="py-2.5 pr-4">Method</th><th className="py-2.5 pr-4">Confidence</th><th className="py-2.5">Date</th></tr></thead><tbody>{exams.map(exam => <tr key={exam.id} className="border-b border-gray-50"><td className="py-3 pr-4 font-semibold">{exam.cattle?.tagNumber} {exam.cattle?.name || ''}</td><td className="py-3 pr-4">{exam.result}</td><td className="py-3 pr-4">{exam.method}</td><td className="py-3 pr-4">{exam.confidence == null ? '—' : `${Math.round(exam.confidence * 100)}%`}</td><td className="py-3">{new Date(exam.examDate).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</div></DashboardLayout>
}
