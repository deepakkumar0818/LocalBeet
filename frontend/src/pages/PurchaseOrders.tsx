import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, Filter, Download, Upload, X, RefreshCw } from 'lucide-react'
import { PurchaseOrder } from '../types'
import { apiService } from '../services/api'

const PurchaseOrders: React.FC = () => {
  const navigate = useNavigate()
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPurchaseOrders()
  }, [])

  // Reload data when filters change
  useEffect(() => {
    if (!loading) {
      loadPurchaseOrders()
    }
  }, [searchTerm, statusFilter, sortBy, sortOrder])

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
        // Convert string dates to Date objects
        const formattedData = response.data.map((po: any) => ({
          ...po,
          orderDate: new Date(po.orderDate),
          expectedDeliveryDate: new Date(po.expectedDeliveryDate),
          createdAt: new Date(po.createdAt),
          updatedAt: new Date(po.updatedAt)
        }))
        setPurchaseOrders(formattedData)
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

  // Data is already filtered and sorted by the backend API
  const displayedPOs = purchaseOrders

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Confirmed': return 'bg-blue-100 text-blue-800'
      case 'Sent': return 'bg-yellow-100 text-yellow-800'
      case 'Partial': return 'bg-orange-100 text-orange-800'
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        const response = await apiService.deletePurchaseOrder(id)
        if (response.success) {
          await loadPurchaseOrders() // Reload the list
        } else {
          alert('Failed to delete purchase order')
        }
      } catch (err) {
        alert('Error deleting purchase order: ' + (err instanceof Error ? err.message : 'Unknown error'))
        console.error('Error deleting purchase order:', err)
      }
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setSortBy('createdAt')
    setSortOrder('desc')
    loadPurchaseOrders() // Reload data with cleared filters
  }

  const handleExport = () => {
    if (purchaseOrders.length === 0) {
      alert('No purchase orders to export')
      return
    }

    const csvContent = [
      // Header row
      [
        'PO Number',
        'Supplier Name',
        'Order Date',
        'Expected Delivery Date',
        'Status',
        'Payment Terms',
        'Total Amount',
        'Created At',
        'Updated At',
        'Notes'
      ].join(','),
      // Data rows
      ...purchaseOrders.map(po => [
        po.poNumber,
        po.supplierName,
        new Date(po.orderDate).toLocaleDateString(),
        new Date(po.expectedDeliveryDate).toLocaleDateString(),
        po.status,
        po.terms,
        po.totalAmount.toFixed(2),
        new Date(po.createdAt).toLocaleDateString(),
        new Date(po.updatedAt).toLocaleDateString(),
        po.notes || ''
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

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    try {
      setImporting(true)
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('CSV file must contain at least a header row and one data row')
        return
      }

      // const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      const dataRows = lines.slice(1)

      let successCount = 0
      let errorCount = 0

      for (const row of dataRows) {
        try {
          const values = row.split(',').map(v => v.replace(/"/g, '').trim())
          const poData = {
            poNumber: values[0] || '',
            supplierName: values[1] || '',
            orderDate: values[2] || new Date().toISOString().split('T')[0],
            expectedDeliveryDate: values[3] || new Date().toISOString().split('T')[0],
            status: values[4] || 'Draft',
            terms: values[5] || 'Net 30',
            totalAmount: parseFloat(values[6]) || 0,
            notes: values[9] || ''
          }

          // Create Purchase Order via API
          const response = await apiService.createPurchaseOrder(poData)
          if (response.success) {
            successCount++
          } else {
            errorCount++
          }
        } catch (err) {
          errorCount++
        }
      }

      alert(`Import completed!\n\nSuccessfully imported: ${successCount} Purchase Orders\nErrors: ${errorCount}`)
      
      // Reload Purchase Orders
      await loadPurchaseOrders()
    } catch (err) {
      alert('Error importing file: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const downloadSampleCSV = () => {
    const sampleData = [
      ['PO Number', 'Supplier Name', 'Order Date', 'Expected Delivery Date', 'Status', 'Payment Terms', 'Total Amount', 'Created At', 'Updated At', 'Notes'],
      ['PO-001', 'Fresh Foods Ltd', '2024-01-15', '2024-01-20', 'Draft', 'Net 30', '1500.00', '2024-01-15', '2024-01-15', 'Monthly produce order'],
      ['PO-002', 'Kitchen Supplies Co', '2024-01-16', '2024-01-22', 'Confirmed', 'Net 15', '2500.00', '2024-01-16', '2024-01-16', 'Equipment purchase']
    ]

    const csvContent = sampleData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'purchase-orders-sample-template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const PODetailsModal: React.FC = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Purchase Order Details</h3>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {selectedPO && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">PO Number</label>
                  <p className="text-sm text-gray-900">{selectedPO.poNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Supplier</label>
                  <p className="text-sm text-gray-900">{selectedPO.supplierName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Date</label>
                  <p className="text-sm text-gray-900">{new Date(selectedPO.orderDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Delivery</label>
                  <p className="text-sm text-gray-900">{new Date(selectedPO.expectedDeliveryDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPO.status)}`}>
                    {selectedPO.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                  <p className="text-sm text-gray-900">{selectedPO.terms}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source</label>
                  {false ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      📦 Auto-Generated from Forecast
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      Manual Creation
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Purchase Items</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-header">Material Code</th>
                        <th className="table-header">Material Name</th>
                        <th className="table-header">Quantity</th>
                        <th className="table-header">Unit Price</th>
                        <th className="table-header">Received</th>
                        <th className="table-header">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedPO.items.map((item, index) => (
                        <tr key={index}>
                          <td className="table-cell">{item.materialCode}</td>
                          <td className="table-cell">{item.materialName}</td>
                          <td className="table-cell">{item.quantity}</td>
                          <td className="table-cell">{item.unitPrice.toFixed(2)} KWD</td>
                          <td className="table-cell">{item.receivedQuantity || 0}</td>
                          <td className="table-cell font-medium">{item.totalPrice.toFixed(2)} KWD</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Amount: {selectedPO.totalAmount.toFixed(2)} KWD
                  </span>
                </div>
              </div>

              {selectedPO.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="text-sm text-gray-900">{selectedPO.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

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
          <p className="text-gray-600">Manage supplier orders and procurement</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadPurchaseOrders}
            className="btn-secondary flex items-center"
            title="Refresh purchase orders"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        <button
          onClick={() => navigate('/purchase-orders/add')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Purchase Order
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
                placeholder="Search purchase orders..."
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
            <button
              onClick={clearFilters}
              className="btn-secondary flex items-center"
              title="Clear all filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
            <button 
              onClick={handleExport}
              className="btn-secondary flex items-center"
              title="Export purchase orders to CSV"
              disabled={purchaseOrders.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button 
              onClick={handleImport}
              className="btn-secondary flex items-center"
              title="Import purchase orders from CSV"
              disabled={importing}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importing...' : 'Import'}
            </button>
            <button 
              onClick={downloadSampleCSV}
              className="btn-secondary flex items-center"
              title="Download sample CSV template"
            >
              <Download className="h-4 w-4 mr-2" />
              Sample CSV
            </button>
          </div>
        </div>
        
        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
          <span>
            Showing {displayedPOs.length} purchase orders
            {(searchTerm || statusFilter) && (
              <span className="ml-2 text-blue-600">
                (filtered)
              </span>
            )}
          </span>
          {(searchTerm || statusFilter) && (
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">PO Number</th>
                <th className="table-header">Supplier</th>
                <th className="table-header">Order Date</th>
                <th className="table-header">Expected Delivery</th>
                <th className="table-header">Status</th>
                <th className="table-header">Total Amount</th>
                <th className="table-header">Source</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedPOs.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{po.poNumber}</td>
                  <td className="table-cell">{po.supplierName}</td>
                <td className="table-cell">{new Date(po.orderDate).toLocaleDateString()}</td>
                <td className="table-cell">{new Date(po.expectedDeliveryDate).toLocaleDateString()}</td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(po.status)}`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="table-cell font-medium">{po.totalAmount.toFixed(2)} KWD</td>
                  <td className="table-cell">
                    {false ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        📦 Auto-Generated
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Manual
                      </span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPO(po)
                          setShowDetailsModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/purchase-orders/edit/${po.id}`)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(po.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailsModal && <PODetailsModal />}

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default PurchaseOrders
