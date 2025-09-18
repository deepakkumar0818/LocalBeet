import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, Filter, Download, X } from 'lucide-react'
import { JobOrder } from '../types'
import { apiService } from '../services/api'

const JobOrders: React.FC = () => {
  const navigate = useNavigate()
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadJobOrders()
  }, [])

  const loadJobOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getJobOrders({
        limit: 1000, // Fetch all for now
        search: searchTerm,
        status: filterStatus,
        priority: filterPriority,
        sortBy,
        sortOrder
      })

      if (response.success) {
        console.log('Loaded Job Orders:', response.data)
        setJobOrders(response.data)
      } else {
        setError('Failed to load job orders')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job orders')
      console.error('Error loading job orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterStatus('')
    setFilterPriority('')
    setSortBy('createdAt')
    setSortOrder('desc')
  }

  const handleView = (jobOrder: JobOrder) => {
    setSelectedJobOrder(jobOrder)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string) => {
    console.log('Deleting Job Order with ID:', id)
    if (!id) {
      alert('Error: Job Order ID is missing')
      return
    }
    
    if (window.confirm('Are you sure you want to delete this job order?')) {
      try {
        const response = await apiService.deleteJobOrder(id)
        if (response.success) {
          await loadJobOrders()
        } else {
          alert('Failed to delete job order')
        }
      } catch (err) {
        alert('Error deleting job order: ' + (err instanceof Error ? err.message : 'Unknown error'))
        console.error('Error deleting job order:', err)
      }
    }
  }

  const filteredJobOrders = jobOrders.filter(jobOrder => {
    const matchesSearch = jobOrder.jobOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          jobOrder.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          jobOrder.customerId.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === '' || jobOrder.status.toLowerCase() === filterStatus.toLowerCase()
    const matchesPriority = filterPriority === '' || jobOrder.priority.toLowerCase() === filterPriority.toLowerCase()

    return matchesSearch && matchesStatus && matchesPriority
  }).sort((a, b) => {
    let aValue, bValue

    switch (sortBy) {
      case 'jobOrderNumber':
        aValue = a.jobOrderNumber
        bValue = b.jobOrderNumber
        break
      case 'customerName':
        aValue = a.customerName
        bValue = b.customerName
        break
      case 'totalAmount':
        aValue = a.totalAmount
        bValue = b.totalAmount
        break
      case 'orderDate':
        aValue = new Date(a.orderDate).getTime()
        bValue = new Date(b.orderDate).getTime()
        break
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      default:
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recipe orders...</p>
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
            onClick={loadJobOrders}
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
          <h1 className="text-2xl font-bold text-gray-900">Recipe Orders</h1>
          <p className="text-gray-600">Manage your restaurant's recipe orders and customer requests</p>
        </div>
        <button
          onClick={() => navigate('/job-orders/add')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Recipe Order
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders by number, customer name, or email..."
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="btn-secondary flex items-center"
                title="Clear all filters"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
              <button className="btn-secondary flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Filter Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="input-field"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Approved">Approved</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="input-field"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="">All Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex gap-1">
                <select
                  className="input-field flex-1"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="createdAt">Date Created</option>
                  <option value="jobOrderNumber">Order Number</option>
                  <option value="customerName">Customer Name</option>
                  <option value="totalAmount">Total Amount</option>
                  <option value="orderDate">Order Date</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="btn-secondary px-3"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredJobOrders.length} of {jobOrders.length} recipe orders
              {(searchTerm || filterStatus || filterPriority) && (
                <span className="ml-2 text-blue-600">
                  (filtered)
                </span>
              )}
            </span>
            {filteredJobOrders.length !== jobOrders.length && (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Job Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Recipe Order #</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Order Date</th>
                <th className="table-header">Delivery Date</th>
                <th className="table-header">Status</th>
                <th className="table-header">Priority</th>
                <th className="table-header">Total Amount</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobOrders.map((jobOrder) => (
                <tr key={jobOrder.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{jobOrder.jobOrderNumber}</td>
                  <td className="table-cell">
                    <div>
                      <div className="text-gray-900">{jobOrder.customerName}</div>
                      <div className="text-gray-500 text-sm">{jobOrder.customerId}</div>
                    </div>
                  </td>
                  <td className="table-cell">{new Date(jobOrder.orderDate).toLocaleDateString()}</td>
                  <td className="table-cell">{new Date(jobOrder.deliveryDate).toLocaleDateString()}</td>
                  <td className="table-cell">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      jobOrder.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      jobOrder.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      jobOrder.status === 'Completed' ? 'bg-purple-100 text-purple-800' :
                      jobOrder.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {jobOrder.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      jobOrder.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                      jobOrder.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                      jobOrder.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {jobOrder.priority}
                    </span>
                  </td>
                  <td className="table-cell">{jobOrder.totalAmount.toFixed(2)} KWD</td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleView(jobOrder)}
                        className="text-green-600 hover:text-green-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/job-orders/edit/${jobOrder.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(jobOrder.id)}
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

      {/* Count Display */}
      <div className="text-center text-sm text-gray-600">
        Total Recipe Orders: <span className="font-semibold text-blue-600">{jobOrders.length}</span>
      </div>

      {/* View Modal */}
      {showViewModal && selectedJobOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Recipe Order Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
                  <p className="text-gray-900 font-mono">{selectedJobOrder.jobOrderNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <p className="text-gray-900">{selectedJobOrder.customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                  <p className="text-gray-900">{selectedJobOrder.customerId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Contact</label>
                  <p className="text-gray-900">{selectedJobOrder.customerContact || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
                  <p className="text-gray-900">{new Date(selectedJobOrder.orderDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                  <p className="text-gray-900">{new Date(selectedJobOrder.deliveryDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedJobOrder.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    selectedJobOrder.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    selectedJobOrder.status === 'Completed' ? 'bg-purple-100 text-purple-800' :
                    selectedJobOrder.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedJobOrder.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedJobOrder.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                    selectedJobOrder.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                    selectedJobOrder.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedJobOrder.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                  <p className="text-gray-900 font-semibold">{selectedJobOrder.totalAmount.toFixed(2)} KWD</p>
                </div>
              </div>

              {/* Notes */}
              {selectedJobOrder.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <p className="text-gray-900">{selectedJobOrder.notes}</p>
                </div>
              )}

              {/* Special Instructions */}
              {selectedJobOrder.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                  <p className="text-gray-900">{selectedJobOrder.notes}</p>
                </div>
              )}

              {/* Order Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Recipe Items ({selectedJobOrder.items.length} items)</label>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outlet A</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outlet B</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outlet C</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedJobOrder.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.product}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.outletA}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.outletB}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.outletC}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{item.totalQuantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.unitPrice.toFixed(2)} KWD</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{item.totalPrice.toFixed(2)} KWD</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                  <p className="text-gray-900">{selectedJobOrder.createdBy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                  <p className="text-gray-900">{new Date(selectedJobOrder.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated By</label>
                  <p className="text-gray-900">{selectedJobOrder.updatedBy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated Date</label>
                  <p className="text-gray-900">{new Date(selectedJobOrder.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowViewModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  navigate(`/job-orders/edit/${selectedJobOrder.id}`)
                }}
                className="btn-primary"
              >
                Edit Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobOrders