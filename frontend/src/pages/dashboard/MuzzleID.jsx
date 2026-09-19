import { useEffect, useState } from 'react'
import DashboardLayout from './DashboardLayout'
import { Fingerprint } from 'lucide-react'
import { muzzleApi } from '../../api/client'

export default function MuzzleID() {
  const [profiles, setProfiles] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { muzzleApi.profiles().then(result => setProfiles(result.data)).catch(err => setError(err.message)) }, [])
  return <DashboardLayout title="MuzzleID"><div className="bg-white rounded-xl border border-gray-200 p-5"><div className="flex items-center gap-3 mb-5"><Fingerprint size={22} className="text-green-600" /><div><h2 className="text-sm font-bold text-gray-900">Registered Muzzle Profiles</h2><p className="text-xs text-gray-500">Profiles stored for your farm</p></div></div>{error && <p className="text-sm text-red-600" role="alert">{error}</p>}{!profiles.length && !error && <p className="py-12 text-center text-sm text-gray-500">No muzzle profiles registered yet.</p>}{!!profiles.length && <div className="space-y-3">{profiles.map(profile => <div key={profile.id} className="flex items-center justify-between border-b border-gray-100 py-3"><div><p className="text-sm font-semibold">{profile.cattle?.tagNumber} {profile.cattle?.name || ''}</p><p className="text-xs text-gray-500">{profile.cattle?.breed || 'Breed not recorded'}</p></div><span className="text-xs text-gray-500">{new Date(profile.createdAt).toLocaleString()}</span></div>)}</div>}</div></DashboardLayout>
}
