import { useEffect, useState } from 'react'
import DashboardLayout from './DashboardLayout'
import { motion } from 'framer-motion'
import { Package, AlertTriangle, Plus } from 'lucide-react'
import { inventoryApi } from '../../api/client'

export default function Inventory() {
  const [inventory, setInventory] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { inventoryApi.list({ limit: 100 }).then(result => setInventory(result.data)).catch(err => setError(err.message)) }, [])
  const summary = [
    { icon: Package, label: 'Total Items', value: inventory.length, sub: 'Current records', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: AlertTriangle, label: 'Low Stock', value: inventory.filter(item => item.lowStock).length, sub: 'Need restocking', color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: Package, label: 'Categories', value: new Set(inventory.map(item => item.category)).size, sub: 'In current inventory', color: 'text-blue-500', bg: 'bg-blue-50' },
  ]
  return (
    <DashboardLayout title="Inventory">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Farm Inventory</h2>
          <p className="text-xs text-gray-500">Manage feed, medical supplies, and equipment</p>
        </div>
        <button className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-green-700 px-4 py-2.5 rounded-lg hover:bg-green-800 transition-all cursor-pointer">
          <Plus size={14} /> Add Item
        </button>
      </div>
      {error && <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {summary.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon size={20} className={s.color} />
                </div>
              </div>
              <div className="text-2xl font-black text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
              <div className={`text-[11px] font-semibold mt-0.5 ${s.color}`}>{s.sub}</div>
            </motion.div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Stock Levels</h3>
        <div className="overflow-x-auto">
          <table className="r-table w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="py-2.5 pr-4">Item</th>
                <th className="py-2.5 pr-4">Category</th>
                <th className="py-2.5 pr-4">Stock</th>
                <th className="py-2.5 pr-4">Level</th>
                <th className="py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => {
                const pct = item.reorderLevel ? Math.min(100, (item.quantity / item.reorderLevel) * 100) : 100
                const low = item.lowStock
                return (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(0.05 * inventory.indexOf(item), 0.25) }}
                  className="border-b border-gray-50 hover:bg-green-50/20 transition-colors">
                  <td data-label="Item" className="py-3 pr-4 font-medium text-gray-900">{item.name}</td>
                  <td data-label="Category" className="py-3 pr-4 text-gray-600">{item.category}</td>
                  <td data-label="Stock" className="py-3 pr-4 text-gray-500">{item.quantity} {item.unit}</td>
                  <td data-label="Level" className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${low ? 'bg-orange-400' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] text-gray-500">{Math.round(pct)}%</span>
                    </div>
                  </td>
                  <td data-label="Status" className="py-3">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${low ? 'text-orange-600 bg-orange-50' : 'text-green-700 bg-green-50'}`}>
                      {low ? 'Low' : 'In Stock'}
                    </span>
                  </td>
                </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
