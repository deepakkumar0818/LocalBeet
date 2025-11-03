import React, { useEffect, useState } from 'react'
import { apiService } from '../services/api'
import { RefreshCcw } from 'lucide-react'

interface ItemRow {
  _id?: string
  sku: string
  name: string
  category?: string
  unit?: string
  rate?: number
  zohoItemId?: string
  updatedAt?: string
}

const ItemsList: React.FC = () => {
  const [items, setItems] = useState<ItemRow[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const res = await apiService.getItemsList({ page, limit, search })
      if (res.success) {
        const payload: any = res.data || {}
        const rows = payload.data || []
        const pagination = payload.pagination || {}
        setItems(rows as ItemRow[])
        setTotal(Number(pagination.total || 0))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, limit])

  const onSync = async () => {
    try {
      setSyncing(true)
      const res = await apiService.syncItemsListFromZoho()
      await load()
      const summary = (res.data as any)?.summary || (res as any)?.summary || {}
      alert(`Synced. Total: ${summary.total ?? 0}, Created: ${summary.created ?? 0}, Updated: ${summary.updated ?? 0}, Skipped: ${summary.skipped ?? 0}`)
    } catch (e: any) {
      alert(`Sync failed: ${e?.message || 'Unknown error'}`)
    } finally {
      setSyncing(false)
    }
  }

  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Items List</h1>
        <button onClick={onSync} disabled={syncing} className={`btn-primary flex items-center ${syncing ? 'opacity-60' : ''}`}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          {syncing ? 'Syncing…' : 'Sync from Zoho'}
        </button>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search SKU or Name" className="input-field" />
          <button onClick={()=>{setPage(1); load()}} className="btn-secondary">Search</button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Zoho Item ID</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2">Rate</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-3 py-4" colSpan={6}>Loading...</td></tr>
              ) : items.length ? items.map((it) => (
                <tr key={`${it.sku}`} className="border-t">
                  <td className="px-3 py-2 font-mono">{it.sku}</td>
                  <td className="px-3 py-2">{it.name}</td>
                  <td className="px-3 py-2 font-mono">{it.zohoItemId || '-'}</td>
                  <td className="px-3 py-2">{it.category || '-'}</td>
                  <td className="px-3 py-2">{it.unit || '-'}</td>
                  <td className="px-3 py-2">{Number(it.rate || 0).toFixed(3)}</td>
                  <td className="px-3 py-2">{it.updatedAt ? new Date(it.updatedAt).toLocaleString() : '-'}</td>
                </tr>
              )) : (
                <tr><td className="px-3 py-4" colSpan={6}>No items</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">Page {page} of {pages}</div>
          <div className="space-x-2">
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="btn-secondary">Prev</button>
            <button disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))} className="btn-secondary">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemsList


