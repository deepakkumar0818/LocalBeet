import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Download, RefreshCw, Package, MapPin, User, DollarSign, Hash, Calendar, AlertCircle } from 'lucide-react'
import { apiService } from '../services/api'

interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplierName: string
  supplierEmail?: string
  orderDate: string
  expectedDeliveryDate: string
  status: string
  totalAmount: number
  items: any[]
  terms?: string
  notes?: string
  zohoBillId?: string
  zohoLocationName?: string
  lastSyncedAt?: string
  syncStatus?: 'syncing' | 'synced' | 'not_synced' | 'sync_failed'
  processingStatus?: 'processing' | 'processed' | 'not_processed' | 'failed'
  lastProcessedAt?: string
  processedBy?: string
  createdAt: string
  updatedAt: string
}

const PurchaseOrders: React.FC = () => {
  const navigate = useNavigate()
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [syncStatusFilter, setSyncStatusFilter] = useState('')
  const [processingStatusFilter, setProcessingStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadPurchaseOrders()
  }, [])

  // Reload data when filters change
  useEffect(() => {
    if (!loading) {
      loadPurchaseOrders()
    }
  }, [searchTerm, statusFilter, syncStatusFilter, processingStatusFilter, sortBy, sortOrder])

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getPurchaseOrders({
        limit: 1000,
        search: searchTerm,
        status: statusFilter,
        sortBy,
        sortOrder
      })

      if (response.success) {
        console.log('Loaded Purchase Orders:', response.data)
        setPurchaseOrders(response.data)
      } else {
        setError('Failed to load purchase orders')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchase orders')
      console.error('Error loading purchase orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncWithZoho = async () => {
    if (!window.confirm('This will fetch all bills from Zoho Inventory and sync them to Purchase Orders. Continue?')) {
      return
    }

    try {
      setSyncing(true)
      console.log('🔄 Starting Zoho Bills sync...')
      
      const response = await apiService.syncZohoBillsToPurchaseOrders()
      
      if (response.success) {
        const { totalBills, addedOrders, updatedOrders, errorCount, processingResult } = response.data
        let message = `✅ Sync Completed Successfully!\n\n` +
          `📦 Total Bills: ${totalBills}\n` +
          `➕ Added: ${addedOrders}\n` +
          `🔄 Updated: ${updatedOrders}\n` +
          `❌ Errors: ${errorCount}\n\n`
        
        if (processingResult) {
          message += `📋 Inventory Processing:\n` +
            `✅ Processed: ${processingResult.processedBills}/${processingResult.totalProcessedBills} bills\n` +
            `📍 ${processingResult.processingMessage}\n\n`
        }
        
        message += `Refreshing purchase orders...`
        
        alert(message)
        
        // Reload purchase orders
        await loadPurchaseOrders()
      } else {
        alert(`❌ Sync Failed: ${response.message}`)
      }
    } catch (err) {
      console.error('Sync error:', err)
      alert(`Error syncing with Zoho: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSyncing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'Confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Sent': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Partial': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSyncStatusColor = (syncStatus: string) => {
    switch (syncStatus) {
      case 'syncing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'synced': return 'bg-green-100 text-green-800 border-green-200'
      case 'not_synced': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'sync_failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSyncStatusText = (syncStatus: string) => {
    switch (syncStatus) {
      case 'syncing': return 'Syncing'
      case 'synced': return 'Synced'
      case 'not_synced': return 'Not Synced'
      case 'sync_failed': return 'Sync Failed'
      default: return 'Unknown'
    }
  }

  const getProcessingStatusColor = (processingStatus: string) => {
    switch (processingStatus) {
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'processed': return 'bg-green-100 text-green-800 border-green-200'
      case 'not_processed': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getProcessingStatusText = (processingStatus: string) => {
    switch (processingStatus) {
      case 'processing': return 'Processing'
      case 'processed': return 'Processed'
      case 'not_processed': return 'Not Processed'
      case 'failed': return 'Failed'
      default: return 'Unknown'
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setSyncStatusFilter('')
    setProcessingStatusFilter('')
    setSortBy('createdAt')
    setSortOrder('desc')
  }

  const handleExport = () => {
    if (purchaseOrders.length === 0) {
      alert('No purchase orders to export')
      return
    }

    const csvContent = [
      // Header row
      [
        'Bill ID',
        'Vendor ID',
        'Vendor Name',
        'Total Amount',
        'Location',
        'PO Number',
        'Status',
        'Order Date',
        'Expected Delivery',
        'Last Synced'
      ].join(','),
      // Data rows
      ...purchaseOrders.map(po => [
        po.zohoBillId || '-',
        po.supplierId || '-',
        po.supplierName || '-',
        po.totalAmount?.toFixed(2) || '0.00',
        po.zohoLocationName || '-',
        po.poNumber || '-',
        po.status || '-',
        po.orderDate ? new Date(po.orderDate).toLocaleDateString() : '-',
        po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : '-',
        po.lastSyncedAt ? new Date(po.lastSyncedAt).toLocaleString() : '-'
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `purchase-orders-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredOrders = purchaseOrders.filter(po => {
    // Search filter
    const matchesSearch = !searchTerm || 
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.zohoBillId && po.zohoBillId.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Status filter
    const matchesStatus = !statusFilter || po.status === statusFilter
    
    // Sync status filter
    const matchesSyncStatus = !syncStatusFilter || (po.syncStatus || 'not_synced') === syncStatusFilter
    
    // Processing status filter
    const matchesProcessingStatus = !processingStatusFilter || (po.processingStatus || 'not_processed') === processingStatusFilter
    
    return matchesSearch && matchesStatus && matchesSyncStatus && matchesProcessingStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadPurchaseOrders}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600">Bills synced from Zoho Inventory</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadPurchaseOrders}
            className="btn-secondary flex items-center"
            title="Refresh purchase orders"
            disabled={loading || syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        <button
            onClick={handleSyncWithZoho}
          className="btn-primary flex items-center"
            disabled={syncing}
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
                placeholder="Search by PO number, vendor, or bill ID..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Partial">Partial</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
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
              disabled={purchaseOrders.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
        
        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
          <span>
            Showing {filteredOrders.length} purchase order{filteredOrders.length !== 1 ? 's' : ''}
            {(searchTerm || statusFilter || syncStatusFilter || processingStatusFilter) && (
              <span className="ml-2 text-blue-600">
                (filtered)
              </span>
            )}
          </span>
          {(searchTerm || statusFilter || syncStatusFilter || processingStatusFilter) && (
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Purchase Orders Grid - Card Format */}
      {filteredOrders.length === 0 ? (
        <div className="card p-12">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchase Orders Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter 
                ? 'Try adjusting your search or filters' 
                : 'Click "Sync from Zoho" to fetch bills from Zoho Inventory'}
            </p>
            {!searchTerm && !statusFilter && (
                      <button
                onClick={handleSyncWithZoho}
                className="btn-primary inline-flex items-center"
                disabled={syncing}
              >
                <Package className="h-4 w-4 mr-2" />
                Sync from Zoho
                      </button>
            )}
                    </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map((po) => (
            <div
              key={po.id}
              className="card p-6 hover:shadow-lg transition-shadow duration-200 border-l-4 border-blue-500"
            >
              {/* Status Badges */}
              <div className="flex justify-end gap-2 mb-3">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getSyncStatusColor(po.syncStatus || 'not_synced')}`}>
                  {getSyncStatusText(po.syncStatus || 'not_synced')}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getProcessingStatusColor(po.processingStatus || 'not_processed')}`}>
                  {getProcessingStatusText(po.processingStatus || 'not_processed')}
                </span>
              </div>

              {/* Bill ID */}
              <div className="mb-2">
                <div className="flex items-center text-xs text-gray-600 mb-1">
                  <Hash className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="font-medium">Bill ID</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 ml-4">
                  {po.zohoBillId || 'N/A'}
                </p>
              </div>

              {/* Vendor ID */}
              <div className="mb-2">
                <div className="flex items-center text-xs text-gray-600 mb-1">
                  <User className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="font-medium">Vendor ID</span>
                </div>
                <p className="text-xs text-gray-900 ml-4">
                  {po.supplierId || 'N/A'}
                </p>
              </div>

              {/* Vendor Name */}
              <div className="mb-2">
                <div className="flex items-center text-xs text-gray-600 mb-1">
                  <User className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="font-medium">Vendor Name</span>
                </div>
                <p className="text-sm font-medium text-gray-900 ml-4">
                  {po.supplierName || 'Unknown Vendor'}
                </p>
              </div>

              {/* Total Amount */}
              <div className="mb-2">
                <div className="flex items-center text-xs text-gray-600 mb-1">
                  <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="font-medium">Total</span>
                </div>
                <p className="text-lg font-bold text-green-600 ml-4">
                  {po.totalAmount?.toFixed(3) || '0.000'} KWD
                </p>
              </div>

              {/* Location Name */}
              <div className="mb-3">
                <div className="flex items-center text-xs text-gray-600 mb-1">
                  <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="font-medium">Location</span>
                </div>
                <p className="text-xs text-gray-900 ml-4">
                  {po.zohoLocationName || 'Not specified'}
                </p>
      </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-4"></div>

              {/* Additional Info */}
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-xs">
                    <Calendar className="h-2 w-2 mr-1" />
                    Order Date
                  </span>
                  <span className="font-medium text-gray-900 text-xs">
                    {po.orderDate ? new Date(po.orderDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-xs">
                    <Calendar className="h-2 w-2 mr-1" />
                    Expected Delivery
                  </span>
                  <span className="font-medium text-gray-900 text-xs">
                    {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">PO Number</span>
                  <span className="font-medium text-gray-900 text-xs">
                    {po.poNumber}
                  </span>
                </div>
                {po.items && po.items.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Line Items</span>
                    <span className="font-medium text-gray-900 text-xs">
                      {po.items.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sync Info Banner */}
      {purchaseOrders.length > 0 && (
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Synced from Zoho Inventory
              </h4>
              <p className="text-sm text-blue-700">
                These purchase orders are automatically synced from Zoho Inventory bills. 
                Click "Sync from Zoho" to fetch the latest bills.
                {purchaseOrders[0]?.lastSyncedAt && (
                  <span className="ml-2 font-medium">
                    Last synced: {new Date(purchaseOrders[0].lastSyncedAt).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchaseOrders
