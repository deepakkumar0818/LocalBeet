import React, { useState, useEffect } from 'react'
import { Search, Filter, Download, RefreshCw, Package, MapPin, Hash, Calendar, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { apiService } from '../services/api'

interface InventoryAdjustment {
  id: string
  adjustmentNumber: string
  adjustmentDate: string
  notes?: string
  reason?: string
  items: Array<{
    sku: string
    name: string
    assetAccountName: string
    quantityAdjusted: number
    locationName: string
  }>
  zohoAdjustmentId?: string
  lastSyncedAt?: string
  syncStatus?: 'syncing' | 'synced' | 'not_synced' | 'sync_failed'
  processingStatus?: 'processing' | 'processed' | 'not_processed' | 'failed'
  lastProcessedAt?: string
  processedBy?: string
  createdAt: string
  updatedAt: string
}

interface QuantityChange {
  sku: string
  name: string
  quantityChange: number
  type: 'raw_material' | 'finished_good'
  timestamp: number
}

const InventoryAdjustments: React.FC = () => {
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [processingStatusFilter, setProcessingStatusFilter] = useState('')
  const [syncStatusFilter, setSyncStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('adjustmentDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [quantityChanges, setQuantityChanges] = useState<QuantityChange[]>([])

  useEffect(() => {
    loadAdjustments()
  }, [])

  // Reload data when filters change
  useEffect(() => {
    if (!loading) {
      loadAdjustments()
    }
  }, [searchTerm, processingStatusFilter, syncStatusFilter, sortBy, sortOrder])

  // Auto-remove quantity changes after 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setQuantityChanges(prev => prev.filter(qc => now - qc.timestamp < 20000))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const loadAdjustments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getInventoryAdjustments({
        limit: 1000,
        search: searchTerm,
        processingStatus: processingStatusFilter,
        syncStatus: syncStatusFilter,
        sortBy,
        sortOrder
      })

      if (response.success) {
        const list = (response.data?.adjustments as any[]) || []
        setAdjustments(list as InventoryAdjustment[])
      } else {
        setError('Failed to load inventory adjustments')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory adjustments')
      console.error('Error loading inventory adjustments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncWithZoho = async () => {
    if (!window.confirm('This will fetch all inventory adjustments from Zoho Inventory and sync them. Continue?')) {
      return
    }

    try {
      setSyncing(true)
      console.log('🔄 Starting Zoho Inventory Adjustments sync...')
      
      const response = await apiService.syncZohoInventoryAdjustments()
      
      if (response.success) {
        const summary: any = response.data as any
        const totalAdjustments = summary?.totalAdjustments ?? 0
        const addedAdjustments = summary?.addedAdjustments ?? 0
        const updatedAdjustments = summary?.updatedAdjustments ?? 0
        const errorCount = summary?.errorCount ?? 0
        const processingResult = summary?.processingResult
        
        let message = `✅ Sync Completed Successfully!\n\n` +
          `📦 Total Adjustments: ${totalAdjustments}\n` +
          `➕ Added: ${addedAdjustments}\n` +
          `🔄 Updated: ${updatedAdjustments}\n` +
          `❌ Errors: ${errorCount}`
        
        if (processingResult) {
          message += `\n\n📊 Processing:\n` +
            `Processed: ${processingResult.processedAdjustments}/${processingResult.totalProcessedAdjustments}\n` +
            `${processingResult.processingMessage}`
        }
        
        alert(message)
        loadAdjustments()
      } else {
        alert(`❌ Sync failed: ${response.message || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Error syncing adjustments:', err)
      alert(`❌ Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleProcessAll = async () => {
    if (!window.confirm('This will process all unprocessed synced adjustments for inventory updates. Continue?')) {
      return
    }

    try {
      setProcessing(true)
      console.log('🔄 Processing all synced adjustments...')
      
      const response = await apiService.processAllSyncedInventoryAdjustments()
      
      if (response.success) {
        const data: any = response.data as any
        const successful = data?.successfulAdjustments ?? 0
        const total = data?.totalAdjustments ?? 0
        const allQuantityChanges = data?.allQuantityChanges || []
        
        // Add quantity changes to display
        if (allQuantityChanges.length > 0) {
          const newChanges: QuantityChange[] = allQuantityChanges.map((qc: any) => ({
            ...qc,
            timestamp: Date.now()
          }))
          setQuantityChanges(prev => [...prev, ...newChanges])
          
          // Dispatch custom event to notify inventory pages
          const event = new CustomEvent('inventoryAdjustmentProcessed', {
            detail: {
              quantityChanges: allQuantityChanges,
              location: 'multiple',
              module: 'multiple'
            }
          })
          window.dispatchEvent(event)
        }
        
        alert(`✅ Processing Completed!\n\n` +
          `Processed: ${successful}/${total} adjustments successfully`)
        loadAdjustments()
      } else {
        alert(`❌ Processing failed: ${response.message || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Error processing adjustments:', err)
      alert(`❌ Processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleProcessSingle = async (adjustmentId: string) => {
    if (!window.confirm('Process this adjustment for inventory updates?')) {
      return
    }

    try {
      setProcessing(true)
      console.log('🔄 Processing adjustment...')
      
      const response = await apiService.processInventoryAdjustment(adjustmentId)
      
      if (response.success) {
        const data: any = response.data as any
        const quantityChanges = data?.quantityChanges || []
        
        // Add quantity changes to display
        if (quantityChanges.length > 0) {
          const newChanges: QuantityChange[] = quantityChanges.map((qc: any) => ({
            ...qc,
            timestamp: Date.now()
          }))
          setQuantityChanges(prev => [...prev, ...newChanges])
          
          // Dispatch custom event to notify inventory pages
          const event = new CustomEvent('inventoryAdjustmentProcessed', {
            detail: {
              quantityChanges: quantityChanges,
              location: data?.location,
              module: data?.module
            }
          })
          window.dispatchEvent(event)
        }
        
        alert(`✅ Adjustment processed successfully!`)
        loadAdjustments()
      } else {
        alert(`❌ Processing failed: ${response.message || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Error processing adjustment:', err)
      alert(`❌ Processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setProcessing(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setProcessingStatusFilter('')
    setSyncStatusFilter('')
  }

  const handleExport = () => {
    const csvContent = [
      ['Adjustment Number', 'Date', 'Location', 'Items Count', 'Sync Status', 'Processing Status', 'Last Synced', 'Last Processed'].join(','),
      ...adjustments.map(adj => [
        adj.adjustmentNumber || '-',
        adj.adjustmentDate ? new Date(adj.adjustmentDate).toLocaleDateString() : '-',
        adj.items?.[0]?.locationName || '-',
        adj.items?.length || 0,
        adj.syncStatus || '-',
        adj.processingStatus || '-',
        adj.lastSyncedAt ? new Date(adj.lastSyncedAt).toLocaleString() : '-',
        adj.lastProcessedAt ? new Date(adj.lastProcessedAt).toLocaleString() : '-'
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `inventory-adjustments-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredAdjustments = adjustments.filter(adj => {
    const matchesSearch = !searchTerm || 
      adj.adjustmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (adj.zohoAdjustmentId && adj.zohoAdjustmentId.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesSyncStatus = !syncStatusFilter || (adj.syncStatus || 'not_synced') === syncStatusFilter
    const matchesProcessingStatus = !processingStatusFilter || (adj.processingStatus || 'not_processed') === processingStatusFilter
    
    return matchesSearch && matchesSyncStatus && matchesProcessingStatus
  })

  const getStatusBadge = (status: string, type: 'sync' | 'processing') => {
    const colors: Record<string, string> = {
      'synced': 'bg-green-100 text-green-800',
      'syncing': 'bg-yellow-100 text-yellow-800',
      'not_synced': 'bg-gray-100 text-gray-800',
      'sync_failed': 'bg-red-100 text-red-800',
      'processed': 'bg-green-100 text-green-800',
      'processing': 'bg-yellow-100 text-yellow-800',
      'not_processed': 'bg-gray-100 text-gray-800',
      'failed': 'bg-red-100 text-red-800'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory adjustments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadAdjustments}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quantity Change Indicators */}
      {quantityChanges.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2 max-h-96 overflow-y-auto">
          {quantityChanges.map((qc, index) => {
            const isPositive = qc.quantityChange >= 0
            const age = Date.now() - qc.timestamp
            const opacity = age > 15000 ? 0.3 : 1
            
            return (
              <div
                key={`${qc.sku}-${qc.timestamp}-${index}`}
                className={`px-4 py-2 rounded-lg shadow-lg text-white font-bold text-lg transition-opacity duration-500 ${
                  isPositive ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ opacity }}
              >
                <div className="flex items-center gap-2">
                  {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  <span>{qc.sku}</span>
                  <span>{isPositive ? '+' : ''}{qc.quantityChange}</span>
                </div>
                <div className="text-xs mt-1 opacity-90">{qc.name}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Adjustments</h1>
          <p className="text-gray-600">Inventory adjustments synced from Zoho Inventory</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadAdjustments}
            className="btn-secondary flex items-center"
            title="Refresh adjustments"
            disabled={loading || syncing || processing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleSyncWithZoho}
            className="btn-primary flex items-center"
            disabled={syncing || processing}
          >
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Sync from Zoho
              </>
            )}
          </button>
          <button
            onClick={handleProcessAll}
            className="btn-primary flex items-center bg-green-600 hover:bg-green-700"
            disabled={syncing || processing}
          >
            {processing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Process All
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by adjustment number or ID..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="input-field"
              value={syncStatusFilter}
              onChange={(e) => setSyncStatusFilter(e.target.value)}
            >
              <option value="">All Sync Status</option>
              <option value="syncing">Syncing</option>
              <option value="synced">Synced</option>
              <option value="not_synced">Not Synced</option>
              <option value="sync_failed">Sync Failed</option>
            </select>
            <select
              className="input-field"
              value={processingStatusFilter}
              onChange={(e) => setProcessingStatusFilter(e.target.value)}
            >
              <option value="">All Processing Status</option>
              <option value="processing">Processing</option>
              <option value="processed">Processed</option>
              <option value="not_processed">Not Processed</option>
              <option value="failed">Failed</option>
            </select>
            <button
              onClick={clearFilters}
              className="btn-secondary flex items-center"
              title="Clear all filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </button>
            <button 
              onClick={handleExport}
              className="btn-secondary flex items-center"
              title="Export to CSV"
              disabled={adjustments.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
        
        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
          <span>
            Showing {filteredAdjustments.length} adjustment{filteredAdjustments.length !== 1 ? 's' : ''}
            {(searchTerm || processingStatusFilter || syncStatusFilter) && (
              <span className="ml-2 text-blue-600">
                (filtered)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adjustment Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sync Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processing Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No inventory adjustments found
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{adj.adjustmentNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {adj.adjustmentDate ? new Date(adj.adjustmentDate).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        {adj.locationName || adj.items?.[0]?.locationName || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {adj.items?.length || 0} item{adj.items?.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(adj.syncStatus || 'not_synced', 'sync')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(adj.processingStatus || 'not_processed', 'processing')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {adj.processingStatus !== 'processed' && adj.syncStatus === 'synced' && (
                        <button
                          onClick={() => handleProcessSingle(adj.zohoAdjustmentId || adj.id)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={processing}
                        >
                          Process
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InventoryAdjustments

