import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, Eye, Filter, Download, X, ArrowRight } from 'lucide-react'
import { apiService } from '../services/api'

interface TransferOrder {
  _id: string
  transferNumber: string
  fromOutlet: {
    name: string
    code: string
    type: string
    location: string
  }
  toOutlet: {
    name: string
    code: string
    type: string
    location: string
  }
  fromTo: string
  transferDate: string
  priority: string
  items: Array<{
    itemType: string
    itemCode: string
    itemName: string
    category?: string
    subCategory?: string
    unitOfMeasure: string
    quantity: number
    unitPrice: number
    totalValue: number
    notes?: string
  }>
  totalAmount: number
  status: string
  requestedBy: string
  approvedBy?: string
  transferStartedAt?: string
  transferCompletedAt?: string
  notes?: string
  transferResults?: Array<{
    itemCode: string
    itemType: string
    quantity: number
    status: string
    error?: string
  }>
  isActive: boolean
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

const TransferOrders: React.FC = () => {
  const navigate = useNavigate()
  const [transferOrders, setTransferOrders] = useState<TransferOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTransfer, setSelectedTransfer] = useState<TransferOrder | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  // Load transfer orders from API
  const loadTransferOrders = async () => {
    try {
      setLoading(true)
      const response = await apiService.getTransferOrders({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        sortBy: 'transferDate',
        sortOrder: 'desc'
      })

      if (response.success) {
        setTransferOrders(response.data)
        setPagination(response.pagination)
      }
    } catch (error) {
      console.error('Error loading transfer orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    loadTransferOrders()
  }, [pagination.page, searchTerm, statusFilter])

  // Auto-refresh every 30 seconds to catch new transfers
  useEffect(() => {
    const interval = setInterval(() => {
      loadTransferOrders()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const filteredTransfers = transferOrders // Data is already filtered by API

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'In Transit': return 'bg-blue-100 text-blue-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Failed': return 'bg-red-100 text-red-800'
      case 'Cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Normal': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransferTypeColor = (transferType: string) => {
    switch (transferType) {
      case 'Emergency': return 'bg-red-100 text-red-800'
      case 'Regular': return 'bg-blue-100 text-blue-800'
      case 'Scheduled': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }



  const handleDelete = async (id: string) => {
    const transfer = transferOrders.find(t => t._id === id)
    const transferNumber = transfer?.transferNumber || 'this transfer order'
    
    if (window.confirm(`Are you sure you want to delete ${transferNumber}?\n\nThis action cannot be undone.`)) {
      try {
        setLoading(true)
        const response = await apiService.deleteTransferOrder(id, { updatedBy: 'Admin User' })
        if (response.success) {
          alert(`Transfer order ${transferNumber} has been deleted successfully.`)
          // Reload the data
          await loadTransferOrders()
        } else {
          alert(`Failed to delete transfer order: ${response.message || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Error deleting transfer order:', error)
        alert(`Error deleting transfer order: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }
  }

  // Unused component removed

  const TransferDetailsModal: React.FC = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Transfer Order Details</h3>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {selectedTransfer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transfer Number</label>
                  <p className="text-sm text-gray-900">{selectedTransfer.transferNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTransfer.priority)}`}>
                    {selectedTransfer.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">From Outlet</label>
                  <div className="text-sm text-gray-900">
                    <div className="font-medium">{selectedTransfer.fromOutlet?.name || selectedTransfer.fromOutlet || 'N/A'}</div>
                    {selectedTransfer.fromOutlet?.code && (
                      <>
                        <div className="text-xs text-gray-500">{selectedTransfer.fromOutlet.code} • {selectedTransfer.fromOutlet.type || 'Outlet'}</div>
                        <div className="text-xs text-gray-400">{selectedTransfer.fromOutlet.location || 'Location not specified'}</div>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">To Outlet</label>
                  <div className="text-sm text-gray-900">
                    <div className="font-medium">{selectedTransfer.toOutlet?.name || selectedTransfer.toOutlet || 'N/A'}</div>
                    {selectedTransfer.toOutlet?.code && (
                      <>
                        <div className="text-xs text-gray-500">{selectedTransfer.toOutlet.code} • {selectedTransfer.toOutlet.type || 'Outlet'}</div>
                        <div className="text-xs text-gray-400">{selectedTransfer.toOutlet.location || 'Location not specified'}</div>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transfer Date</label>
                  <p className="text-sm text-gray-900">{selectedTransfer.transferDate ? new Date(selectedTransfer.transferDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransfer.status || 'Unknown')}`}>
                    {selectedTransfer.status || 'Unknown'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested By</label>
                  <p className="text-sm text-gray-900">{selectedTransfer.requestedBy || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <p className="text-sm text-gray-900 font-medium">{selectedTransfer.totalAmount ? selectedTransfer.totalAmount.toFixed(2) : '0.00'} KWD</p>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Transfer Items</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-header">Item Code</th>
                        <th className="table-header">Item Name</th>
                        <th className="table-header">Item Type</th>
                        <th className="table-header">Quantity</th>
                        <th className="table-header">Unit</th>
                        <th className="table-header">Unit Price</th>
                        <th className="table-header">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedTransfer.items && selectedTransfer.items.length > 0 ? (
                        selectedTransfer.items.map((item, index) => (
                          <tr key={index}>
                            <td className="table-cell">{item.itemCode}</td>
                            <td className="table-cell">{item.itemName}</td>
                            <td className="table-cell">{item.itemType}</td>
                            <td className="table-cell">{item.quantity}</td>
                            <td className="table-cell">{item.unitOfMeasure}</td>
                            <td className="table-cell">{item.unitPrice ? item.unitPrice.toFixed(2) : '0.00'} KWD</td>
                            <td className="table-cell font-medium">{item.totalValue ? item.totalValue.toFixed(2) : '0.00'} KWD</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="table-cell text-center text-gray-500">
                            No items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Amount: {selectedTransfer.totalAmount ? selectedTransfer.totalAmount.toFixed(2) : '0.00'} KWD
                  </span>
                </div>
              </div>

              {selectedTransfer.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="text-sm text-gray-900">{selectedTransfer.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfer Orders</h1>
          <p className="text-gray-600">Manage material transfers between warehouses</p>
        </div>
        <button
          onClick={() => navigate('/transfer-orders/add')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Transfer Order
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transfer orders..."
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
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button className="btn-secondary flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button 
              onClick={loadTransferOrders}
              className="btn-secondary flex items-center"
              disabled={loading}
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="btn-secondary flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Transfer Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Transfer Number</th>
                <th className="table-header">From → To</th>
                <th className="table-header">Transfer Date</th>
                <th className="table-header">Status</th>
                <th className="table-header">Requested By</th>
                <th className="table-header">Total Amount</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading transfer orders...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-8 text-gray-500">
                    No transfer orders found
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((transfer) => (
                <tr key={transfer._id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{transfer.transferNumber}</td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {transfer.fromOutlet.name}
                      </div>
                      <ArrowRight className="h-4 w-4 mx-3 text-gray-400 flex-shrink-0" />
                      <div className="text-sm font-medium text-gray-900">
                        {transfer.toOutlet.name}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">{new Date(transfer.transferDate).toLocaleDateString()}</td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transfer.status)}`}>
                      {transfer.status}
                    </span>
                  </td>
                  <td className="table-cell">{transfer.requestedBy}</td>
                  <td className="table-cell font-medium">{transfer.totalAmount.toFixed(2)} KWD</td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTransfer(transfer)
                          setShowDetailsModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transfer._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailsModal && <TransferDetailsModal />}
    </div>
  )
}

export default TransferOrders
