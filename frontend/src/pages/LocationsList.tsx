import React, { useEffect, useState } from 'react'
import { apiService } from '../services/api'
import { RefreshCcw } from 'lucide-react'

interface LocationRow { _id?: string; zohoLocationId: string; locationName: string; updatedAt?: string }

const LocationsList: React.FC = () => {
  const [rows, setRows] = useState<LocationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiService.getLocationsList({ limit: 200 })
      if (res.success) {
        const payload: any = res.data || {}
        setRows((payload.data as LocationRow[]) || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() }, [])

  const onSync = async () => {
    setSyncing(true)
    try {
      await apiService.syncLocationsFromZoho()
      await load()
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">All Locations</h1>
        <button onClick={onSync} disabled={syncing} className={`btn-primary flex items-center ${syncing ? 'opacity-60' : ''}`}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          {syncing ? 'Syncing…' : 'Sync from Zoho'}
        </button>
      </div>
      <div className="card p-4">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="px-3 py-2">Zoho Location ID</th>
                <th className="px-3 py-2">Location Name</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-3 py-4" colSpan={3}>Loading...</td></tr>
              ) : rows.length ? rows.map(row => (
                <tr key={row.zohoLocationId} className="border-t">
                  <td className="px-3 py-2 font-mono">{row.zohoLocationId}</td>
                  <td className="px-3 py-2">{row.locationName}</td>
                  <td className="px-3 py-2">{row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '-'}</td>
                </tr>
              )) : (
                <tr><td className="px-3 py-4" colSpan={3}>No locations</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default LocationsList


